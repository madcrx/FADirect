const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');
// const backupScheduler = require('./services/backup-scheduler');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(config.UPLOAD_DIR || './uploads'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/users', require('./routes/users'));
app.use('/api/arrangements', require('./routes/arrangements'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/photos', require('./routes/photos'));
app.use('/api/trash', require('./routes/trash'));
app.use('/api/email', require('./routes/email'));
app.use('/api/print', require('./routes/print'));
// app.use('/api/backups', require('./routes/backups'));
app.use('/api/phone', require('./routes/phone'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/bulk', require('./routes/bulk-operations'));
app.use('/api/roster', require('./routes/roster'));
app.use('/api/staff-profiles', require('./routes/staff-profiles'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/digital-forms', require('./routes/digital-forms'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      ...(config.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: { message: 'Route not found' } });
});

// Start server
const PORT = config.PORT;
app.listen(PORT, () => {
  console.log(`🚀 FA Direct API Server running on port ${PORT}`);
  console.log(`📊 Environment: ${config.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);

  // Start backup scheduler
  // backupScheduler.start();
});

module.exports = app;
