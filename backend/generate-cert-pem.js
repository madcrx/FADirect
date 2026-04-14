const pem = require('pem');
const fs = require('fs');
const path = require('path');

console.log('Generating SSL certificate with pem package...');

pem.createCertificate({
  days: 365,
  selfSigned: true,
  commonName: '192.168.101.128',
  altNames: ['192.168.101.128', 'localhost'],
  organization: 'FADirect',
  organizationUnit: 'Development',
  country: 'AU'
}, (err, keys) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }

  // Create ssl directory
  if (!fs.existsSync('ssl')) {
    fs.mkdirSync('ssl');
  }

  // Save files
  fs.writeFileSync(path.join('ssl', 'server.key'), keys.serviceKey);
  fs.writeFileSync(path.join('ssl', 'server.crt'), keys.certificate);

  console.log('✅ Certificate generated successfully!');
  console.log('Files: ssl/server.key, ssl/server.crt');
});
