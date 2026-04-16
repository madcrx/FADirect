-- Government Submissions Table
CREATE TABLE IF NOT EXISTS government_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arrangement_id UUID NOT NULL REFERENCES arrangements(id),
  submission_type VARCHAR(50) NOT NULL CHECK (submission_type IN ('bdm_death_registration', 'coroner_report', 'death_certificate_application')),
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'in_progress', 'completed', 'rejected')),
  reference_number VARCHAR(100),
  submission_date TIMESTAMP,
  completion_date TIMESTAMP,
  notes TEXT,
  form_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_government_submissions_arrangement ON government_submissions(arrangement_id);
CREATE INDEX IF NOT EXISTS idx_government_submissions_type ON government_submissions(submission_type);
CREATE INDEX IF NOT EXISTS idx_government_submissions_status ON government_submissions(status);
CREATE INDEX IF NOT EXISTS idx_government_submissions_deleted ON government_submissions(deleted_at);

-- Government Documents Table (for generated PDFs, forms, etc.)
CREATE TABLE IF NOT EXISTS government_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES government_submissions(id) ON DELETE CASCADE,
  document_name VARCHAR(255) NOT NULL,
  document_type VARCHAR(100) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_government_documents_submission ON government_documents(submission_id);

-- Update trigger for government_submissions
DROP TRIGGER IF EXISTS trigger_update_government_submissions_updated_at ON government_submissions;
CREATE TRIGGER trigger_update_government_submissions_updated_at
BEFORE UPDATE ON government_submissions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
