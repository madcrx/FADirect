-- Add restore functionality to all soft-delete tables
-- This migration adds indexes and helper functions for managing deleted items

-- Function to restore a deleted record
CREATE OR REPLACE FUNCTION restore_deleted_record(table_name TEXT, record_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  EXECUTE format('UPDATE %I SET deleted_at = NULL WHERE id = $1', table_name) USING record_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to permanently delete a record
CREATE OR REPLACE FUNCTION permanently_delete_record(table_name TEXT, record_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  EXECUTE format('DELETE FROM %I WHERE id = $1 AND deleted_at IS NOT NULL', table_name) USING record_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Backup Schedules Table
CREATE TABLE IF NOT EXISTS backup_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  schedule_type VARCHAR(20) CHECK (schedule_type IN ('hourly', 'daily', 'weekly', 'monthly')),
  schedule_time TIME,
  schedule_day INTEGER, -- day of week (0-6) or day of month (1-31)
  backup_location VARCHAR(50) CHECK (backup_location IN ('local', 's3', 'google_drive', 'dropbox')),
  location_config JSONB,
  enabled BOOLEAN DEFAULT true,
  last_run TIMESTAMP,
  last_status VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_backup_schedules_enabled ON backup_schedules(enabled);
CREATE INDEX IF NOT EXISTS idx_backup_schedules_last_run ON backup_schedules(last_run);

-- Backup History Table
CREATE TABLE IF NOT EXISTS backup_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES backup_schedules(id),
  backup_type VARCHAR(20) CHECK (backup_type IN ('manual', 'automatic')),
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT,
  file_path TEXT,
  cloud_url TEXT,
  status VARCHAR(20) CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  error_message TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_backup_history_schedule ON backup_history(schedule_id);
CREATE INDEX IF NOT EXISTS idx_backup_history_status ON backup_history(status);
CREATE INDEX IF NOT EXISTS idx_backup_history_created ON backup_history(created_at DESC);

-- Email Queue Table (for sending emails)
CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email VARCHAR(255) NOT NULL,
  to_name VARCHAR(255),
  from_email VARCHAR(255),
  from_name VARCHAR(255),
  subject VARCHAR(500) NOT NULL,
  body TEXT NOT NULL,
  html_body TEXT,
  template_id UUID REFERENCES notification_templates(id),
  template_variables JSONB,
  attachments JSONB,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
  sent_at TIMESTAMP,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_created ON email_queue(created_at);

-- Update triggers
DROP TRIGGER IF EXISTS trigger_update_backup_schedules_updated_at ON backup_schedules;
CREATE TRIGGER trigger_update_backup_schedules_updated_at
BEFORE UPDATE ON backup_schedules
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
