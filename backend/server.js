const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./src/config');
const backupScheduler = require('./src/services/backup-scheduler');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/arrangements', require('./src/routes/arrangements'));
app.use('/api/messages', require('./src/routes/messages'));
app.use('/api/documents', require('./src/routes/documents'));
app.use('/api/photos', require('./src/routes/photos'));
app.use('/api/dashboard', require('./src/routes/dashboard'));
app.use('/api/admin/users', require('./src/routes/users-management'));
app.use('/api/price-lists', require('./src/routes/price-lists'));
app.use('/api/invoices', require('./src/routes/invoices'));
app.use('/api/government-forms', require('./src/routes/government-forms'));
app.use('/api/settings', require('./src/routes/settings'));
app.use('/api/audit-logs', require('./src/routes/audit-logs'));
app.use('/api/calendar', require('./src/routes/calendar'));
app.use('/api/search', require('./src/routes/search'));
app.use('/api/export', require('./src/routes/export'));
app.use('/api/trash', require('./src/routes/trash'));
app.use('/api/email', require('./src/routes/email'));
app.use('/api/print', require('./src/routes/print'));
app.use('/api/backups', require('./src/routes/backups'));
app.use('/api/phone', require('./src/routes/phone'));
app.use('/api/analytics', require('./src/routes/analytics'));
app.use('/api/notifications', require('./src/routes/notifications'));
app.use('/api/bulk', require('./src/routes/bulk-operations'));
app.use('/api/roster', require('./src/routes/roster'));
app.use('/api/staff-profiles', require('./src/routes/staff-profiles'));
app.use('/api/vehicles', require('./src/routes/vehicles'));
app.use('/api/equipment', require('./src/routes/equipment'));
app.use('/api/videos', require('./src/routes/videos'));
app.use('/api/digital-forms', require('./src/routes/digital-forms'));
app.use('/api/leave', require('./src/routes/leave'));
app.use('/api/config', require('./src/routes/config'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), protocol: 'http' });
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

// Start HTTP server (for development)
const PORT = config.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('🚀 ================================');
  console.log('🚀 FA Direct API Server (HTTP)');
  console.log('🚀 ================================');
  console.log('🚀 Port:', PORT);
  console.log('📊 Environment:', config.NODE_ENV);
  console.log('💻 Local: http://localhost:' + PORT + '/health');
  console.log('📱 Mobile: http://192.168.101.128:' + PORT + '/health');
  console.log('🚀 ================================');
  console.log('');

  // Start backup scheduler
  backupScheduler.start();
});

module.exports = app;
