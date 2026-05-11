-- Link pre-arrangement forms to form templates

-- Add template_id column to pre_arrangement_forms
ALTER TABLE pre_arrangement_forms ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES form_templates(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_pre_arrangement_forms_template ON pre_arrangement_forms(template_id);

-- Add comment
COMMENT ON COLUMN pre_arrangement_forms.template_id IS 'Reference to the form template used to create this form';
