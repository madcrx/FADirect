-- Migration 033: Add file sending to mourners functionality

-- Track files sent to mourners
CREATE TABLE IF NOT EXISTS file_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL,
  file_type VARCHAR(20) NOT NULL CHECK (file_type IN ('document', 'photo')),
  arrangement_id UUID REFERENCES arrangements(id) ON DELETE CASCADE,
  sent_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  sent_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'viewed', 'returned', 'cancelled')),
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  viewed_at TIMESTAMP,
  returned_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pre-Arrangement Forms
CREATE TABLE IF NOT EXISTS pre_arrangement_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arrangement_id UUID REFERENCES arrangements(id) ON DELETE CASCADE,
  sent_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  sent_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'in_progress', 'completed', 'cancelled')),
  form_data JSONB,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(arrangement_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_file_sends_arrangement ON file_sends(arrangement_id);
CREATE INDEX IF NOT EXISTS idx_file_sends_sent_to ON file_sends(sent_to_user_id);
CREATE INDEX IF NOT EXISTS idx_file_sends_status ON file_sends(status);
CREATE INDEX IF NOT EXISTS idx_pre_arrangement_forms_arrangement ON pre_arrangement_forms(arrangement_id);
CREATE INDEX IF NOT EXISTS idx_pre_arrangement_forms_status ON pre_arrangement_forms(status);

-- Comments
COMMENT ON TABLE file_sends IS 'Tracks files sent to mourners for review/signing';
COMMENT ON TABLE pre_arrangement_forms IS 'Pre-arrangement forms sent to mourners';
