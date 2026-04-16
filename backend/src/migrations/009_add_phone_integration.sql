-- Migration 009: Phone Integration
-- Add call logging and phone integration features

-- Call logs table
CREATE TABLE IF NOT EXISTS call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sid VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  arrangement_id UUID REFERENCES arrangements(id) ON DELETE SET NULL,
  to_number VARCHAR(20) NOT NULL,
  from_number VARCHAR(20) NOT NULL,
  status VARCHAR(50) NOT NULL,
  direction VARCHAR(20) NOT NULL, -- 'outbound', 'inbound'
  duration INTEGER, -- in seconds
  recording_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add Twilio settings to company_settings if columns don't exist
DO $$
BEGIN
  BEGIN
    ALTER TABLE company_settings ADD COLUMN twilio_account_sid VARCHAR(255);
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;

  BEGIN
    ALTER TABLE company_settings ADD COLUMN twilio_auth_token VARCHAR(255);
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;

  BEGIN
    ALTER TABLE company_settings ADD COLUMN twilio_phone_number VARCHAR(20);
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;
END $$;

-- Add external_id to messages table for tracking Twilio message SIDs
DO $$
BEGIN
  BEGIN
    ALTER TABLE messages ADD COLUMN external_id VARCHAR(255);
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;
END $$;

-- Index for faster call log lookups
CREATE INDEX IF NOT EXISTS idx_call_logs_arrangement ON call_logs(arrangement_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_user ON call_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_created ON call_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_external_id ON messages(external_id);

-- Audit log for call activity
CREATE OR REPLACE FUNCTION log_call_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    details
  ) VALUES (
    NEW.user_id,
    'phone_call',
    'call_log',
    NEW.id,
    jsonb_build_object(
      'to_number', NEW.to_number,
      'status', NEW.status,
      'direction', NEW.direction,
      'arrangement_id', NEW.arrangement_id
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for call logging
DROP TRIGGER IF EXISTS trigger_log_call_activity ON call_logs;
CREATE TRIGGER trigger_log_call_activity
  AFTER INSERT ON call_logs
  FOR EACH ROW
  EXECUTE FUNCTION log_call_activity();

COMMENT ON TABLE call_logs IS 'Logs of all phone calls made through the system';
COMMENT ON COLUMN call_logs.call_sid IS 'Twilio call SID for tracking';
COMMENT ON COLUMN call_logs.duration IS 'Call duration in seconds';
