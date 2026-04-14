const crypto = require('crypto');
const fs = require('fs');
const forge = require('node-forge');

// This won't work either without forge...

// Alternative: Just install OpenSSL Light
console.log('Installing OpenSSL...');
console.log('Run this command:');
console.log('  winget install -e --id OpenSSL.Light');
