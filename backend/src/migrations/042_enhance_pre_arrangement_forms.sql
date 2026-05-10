-- Enhance pre-arrangement forms with comprehensive fields and auto-population

-- Add columns for admin/manager editing
ALTER TABLE pre_arrangement_forms ADD COLUMN IF NOT EXISTS last_edited_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE pre_arrangement_forms ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMP;

-- Add missing columns to arrangements table for comprehensive form data
ALTER TABLE arrangements ADD COLUMN IF NOT EXISTS funeral_type VARCHAR(50);
ALTER TABLE arrangements ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255);
ALTER TABLE arrangements ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20);
ALTER TABLE arrangements ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);
ALTER TABLE arrangements ADD COLUMN IF NOT EXISTS place_of_death VARCHAR(255);
ALTER TABLE arrangements ADD COLUMN IF NOT EXISTS cause_of_death TEXT;
ALTER TABLE arrangements ADD COLUMN IF NOT EXISTS medical_certificate_signed BOOLEAN DEFAULT FALSE;
ALTER TABLE arrangements ADD COLUMN IF NOT EXISTS special_requests TEXT;

-- Function to auto-populate arrangement from completed form
CREATE OR REPLACE FUNCTION auto_populate_arrangement_from_form()
RETURNS TRIGGER AS $$
DECLARE
  form_data JSONB;
BEGIN
  -- Only proceed if form was just completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    form_data := NEW.form_data;

    -- Update arrangement with form data
    UPDATE arrangements SET
      -- Deceased Information
      deceased_name = COALESCE(
        form_data->>'deceasedFirstName' || ' ' ||
        COALESCE(form_data->>'deceasedMiddleName' || ' ', '') ||
        form_data->>'deceasedLastName',
        deceased_name
      ),
      deceased_date_of_birth = COALESCE(
        (form_data->>'deceasedDateOfBirth')::DATE,
        deceased_date_of_birth
      ),
      deceased_date_of_death = COALESCE(
        (form_data->>'deceasedDateOfDeath')::DATE,
        deceased_date_of_death
      ),

      -- Service Information
      service_date = COALESCE(
        (form_data->>'serviceDate')::TIMESTAMP,
        service_date
      ),
      service_location = COALESCE(
        form_data->>'serviceLocation',
        service_location
      ),
      funeral_type = COALESCE(
        form_data->>'funeralType',
        funeral_type
      ),

      -- Contact Information
      contact_name = COALESCE(
        form_data->>'contactFirstName' || ' ' || form_data->>'contactLastName',
        contact_name
      ),
      contact_phone = COALESCE(
        form_data->>'contactPhone',
        contact_phone
      ),
      contact_email = COALESCE(
        form_data->>'contactEmail',
        contact_email
      ),

      -- Additional Details
      location_of_deceased = COALESCE(
        form_data->>'locationOfDeceased',
        location_of_deceased
      ),
      place_of_death = COALESCE(
        form_data->>'placeOfDeath',
        place_of_death
      ),
      cause_of_death = COALESCE(
        form_data->>'causeOfDeath',
        cause_of_death
      ),
      medical_certificate_signed = COALESCE(
        (form_data->>'medicalCertificateSigned')::BOOLEAN,
        medical_certificate_signed
      ),

      -- Preferences
      special_requests = COALESCE(
        form_data->>'specialRequests',
        special_requests
      ),

      -- Metadata
      notes = COALESCE(
        notes || E'\n\n--- From Pre-Arrangement Form ---\n' ||
        COALESCE(form_data->>'additionalNotes', ''),
        notes
      ),
      updated_at = NOW()
    WHERE id = NEW.arrangement_id;

    -- Log the auto-population in audit
    PERFORM log_audit_event(
      'arrangement',
      NEW.arrangement_id,
      'updated',
      'form_data',
      NULL,
      'Auto-populated from completed pre-arrangement form',
      NEW.sent_to_user_id,
      'Arrangement details auto-populated from completed pre-arrangement form'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_auto_populate_arrangement_from_form ON pre_arrangement_forms;
CREATE TRIGGER trigger_auto_populate_arrangement_from_form
  AFTER UPDATE ON pre_arrangement_forms
  FOR EACH ROW
  EXECUTE FUNCTION auto_populate_arrangement_from_form();

-- Add comprehensive form template as a default
COMMENT ON COLUMN pre_arrangement_forms.form_data IS 'Comprehensive funeral arrangement form data including:
Deceased Details: firstName, middleName, lastName, dateOfBirth, dateOfDeath, age, placeOfBirth, placeOfDeath, causeOfDeath, occupation, maritalStatus
Contact Information: contactFirstName, contactLastName, contactPhone, contactEmail, contactAddress, relationship
Service Preferences: funeralType (burial/cremation/memorial), serviceDate, serviceTime, serviceLocation, serviceType (religious/non-religious/celebration), denomination
Burial/Cremation: burialLocation, cemeteryName, plotNumber, crematoriumName, ashesDisposal
Service Details: serviceOfficiant, serviceMusic, serviceReadings, serviceFlowers, serviceNotices, specialRequests
Deceased Background: lifeHistory, hobbies, achievements, familyDetails, militaryService
Documents: medicalCertificateSigned, deathCertificateIssued, willLocation, insurancePolicies
Preferences: viewingRequired, embalmingRequired, dressingDetails, coffimType, transportation
Additional: additionalNotes, estimatedAttendees, catering, livestreaming';
