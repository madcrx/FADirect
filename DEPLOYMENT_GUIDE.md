# FA Direct - Production Deployment Guide

Complete guide for deploying FA Direct to production with all security measures and best practices.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Backend Deployment](#backend-deployment)
5. [Web Portal Deployment](#web-portal-deployment)
6. [Mobile App Deployment](#mobile-app-deployment)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Monitoring & Maintenance](#monitoring--maintenance)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements
- **Node.js**: v18.x or higher
- **PostgreSQL**: v14.x or higher
- **Redis**: v7.x or higher (optional, for caching)
- **SSL Certificate**: Required for HTTPS
- **Domain Names**: Configured DNS for API, portal, and app

### Required Services
- **Twilio Account**: For phone verification
- **AWS S3** (optional): For file backups
- **Expo Account**: For mobile app builds

---

## Environment Setup

### 1. Generate Secrets

```bash
# Generate JWT secret (64 characters recommended)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate database password (32+ characters)
openssl rand -base64 32
```

### 2. Backend Environment Variables

Create `/backend/.env`:

```bash
# ============================================
# CRITICAL - REQUIRED VARIABLES
# ============================================

# Application
NODE_ENV=production
PORT=3000

# Database (PostgreSQL)
DB_HOST=your-db-host.com
DB_PORT=5432
DB_NAME=fadirect_prod
DB_USER=fadirect_user
DB_PASSWORD=<GENERATE_SECURE_PASSWORD>

# JWT Authentication
JWT_SECRET=<GENERATE_64_CHAR_HEX_STRING>

# CORS - Comma-separated allowed origins
ALLOWED_ORIGINS=https://portal.fadirect.com,https://app.fadirect.com

# ============================================
# TWILIO (Phone Verification)
# ============================================
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ============================================
# FILE STORAGE
# ============================================
UPLOAD_DIR=/var/fadirect/uploads

# AWS S3 (Optional - for backups)
AWS_ACCESS_KEY_ID=AKIAxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_REGION=us-east-1
AWS_S3_BUCKET=fadirect-backups

# ============================================
# OPTIONAL SERVICES
# ============================================

# Redis (for caching)
REDIS_URL=redis://localhost:6379

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=notifications@fadirect.com
SMTP_PASSWORD=<APP_PASSWORD>
SMTP_FROM=FA Direct <no-reply@fadirect.com>

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5

# Logging
LOG_LEVEL=info  # error, warn, info, debug
```

### 3. Web Portal Environment Variables

Create `/web-portal/.env.production`:

```bash
VITE_API_URL=https://api.fadirect.com/api
VITE_APP_NAME=FA Direct
VITE_NODE_ENV=production
```

### 4. Mobile App Environment Variables

Update `/app.config.js`:

```javascript
export default {
  extra: {
    apiUrl: 'https://api.fadirect.com/api',
    environment: 'production',
    eas: {
      projectId: 'your-eas-project-id',
    },
  },
};
```

---

## Database Setup

### 1. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE fadirect_prod;
CREATE USER fadirect_user WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE fadirect_prod TO fadirect_user;

# Enable required extensions
\c fadirect_prod
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

### 2. Run Migrations

```bash
cd backend
npm install
npm run migrate
```

Expected output:
```
🔄 Running database migrations...
📝 Running migration: 001_initial_schema.sql
✅ Completed: 001_initial_schema.sql
...
📝 Running migration: 034_add_performance_indexes.sql
✅ Completed: 034_add_performance_indexes.sql
✨ All migrations completed successfully!
```

### 3. Verify Database

```sql
-- Check tables
\dt

-- Check indexes
\di

-- Verify extensions
SELECT * FROM pg_extension;
```

---

## Backend Deployment

### Option A: Traditional Server (PM2)

```bash
# Install PM2 globally
npm install -g pm2

# Navigate to backend
cd backend
npm install --production

# Start with PM2
pm2 start src/server.js --name "fadirect-api" \
  --env production \
  --instances 2 \
  --max-memory-restart 500M

# Save PM2 configuration
pm2 save
pm2 startup

# Monitor
pm2 monit
pm2 logs fadirect-api
```

### Option B: Docker

Create `/backend/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "src/server.js"]
```

```bash
# Build image
docker build -t fadirect-api .

# Run container
docker run -d \
  --name fadirect-api \
  -p 3000:3000 \
  --env-file .env \
  -v /var/fadirect/uploads:/app/uploads \
  fadirect-api

# Check logs
docker logs -f fadirect-api
```

### Option C: Cloud Platform (Heroku, AWS, etc.)

**Heroku:**
```bash
heroku create fadirect-api
heroku addons:create heroku-postgresql:standard-0
heroku config:set JWT_SECRET=your-secret
heroku config:set ALLOWED_ORIGINS=https://portal.fadirect.com
# ... set all other env vars
git push heroku main
```

### Nginx Reverse Proxy

Create `/etc/nginx/sites-available/fadirect-api`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name api.fadirect.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.fadirect.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.fadirect.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.fadirect.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # File upload size limit
    client_max_body_size 100M;

    # Logging
    access_log /var/log/nginx/fadirect-api-access.log;
    error_log /var/log/nginx/fadirect-api-error.log;
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/fadirect-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Web Portal Deployment

### Build for Production

```bash
cd web-portal
npm install
npm run build
```

### Deploy Static Files

**Option A: Nginx**

```nginx
server {
    listen 443 ssl http2;
    server_name portal.fadirect.com;

    ssl_certificate /etc/letsencrypt/live/portal.fadirect.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/portal.fadirect.com/privkey.pem;

    root /var/www/fadirect-portal/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
sudo cp -r dist/* /var/www/fadirect-portal/
sudo chown -R www-data:www-data /var/www/fadirect-portal
```

**Option B: Vercel**

```bash
npm install -g vercel
vercel --prod
```

**Option C: Netlify**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

---

## Mobile App Deployment

### iOS Deployment

1. **Configure App**
```json
// app.json
{
  "expo": {
    "name": "FA Direct",
    "slug": "fadirect",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.fadirect.app",
      "buildNumber": "1"
    }
  }
}
```

2. **Build**
```bash
eas build --platform ios --profile production
```

3. **Submit to App Store**
```bash
eas submit --platform ios
```

### Android Deployment

1. **Build**
```bash
eas build --platform android --profile production
```

2. **Submit to Google Play**
```bash
eas submit --platform android
```

---

## Post-Deployment Verification

### 1. Health Checks

```bash
# API Health
curl https://api.fadirect.com/health

# Expected response:
# {"status":"ok","timestamp":"2024-..."}
```

### 2. Database Connection

```bash
# Test database queries
curl -X GET https://api.fadirect.com/api/arrangements \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Authentication Flow

Test complete auth flow:
1. Request verification code
2. Verify code
3. Access protected endpoint

### 4. File Upload

Test file upload functionality:
```bash
curl -X POST https://api.fadirect.com/api/documents/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.pdf" \
  -F "arrangementId=..."
```

### 5. Rate Limiting

```bash
# Should get 429 after 5 attempts
for i in {1..10}; do
  curl https://api.fadirect.com/api/auth/send-code \
    -H "Content-Type: application/json" \
    -d '{"phoneNumber":"+1234567890"}'
  echo ""
done
```

---

## Monitoring & Maintenance

### Application Monitoring

**PM2 Monitoring:**
```bash
pm2 monit
pm2 logs fadirect-api --lines 100
pm2 status
```

**Nginx Logs:**
```bash
tail -f /var/log/nginx/fadirect-api-access.log
tail -f /var/log/nginx/fadirect-api-error.log
```

### Database Maintenance

**Weekly Backup:**
```bash
#!/bin/bash
# /opt/fadirect/backup.sh

BACKUP_DIR=/var/backups/fadirect
DATE=$(date +%Y%m%d_%H%M%S)

pg_dump fadirect_prod -U fadirect_user | gzip > \
  $BACKUP_DIR/fadirect_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "fadirect_*.sql.gz" -mtime +30 -delete
```

**Automate with cron:**
```bash
0 2 * * * /opt/fadirect/backup.sh
```

### SSL Certificate Renewal

**Let's Encrypt (Certbot):**
```bash
# Test renewal
sudo certbot renew --dry-run

# Auto-renew (add to cron)
0 0 1 * * /usr/bin/certbot renew --quiet
```

### Performance Monitoring

**Database Performance:**
```sql
-- Slow queries
SELECT
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan;
```

---

## Troubleshooting

### Common Issues

**1. "JWT_SECRET not set" Error**
```bash
# Verify environment variable
echo $JWT_SECRET

# If empty, set in .env file
# Restart application
pm2 restart fadirect-api
```

**2. CORS Errors**
```bash
# Check ALLOWED_ORIGINS includes your domain
grep ALLOWED_ORIGINS /backend/.env

# Update if needed
ALLOWED_ORIGINS=https://portal.fadirect.com,https://app.fadirect.com
```

**3. Database Connection Failed**
```bash
# Test connection
psql -h $DB_HOST -U $DB_USER -d $DB_NAME

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

**4. File Upload Fails**
```bash
# Check upload directory permissions
ls -la /var/fadirect/uploads

# Fix permissions
sudo chown -R node:node /var/fadirect/uploads
sudo chmod 755 /var/fadirect/uploads
```

**5. Rate Limit Too Restrictive**
```bash
# Adjust in .env
RATE_LIMIT_MAX_REQUESTS=200  # Increase from 100

# Restart
pm2 restart fadirect-api
```

### Emergency Procedures

**Rollback Deployment:**
```bash
# PM2
pm2 restart fadirect-api@previous

# Git
git revert HEAD
git push origin main
```

**Database Restore:**
```bash
# Stop application
pm2 stop fadirect-api

# Restore from backup
gunzip -c /var/backups/fadirect/fadirect_20240101.sql.gz | \
  psql fadirect_prod -U fadirect_user

# Restart
pm2 start fadirect-api
```

---

## Security Checklist

Before going live, verify:

- [ ] All environment variables set
- [ ] JWT_SECRET is 64+ characters
- [ ] Database uses strong password
- [ ] CORS restricted to production domains
- [ ] SSL certificates installed and valid
- [ ] Rate limiting configured
- [ ] File upload directory not publicly accessible
- [ ] Error messages don't expose sensitive data
- [ ] Database backups automated
- [ ] Monitoring and alerting configured
- [ ] Firewall rules configured
- [ ] SSH key-only access (no password auth)
- [ ] Twilio credentials secured
- [ ] AWS credentials (if used) have minimal permissions

---

## Support

For deployment assistance:
- Review logs: `pm2 logs fadirect-api`
- Check system resources: `pm2 monit`
- Database queries: Review migration logs
- Security audit: Run `npm audit` in backend

**Emergency Contact:**
- Email: support@fadirect.com
- Phone: +1-XXX-XXX-XXXX

---

**Last Updated:** 2024-04-19  
**Version:** 1.0.0  
**Deployment Target:** Production
