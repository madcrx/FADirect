-- Migration 011: Rostering and Scheduling System
-- Add comprehensive staff rostering, vehicle management, and job scheduling

-- Staff profiles (extends users table)
CREATE TABLE IF NOT EXISTS staff_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  photo_url TEXT,
  position VARCHAR(100),
  license_number VARCHAR(50),
  license_expiry DATE,
  qualifications TEXT[],
  certifications JSONB,
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(20),
  availability JSONB, -- {"monday": ["09:00-17:00"], "tuesday": ["09:00-17:00"], ...}
  is_available BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicles
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_type VARCHAR(50) NOT NULL, -- 'hearse', 'limousine', 'transfer_vehicle', 'utility'
  make VARCHAR(100),
  model VARCHAR(100),
  year INTEGER,
  registration VARCHAR(20) UNIQUE NOT NULL,
  vin VARCHAR(50),
  color VARCHAR(50),
  photo_url TEXT,
  seating_capacity INTEGER,
  status VARCHAR(20) DEFAULT 'available', -- 'available', 'in_use', 'maintenance', 'out_of_service'
  last_service_date DATE,
  next_service_date DATE,
  insurance_expiry DATE,
  registration_expiry DATE,
  odometer_reading INTEGER,
  fuel_type VARCHAR(20),
  notes TEXT,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Job types
CREATE TABLE IF NOT EXISTS job_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#1976d2', -- Hex color for calendar display
  icon VARCHAR(50),
  default_duration INTEGER DEFAULT 60, -- in minutes
  requires_vehicle BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default job types
INSERT INTO job_types (name, description, color, requires_vehicle, default_duration) VALUES
  ('Funeral Service', 'Funeral service and ceremony', '#1976d2', true, 120),
  ('Delivery', 'Delivery of items or documents', '#4caf50', true, 60),
  ('Arrangement', 'Family arrangement meeting', '#ff9800', false, 90),
  ('Transfer', 'Transfer of deceased', '#f44336', true, 90),
  ('Direct Cremation', 'Direct cremation service', '#9c27b0', true, 60),
  ('Viewing', 'Viewing and visitation', '#00bcd4', false, 120),
  ('Grave Service', 'Graveside service', '#795548', true, 60),
  ('Embalming', 'Embalming procedure', '#607d8b', false, 120)
ON CONFLICT (name) DO NOTHING;

-- Jobs (scheduled work)
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type_id UUID REFERENCES job_types(id) ON DELETE RESTRICT,
  arrangement_id UUID REFERENCES arrangements(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(500),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  notes TEXT,
  special_instructions TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Staff assignments to jobs
CREATE TABLE IF NOT EXISTS job_staff_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(100), -- 'conductor', 'driver', 'arranger', 'support', etc.
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(job_id, staff_id)
);

-- Vehicle assignments to jobs
CREATE TABLE IF NOT EXISTS job_vehicle_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(job_id, vehicle_id)
);

-- Digital forms (for mourner information collection)
CREATE TABLE IF NOT EXISTS digital_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_type VARCHAR(50) NOT NULL, -- 'arrangement', 'funeral_notice', 'cremation_authority', etc.
  name VARCHAR(255) NOT NULL,
  description TEXT,
  form_schema JSONB NOT NULL, -- JSON schema defining form fields
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Form submissions from mourners
CREATE TABLE IF NOT EXISTS form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES digital_forms(id) ON DELETE CASCADE,
  arrangement_id UUID REFERENCES arrangements(id) ON DELETE SET NULL,
  submission_data JSONB NOT NULL, -- The actual form data submitted
  submitter_name VARCHAR(255),
  submitter_email VARCHAR(255),
  submitter_phone VARCHAR(20),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'reviewed', 'approved', 'rejected', 'imported'
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP,
  review_notes TEXT,
  imported_at TIMESTAMP,
  access_token VARCHAR(255) UNIQUE, -- For secure anonymous access
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Run sheets (daily schedule reports)
CREATE TABLE IF NOT EXISTS run_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  title VARCHAR(255),
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'published', 'archived'
  generated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP,
  recipients TEXT[], -- Array of email addresses
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_staff_profiles_user ON staff_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_vehicles_registration ON vehicles(registration);
CREATE INDEX IF NOT EXISTS idx_jobs_start_time ON jobs(start_time);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_arrangement ON jobs(arrangement_id);
CREATE INDEX IF NOT EXISTS idx_job_staff_assignments_job ON job_staff_assignments(job_id);
CREATE INDEX IF NOT EXISTS idx_job_staff_assignments_staff ON job_staff_assignments(staff_id);
CREATE INDEX IF NOT EXISTS idx_job_vehicle_assignments_job ON job_vehicle_assignments(job_id);
CREATE INDEX IF NOT EXISTS idx_job_vehicle_assignments_vehicle ON job_vehicle_assignments(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_status ON form_submissions(status);
CREATE INDEX IF NOT EXISTS idx_form_submissions_token ON form_submissions(access_token);
CREATE INDEX IF NOT EXISTS idx_run_sheets_date ON run_sheets(date);

-- Function to check staff availability
CREATE OR REPLACE FUNCTION check_staff_availability(
  p_staff_id UUID,
  p_start_time TIMESTAMP,
  p_end_time TIMESTAMP,
  p_exclude_job_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_conflict_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_conflict_count
  FROM job_staff_assignments jsa
  JOIN jobs j ON jsa.job_id = j.id
  WHERE jsa.staff_id = p_staff_id
    AND j.status NOT IN ('cancelled', 'completed')
    AND (p_exclude_job_id IS NULL OR j.id != p_exclude_job_id)
    AND j.deleted_at IS NULL
    AND (
      (j.start_time, j.end_time) OVERLAPS (p_start_time, p_end_time)
    );

  RETURN v_conflict_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Function to check vehicle availability
CREATE OR REPLACE FUNCTION check_vehicle_availability(
  p_vehicle_id UUID,
  p_start_time TIMESTAMP,
  p_end_time TIMESTAMP,
  p_exclude_job_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_conflict_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_conflict_count
  FROM job_vehicle_assignments jva
  JOIN jobs j ON jva.job_id = j.id
  WHERE jva.vehicle_id = p_vehicle_id
    AND j.status NOT IN ('cancelled', 'completed')
    AND (p_exclude_job_id IS NULL OR j.id != p_exclude_job_id)
    AND j.deleted_at IS NULL
    AND (
      (j.start_time, j.end_time) OVERLAPS (p_start_time, p_end_time)
    );

  RETURN v_conflict_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update job status notification
CREATE OR REPLACE FUNCTION notify_job_assignment()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_notification(
    NEW.staff_id,
    'New Job Assignment',
    'You have been assigned to a job',
    'info',
    'job',
    'job',
    NEW.job_id,
    '/roster'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_job_assignment ON job_staff_assignments;
CREATE TRIGGER trigger_notify_job_assignment
  AFTER INSERT ON job_staff_assignments
  FOR EACH ROW
  EXECUTE FUNCTION notify_job_assignment();

COMMENT ON TABLE staff_profiles IS 'Extended staff information including photos and qualifications';
COMMENT ON TABLE vehicles IS 'Fleet management and vehicle information';
COMMENT ON TABLE job_types IS 'Types of jobs/work that can be scheduled';
COMMENT ON TABLE jobs IS 'Scheduled jobs and work assignments';
COMMENT ON TABLE job_staff_assignments IS 'Staff assigned to specific jobs';
COMMENT ON TABLE job_vehicle_assignments IS 'Vehicles assigned to specific jobs';
COMMENT ON TABLE digital_forms IS 'Digital form templates for mourner information collection';
COMMENT ON TABLE form_submissions IS 'Submitted forms from mourners awaiting review';
COMMENT ON TABLE run_sheets IS 'Daily schedule reports sent to staff';
