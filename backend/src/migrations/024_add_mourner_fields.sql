-- Migration 024: Add mourner contact fields to arrangements

ALTER TABLE arrangements ADD COLUMN IF NOT EXISTS mourner_phone VARCHAR(20);
ALTER TABLE arrangements ADD COLUMN IF NOT EXISTS mourner_name VARCHAR(255);
ALTER TABLE arrangements ADD COLUMN IF NOT EXISTS mourner_relationship VARCHAR(100);
ALTER TABLE arrangements ADD COLUMN IF NOT EXISTS mourner_email VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_arrangements_mourner_phone ON arrangements(mourner_phone);

COMMENT ON COLUMN arrangements.mourner_phone IS 'Primary mourner contact phone number';
COMMENT ON COLUMN arrangements.mourner_name IS 'Primary mourner name';
COMMENT ON COLUMN arrangements.mourner_relationship IS 'Relationship to deceased';
COMMENT ON COLUMN arrangements.mourner_email IS 'Primary mourner email address';
