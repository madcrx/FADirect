-- Migration 028: Add is_primary column to job_vehicle_assignments
-- The roster.js route tries to use this column but it doesn't exist

ALTER TABLE job_vehicle_assignments
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;

COMMENT ON COLUMN job_vehicle_assignments.is_primary IS 'Whether this is the primary vehicle for the job';
