const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./src/config');

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
});

module.exports = app;
