-- Migration 025: Add missing notification columns
-- Migration 010 tried to create notifications table with additional columns,
-- but since migration 001 already created it, CREATE TABLE IF NOT EXISTS silently no-oped.
-- This migration adds the missing columns that should have been added in migration 010.

-- Add category column for categorizing notifications
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'system';

-- Add entity_type column for tracking the type of related entity
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50);

-- Add entity_id column for referencing the related entity
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS entity_id UUID;

-- Add read_at column for tracking when notification was read
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;

-- Add action_url column for navigation links
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS action_url TEXT;

-- Update existing notifications to have proper defaults
UPDATE notifications
SET category = 'system'
WHERE category IS NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_entity ON notifications(entity_type, entity_id);

COMMENT ON COLUMN notifications.category IS 'Category of notification: arrangement, invoice, message, system, user, job';
COMMENT ON COLUMN notifications.entity_type IS 'Type of the related entity';
COMMENT ON COLUMN notifications.entity_id IS 'UUID reference to the related entity';
COMMENT ON COLUMN notifications.read_at IS 'Timestamp when the notification was read';
COMMENT ON COLUMN notifications.action_url IS 'URL to navigate to when notification is clicked';
