-- Add workflow automation for arrangements → quotes → jobs → invoices → payments

-- Create quotes table
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arrangement_id UUID NOT NULL REFERENCES arrangements(id) ON DELETE CASCADE,
  quote_number VARCHAR(50) UNIQUE NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  valid_until DATE,
  notes TEXT,
  terms_conditions TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  accepted_at TIMESTAMP,
  accepted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quotes_arrangement ON quotes(arrangement_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_number ON quotes(quote_number);

-- Quote line items table
CREATE TABLE IF NOT EXISTS quote_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  description VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  price_list_item_id UUID REFERENCES price_list_items(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quote_line_items_quote ON quote_line_items(quote_id);

-- Update arrangements table to add workflow status
ALTER TABLE arrangements DROP CONSTRAINT IF EXISTS arrangements_status_check;
ALTER TABLE arrangements ADD CONSTRAINT arrangements_status_check
  CHECK (status IN ('pending', 'quoted', 'quote_accepted', 'in_progress', 'completed', 'cancelled'));

-- Add workflow tracking to jobs
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(50) DEFAULT 'pending_resources'
  CHECK (workflow_status IN ('pending_resources', 'resources_assigned', 'ready_to_invoice', 'invoiced', 'paid', 'completed'));
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS resources_finalized_at TIMESTAMP;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS resources_finalized_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_quote ON jobs(quote_id);
CREATE INDEX IF NOT EXISTS idx_jobs_workflow_status ON jobs(workflow_status);

-- Add auto-invoice field to invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT FALSE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES jobs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_invoices_job ON invoices(job_id);

-- Function to generate quote number
CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  new_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(quote_number FROM '[0-9]+') AS INTEGER)), 0) + 1
  INTO next_num
  FROM quotes
  WHERE quote_number ~ '^QT[0-9]+$';

  new_number := 'QT' || LPAD(next_num::TEXT, 6, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate quote number
CREATE OR REPLACE FUNCTION set_quote_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.quote_number IS NULL OR NEW.quote_number = '' THEN
    NEW.quote_number := generate_quote_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_quote_number
  BEFORE INSERT ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION set_quote_number();

-- Function to update quote total when line items change
CREATE OR REPLACE FUNCTION update_quote_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE quotes
  SET total_amount = (
    SELECT COALESCE(SUM(total_price), 0)
    FROM quote_line_items
    WHERE quote_id = COALESCE(NEW.quote_id, OLD.quote_id)
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.quote_id, OLD.quote_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_quote_total_insert
  AFTER INSERT ON quote_line_items
  FOR EACH ROW
  EXECUTE FUNCTION update_quote_total();

CREATE TRIGGER trigger_update_quote_total_update
  AFTER UPDATE ON quote_line_items
  FOR EACH ROW
  EXECUTE FUNCTION update_quote_total();

CREATE TRIGGER trigger_update_quote_total_delete
  AFTER DELETE ON quote_line_items
  FOR EACH ROW
  EXECUTE FUNCTION update_quote_total();

-- Function to auto-create job when quote is accepted
CREATE OR REPLACE FUNCTION auto_create_job_on_quote_acceptance()
RETURNS TRIGGER AS $$
DECLARE
  arrangement_row RECORD;
  default_job_type_id UUID;
  new_job_id UUID;
BEGIN
  -- Only proceed if quote status changed to 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN

    -- Get arrangement details
    SELECT * INTO arrangement_row FROM arrangements WHERE id = NEW.arrangement_id;

    -- Get default job type (you may want to customize this)
    SELECT id INTO default_job_type_id FROM job_types LIMIT 1;

    -- Create the job
    INSERT INTO jobs (
      quote_id,
      job_type_id,
      arrangement_id,
      title,
      description,
      location,
      start_time,
      end_time,
      status,
      workflow_status,
      created_by
    ) VALUES (
      NEW.id,
      default_job_type_id,
      NEW.arrangement_id,
      'Service for ' || arrangement_row.deceased_name,
      'Auto-generated from accepted quote ' || NEW.quote_number,
      arrangement_row.service_location,
      arrangement_row.service_date,
      arrangement_row.service_date + INTERVAL '2 hours',
      'scheduled',
      'pending_resources',
      NEW.accepted_by
    )
    RETURNING id INTO new_job_id;

    -- Update arrangement status to quote_accepted
    UPDATE arrangements
    SET status = 'quote_accepted', updated_at = NOW()
    WHERE id = NEW.arrangement_id;

    -- Create notification for managers
    INSERT INTO notifications (user_id, title, body, type, category, entity_type, entity_id, action_url)
    SELECT
      u.id,
      'Quote Accepted - Job Created',
      'Quote ' || NEW.quote_number || ' has been accepted. A job has been auto-created and needs resources assigned.',
      'success',
      'job',
      'job',
      new_job_id,
      '/bookings'
    FROM users u
    WHERE 'admin' = ANY(u.role) OR 'management' = ANY(u.role);

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_create_job_on_quote_acceptance
  AFTER UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_job_on_quote_acceptance();

-- Function to auto-create invoice when job resources are finalized
CREATE OR REPLACE FUNCTION auto_create_invoice_on_job_finalization()
RETURNS TRIGGER AS $$
DECLARE
  quote_row RECORD;
  new_invoice_id UUID;
  invoice_num TEXT;
BEGIN
  -- Only proceed if workflow_status changed to 'ready_to_invoice'
  IF NEW.workflow_status = 'ready_to_invoice' AND
     (OLD.workflow_status IS NULL OR OLD.workflow_status != 'ready_to_invoice') AND
     NEW.quote_id IS NOT NULL THEN

    -- Get quote details
    SELECT * INTO quote_row FROM quotes WHERE id = NEW.quote_id;

    -- Check if invoice already exists for this arrangement
    IF NOT EXISTS (SELECT 1 FROM invoices WHERE arrangement_id = NEW.arrangement_id AND deleted_at IS NULL) THEN

      -- Generate invoice number
      SELECT 'INV' || LPAD((COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '[0-9]+') AS INTEGER)), 0) + 1)::TEXT, 6, '0')
      INTO invoice_num
      FROM invoices
      WHERE invoice_number ~ '^INV[0-9]+$';

      -- Create the invoice
      INSERT INTO invoices (
        arrangement_id,
        invoice_number,
        total_amount,
        status,
        auto_generated,
        job_id,
        notes
      ) VALUES (
        NEW.arrangement_id,
        invoice_num,
        quote_row.total_amount,
        'pending',
        TRUE,
        NEW.id,
        'Auto-generated from job completion'
      )
      RETURNING id INTO new_invoice_id;

      -- Copy quote line items to invoice line items
      INSERT INTO invoice_line_items (invoice_id, description, quantity, unit_price, total_price, price_list_item_id)
      SELECT new_invoice_id, description, quantity, unit_price, total_price, price_list_item_id
      FROM quote_line_items
      WHERE quote_id = NEW.quote_id;

      -- Update job workflow status to 'invoiced'
      UPDATE jobs
      SET workflow_status = 'invoiced', updated_at = NOW()
      WHERE id = NEW.id;

      -- Create notification
      INSERT INTO notifications (user_id, title, body, type, category, entity_type, entity_id, action_url)
      SELECT
        u.id,
        'Invoice Auto-Generated',
        'Invoice ' || invoice_num || ' has been automatically created for completed job.',
        'info',
        'invoice',
        'invoice',
        new_invoice_id,
        '/invoicing'
      FROM users u
      WHERE 'admin' = ANY(u.role) OR 'management' = ANY(u.role);

    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_create_invoice_on_job_finalization
  AFTER UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_invoice_on_job_finalization();

-- Function to mark job as completed when invoice is fully paid
CREATE OR REPLACE FUNCTION auto_complete_job_on_invoice_payment()
RETURNS TRIGGER AS $$
DECLARE
  invoice_row RECORD;
BEGIN
  -- Get invoice details
  SELECT * INTO invoice_row FROM invoices WHERE id = NEW.invoice_id;

  -- Check if invoice is now fully paid
  IF invoice_row.paid_amount >= invoice_row.total_amount AND invoice_row.job_id IS NOT NULL THEN

    -- Update job to completed
    UPDATE jobs
    SET
      status = 'completed',
      workflow_status = 'completed',
      updated_at = NOW()
    WHERE id = invoice_row.job_id AND status != 'completed';

    -- Update arrangement to completed
    UPDATE arrangements
    SET status = 'completed', updated_at = NOW()
    WHERE id = invoice_row.arrangement_id AND status != 'completed';

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_complete_job_on_invoice_payment
  AFTER INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION auto_complete_job_on_invoice_payment();

-- Function to update job workflow when resources are assigned
CREATE OR REPLACE FUNCTION update_job_workflow_on_resource_assignment()
RETURNS TRIGGER AS $$
DECLARE
  job_row RECORD;
  has_staff BOOLEAN;
  has_vehicles BOOLEAN;
BEGIN
  -- Get job details
  SELECT * INTO job_row FROM jobs WHERE id = NEW.job_id;

  -- Check if job has required resources
  SELECT EXISTS(SELECT 1 FROM job_staff_assignments WHERE job_id = NEW.job_id) INTO has_staff;
  SELECT EXISTS(SELECT 1 FROM job_vehicle_assignments WHERE job_id = NEW.job_id) INTO has_vehicles;

  -- If resources are assigned and workflow is still pending, update to resources_assigned
  IF (has_staff OR has_vehicles) AND job_row.workflow_status = 'pending_resources' THEN
    UPDATE jobs
    SET workflow_status = 'resources_assigned', updated_at = NOW()
    WHERE id = NEW.job_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_job_workflow_on_staff_assignment
  AFTER INSERT ON job_staff_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_job_workflow_on_resource_assignment();

CREATE TRIGGER trigger_update_job_workflow_on_vehicle_assignment
  AFTER INSERT ON job_vehicle_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_job_workflow_on_resource_assignment();
