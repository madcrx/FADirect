-- Migration 010: Notifications System
-- Add comprehensive notifications and alerts functionality

-- Notification types: 'info', 'success', 'warning', 'error'
-- Categories: 'arrangement', 'invoice', 'message', 'system', 'user'

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'info', -- 'info', 'success', 'warning', 'error'
  category VARCHAR(50) DEFAULT 'system', -- 'arrangement', 'invoice', 'message', 'system', 'user'
  entity_type VARCHAR(50), -- 'arrangement', 'invoice', 'message', etc.
  entity_id UUID, -- Reference to the related entity
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  action_url TEXT, -- URL for clicking the notification
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notification preferences for users
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  push_enabled BOOLEAN DEFAULT true,
  -- Category-specific preferences
  arrangement_notifications BOOLEAN DEFAULT true,
  invoice_notifications BOOLEAN DEFAULT true,
  message_notifications BOOLEAN DEFAULT true,
  system_notifications BOOLEAN DEFAULT true,
  -- Frequency settings
  digest_enabled BOOLEAN DEFAULT false,
  digest_frequency VARCHAR(20) DEFAULT 'daily', -- 'hourly', 'daily', 'weekly'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System alerts (broadcast messages to all users or specific roles)
CREATE TABLE IF NOT EXISTS system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'info',
  target_roles TEXT[], -- Array of roles: ['admin', 'staff', 'viewer']
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Track which users have dismissed system alerts
CREATE TABLE IF NOT EXISTS system_alert_dismissals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES system_alerts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(alert_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_system_alerts_active ON system_alerts(is_active) WHERE is_active = true;

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_title VARCHAR,
  p_body TEXT,
  p_type VARCHAR DEFAULT 'info',
  p_category VARCHAR DEFAULT 'system',
  p_entity_type VARCHAR DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_action_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id,
    title,
    body,
    type,
    category,
    entity_type,
    entity_id,
    action_url
  ) VALUES (
    p_user_id,
    p_title,
    p_body,
    p_type,
    p_category,
    p_entity_type,
    p_entity_id,
    p_action_url
  ) RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to send notification to all users with specific role
CREATE OR REPLACE FUNCTION create_role_notification(
  p_role VARCHAR,
  p_title VARCHAR,
  p_body TEXT,
  p_type VARCHAR DEFAULT 'info',
  p_category VARCHAR DEFAULT 'system'
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_user RECORD;
BEGIN
  FOR v_user IN
    SELECT id FROM users WHERE role = p_role
  LOOP
    PERFORM create_notification(
      v_user.id,
      p_title,
      p_body,
      p_type,
      p_category
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger to notify users when they're assigned to an arrangement
CREATE OR REPLACE FUNCTION notify_arrangement_assignment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assigned_to IS NOT NULL AND (OLD.assigned_to IS NULL OR OLD.assigned_to != NEW.assigned_to) THEN
    PERFORM create_notification(
      NEW.assigned_to,
      'New Arrangement Assigned',
      'You have been assigned to arrangement for ' || NEW.deceased_name,
      'info',
      'arrangement',
      'arrangement',
      NEW.id,
      '/arrangements/' || NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_arrangement_assignment ON arrangements;
CREATE TRIGGER trigger_notify_arrangement_assignment
  AFTER INSERT OR UPDATE ON arrangements
  FOR EACH ROW
  EXECUTE FUNCTION notify_arrangement_assignment();

-- Trigger to notify when arrangement status changes
CREATE OR REPLACE FUNCTION notify_arrangement_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    -- Notify assigned user
    IF NEW.assigned_to IS NOT NULL THEN
      PERFORM create_notification(
        NEW.assigned_to,
        'Arrangement Status Updated',
        'Arrangement for ' || NEW.deceased_name || ' is now ' || NEW.status,
        CASE
          WHEN NEW.status = 'completed' THEN 'success'
          WHEN NEW.status = 'cancelled' THEN 'warning'
          ELSE 'info'
        END,
        'arrangement',
        'arrangement',
        NEW.id,
        '/arrangements/' || NEW.id
      );
    END IF;

    -- Notify creator if different from assigned user
    IF NEW.created_by IS NOT NULL AND NEW.created_by != NEW.assigned_to THEN
      PERFORM create_notification(
        NEW.created_by,
        'Arrangement Status Updated',
        'Arrangement for ' || NEW.deceased_name || ' is now ' || NEW.status,
        CASE
          WHEN NEW.status = 'completed' THEN 'success'
          WHEN NEW.status = 'cancelled' THEN 'warning'
          ELSE 'info'
        END,
        'arrangement',
        'arrangement',
        NEW.id,
        '/arrangements/' || NEW.id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_arrangement_status_change ON arrangements;
CREATE TRIGGER trigger_notify_arrangement_status_change
  AFTER UPDATE ON arrangements
  FOR EACH ROW
  EXECUTE FUNCTION notify_arrangement_status_change();

-- Trigger to notify when invoice is created
CREATE OR REPLACE FUNCTION notify_invoice_created()
RETURNS TRIGGER AS $$
DECLARE
  v_arrangement RECORD;
BEGIN
  -- Get arrangement details
  SELECT * INTO v_arrangement FROM arrangements WHERE id = NEW.arrangement_id;

  IF v_arrangement.assigned_to IS NOT NULL THEN
    PERFORM create_notification(
      v_arrangement.assigned_to,
      'New Invoice Created',
      'Invoice ' || NEW.invoice_number || ' created for ' || v_arrangement.deceased_name,
      'info',
      'invoice',
      'invoice',
      NEW.id,
      '/invoicing'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_invoice_created ON invoices;
CREATE TRIGGER trigger_notify_invoice_created
  AFTER INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION notify_invoice_created();

-- Trigger to notify when invoice status changes
CREATE OR REPLACE FUNCTION notify_invoice_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_arrangement RECORD;
BEGIN
  IF OLD.status != NEW.status THEN
    -- Get arrangement details
    SELECT * INTO v_arrangement FROM arrangements WHERE id = NEW.arrangement_id;

    IF v_arrangement.assigned_to IS NOT NULL THEN
      PERFORM create_notification(
        v_arrangement.assigned_to,
        'Invoice Status Updated',
        'Invoice ' || NEW.invoice_number || ' is now ' || NEW.status,
        CASE
          WHEN NEW.status = 'paid' THEN 'success'
          WHEN NEW.status = 'overdue' THEN 'error'
          ELSE 'info'
        END,
        'invoice',
        'invoice',
        NEW.id,
        '/invoicing'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_invoice_status_change ON invoices;
CREATE TRIGGER trigger_notify_invoice_status_change
  AFTER UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION notify_invoice_status_change();

-- Trigger to notify when message is received
CREATE OR REPLACE FUNCTION notify_message_received()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify arrangement assigned user if exists
  IF NEW.arrangement_id IS NOT NULL THEN
    DECLARE
      v_arrangement RECORD;
    BEGIN
      SELECT * INTO v_arrangement FROM arrangements WHERE id = NEW.arrangement_id;

      IF v_arrangement.assigned_to IS NOT NULL AND v_arrangement.assigned_to != NEW.sender_id THEN
        PERFORM create_notification(
          v_arrangement.assigned_to,
          'New Message Received',
          'New message from ' || COALESCE(NEW.sender_phone, NEW.sender_email),
          'info',
          'message',
          'message',
          NEW.id,
          '/arrangements/' || NEW.arrangement_id
        );
      END IF;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_message_received ON messages;
CREATE TRIGGER trigger_notify_message_received
  AFTER INSERT ON messages
  FOR EACH ROW
  WHEN (NEW.direction = 'inbound')
  EXECUTE FUNCTION notify_message_received();

COMMENT ON TABLE notifications IS 'User notifications for events and updates';
COMMENT ON TABLE notification_preferences IS 'User-specific notification preferences and settings';
COMMENT ON TABLE system_alerts IS 'System-wide broadcast messages and alerts';
COMMENT ON TABLE system_alert_dismissals IS 'Tracks which users have dismissed system alerts';
