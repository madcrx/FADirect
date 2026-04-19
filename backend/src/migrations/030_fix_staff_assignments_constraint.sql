-- Migration 030: Update job_staff_assignments unique constraint to include role
-- This allows the same staff member to be assigned to the same job with different roles

-- Drop the old unique constraint on (job_id, staff_id)
ALTER TABLE job_staff_assignments
DROP CONSTRAINT IF EXISTS job_staff_assignments_job_id_staff_id_key;

-- Add new unique constraint on (job_id, staff_id, role)
ALTER TABLE job_staff_assignments
ADD CONSTRAINT job_staff_assignments_job_staff_role_key
UNIQUE (job_id, staff_id, role);

COMMENT ON CONSTRAINT job_staff_assignments_job_staff_role_key ON job_staff_assignments
IS 'Ensures staff can only be assigned once per job per role, but allows multiple roles';
