-- Migration 021: Add vehicle reference to equipment for location tracking

ALTER TABLE equipment ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_equipment_vehicle ON equipment(vehicle_id);

COMMENT ON COLUMN equipment.vehicle_id IS 'Vehicle where this equipment is currently located (alternative to location text)';
COMMENT ON COLUMN equipment.location IS 'Custom storage location text (used when not in a vehicle)';
