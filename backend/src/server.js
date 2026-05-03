const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');
const { generalLimiter, authLimiter } = require('./middleware/rateLimiter');
const { HTTP_STATUS } = require('./constants');
const { initializeSocket } = require('./services/socketService');
const backupScheduler = require('./services/backup-scheduler');
const db = require('./config/database');

const app = express();
const httpServer = http.createServer(app);

// Ensure automatic backup schedules exist
async function ensureAutoBackupSchedule() {
  try {
    const schedules = [
      {
        name: 'Auto Backup - Hourly (3 day retention)',
        frequency: 'hourly',
        nextRunHours: 1,
      },
      {
        name: 'Auto Backup - Daily (30 day retention)',
        frequency: 'daily',
        nextRunHours: 24,
      },
      {
        name: 'Auto Backup - Monthly (permanent retention)',
        frequency: 'monthly',
        nextRunDays: 30,
      },
    ];

    for (const schedule of schedules) {
      const result = await db.query(`
        SELECT * FROM backup_schedules
        WHERE name = $1
      `, [schedule.name]);

      if (result.rows.length === 0) {
        const nextRun = new Date();

        if (schedule.nextRunMinutes) {
          nextRun.setMinutes(nextRun.getMinutes() + schedule.nextRunMinutes);
        } else if (schedule.nextRunHours) {
          nextRun.setHours(nextRun.getHours() + schedule.nextRunHours);
        } else if (schedule.nextRunDays) {
          nextRun.setDate(nextRun.getDate() + schedule.nextRunDays);
        }

        await db.query(`
          INSERT INTO backup_schedules (
            name,
            frequency,
            destination,
            destination_config,
            is_active,
            next_run_at
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          schedule.name,
          schedule.frequency,
          'local',
          '{}',
          true,
          nextRun
        ]);

        console.log(`✅ Created ${schedule.name}`);
      }
    }

    console.log('✓ All automatic backup schedules configured');
  } catch (error) {
    console.error('⚠️  Failed to create automatic backup schedules:', error.message);
  }
}

// Security middleware
app.use(helmet());

// CORS configuration - restrict to allowed origins
const allowedOrigins = config.ALLOWED_ORIGINS.split(',');
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 || config.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting - apply to all routes
app.use(generalLimiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Note: Static file serving removed for security
// Files are now served through authenticated endpoints in their respective routes

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/users', require('./routes/users'));
app.use('/api/arrangements', require('./routes/arrangements'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/photos', require('./routes/photos'));
app.use('/api/videos', require('./routes/videos'));
app.use('/api/file-sends', require('./routes/file-sends'));
app.use('/api/pre-arrangement-forms', require('./routes/pre-arrangement-forms'));
app.use('/api/trash', require('./routes/trash'));
app.use('/api/email', require('./routes/email'));
app.use('/api/print', require('./routes/print'));
app.use('/api/price-lists', require('./routes/price-lists'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/export', require('./routes/export'));
app.use('/api/backups', require('./routes/backups'));
app.use('/api/phone', require('./routes/phone'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/bulk', require('./routes/bulk-operations'));
app.use('/api/roster', require('./routes/roster'));
app.use('/api/staff-profiles', require('./routes/staff-profiles'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/equipment', require('./routes/equipment'));
app.use('/api/digital-forms', require('./routes/digital-forms'));
app.use('/api/leave', require('./routes/leave'));
app.use('/api/config', require('./routes/config'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/registration', require('./routes/registration'));

// Serve uploaded files with authentication
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
app.get('/uploads/:filename', (req, res) => {
  // Check authentication - support both header and query parameter
  let token = null;

  // Try to get token from Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // Fallback to query parameter for img tags
  if (!token && req.query.token) {
    token = req.query.token;
  }

  // Verify token
  if (!token) {
    return res.status(401).json({ error: { message: 'Authentication required' } });
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({ error: { message: 'Invalid token' } });
  }

  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads', filename);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: { message: 'File not found' } });
  }

  // Send file
  res.sendFile(filePath);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);

  // Sanitize error messages in production
  const statusCode = err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = config.NODE_ENV === 'production'
    ? (statusCode < 500 ? err.message : 'An error occurred')
    : err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: {
      message,
      ...(config.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    error: { message: 'Route not found' }
  });
});

// Initialize WebSocket server
initializeSocket(httpServer);

// Start server
const PORT = config.PORT;
httpServer.listen(PORT, () => {
  console.log(`🚀 FA Direct API Server running on port ${PORT}`);
  console.log(`📊 Environment: ${config.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);

  // Start backup scheduler
  backupScheduler.start();

  // Create default auto-backup schedule if it doesn't exist
  ensureAutoBackupSchedule();
});

module.exports = app;
