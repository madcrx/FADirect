-- Add workflow and funeral type features to arrangements

-- Add new columns to arrangements table
ALTER TABLE arrangements
  ADD COLUMN funeral_type VARCHAR(20) CHECK (funeral_type IN ('burial', 'cremation', 'memorial', 'celebration_of_life')),
  ADD COLUMN mourner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN current_step_index INTEGER DEFAULT 0;

-- Update status values to match frontend expectations
ALTER TABLE arrangements
  DROP CONSTRAINT IF EXISTS arrangements_status_check,
  ADD CONSTRAINT arrangements_status_check CHECK (status IN (
    'draft',
    'active',
    'completed',
    'initial_contact',
    'information_gathering',
    'service_planning',
    'documentation',
    'arrangements_confirmed',
    'service_scheduled'
  ));

-- Create workflow_steps table for tracking arrangement progress
CREATE TABLE workflow_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  arrangement_id UUID REFERENCES arrangements(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  step_order INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  due_date TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(arrangement_id, step_order)
);

CREATE INDEX idx_workflow_steps_arrangement ON workflow_steps(arrangement_id);
CREATE INDEX idx_workflow_steps_status ON workflow_steps(status);

CREATE TRIGGER update_workflow_steps_updated_at BEFORE UPDATE ON workflow_steps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add email column to users if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'email'
  ) THEN
    ALTER TABLE users ADD COLUMN email VARCHAR(255);
  END IF;
END $$;
