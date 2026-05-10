-- Audit history system for tracking all changes to arrangements and jobs

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL, -- 'arrangement', 'job', 'quote', 'invoice', 'payment'
  entity_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deleted', 'status_changed', 'accepted', 'rejected', 'finalized', 'resource_assigned', 'resource_removed'
  field_name VARCHAR(100), -- specific field that changed (for updates)
  old_value TEXT, -- previous value (JSON for complex types)
  new_value TEXT, -- new value (JSON for complex types)
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name VARCHAR(255), -- Denormalized for history preservation
  ip_address INET,
  user_agent TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
  p_entity_type VARCHAR,
  p_entity_id UUID,
  p_action VARCHAR,
  p_field_name VARCHAR DEFAULT NULL,
  p_old_value TEXT DEFAULT NULL,
  p_new_value TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
  v_user_name VARCHAR(255);
BEGIN
  -- Get user name if user_id provided
  IF p_user_id IS NOT NULL THEN
    SELECT name INTO v_user_name FROM users WHERE id = p_user_id;
  END IF;

  INSERT INTO audit_logs (
    entity_type,
    entity_id,
    action,
    field_name,
    old_value,
    new_value,
    user_id,
    user_name,
    notes
  ) VALUES (
    p_entity_type,
    p_entity_id,
    p_action,
    p_field_name,
    p_old_value,
    p_new_value,
    p_user_id,
    v_user_name,
    p_notes
  )
  RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for arrangements audit
CREATE OR REPLACE FUNCTION audit_arrangements()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Try to get user_id from session if available
  v_user_id := current_setting('app.current_user_id', true)::UUID;

  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit_event('arrangement', NEW.id, 'created', NULL, NULL,
      json_build_object('deceased_name', NEW.deceased_name, 'status', NEW.status)::text,
      v_user_id, 'Arrangement created');

  ELSIF TG_OP = 'UPDATE' THEN
    -- Log status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      PERFORM log_audit_event('arrangement', NEW.id, 'status_changed', 'status',
        OLD.status, NEW.status, v_user_id,
        'Status changed from ' || OLD.status || ' to ' || NEW.status);
    END IF;

    -- Log other field changes
    IF OLD.deceased_name IS DISTINCT FROM NEW.deceased_name THEN
      PERFORM log_audit_event('arrangement', NEW.id, 'updated', 'deceased_name',
        OLD.deceased_name, NEW.deceased_name, v_user_id);
    END IF;

    IF OLD.service_date IS DISTINCT FROM NEW.service_date THEN
      PERFORM log_audit_event('arrangement', NEW.id, 'updated', 'service_date',
        OLD.service_date::text, NEW.service_date::text, v_user_id);
    END IF;

    IF OLD.service_location IS DISTINCT FROM NEW.service_location THEN
      PERFORM log_audit_event('arrangement', NEW.id, 'updated', 'service_location',
        OLD.service_location, NEW.service_location, v_user_id);
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_audit_event('arrangement', OLD.id, 'deleted', NULL,
      json_build_object('deceased_name', OLD.deceased_name, 'status', OLD.status)::text,
      NULL, v_user_id, 'Arrangement deleted');
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_arrangements
  AFTER INSERT OR UPDATE OR DELETE ON arrangements
  FOR EACH ROW
  EXECUTE FUNCTION audit_arrangements();

-- Trigger function for jobs audit
CREATE OR REPLACE FUNCTION audit_jobs()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := current_setting('app.current_user_id', true)::UUID;

  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit_event('job', NEW.id, 'created', NULL, NULL,
      json_build_object('title', NEW.title, 'status', NEW.status, 'workflow_status', NEW.workflow_status)::text,
      COALESCE(v_user_id, NEW.created_by), 'Job created');

  ELSIF TG_OP = 'UPDATE' THEN
    -- Log status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      PERFORM log_audit_event('job', NEW.id, 'status_changed', 'status',
        OLD.status, NEW.status, v_user_id,
        'Job status changed from ' || OLD.status || ' to ' || NEW.status);
    END IF;

    -- Log workflow status changes
    IF OLD.workflow_status IS DISTINCT FROM NEW.workflow_status THEN
      PERFORM log_audit_event('job', NEW.id, 'status_changed', 'workflow_status',
        OLD.workflow_status, NEW.workflow_status, v_user_id,
        'Workflow status changed from ' || OLD.workflow_status || ' to ' || NEW.workflow_status);
    END IF;

    -- Log resource finalization
    IF OLD.resources_finalized_at IS NULL AND NEW.resources_finalized_at IS NOT NULL THEN
      PERFORM log_audit_event('job', NEW.id, 'finalized', NULL, NULL,
        json_build_object('finalized_at', NEW.resources_finalized_at)::text,
        NEW.resources_finalized_by, 'Job resources finalized and ready for invoicing');
    END IF;

    -- Log other field changes
    IF OLD.title IS DISTINCT FROM NEW.title THEN
      PERFORM log_audit_event('job', NEW.id, 'updated', 'title',
        OLD.title, NEW.title, v_user_id);
    END IF;

    IF OLD.start_time IS DISTINCT FROM NEW.start_time THEN
      PERFORM log_audit_event('job', NEW.id, 'updated', 'start_time',
        OLD.start_time::text, NEW.start_time::text, v_user_id);
    END IF;

    IF OLD.end_time IS DISTINCT FROM NEW.end_time THEN
      PERFORM log_audit_event('job', NEW.id, 'updated', 'end_time',
        OLD.end_time::text, NEW.end_time::text, v_user_id);
    END IF;

    IF OLD.location IS DISTINCT FROM NEW.location THEN
      PERFORM log_audit_event('job', NEW.id, 'updated', 'location',
        OLD.location, NEW.location, v_user_id);
    END IF;

    -- Log soft delete
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
      PERFORM log_audit_event('job', NEW.id, 'deleted', NULL, NULL,
        json_build_object('deleted_at', NEW.deleted_at)::text,
        v_user_id, 'Job soft deleted');
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_audit_event('job', OLD.id, 'deleted', NULL,
      json_build_object('title', OLD.title, 'status', OLD.status)::text,
      NULL, v_user_id, 'Job permanently deleted');
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_jobs
  AFTER INSERT OR UPDATE OR DELETE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION audit_jobs();

-- Trigger function for quotes audit
CREATE OR REPLACE FUNCTION audit_quotes()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := current_setting('app.current_user_id', true)::UUID;

  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit_event('quote', NEW.id, 'created', NULL, NULL,
      json_build_object('quote_number', NEW.quote_number, 'total_amount', NEW.total_amount)::text,
      COALESCE(v_user_id, NEW.created_by), 'Quote created');

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      CASE NEW.status
        WHEN 'accepted' THEN
          PERFORM log_audit_event('quote', NEW.id, 'accepted', 'status',
            OLD.status, NEW.status, NEW.accepted_by,
            'Quote accepted by customer');
        WHEN 'rejected' THEN
          PERFORM log_audit_event('quote', NEW.id, 'rejected', 'status',
            OLD.status, NEW.status, v_user_id,
            'Quote rejected');
        WHEN 'sent' THEN
          PERFORM log_audit_event('quote', NEW.id, 'status_changed', 'status',
            OLD.status, NEW.status, v_user_id,
            'Quote sent to customer');
        ELSE
          PERFORM log_audit_event('quote', NEW.id, 'status_changed', 'status',
            OLD.status, NEW.status, v_user_id);
      END CASE;
    END IF;

    IF OLD.total_amount IS DISTINCT FROM NEW.total_amount THEN
      PERFORM log_audit_event('quote', NEW.id, 'updated', 'total_amount',
        OLD.total_amount::text, NEW.total_amount::text, v_user_id);
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_quotes
  AFTER INSERT OR UPDATE OR DELETE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION audit_quotes();

-- Trigger function for resource assignments audit
CREATE OR REPLACE FUNCTION audit_staff_assignments()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_staff_name VARCHAR(255);
BEGIN
  v_user_id := current_setting('app.current_user_id', true)::UUID;

  IF TG_OP = 'INSERT' THEN
    SELECT name INTO v_staff_name FROM users WHERE id = NEW.staff_id;
    PERFORM log_audit_event('job', NEW.job_id, 'resource_assigned', 'staff',
      NULL, json_build_object('staff_id', NEW.staff_id, 'staff_name', v_staff_name, 'role', NEW.role)::text,
      v_user_id, 'Staff member ' || v_staff_name || ' assigned as ' || NEW.role);

  ELSIF TG_OP = 'DELETE' THEN
    SELECT name INTO v_staff_name FROM users WHERE id = OLD.staff_id;
    PERFORM log_audit_event('job', OLD.job_id, 'resource_removed', 'staff',
      json_build_object('staff_id', OLD.staff_id, 'staff_name', v_staff_name, 'role', OLD.role)::text,
      NULL, v_user_id, 'Staff member ' || v_staff_name || ' removed from job');
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_staff_assignments
  AFTER INSERT OR DELETE ON job_staff_assignments
  FOR EACH ROW
  EXECUTE FUNCTION audit_staff_assignments();

-- Trigger function for vehicle assignments audit
CREATE OR REPLACE FUNCTION audit_vehicle_assignments()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_vehicle_reg VARCHAR(255);
BEGIN
  v_user_id := current_setting('app.current_user_id', true)::UUID;

  IF TG_OP = 'INSERT' THEN
    SELECT registration INTO v_vehicle_reg FROM vehicles WHERE id = NEW.vehicle_id;
    PERFORM log_audit_event('job', NEW.job_id, 'resource_assigned', 'vehicle',
      NULL, json_build_object('vehicle_id', NEW.vehicle_id, 'registration', v_vehicle_reg)::text,
      v_user_id, 'Vehicle ' || v_vehicle_reg || ' assigned');

  ELSIF TG_OP = 'DELETE' THEN
    SELECT registration INTO v_vehicle_reg FROM vehicles WHERE id = OLD.vehicle_id;
    PERFORM log_audit_event('job', OLD.job_id, 'resource_removed', 'vehicle',
      json_build_object('vehicle_id', OLD.vehicle_id, 'registration', v_vehicle_reg)::text,
      NULL, v_user_id, 'Vehicle ' || v_vehicle_reg || ' removed from job');
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_vehicle_assignments
  AFTER INSERT OR DELETE ON job_vehicle_assignments
  FOR EACH ROW
  EXECUTE FUNCTION audit_vehicle_assignments();

-- Trigger function for invoices audit
CREATE OR REPLACE FUNCTION audit_invoices()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := current_setting('app.current_user_id', true)::UUID;

  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit_event('invoice', NEW.id, 'created', NULL, NULL,
      json_build_object('invoice_number', NEW.invoice_number, 'total_amount', NEW.total_amount, 'auto_generated', NEW.auto_generated)::text,
      v_user_id, CASE WHEN NEW.auto_generated THEN 'Invoice auto-generated' ELSE 'Invoice created' END);

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      PERFORM log_audit_event('invoice', NEW.id, 'status_changed', 'status',
        OLD.status, NEW.status, v_user_id,
        'Invoice status changed from ' || OLD.status || ' to ' || NEW.status);
    END IF;

    IF OLD.paid_amount IS DISTINCT FROM NEW.paid_amount THEN
      PERFORM log_audit_event('invoice', NEW.id, 'updated', 'paid_amount',
        OLD.paid_amount::text, NEW.paid_amount::text, v_user_id,
        'Payment of $' || (NEW.paid_amount - OLD.paid_amount)::text || ' recorded');
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_invoices
  AFTER INSERT OR UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION audit_invoices();

-- Trigger function for payments audit
CREATE OR REPLACE FUNCTION audit_payments()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_invoice_number VARCHAR(50);
BEGIN
  v_user_id := current_setting('app.current_user_id', true)::UUID;

  IF TG_OP = 'INSERT' THEN
    SELECT invoice_number INTO v_invoice_number FROM invoices WHERE id = NEW.invoice_id;
    PERFORM log_audit_event('payment', NEW.id, 'created', NULL, NULL,
      json_build_object('invoice_number', v_invoice_number, 'amount', NEW.amount, 'method', NEW.payment_method)::text,
      v_user_id, 'Payment of $' || NEW.amount::text || ' received for invoice ' || v_invoice_number);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_payments
  AFTER INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION audit_payments();
