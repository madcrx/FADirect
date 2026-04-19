-- Migration 032: Add maintenance schedules for vehicles/equipment and leave periods for staff

-- Vehicle maintenance schedules
CREATE TABLE IF NOT EXISTS vehicle_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT vehicle_maintenance_dates CHECK (end_date >= start_date)
);

-- Equipment maintenance schedules
CREATE TABLE IF NOT EXISTS equipment_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT equipment_maintenance_dates CHECK (end_date >= start_date)
);

-- Staff leave periods
CREATE TABLE IF NOT EXISTS staff_leave (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  leave_type VARCHAR(30) DEFAULT 'annual' CHECK (leave_type IN ('annual', 'sick', 'personal', 'unpaid', 'other')),
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT staff_leave_dates CHECK (end_date >= start_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_vehicle ON vehicle_maintenance(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_dates ON vehicle_maintenance(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_equipment ON equipment_maintenance(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_dates ON equipment_maintenance(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_staff_leave_user ON staff_leave(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_leave_dates ON staff_leave(start_date, end_date);

-- Comments
COMMENT ON TABLE vehicle_maintenance IS 'Maintenance and repair schedules for vehicles';
COMMENT ON TABLE equipment_maintenance IS 'Maintenance and repair schedules for equipment';
COMMENT ON TABLE staff_leave IS 'Leave periods for staff members';
