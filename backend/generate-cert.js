const selfsigned = require('selfsigned');
const fs = require('fs');

const attrs = [
  { name: 'commonName', value: '192.168.101.128' },
  { name: 'countryName', value: 'AU' },
  { name: 'organizationName', value: 'FADirect' },
];

const options = { 
  days: 365,
  keySize: 2048,
  algorithm: 'sha256'
};

(async () => {
  try {
    console.log('Generating certificate...');

    // Create ssl directory if it doesn't exist
    if (!fs.existsSync('ssl')) {
      fs.mkdirSync('ssl', { recursive: true });
    }

    const pems = await selfsigned.generate(attrs, options);

    if (pems && pems.private && pems.cert) {
      fs.writeFileSync('ssl/server.key', pems.private);
      fs.writeFileSync('ssl/server.crt', pems.cert);
      console.log('');
      console.log('✅ SSL Certificate generated successfully!');
      console.log('');
      console.log('Files created:');
      console.log('  - ssl/server.key (private key)');
      console.log('  - ssl/server.crt (certificate)');
      console.log('');
      console.log('Next: Update your server.js to use HTTPS');
    } else {
      throw new Error('Certificate generation returned invalid data');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('');
    console.error('Alternative: Install OpenSSL');
    console.error('  winget install OpenSSL.Light');
    console.error('  or download from: https://slproweb.com/products/Win32OpenSSL.html');
  }
})();
