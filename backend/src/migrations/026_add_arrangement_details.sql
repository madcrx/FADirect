-- Migration 026: Add additional arrangement details fields
-- Add deceased address, next of kin, and location fields

-- Deceased address fields
ALTER TABLE arrangements ADD COLUMN IF NOT EXISTS deceased_address_line1 VARCHAR(255);
ALTER TABLE arrangements ADD COLUMN IF NOT EXISTS deceased_address_line2 VARCHAR(255);
ALTER TABLE arrangements ADD COLUMN IF NOT EXISTS deceased_city VARCHAR(100);
ALTER TABLE arrangements ADD COLUMN IF NOT EXISTS deceased_state VARCHAR(50);
ALTER TABLE arrangements ADD COLUMN IF NOT EXISTS deceased_postcode VARCHAR(20);
ALTER TABLE arrangements ADD COLUMN IF NOT EXISTS deceased_country VARCHAR(100) DEFAULT 'Australia';

-- Next of kin details
ALTER TABLE arrangements ADD COLUMN IF NOT EXISTS next_of_kin_name VARCHAR(255);
ALTER TABLE arrangements ADD COLUMN IF NOT EXISTS next_of_kin_relationship VARCHAR(100);
ALTER TABLE arrangements ADD COLUMN IF NOT EXISTS next_of_kin_phone VARCHAR(20);
ALTER TABLE arrangements ADD COLUMN IF NOT EXISTS next_of_kin_email VARCHAR(255);

-- Location of deceased (where the body is currently located)
ALTER TABLE arrangements ADD COLUMN IF NOT EXISTS location_of_deceased TEXT;

-- Add indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_arrangements_deceased_postcode ON arrangements(deceased_postcode);
CREATE INDEX IF NOT EXISTS idx_arrangements_next_of_kin_phone ON arrangements(next_of_kin_phone);

-- Comments for documentation
COMMENT ON COLUMN arrangements.deceased_address_line1 IS 'Deceased residential address line 1';
COMMENT ON COLUMN arrangements.deceased_address_line2 IS 'Deceased residential address line 2';
COMMENT ON COLUMN arrangements.deceased_city IS 'Deceased residential city';
COMMENT ON COLUMN arrangements.deceased_state IS 'Deceased residential state/territory';
COMMENT ON COLUMN arrangements.deceased_postcode IS 'Deceased residential postcode';
COMMENT ON COLUMN arrangements.deceased_country IS 'Deceased residential country';
COMMENT ON COLUMN arrangements.next_of_kin_name IS 'Next of kin full name';
COMMENT ON COLUMN arrangements.next_of_kin_relationship IS 'Next of kin relationship to deceased';
COMMENT ON COLUMN arrangements.next_of_kin_phone IS 'Next of kin contact phone number';
COMMENT ON COLUMN arrangements.next_of_kin_email IS 'Next of kin email address';
COMMENT ON COLUMN arrangements.location_of_deceased IS 'Current location of the deceased (e.g., hospital, morgue, funeral home)';
