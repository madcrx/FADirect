# FA Direct Custom REST API

Complete backend API for FA Direct funeral communication platform.

## Features

- ✅ **JWT Authentication** with phone number verification
- ✅ **User Management** (mourners, arrangers, admins)
- ✅ **Funeral Arrangements** CRUD operations
- ✅ **End-to-End Encrypted Messaging** (supports Signal Protocol)
- ✅ **File Upload** for documents and photos
- ✅ **PostgreSQL Database** with full schema
- ✅ **Twilio Integration** for SMS verification

## Quick Start

### 1. Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- (Optional) Twilio account for SMS verification

### 2. Installation

```bash
cd backend
npm install
```

### 3. Database Setup

```bash
# Create PostgreSQL database
createdb fadirect

# Run migrations
psql fadirect < src/migrations/001_initial_schema.sql
```

### 4. Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your settings
nano .env
```

**Required settings:**
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `JWT_SECRET` (generate with `openssl rand -hex 32`)
- (Optional) Twilio credentials for production

### 5. Run

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

Server runs on http://localhost:3000

## API Endpoints

### Authentication

```
POST /api/auth/send-code
POST /api/auth/verify-code
GET /api/auth/me
POST /api/auth/logout
```

### Users

```
GET /api/users/:id
PUT /api/users/me
```

### Arrangements

```
GET /api/arrangements
GET /api/arrangements/:id
POST /api/arrangements
PUT /api/arrangements/:id
```

### Messages

```
GET /api/messages/arrangement/:arrangementId
POST /api/messages
PUT /api/messages/:id/read
```

### Documents

```
POST /api/documents/upload
GET /api/documents/arrangement/:arrangementId
```

## Development Mode

Without Twilio configured, the API uses mock verification:
- Code is always `123456`
- Verification always succeeds

## Production Deployment

### Option 1: Heroku

```bash
heroku create fadirect-api
heroku addons:create heroku-postgresql:mini
heroku config:set JWT_SECRET=your-secret-here
heroku config:set TWILIO_ACCOUNT_SID=your-sid
heroku config:set TWILIO_AUTH_TOKEN=your-token
heroku config:set TWILIO_VERIFY_SERVICE_SID=your-service-sid
git push heroku main
```

### Option 2: AWS/DigitalOcean/etc.

1. Set up PostgreSQL database
2. Install Node.js 18+
3. Clone repo and run `npm install --production`
4. Set environment variables
5. Run migrations
6. Start with PM2: `pm2 start src/server.js --name fadirect-api`

## Security Notes

- **CHANGE** `JWT_SECRET` in production!
- Use HTTPS in production (reverse proxy with nginx/Caddy)
- Enable rate limiting for auth endpoints
- Configure CORS for your frontend domain only
- Regular database backups

## Database Schema

See `src/migrations/001_initial_schema.sql` for complete schema.

**Main Tables:**
- `users` - User accounts
- `organizations` - Funeral homes
- `arrangements` - Funeral arrangements
- `messages` - Encrypted messages
- `encryption_keys` - Signal Protocol keys
- `documents` - Uploaded files
- `notifications` - Push notifications

## Support

For issues, contact the development team or open an issue on GitHub.
