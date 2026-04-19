-- Migration 029: Add soft delete to users table
-- The lookup/arrangers query expects this column but it doesn't exist

ALTER TABLE users
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_users_deleted ON users(deleted_at);

COMMENT ON COLUMN users.deleted_at IS 'Timestamp when user was soft-deleted';
