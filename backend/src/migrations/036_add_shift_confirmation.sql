-- Migration 036: Add shift confirmation tracking
-- Allows staff to accept/decline roster assignments via mobile app

-- Add confirmation status to job_staff_assignments
ALTER TABLE job_staff_assignments
  ADD COLUMN IF NOT EXISTS confirmation_status VARCHAR(20) DEFAULT 'pending'
    CHECK (confirmation_status IN ('pending', 'accepted', 'declined')),
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS confirmation_notes TEXT;

-- Add index for filtering by confirmation status
CREATE INDEX IF NOT EXISTS idx_job_staff_assignments_confirmation
  ON job_staff_assignments(confirmation_status);

-- Add notification tracking for roster assignments
CREATE TABLE IF NOT EXISTS roster_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES job_staff_assignments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL, -- 'roster_assigned', 'roster_updated', 'roster_cancelled'
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  data JSONB, -- Additional notification data
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_roster_notifications_user
  ON roster_notifications(user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_roster_notifications_assignment
  ON roster_notifications(assignment_id);

-- Add push notification tokens table for mobile devices
CREATE TABLE IF NOT EXISTS push_notification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  device_token TEXT NOT NULL,
  device_type VARCHAR(20) NOT NULL, -- 'ios', 'android', 'web'
  device_name VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, device_token)
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user
  ON push_notification_tokens(user_id)
  WHERE is_active = true;

COMMENT ON TABLE roster_notifications IS 'Track roster-related notifications sent to staff';
COMMENT ON TABLE push_notification_tokens IS 'Store device tokens for push notifications';
COMMENT ON COLUMN job_staff_assignments.confirmation_status IS 'Staff confirmation status: pending, accepted, declined';
