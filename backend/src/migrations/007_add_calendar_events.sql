-- Calendar Events Table
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('service', 'appointment', 'meeting', 'reminder', 'other')),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  all_day BOOLEAN DEFAULT false,
  location VARCHAR(255),
  arrangement_id UUID REFERENCES arrangements(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  attendees JSONB,
  reminder_minutes INTEGER,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled')),
  color VARCHAR(7),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_end_time ON calendar_events(end_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_arrangement ON calendar_events(arrangement_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(event_type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON calendar_events(status);
CREATE INDEX IF NOT EXISTS idx_calendar_events_deleted ON calendar_events(deleted_at);

-- Update trigger for calendar_events
DROP TRIGGER IF EXISTS trigger_update_calendar_events_updated_at ON calendar_events;
CREATE TRIGGER trigger_update_calendar_events_updated_at
BEFORE UPDATE ON calendar_events
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Notification Templates Table
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  template_type VARCHAR(50) NOT NULL CHECK (template_type IN ('email', 'sms')),
  event_trigger VARCHAR(50) NOT NULL,
  subject VARCHAR(255),
  body TEXT NOT NULL,
  variables JSONB,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_templates_trigger ON notification_templates(event_trigger);
CREATE INDEX IF NOT EXISTS idx_notification_templates_active ON notification_templates(active);

-- Insert default notification templates
INSERT INTO notification_templates (name, template_type, event_trigger, subject, body, variables, active)
VALUES
  (
    'Service Reminder',
    'email',
    'service_reminder',
    'Reminder: Funeral Service for {{deceased_name}}',
    'Dear {{mourner_name}},

This is a reminder that the funeral service for {{deceased_name}} is scheduled for:

Date: {{service_date}}
Time: {{service_time}}
Location: {{service_location}}

If you have any questions, please contact us at {{company_phone}}.

With our deepest sympathy,
{{company_name}}',
    '["deceased_name", "mourner_name", "service_date", "service_time", "service_location", "company_phone", "company_name"]'::jsonb,
    true
  ),
  (
    'Invoice Sent',
    'email',
    'invoice_created',
    'Invoice {{invoice_number}} from {{company_name}}',
    'Dear {{mourner_name}},

Please find attached invoice {{invoice_number}} for services provided for {{deceased_name}}.

Invoice Amount: ${{invoice_total}}
Due Date: {{due_date}}

Payment can be made via bank transfer or credit card. Please contact us if you have any questions.

Thank you,
{{company_name}}
{{company_phone}}',
    '["mourner_name", "deceased_name", "invoice_number", "invoice_total", "due_date", "company_name", "company_phone"]'::jsonb,
    true
  ),
  (
    'Payment Received',
    'email',
    'payment_received',
    'Payment Confirmation - {{company_name}}',
    'Dear {{mourner_name}},

We have received your payment of ${{payment_amount}} for invoice {{invoice_number}}.

Thank you for your prompt payment.

With our sympathy,
{{company_name}}',
    '["mourner_name", "payment_amount", "invoice_number", "company_name"]'::jsonb,
    true
  )
ON CONFLICT DO NOTHING;

-- Update trigger for notification_templates
DROP TRIGGER IF EXISTS trigger_update_notification_templates_updated_at ON notification_templates;
CREATE TRIGGER trigger_update_notification_templates_updated_at
BEFORE UPDATE ON notification_templates
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
