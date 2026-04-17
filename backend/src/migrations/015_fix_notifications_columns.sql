-- Migration 015: Fix notifications table column names
-- Rename is_read to read, and message to body for consistency

-- Fix notifications table if columns exist with old names
DO $$
BEGIN
  -- Rename is_read to read if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'is_read'
  ) THEN
    ALTER TABLE notifications RENAME COLUMN is_read TO read;
  END IF;

  -- Rename message to body if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'message'
  ) THEN
    ALTER TABLE notifications RENAME COLUMN message TO body;
  END IF;
END $$;

-- Fix system_alerts table if columns exist with old names
DO $$
BEGIN
  -- Rename message to body if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_alerts' AND column_name = 'message'
  ) THEN
    ALTER TABLE system_alerts RENAME COLUMN message TO body;
  END IF;
END $$;

-- Drop old indexes if they exist
DROP INDEX IF EXISTS idx_notifications_is_read;
DROP INDEX IF EXISTS idx_notifications_user_unread;

-- Create new indexes with correct column names
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read) WHERE read = false;

COMMENT ON COLUMN notifications.read IS 'Whether the notification has been read by the user';
COMMENT ON COLUMN notifications.body IS 'The notification message body text';
COMMENT ON COLUMN system_alerts.body IS 'The alert message body text';
