-- Migration 013: Convert role to array to support multiple roles per user
-- Staff members can now have multiple roles (e.g., Driver + Embalmer)

-- Add new roles column as array
ALTER TABLE users ADD COLUMN IF NOT EXISTS roles TEXT[];

-- Migrate existing role data to roles array
UPDATE users SET roles = ARRAY[role] WHERE roles IS NULL;

-- Drop the old role column and constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users DROP COLUMN IF EXISTS role;

-- Rename roles to role for backwards compatibility
ALTER TABLE users RENAME COLUMN roles TO role;

-- Add constraint to ensure at least one role
ALTER TABLE users ADD CONSTRAINT users_role_not_empty
  CHECK (array_length(role, 1) > 0);

-- Add constraint to validate role values
ALTER TABLE users ADD CONSTRAINT users_role_valid
  CHECK (
    role <@ ARRAY['admin', 'management', 'arranger', 'conductor', 'funeral_director_assistant', 'embalmer', 'driver', 'mourner']::TEXT[]
  );

-- Create GIN index for faster array queries
CREATE INDEX IF NOT EXISTS idx_users_role_gin ON users USING GIN(role);

-- Drop old b-tree index if exists
DROP INDEX IF EXISTS idx_users_role;

-- Add comment
COMMENT ON COLUMN users.role IS 'User roles (array): Can have multiple roles like [''driver'', ''embalmer'']. Valid values: admin, management, arranger, conductor, funeral_director_assistant, embalmer, driver, mourner';
