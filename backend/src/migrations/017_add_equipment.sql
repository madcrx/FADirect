-- Migration 017: Add Equipment Management
-- Tracks equipment/assets that can be assigned to jobs

CREATE TABLE IF NOT EXISTS equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  equipment_type VARCHAR(50) NOT NULL, -- 'casket', 'urn', 'trolley', 'coffin_lowering_device', 'flowers', 'other'
  description TEXT,
  serial_number VARCHAR(100),
  photo_url TEXT,
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance', 'retired')),
  purchase_date DATE,
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  location VARCHAR(255), -- Storage location
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Equipment assignments to jobs
CREATE TABLE IF NOT EXISTS job_equipment_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(job_id, equipment_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_equipment_type ON equipment(equipment_type);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_deleted ON equipment(deleted_at);
CREATE INDEX IF NOT EXISTS idx_job_equipment_job ON job_equipment_assignments(job_id);
CREATE INDEX IF NOT EXISTS idx_job_equipment_equipment ON job_equipment_assignments(equipment_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_equipment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER equipment_updated_at
  BEFORE UPDATE ON equipment
  FOR EACH ROW
  EXECUTE FUNCTION update_equipment_timestamp();

-- Comments
COMMENT ON TABLE equipment IS 'Equipment and assets that can be assigned to jobs';
COMMENT ON TABLE job_equipment_assignments IS 'Links equipment to jobs for scheduling and conflict detection';
COMMENT ON COLUMN equipment.equipment_type IS 'Type of equipment: casket, urn, trolley, coffin_lowering_device, flowers, other';
COMMENT ON COLUMN equipment.status IS 'Current status: available, in_use, maintenance, retired';
