-- Migration 019: Combine Calendar Events and Jobs into unified scheduling system

-- Add missing fields to jobs table to support calendar event functionality
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS all_day BOOLEAN DEFAULT false;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS attendees JSONB;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS reminder_minutes INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS color VARCHAR(7); -- Custom color override for job_type color
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS requirements JSONB DEFAULT '{}'::jsonb;

-- Create job types for calendar events that don't exist yet
INSERT INTO job_types (name, description, color, requires_vehicle, default_duration, is_active) VALUES
  ('Appointment', 'General appointment', '#9c27b0', false, 60, true),
  ('Meeting', 'Internal or external meeting', '#f57c00', false, 60, true),
  ('Reminder', 'Important reminder or task', '#388e3c', false, 30, true),
  ('Other', 'Miscellaneous event', '#757575', false, 60, true)
ON CONFLICT (name) DO UPDATE SET is_active = true;

-- Map calendar event types to job types
-- 'service' events will map to existing 'Funeral Service' job type
-- Other event types will map to their corresponding new job types

-- Migrate calendar_events to jobs table
DO $$
DECLARE
  event_record RECORD;
  service_job_type_id UUID;
  appointment_job_type_id UUID;
  meeting_job_type_id UUID;
  reminder_job_type_id UUID;
  other_job_type_id UUID;
BEGIN
  -- Get job type IDs for mapping
  SELECT id INTO service_job_type_id FROM job_types WHERE name = 'Funeral Service';
  SELECT id INTO appointment_job_type_id FROM job_types WHERE name = 'Appointment';
  SELECT id INTO meeting_job_type_id FROM job_types WHERE name = 'Meeting';
  SELECT id INTO reminder_job_type_id FROM job_types WHERE name = 'Reminder';
  SELECT id INTO other_job_type_id FROM job_types WHERE name = 'Other';

  -- Migrate each calendar event to jobs table
  FOR event_record IN
    SELECT * FROM calendar_events WHERE deleted_at IS NULL
  LOOP
    INSERT INTO jobs (
      id, -- Preserve the original ID
      job_type_id,
      arrangement_id,
      title,
      description,
      location,
      start_time,
      end_time,
      status,
      notes,
      created_by,
      all_day,
      attendees,
      reminder_minutes,
      color,
      created_at,
      updated_at
    )
    VALUES (
      event_record.id,
      CASE event_record.event_type
        WHEN 'service' THEN service_job_type_id
        WHEN 'appointment' THEN appointment_job_type_id
        WHEN 'meeting' THEN meeting_job_type_id
        WHEN 'reminder' THEN reminder_job_type_id
        ELSE other_job_type_id
      END,
      event_record.arrangement_id,
      event_record.title,
      event_record.description,
      event_record.location,
      event_record.start_time,
      event_record.end_time,
      event_record.status,
      event_record.notes,
      event_record.created_by,
      event_record.all_day,
      event_record.attendees,
      event_record.reminder_minutes,
      event_record.color,
      event_record.created_at,
      event_record.updated_at
    )
    ON CONFLICT (id) DO NOTHING; -- Skip if already exists (e.g., re-running migration)
  END LOOP;

  -- Mark calendar events as migrated by soft deleting them
  UPDATE calendar_events
  SET deleted_at = CURRENT_TIMESTAMP
  WHERE deleted_at IS NULL;

  RAISE NOTICE 'Migrated calendar events to jobs table';
END $$;

-- Add index for new fields
CREATE INDEX IF NOT EXISTS idx_jobs_all_day ON jobs(all_day);
CREATE INDEX IF NOT EXISTS idx_jobs_reminder ON jobs(reminder_minutes) WHERE reminder_minutes IS NOT NULL;

COMMENT ON COLUMN jobs.all_day IS 'Whether this is an all-day event';
COMMENT ON COLUMN jobs.attendees IS 'JSON array of attendee information';
COMMENT ON COLUMN jobs.reminder_minutes IS 'Minutes before start time to send reminder';
COMMENT ON COLUMN jobs.color IS 'Custom color override (hex) for this specific job, overrides job_type color';
COMMENT ON COLUMN jobs.requirements IS 'JSON object containing job requirements and specifications';
