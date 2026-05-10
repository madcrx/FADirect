# Database Migrations

## Running Migrations

To run the policy management migration (038), execute the following SQL file against your PostgreSQL database:

```bash
psql -U your_username -d your_database -f backend/src/migrations/038_add_policy_management.sql
```

Or if you have a migration runner set up, use that to run migration 038.

## Migration 038: Policy Management System

This migration adds:
- `policy_categories` table with 5 default categories
- `policy_documents` table for storing policy metadata
- `policy_acknowledgments` table for tracking staff acknowledgments
- Indexes for performance optimization
- Automatic updated_at triggers

### Required Setup

After running the migration, create an `uploads/policies` directory for file storage:

```bash
mkdir -p uploads/policies
```

The backend API will automatically use this directory for policy document storage.

### Features Enabled

- Policy document upload (PDF, DOC, DOCX up to 50MB)
- Category management
- Version control
- Required acknowledgment tracking
- Soft delete support
- Audit trail (created_by, updated_by, IP address, user agent)
