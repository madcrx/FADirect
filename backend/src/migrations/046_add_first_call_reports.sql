-- Migration: First Call Reports with Auto-create Arrangement and Job
-- This migration creates a table for First Call Reports and triggers to automatically
-- create an arrangement and a job (removal) when a report is submitted

-- Create first_call_reports table
CREATE TABLE IF NOT EXISTS first_call_reports (
  id SERIAL PRIMARY KEY,

  -- Foreign keys
  template_id UUID REFERENCES form_templates(id),
  arrangement_id UUID REFERENCES arrangements(id) ON DELETE SET NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  submitted_by UUID NOT NULL REFERENCES users(id),

  -- Form data stored as JSONB
  form_data JSONB NOT NULL,

  -- Status tracking
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),

  -- Timestamps
  submitted_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,

  -- Notes and errors
  notes TEXT,
  processing_error TEXT
);

-- Add indexes
CREATE INDEX idx_first_call_reports_arrangement ON first_call_reports(arrangement_id);
CREATE INDEX idx_first_call_reports_job ON first_call_reports(job_id);
CREATE INDEX idx_first_call_reports_submitted_by ON first_call_reports(submitted_by);
CREATE INDEX idx_first_call_reports_status ON first_call_reports(status);
CREATE INDEX idx_first_call_reports_submitted_at ON first_call_reports(submitted_at);

-- Function to auto-create arrangement and job from First Call Report
CREATE OR REPLACE FUNCTION process_first_call_report()
RETURNS TRIGGER AS $$
DECLARE
  new_arrangement_id UUID;
  new_job_id UUID;
  deceased_full_name TEXT;
  removal_datetime TIMESTAMP;
BEGIN
  -- Only process if status is 'pending' or being set to 'processing'
  IF NEW.status IN ('pending', 'processing') AND (OLD IS NULL OR OLD.status = 'pending') THEN
    BEGIN
      -- Mark as processing
      NEW.status := 'processing';

      -- Extract deceased full name
      deceased_full_name := NEW.form_data->'deceased_details'->>'deceasedFullName';

      -- 1. CREATE ARRANGEMENT from First Call Report
      INSERT INTO arrangements (
        deceased_name,
        date_of_birth,
        date_of_death,
        age,
        gender,
        place_of_death,
        location_of_deceased,
        cause_of_death,
        contact_name,
        contact_phone,
        contact_email,
        special_requests,
        status,
        created_by,
        created_at
      ) VALUES (
        deceased_full_name,
        (NEW.form_data->'deceased_details'->>'dateOfBirth')::DATE,
        (NEW.form_data->'deceased_details'->>'dateOfDeath')::DATE,
        (NEW.form_data->'deceased_details'->>'age')::INTEGER,
        NEW.form_data->'deceased_details'->>'gender',
        NEW.form_data->'location_details'->>'currentLocation',
        NEW.form_data->'location_details'->>'address',
        NEW.form_data->'medical_info'->>'causeOfDeath',
        NEW.form_data->'call_details'->>'callerName',
        NEW.form_data->'call_details'->>'callerPhone',
        NULL, -- email not in first call report
        NEW.form_data->'removal_details'->>'specialInstructions',
        'pending',
        NEW.submitted_by,
        NOW()
      )
      RETURNING id INTO new_arrangement_id;

      -- Store the arrangement ID
      NEW.arrangement_id := new_arrangement_id;

      -- 2. CREATE JOB (Removal/Transfer)
      -- Combine removal date and time
      removal_datetime := (
        NEW.form_data->'removal_details'->>'removalDate' || ' ' ||
        COALESCE(NEW.form_data->'removal_details'->>'removalTime', '09:00')
      )::TIMESTAMP;

      INSERT INTO jobs (
        job_type_id,
        arrangement_id,
        title,
        description,
        location,
        start_time,
        end_time,
        status,
        priority,
        notes,
        special_instructions,
        created_by
      ) VALUES (
        (SELECT id FROM job_types WHERE name = 'Transfer' LIMIT 1),
        new_arrangement_id,
        CONCAT('Transfer - ', deceased_full_name),
        CONCAT('First Call Report - Transfer of deceased from ',
               NEW.form_data->'location_details'->>'currentLocation'),
        NEW.form_data->'location_details'->>'address',
        removal_datetime,
        removal_datetime + INTERVAL '90 minutes', -- Default 90 min duration
        'scheduled',
        CASE
          WHEN (NEW.form_data->'removal_details'->>'coronerCase')::BOOLEAN = TRUE THEN 'high'
          ELSE 'normal'
        END,
        CONCAT(
          'Facility: ', COALESCE(NEW.form_data->'location_details'->>'facilityName', 'N/A'),
          CASE
            WHEN NEW.form_data->'location_details'->>'roomNumber' IS NOT NULL
            THEN CONCAT(E'\nRoom: ', NEW.form_data->'location_details'->>'roomNumber')
            ELSE ''
          END,
          CASE
            WHEN NEW.form_data->'location_details'->>'contactPerson' IS NOT NULL
            THEN CONCAT(E'\nContact: ', NEW.form_data->'location_details'->>'contactPerson',
                       ' (', NEW.form_data->'location_details'->>'contactPhone', ')')
            ELSE ''
          END,
          CASE
            WHEN (NEW.form_data->'removal_details'->>'coronerCase')::BOOLEAN = TRUE
            THEN CONCAT(E'\n*** CORONER CASE - Release #: ', NEW.form_data->'removal_details'->>'coronerReleaseNumber')
            ELSE ''
          END,
          CASE
            WHEN (NEW.form_data->'medical_info'->>'infectiousDisease')::BOOLEAN = TRUE
            THEN CONCAT(E'\n*** INFECTIOUS DISEASE: ', NEW.form_data->'medical_info'->>'diseaseDetails')
            ELSE ''
          END,
          CASE
            WHEN NEW.form_data->'medical_info'->>'medicalDevices' IS NOT NULL
            THEN CONCAT(E'\nMedical Devices: ', NEW.form_data->'medical_info'->>'medicalDevices')
            ELSE ''
          END
        ),
        NEW.form_data->'removal_details'->>'specialInstructions',
        NEW.submitted_by
      )
      RETURNING id INTO new_job_id;

      -- Store the job ID
      NEW.job_id := new_job_id;

      -- Assign staff if specified (lookup by name)
      IF NEW.form_data->'removal_details'->>'staffAssigned' IS NOT NULL AND
         NEW.form_data->'removal_details'->>'staffAssigned' != '' THEN
        INSERT INTO job_staff_assignments (job_id, staff_id, role, is_primary)
        SELECT new_job_id, id, 'driver', true
        FROM users
        WHERE name ILIKE '%' || (NEW.form_data->'removal_details'->>'staffAssigned') || '%'
        LIMIT 1
        ON CONFLICT DO NOTHING;
      END IF;

      -- Assign vehicle if specified (lookup by name)
      IF NEW.form_data->'removal_details'->>'vehicleUsed' IS NOT NULL AND
         NEW.form_data->'removal_details'->>'vehicleUsed' != '' THEN
        INSERT INTO job_vehicle_assignments (job_id, vehicle_id, is_primary)
        SELECT new_job_id, id, true
        FROM vehicles
        WHERE name ILIKE '%' || (NEW.form_data->'removal_details'->>'vehicleUsed') || '%'
        LIMIT 1
        ON CONFLICT DO NOTHING;
      END IF;

      -- Mark as completed
      NEW.status := 'completed';
      NEW.processed_at := NOW();

      -- Success message
      NEW.notes := CONCAT(
        'Successfully created Arrangement #', new_arrangement_id,
        ' and Removal Job #', new_job_id
      );

    EXCEPTION WHEN OTHERS THEN
      -- Handle errors
      NEW.status := 'failed';
      NEW.processing_error := SQLERRM;
      NEW.processed_at := NOW();

      RAISE NOTICE 'Error processing first call report: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_process_first_call_report ON first_call_reports;
CREATE TRIGGER trigger_process_first_call_report
  BEFORE INSERT OR UPDATE ON first_call_reports
  FOR EACH ROW
  EXECUTE FUNCTION process_first_call_report();

-- Add comment
COMMENT ON TABLE first_call_reports IS 'Stores submitted First Call Reports and automatically creates arrangements and removal jobs';
COMMENT ON FUNCTION process_first_call_report() IS 'Automatically creates an arrangement and removal job when a First Call Report is submitted';
