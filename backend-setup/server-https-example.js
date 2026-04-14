/**
 * FA Direct Backend - HTTPS Server Example
 *
 * This is an example of how to update your server.js to use HTTPS
 * Copy the relevant parts to your actual server.js file
 */

const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Your routes here (example)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', protocol: 'https' });
});

app.post('/api/auth/send-code', async (req, res) => {
  // Your send-code logic
  res.json({ success: true });
});

// Add all your other routes...

// HTTPS Configuration
const PORT = process.env.PORT || 3000;
const USE_HTTPS = process.env.USE_HTTPS !== 'false'; // Default to HTTPS

if (USE_HTTPS) {
  try {
    // Load SSL certificate
    const sslOptions = {
      key: fs.readFileSync(path.join(__dirname, 'ssl', 'server.key')),
      cert: fs.readFileSync(path.join(__dirname, 'ssl', 'server.crt'))
    };

    // Create HTTPS server
    const httpsServer = https.createServer(sslOptions, app);

    httpsServer.listen(PORT, '0.0.0.0', () => {
      console.log('');
      console.log('🔒 ===================================');
      console.log('🔒 HTTPS Server Running');
      console.log('🔒 ===================================');
      console.log(`🔒 Port: ${PORT}`);
      console.log(`🔒 Host: 0.0.0.0 (accessible from network)`);
      console.log(`📱 Mobile: https://192.168.101.128:${PORT}`);
      console.log(`💻 Local: https://localhost:${PORT}`);
      console.log('🔒 ===================================');
      console.log('');
    });

    // Optional: Also create HTTP server that redirects to HTTPS
    const httpApp = express();
    httpApp.use((req, res) => {
      res.redirect(301, `https://${req.headers.host}${req.url}`);
    });

    http.createServer(httpApp).listen(8080, '0.0.0.0', () => {
      console.log('📝 HTTP redirect server on port 8080 (redirects to HTTPS)');
    });

  } catch (error) {
    console.error('❌ Failed to start HTTPS server:', error.message);
    console.error('');
    console.error('SSL Certificate not found. Please generate it first:');
    console.error('  node generate-ssl-cert.js');
    console.error('');
    console.error('Or run with HTTP instead:');
    console.error('  USE_HTTPS=false node server.js');
    process.exit(1);
  }
} else {
  // Fallback to HTTP
  const httpServer = http.createServer(app);

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('⚠️  ===================================');
    console.log('⚠️  HTTP Server Running (NOT SECURE)');
    console.log('⚠️  ===================================');
    console.log(`📡 Port: ${PORT}`);
    console.log(`📱 Mobile: http://192.168.101.128:${PORT}`);
    console.log('⚠️  Android may block HTTP connections!');
    console.log('⚠️  ===================================');
    console.log('');
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
