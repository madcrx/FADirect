-- Migration 026: Fix backup_schedules schema to match application code
-- The original migration used different column names than what the code expects

-- Rename and add columns to match application code
ALTER TABLE backup_schedules
  RENAME COLUMN schedule_type TO frequency;

ALTER TABLE backup_schedules
  RENAME COLUMN backup_location TO destination;

ALTER TABLE backup_schedules
  RENAME COLUMN location_config TO destination_config;

ALTER TABLE backup_schedules
  RENAME COLUMN enabled TO is_active;

ALTER TABLE backup_schedules
  RENAME COLUMN last_run TO last_run_at;

-- Add next_run_at column which is required by the scheduler
ALTER TABLE backup_schedules
  ADD COLUMN IF NOT EXISTS next_run_at TIMESTAMP;

-- Drop old columns that aren't used by the application
ALTER TABLE backup_schedules
  DROP COLUMN IF EXISTS schedule_time,
  DROP COLUMN IF EXISTS schedule_day,
  DROP COLUMN IF EXISTS last_status;

-- Drop old CHECK constraints
ALTER TABLE backup_schedules
  DROP CONSTRAINT IF EXISTS backup_schedules_schedule_type_check,
  DROP CONSTRAINT IF EXISTS backup_schedules_backup_location_check;

-- Add new CHECK constraints with updated values
ALTER TABLE backup_schedules
  ADD CONSTRAINT backup_schedules_frequency_check
    CHECK (frequency IN ('15min', 'custom', 'hourly', 'daily', 'weekly', 'monthly'));

ALTER TABLE backup_schedules
  ADD CONSTRAINT backup_schedules_destination_check
    CHECK (destination IN ('local', 's3', 'google-drive', 'dropbox'));

-- Update indexes to use new column names
DROP INDEX IF EXISTS idx_backup_schedules_enabled;
DROP INDEX IF EXISTS idx_backup_schedules_last_run;

CREATE INDEX IF NOT EXISTS idx_backup_schedules_is_active ON backup_schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_backup_schedules_last_run_at ON backup_schedules(last_run_at);
CREATE INDEX IF NOT EXISTS idx_backup_schedules_next_run_at ON backup_schedules(next_run_at);

-- Update backup_history to use started_at consistently
ALTER TABLE backup_history
  DROP COLUMN IF EXISTS backup_type,
  DROP COLUMN IF EXISTS file_name,
  DROP COLUMN IF EXISTS cloud_url;

-- Add error_message column if it doesn't exist (code expects it)
ALTER TABLE backup_history
  ADD COLUMN IF NOT EXISTS error_message TEXT;

COMMENT ON COLUMN backup_schedules.frequency IS 'Backup frequency: 15min, hourly, daily, weekly, monthly';
COMMENT ON COLUMN backup_schedules.destination IS 'Backup destination: local, s3, google-drive, dropbox';
COMMENT ON COLUMN backup_schedules.next_run_at IS 'Next scheduled run time for the backup';
