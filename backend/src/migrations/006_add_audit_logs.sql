-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  changes JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- Company Settings Table
CREATE TABLE IF NOT EXISTS company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(255) NOT NULL,
  abn VARCHAR(20),
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(255),
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#1A3A52',
  secondary_color VARCHAR(7) DEFAULT '#2C5F7F',
  email_from_name VARCHAR(255),
  email_from_address VARCHAR(255),
  smtp_host VARCHAR(255),
  smtp_port INTEGER,
  smtp_user VARCHAR(255),
  smtp_password VARCHAR(255),
  smtp_secure BOOLEAN DEFAULT true,
  invoice_prefix VARCHAR(10) DEFAULT 'INV',
  invoice_terms TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO company_settings (company_name, address, phone, email)
VALUES (
  'FA Direct',
  '123 Funeral Avenue, Sydney NSW 2000',
  '+61 2 9999 9999',
  'info@fadirect.com.au'
) ON CONFLICT DO NOTHING;

-- Update trigger for company_settings
DROP TRIGGER IF EXISTS trigger_update_company_settings_updated_at ON company_settings;
CREATE TRIGGER trigger_update_company_settings_updated_at
BEFORE UPDATE ON company_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
