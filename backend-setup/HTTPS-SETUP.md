# HTTPS Setup for FA Direct Backend

## Why HTTPS?

Android blocks HTTP cleartext traffic for security. Using HTTPS (even with self-signed certificate) bypasses this restriction.

## Step 1: Generate SSL Certificate

**Option A: Using Node.js (Easiest)**
```powershell
cd C:\fad\backend
node path\to\generate-ssl-cert.js
```

**Option B: Using PowerShell Script**
```powershell
cd C:\fad\backend
powershell -ExecutionPolicy Bypass -File path\to\generate-ssl-cert.ps1
```

This creates:
- `ssl/server.key` - Private key
- `ssl/server.crt` - Certificate

## Step 2: Update Backend Server

Add HTTPS support to your `server.js`:

```javascript
const https = require('https');
const fs = require('fs');
const path = require('path');

// Load SSL certificate
const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, 'ssl', 'server.key')),
  cert: fs.readFileSync(path.join(__dirname, 'ssl', 'server.crt'))
};

// Change from http.createServer to https.createServer
const server = https.createServer(sslOptions, app);

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🔒 HTTPS Server running on port ${PORT}`);
  console.log(`📱 Mobile access: https://192.168.101.128:${PORT}`);
});
```

## Step 3: Update Firewall (if needed)

If Windows Firewall blocks HTTPS:
```powershell
# Run as Administrator
New-NetFirewallRule -DisplayName "FADirect HTTPS" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

## Step 4: Test HTTPS Backend

```powershell
# Should return {"status":"ok"} with HTTPS
curl -k https://192.168.101.128:3000/health
```

Note: `-k` flag ignores self-signed certificate warnings

## Step 5: Update Frontend

The frontend URLs will be automatically updated to use `https://` instead of `http://`

## Troubleshooting

### Certificate not trusted
**Expected!** Self-signed certificates show warnings. This is normal for development.

### Port already in use
Make sure to stop the HTTP server before starting HTTPS, or use a different port.

### Connection refused
- Check Windows Firewall
- Verify backend is listening on 0.0.0.0 (not localhost)
- Confirm SSL files exist in ssl/ directory

## Production Note

For production, use a real SSL certificate from:
- Let's Encrypt (free)
- Your domain registrar
- Cloud provider (AWS Certificate Manager, etc.)
