# Generate self-signed SSL certificate for development
# Run this in PowerShell as Administrator in your backend directory (C:\fad\backend)

Write-Host "Generating self-signed SSL certificate for HTTPS..." -ForegroundColor Green

# Check if OpenSSL is available
$opensslPath = Get-Command openssl -ErrorAction SilentlyContinue

if (-not $opensslPath) {
    Write-Host "OpenSSL not found. Installing via Chocolatey..." -ForegroundColor Yellow

    # Check if Chocolatey is installed
    $chocoPath = Get-Command choco -ErrorAction SilentlyContinue
    if (-not $chocoPath) {
        Write-Host "Please install Chocolatey first: https://chocolatey.org/install" -ForegroundColor Red
        Write-Host "Or use the alternative method below:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "ALTERNATIVE: Use Node.js to generate certificate:" -ForegroundColor Cyan
        Write-Host "  cd C:\fad\backend" -ForegroundColor Cyan
        Write-Host "  npm install -g selfsigned-cli" -ForegroundColor Cyan
        Write-Host "  selfsigned" -ForegroundColor Cyan
        exit 1
    }

    choco install openssl -y
    refreshenv
}

# Create ssl directory if it doesn't exist
$sslDir = "ssl"
if (-not (Test-Path $sslDir)) {
    New-Item -ItemType Directory -Path $sslDir | Out-Null
}

# Generate private key
Write-Host "Generating private key..." -ForegroundColor Cyan
openssl genrsa -out ssl/server.key 2048

# Generate certificate signing request
Write-Host "Generating certificate signing request..." -ForegroundColor Cyan
openssl req -new -key ssl/server.key -out ssl/server.csr -subj "/C=AU/ST=State/L=City/O=FADirect/CN=192.168.101.128"

# Generate self-signed certificate (valid for 365 days)
Write-Host "Generating self-signed certificate..." -ForegroundColor Cyan
openssl x509 -req -days 365 -in ssl/server.csr -signkey ssl/server.key -out ssl/server.crt

Write-Host ""
Write-Host "✅ SSL Certificate generated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Files created in ssl/ directory:" -ForegroundColor Yellow
Write-Host "  - server.key (private key)" -ForegroundColor White
Write-Host "  - server.crt (certificate)" -ForegroundColor White
Write-Host "  - server.csr (certificate signing request)" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update your backend server to use HTTPS" -ForegroundColor White
Write-Host "2. Restart your backend server" -ForegroundColor White
Write-Host "3. Backend will be available at: https://192.168.101.128:3000" -ForegroundColor White
