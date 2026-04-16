-- Migration 012: Update user roles
-- Add new staff roles for better permission management

-- Drop the old CHECK constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new CHECK constraint with expanded roles
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'management', 'arranger', 'conductor', 'funeral_director_assistant', 'embalmer', 'driver', 'mourner'));

-- Create index on role for faster queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Add comment explaining roles
COMMENT ON COLUMN users.role IS 'User role: admin (full access), management (portal management), arranger (arrangements), conductor (funeral conductor), funeral_director_assistant (assistant to funeral director), embalmer (mortuary), driver (transport), mourner (family member, app only)';
