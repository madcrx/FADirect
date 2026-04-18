-- Migration 020: Add system configuration values for dropdown management

CREATE TABLE IF NOT EXISTS config_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL, -- 'vehicle_type', 'equipment_type', 'staff_role', 'price_category', 'arrangement_status', etc.
  value VARCHAR(255) NOT NULL,
  label VARCHAR(255) NOT NULL, -- Display name
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  UNIQUE(category, value)
);

CREATE INDEX IF NOT EXISTS idx_config_values_category ON config_values(category);
CREATE INDEX IF NOT EXISTS idx_config_values_active ON config_values(is_active);
CREATE INDEX IF NOT EXISTS idx_config_values_deleted ON config_values(deleted_at);

-- Insert default values for vehicle types
INSERT INTO config_values (category, value, label, sort_order) VALUES
  ('vehicle_type', 'hearse', 'Hearse', 1),
  ('vehicle_type', 'limousine', 'Limousine', 2),
  ('vehicle_type', 'transfer_vehicle', 'Transfer Vehicle', 3),
  ('vehicle_type', 'utility', 'Utility', 4),
  ('vehicle_type', 'coach', 'Coach', 5)
ON CONFLICT (category, value) DO NOTHING;

-- Insert default values for equipment types
INSERT INTO config_values (category, value, label, sort_order) VALUES
  ('equipment_type', 'coffin', 'Coffin', 1),
  ('equipment_type', 'casket', 'Casket', 2),
  ('equipment_type', 'urn', 'Urn', 3),
  ('equipment_type', 'flowers', 'Flowers', 4),
  ('equipment_type', 'memorial_book', 'Memorial Book', 5),
  ('equipment_type', 'chapel_equipment', 'Chapel Equipment', 6),
  ('equipment_type', 'av_equipment', 'A/V Equipment', 7),
  ('equipment_type', 'other', 'Other', 8)
ON CONFLICT (category, value) DO NOTHING;

-- Insert default values for staff roles
INSERT INTO config_values (category, value, label, sort_order) VALUES
  ('staff_role', 'admin', 'Admin', 1),
  ('staff_role', 'arranger', 'Arranger', 2),
  ('staff_role', 'conductor', 'Funeral Conductor', 3),
  ('staff_role', 'driver', 'Driver', 4),
  ('staff_role', 'embalmer', 'Embalmer', 5),
  ('staff_role', 'mortician', 'Mortician', 6),
  ('staff_role', 'support_staff', 'Support Staff', 7),
  ('staff_role', 'mourner', 'Mourner', 8)
ON CONFLICT (category, value) DO NOTHING;

-- Insert default values for price list categories
INSERT INTO config_values (category, value, label, sort_order) VALUES
  ('price_category', 'coffins_caskets', 'Coffins & Caskets', 1),
  ('price_category', 'professional_services', 'Professional Services', 2),
  ('price_category', 'transportation', 'Transportation', 3),
  ('price_category', 'flowers', 'Flowers', 4),
  ('price_category', 'stationery', 'Stationery', 5),
  ('price_category', 'cemetery_fees', 'Cemetery Fees', 6),
  ('price_category', 'cremation', 'Cremation Services', 7),
  ('price_category', 'memorial', 'Memorial Products', 8),
  ('price_category', 'other', 'Other', 9)
ON CONFLICT (category, value) DO NOTHING;

-- Insert default values for arrangement status
INSERT INTO config_values (category, value, label, sort_order) VALUES
  ('arrangement_status', 'initial_contact', 'Initial Contact', 1),
  ('arrangement_status', 'pending_documents', 'Pending Documents', 2),
  ('arrangement_status', 'in_progress', 'In Progress', 3),
  ('arrangement_status', 'confirmed', 'Confirmed', 4),
  ('arrangement_status', 'service_completed', 'Service Completed', 5),
  ('arrangement_status', 'completed', 'Completed', 6),
  ('arrangement_status', 'cancelled', 'Cancelled', 7)
ON CONFLICT (category, value) DO NOTHING;

-- Insert default values for funeral types
INSERT INTO config_values (category, value, label, sort_order) VALUES
  ('funeral_type', 'traditional', 'Traditional Funeral', 1),
  ('funeral_type', 'cremation', 'Cremation', 2),
  ('funeral_type', 'burial', 'Burial', 3),
  ('funeral_type', 'memorial', 'Memorial Service', 4),
  ('funeral_type', 'direct_cremation', 'Direct Cremation', 5),
  ('funeral_type', 'green_burial', 'Green Burial', 6)
ON CONFLICT (category, value) DO NOTHING;

-- Insert default values for job status
INSERT INTO config_values (category, value, label, sort_order) VALUES
  ('job_status', 'scheduled', 'Scheduled', 1),
  ('job_status', 'confirmed', 'Confirmed', 2),
  ('job_status', 'in_progress', 'In Progress', 3),
  ('job_status', 'completed', 'Completed', 4),
  ('job_status', 'cancelled', 'Cancelled', 5)
ON CONFLICT (category, value) DO NOTHING;

-- Insert default values for job priority
INSERT INTO config_values (category, value, label, sort_order) VALUES
  ('job_priority', 'low', 'Low', 1),
  ('job_priority', 'normal', 'Normal', 2),
  ('job_priority', 'high', 'High', 3),
  ('job_priority', 'urgent', 'Urgent', 4)
ON CONFLICT (category, value) DO NOTHING;

COMMENT ON TABLE config_values IS 'System-wide dropdown configuration values';
COMMENT ON COLUMN config_values.category IS 'Type of configuration (vehicle_type, staff_role, etc.)';
COMMENT ON COLUMN config_values.value IS 'Internal value used in database';
COMMENT ON COLUMN config_values.label IS 'Human-readable label shown in UI';
