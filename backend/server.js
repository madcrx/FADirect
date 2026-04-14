const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/arrangements', require('./routes/arrangements'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/documents', require('./routes/documents'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), protocol: 'https' });
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

// Start server with HTTPS
const PORT = config.PORT || 3000;

try {
  // Load SSL certificate
  const sslOptions = {
    key: fs.readFileSync(path.join(__dirname, 'ssl', 'server.key')),
    cert: fs.readFileSync(path.join(__dirname, 'ssl', 'server.crt'))
  };

  // Create HTTPS server
  const server = https.createServer(sslOptions, app);

  server.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('🔒 ================================');
    console.log('🔒 FA Direct HTTPS API Server');
    console.log('🔒 ================================');
    console.log('🔒 Port: ' + PORT);
    console.log('📊 Environment: ' + config.NODE_ENV);
    console.log('💻 Local: https://localhost:' + PORT + '/health');
    console.log('📱 Mobile: https://192.168.101.128:' + PORT + '/health');
    console.log('🔒 ================================');
    console.log('');
  });

} catch (error) {
  console.error('❌ Failed to start HTTPS server:', error.message);
  console.error('');
  console.error('SSL Certificate not found. Please generate it:');
  console.error('  cd C:\\fad\\backend');
  console.error('  node generate-cert.js');
  console.error('');
  process.exit(1);
}

module.exports = app;
