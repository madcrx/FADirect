-- Migration 037: Add user registration and approval workflow
-- Allows staff and mourners to register via mobile app
-- Admins approve/reject registrations

-- Pending user registrations table
CREATE TABLE IF NOT EXISTS pending_user_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  requested_role VARCHAR(20) NOT NULL CHECK (requested_role IN ('staff', 'mourner')),
  registration_data JSONB, -- Additional data from registration form
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,

  -- Admin actions
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,

  -- Verification
  verification_code VARCHAR(10),
  code_verified_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT valid_phone CHECK (phone_number ~ '^\+[1-9]\d{1,14}$')
);

CREATE INDEX IF NOT EXISTS idx_pending_registrations_status
  ON pending_user_registrations(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pending_registrations_phone
  ON pending_user_registrations(phone_number);

-- Admin notifications for pending registrations
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type VARCHAR(50) NOT NULL, -- 'user_registration', 'shift_declined', etc.
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  related_entity_type VARCHAR(50), -- 'pending_registration', 'job', etc.
  related_entity_id UUID,

  -- Who should see this
  target_roles TEXT[] DEFAULT '{admin}', -- Array of roles that should see this

  -- Read tracking
  read_by UUID[] DEFAULT '{}', -- Array of user IDs who have read this

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP -- Optional expiration
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_roles
  ON admin_notifications USING GIN(target_roles);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created
  ON admin_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_expires
  ON admin_notifications(expires_at)
  WHERE expires_at IS NOT NULL;

-- Email queue for registration notifications
ALTER TABLE email_queue
  ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 5, -- 1 (highest) to 10 (lowest)
  ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP; -- Send at specific time

CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled
  ON email_queue(scheduled_for)
  WHERE status = 'pending';

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_pending_registrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_pending_registrations_updated_at ON pending_user_registrations;
CREATE TRIGGER trigger_update_pending_registrations_updated_at
  BEFORE UPDATE ON pending_user_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_pending_registrations_updated_at();

COMMENT ON TABLE pending_user_registrations IS 'User registrations awaiting admin approval';
COMMENT ON TABLE admin_notifications IS 'Notifications for admins/managers about system events';
COMMENT ON COLUMN pending_user_registrations.status IS 'Registration status: pending, approved, rejected';
COMMENT ON COLUMN pending_user_registrations.requested_role IS 'Role requested: staff or mourner';
