-- Migration: First Call Reports with Auto-create Arrangement and Job
-- This migration creates a table for First Call Reports and triggers to automatically
-- create an arrangement and a job (removal) when a report is submitted

-- Create first_call_reports table
CREATE TABLE IF NOT EXISTS first_call_reports (
  id SERIAL PRIMARY KEY,

  -- Foreign keys
  template_id INTEGER REFERENCES form_templates(id),
  arrangement_id INTEGER REFERENCES arrangements(id) ON DELETE SET NULL,
  job_id INTEGER REFERENCES daily_run_sheet(id) ON DELETE SET NULL,
  submitted_by INTEGER NOT NULL REFERENCES users(id),

  -- Form data stored as JSONB
  form_data JSONB NOT NULL,

  -- Status tracking
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),

  -- Timestamps
  submitted_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,

  -- Notes and errors
  notes TEXT,
  processing_error TEXT,

  CONSTRAINT fk_template FOREIGN KEY (template_id) REFERENCES form_templates(id),
  CONSTRAINT fk_submitted_by FOREIGN KEY (submitted_by) REFERENCES users(id)
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
  new_arrangement_id INTEGER;
  new_job_id INTEGER;
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

      -- 2. CREATE JOB (Removal) on Daily Run Sheet
      -- Combine removal date and time
      removal_datetime := (
        NEW.form_data->'removal_details'->>'removalDate' || ' ' ||
        COALESCE(NEW.form_data->'removal_details'->>'removalTime', '09:00')
      )::TIMESTAMP;

      INSERT INTO daily_run_sheet (
        arrangement_id,
        job_type,
        scheduled_date,
        scheduled_time,
        pickup_location,
        delivery_location,
        assigned_staff,
        vehicle_id,
        status,
        priority,
        notes,
        created_by,
        created_at
      ) VALUES (
        new_arrangement_id,
        'removal',
        (NEW.form_data->'removal_details'->>'removalDate')::DATE,
        (NEW.form_data->'removal_details'->>'removalTime')::TIME,
        NEW.form_data->'location_details'->>'address',
        'Funeral Home', -- Default delivery location
        NEW.form_data->'removal_details'->>'staffAssigned',
        -- Try to match vehicle by name if provided
        (SELECT id FROM vehicles WHERE name = NEW.form_data->'removal_details'->>'vehicleUsed' LIMIT 1),
        'pending',
        CASE
          WHEN (NEW.form_data->'removal_details'->>'coronerCase')::BOOLEAN = TRUE THEN 'high'
          ELSE 'medium'
        END,
        CONCAT(
          'First Call Report - Removal for ', deceased_full_name,
          E'\nLocation: ', NEW.form_data->'location_details'->>'facilityName',
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
            THEN CONCAT(E'\n⚠️ CORONER CASE - Release #: ', NEW.form_data->'removal_details'->>'coronerReleaseNumber')
            ELSE ''
          END,
          CASE
            WHEN (NEW.form_data->'medical_info'->>'infectiousDisease')::BOOLEAN = TRUE
            THEN CONCAT(E'\n⚠️ INFECTIOUS DISEASE: ', NEW.form_data->'medical_info'->>'diseaseDetails')
            ELSE ''
          END,
          CASE
            WHEN NEW.form_data->'medical_info'->>'medicalDevices' IS NOT NULL
            THEN CONCAT(E'\nMedical Devices: ', NEW.form_data->'medical_info'->>'medicalDevices')
            ELSE ''
          END,
          CASE
            WHEN NEW.form_data->'removal_details'->>'specialInstructions' IS NOT NULL
            THEN CONCAT(E'\nSpecial Instructions: ', NEW.form_data->'removal_details'->>'specialInstructions')
            ELSE ''
          END
        ),
        NEW.submitted_by,
        NOW()
      )
      RETURNING id INTO new_job_id;

      -- Store the job ID
      NEW.job_id := new_job_id;

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
