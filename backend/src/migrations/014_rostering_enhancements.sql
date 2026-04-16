-- Migration 014: Split driver role and add job requirements

-- Update role constraint to include hearse_driver and coach_driver, remove generic driver
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_valid;

ALTER TABLE users ADD CONSTRAINT users_role_valid
  CHECK (
    role <@ ARRAY['admin', 'management', 'arranger', 'conductor', 'funeral_director_assistant', 'embalmer', 'hearse_driver', 'coach_driver', 'mourner']::TEXT[]
  );

-- Migrate existing 'driver' roles to 'hearse_driver' (default assumption)
UPDATE users
SET role = array_replace(role, 'driver', 'hearse_driver')
WHERE 'driver' = ANY(role);

-- Add job_requirements JSONB column to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS requirements JSONB DEFAULT '{}'::jsonb;

-- Add comment explaining requirements structure
COMMENT ON COLUMN jobs.requirements IS 'Job staffing requirements as JSONB, e.g., {"arranger": 1, "funeral_director_assistant": 4, "hearse_driver": 1, "coach_driver": 1, "embalmer": 1}';

-- Create leave_requests table
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_leave_requests_staff ON leave_requests(staff_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_leave_request_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leave_requests_updated_at
  BEFORE UPDATE ON leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_leave_request_timestamp();

-- Update role comment
COMMENT ON COLUMN users.role IS 'User roles (array): Can have multiple roles. Valid values: admin, management, arranger, conductor, funeral_director_assistant, embalmer, hearse_driver, coach_driver, mourner';
