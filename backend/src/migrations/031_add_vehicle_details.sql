-- Migration 031: Add vehicle details and staff allocation
-- Add registration expiry, transmission, engine number, VIN, and staff allocation

ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS registration_expiry DATE,
ADD COLUMN IF NOT EXISTS transmission VARCHAR(20) CHECK (transmission IN ('manual', 'automatic')),
ADD COLUMN IF NOT EXISTS engine_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS vin_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS allocated_to_staff_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_vehicles_allocated_staff ON vehicles(allocated_to_staff_id);

COMMENT ON COLUMN vehicles.registration_expiry IS 'Date when vehicle registration expires';
COMMENT ON COLUMN vehicles.transmission IS 'Type of transmission: manual or automatic';
COMMENT ON COLUMN vehicles.engine_number IS 'Vehicle engine number';
COMMENT ON COLUMN vehicles.vin_number IS 'Vehicle Identification Number (VIN)';
COMMENT ON COLUMN vehicles.allocated_to_staff_id IS 'Staff member this vehicle is permanently allocated to';
