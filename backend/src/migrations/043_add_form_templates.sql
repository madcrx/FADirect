-- Create form templates table for managing system-wide form versions

CREATE TABLE IF NOT EXISTS form_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  form_type VARCHAR(100) NOT NULL DEFAULT 'pre_arrangement',
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  template_data JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Index for finding active templates
CREATE INDEX IF NOT EXISTS idx_form_templates_active ON form_templates(form_type, is_active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_form_templates_deleted ON form_templates(deleted_at);
CREATE INDEX IF NOT EXISTS idx_form_templates_type ON form_templates(form_type);

-- Function to get the latest active template for a form type
CREATE OR REPLACE FUNCTION get_latest_form_template(p_form_type VARCHAR)
RETURNS UUID AS $$
DECLARE
  template_id UUID;
BEGIN
  SELECT id INTO template_id
  FROM form_templates
  WHERE form_type = p_form_type
    AND is_active = TRUE
    AND deleted_at IS NULL
  ORDER BY version DESC, created_at DESC
  LIMIT 1;

  RETURN template_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create new version when template is updated
CREATE OR REPLACE FUNCTION create_template_version()
RETURNS TRIGGER AS $$
DECLARE
  new_version INTEGER;
BEGIN
  -- Get the highest version number for this form type
  SELECT COALESCE(MAX(version), 0) + 1 INTO new_version
  FROM form_templates
  WHERE form_type = NEW.form_type;

  -- Set the version
  NEW.version = new_version;

  -- Mark old active templates as inactive (soft delete old versions)
  UPDATE form_templates
  SET is_active = FALSE,
      deleted_at = NOW(),
      deleted_by = NEW.updated_by
  WHERE form_type = NEW.form_type
    AND is_active = TRUE
    AND id != NEW.id
    AND deleted_at IS NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-version templates
DROP TRIGGER IF EXISTS trigger_create_template_version ON form_templates;
CREATE TRIGGER trigger_create_template_version
  BEFORE INSERT ON form_templates
  FOR EACH ROW
  EXECUTE FUNCTION create_template_version();

-- Insert default pre-arrangement form template
INSERT INTO form_templates (name, description, form_type, template_data, is_active)
VALUES (
  'Pre-Arrangement Form',
  'Standard pre-arrangement form for collecting funeral arrangement details from families',
  'pre_arrangement',
  '{
    "sections": [
      {
        "id": "deceased_details",
        "title": "Deceased Details",
        "fields": [
          {"name": "fullName", "label": "Full Name", "type": "text", "required": true},
          {"name": "preferredName", "label": "Preferred Name", "type": "text"},
          {"name": "dateOfBirth", "label": "Date of Birth", "type": "date"},
          {"name": "dateOfDeath", "label": "Date of Death", "type": "date"},
          {"name": "age", "label": "Age", "type": "number"},
          {"name": "gender", "label": "Gender", "type": "text"},
          {"name": "maritalStatus", "label": "Marital Status", "type": "text"},
          {"name": "occupation", "label": "Occupation", "type": "text"},
          {"name": "nationality", "label": "Nationality", "type": "text"},
          {"name": "religion", "label": "Religion / Cultural Requirements", "type": "text"},
          {"name": "placeOfDeath", "label": "Place of Death", "type": "text"},
          {"name": "locationOfDeceased", "label": "Current Location of Deceased", "type": "text"},
          {"name": "causeOfDeath", "label": "Cause of Death", "type": "textarea"}
        ]
      },
      {
        "id": "next_of_kin",
        "title": "Next of Kin Details",
        "fields": [
          {"name": "fullName", "label": "Full Name", "type": "text", "required": true},
          {"name": "relationship", "label": "Relationship to Deceased", "type": "text", "required": true},
          {"name": "phone", "label": "Phone Number", "type": "tel", "required": true},
          {"name": "email", "label": "Email Address", "type": "email"},
          {"name": "address", "label": "Address", "type": "textarea"}
        ]
      },
      {
        "id": "funeral_preferences",
        "title": "Funeral Preferences",
        "fields": [
          {"name": "serviceType", "label": "Service Type", "type": "radio", "options": ["Burial", "Cremation", "Memorial Service", "No Service"]},
          {"name": "serviceLocation", "label": "Service Location", "type": "radio", "options": ["Chapel", "Church", "Graveside", "Private Venue", "Other"]},
          {"name": "preferredDate", "label": "Preferred Date", "type": "date"},
          {"name": "preferredTime", "label": "Preferred Time", "type": "time"}
        ]
      },
      {
        "id": "service_content",
        "title": "Service Content",
        "fields": [
          {"name": "officiant", "label": "Officiant", "type": "radio", "options": ["Religious Minister", "Celebrant", "Family-led", "Undecided"]},
          {"name": "musicSelections", "label": "Music Selections", "type": "repeater", "subfields": [
            {"name": "songTitle", "label": "Song Title", "type": "text"},
            {"name": "artist", "label": "Artist", "type": "text"},
            {"name": "whenPlayed", "label": "When Played", "type": "text"}
          ]},
          {"name": "readings", "label": "Readings / Eulogies", "type": "repeater", "subfields": [
            {"name": "type", "label": "Type", "type": "text"},
            {"name": "personDelivering", "label": "Person Delivering", "type": "text"},
            {"name": "notes", "label": "Notes", "type": "text"}
          ]}
        ]
      },
      {
        "id": "special_requests",
        "title": "Special Requests",
        "fields": [
          {"name": "specialRequests", "label": "Special Requests", "type": "textarea"}
        ]
      },
      {
        "id": "legal",
        "title": "Legal Information",
        "fields": [
          {"name": "doctorHospital", "label": "Doctor/Hospital", "type": "text"},
          {"name": "coronerInvolved", "label": "Coroner Involved", "type": "checkbox"},
          {"name": "medicalCertificateReceived", "label": "Medical Certificate Received", "type": "checkbox"},
          {"name": "willInPlace", "label": "Will in Place", "type": "checkbox"}
        ]
      }
    ]
  }'::jsonb,
  TRUE
) ON CONFLICT DO NOTHING;

-- Add comments
COMMENT ON TABLE form_templates IS 'System-wide form templates with versioning. When a template is updated, old versions are soft-deleted.';
COMMENT ON COLUMN form_templates.form_type IS 'Type of form: pre_arrangement, government_form, etc.';
COMMENT ON COLUMN form_templates.version IS 'Auto-incrementing version number for each form type';
COMMENT ON COLUMN form_templates.is_active IS 'Only one version per form_type should be active at a time';
COMMENT ON COLUMN form_templates.template_data IS 'JSON structure defining form sections and fields';
