#!/usr/bin/env node
/**
 * Generate self-signed SSL certificate for development
 * Run this in your backend directory: node generate-ssl-cert.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔐 Generating self-signed SSL certificate for HTTPS...\n');

// Create ssl directory
const sslDir = path.join(process.cwd(), 'ssl');
if (!fs.existsSync(sslDir)) {
  fs.mkdirSync(sslDir);
  console.log('✅ Created ssl/ directory');
}

try {
  // Check if openssl is available
  execSync('openssl version', { stdio: 'ignore' });

  console.log('📝 Generating private key...');
  execSync('openssl genrsa -out ssl/server.key 2048', { stdio: 'inherit' });

  console.log('📝 Generating certificate signing request...');
  execSync(
    'openssl req -new -key ssl/server.key -out ssl/server.csr -subj "/C=AU/ST=State/L=City/O=FADirect/CN=192.168.101.128"',
    { stdio: 'inherit' }
  );

  console.log('📝 Generating self-signed certificate...');
  execSync(
    'openssl x509 -req -days 365 -in ssl/server.csr -signkey ssl/server.key -out ssl/server.crt',
    { stdio: 'inherit' }
  );

  console.log('\n✅ SSL Certificate generated successfully!\n');
  console.log('Files created in ssl/ directory:');
  console.log('  - server.key (private key)');
  console.log('  - server.crt (certificate)');
  console.log('  - server.csr (certificate signing request)\n');
  console.log('Next steps:');
  console.log('1. Update your backend server.js to use HTTPS');
  console.log('2. Restart your backend server');
  console.log('3. Backend will be available at: https://192.168.101.128:3000\n');
} catch (error) {
  console.error('\n❌ OpenSSL not found. Installing alternative package...\n');

  try {
    console.log('Installing selfsigned package...');
    execSync('npm install selfsigned', { stdio: 'inherit' });

    console.log('\n📝 Generating certificate using Node.js...');
    const selfsigned = require('selfsigned');

    const attrs = [
      { name: 'commonName', value: '192.168.101.128' },
      { name: 'countryName', value: 'AU' },
      { name: 'organizationName', value: 'FADirect' },
    ];

    const pems = selfsigned.generate(attrs, {
      days: 365,
      keySize: 2048,
      algorithm: 'sha256',
    });

    fs.writeFileSync(path.join(sslDir, 'server.key'), pems.private);
    fs.writeFileSync(path.join(sslDir, 'server.crt'), pems.cert);

    console.log('\n✅ SSL Certificate generated successfully!\n');
    console.log('Files created in ssl/ directory:');
    console.log('  - server.key (private key)');
    console.log('  - server.crt (certificate)\n');
    console.log('Next steps:');
    console.log('1. Update your backend server.js to use HTTPS');
    console.log('2. Restart your backend server');
    console.log('3. Backend will be available at: https://192.168.101.128:3000\n');
  } catch (fallbackError) {
    console.error('❌ Failed to generate certificate:', fallbackError.message);
    process.exit(1);
  }
}
