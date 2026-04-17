-- Migration 016: Fix notification triggers to use correct arrangement fields
-- Replace assigned_to with arranger_id and handle missing created_by field

-- Fix arrangement assignment trigger
CREATE OR REPLACE FUNCTION notify_arrangement_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Arrangements don't have assigned_to, they have arranger_id
  -- This trigger is not applicable for arrangements, so we'll just return
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix arrangement status change trigger
CREATE OR REPLACE FUNCTION notify_arrangement_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    -- Notify arranger (not assigned_to, as that field doesn't exist)
    IF NEW.arranger_id IS NOT NULL THEN
      PERFORM create_notification(
        NEW.arranger_id,
        'Arrangement Status Updated',
        'Arrangement for ' || NEW.deceased_name || ' is now ' || NEW.status,
        CASE
          WHEN NEW.status = 'completed' THEN 'success'
          WHEN NEW.status = 'cancelled' THEN 'warning'
          ELSE 'info'
        END,
        'arrangement',
        'arrangement',
        NEW.id,
        '/arrangements/' || NEW.id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix invoice created trigger
CREATE OR REPLACE FUNCTION notify_invoice_created()
RETURNS TRIGGER AS $$
DECLARE
  v_arrangement RECORD;
BEGIN
  -- Get arrangement details
  SELECT * INTO v_arrangement FROM arrangements WHERE id = NEW.arrangement_id;

  -- Use arranger_id instead of assigned_to
  IF v_arrangement.arranger_id IS NOT NULL THEN
    PERFORM create_notification(
      v_arrangement.arranger_id,
      'New Invoice Created',
      'Invoice ' || NEW.invoice_number || ' created for ' || v_arrangement.deceased_name,
      'info',
      'invoice',
      'invoice',
      NEW.id,
      '/invoicing'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix invoice status change trigger
CREATE OR REPLACE FUNCTION notify_invoice_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_arrangement RECORD;
BEGIN
  IF OLD.status != NEW.status THEN
    -- Get arrangement details
    SELECT * INTO v_arrangement FROM arrangements WHERE id = NEW.arrangement_id;

    -- Use arranger_id instead of assigned_to
    IF v_arrangement.arranger_id IS NOT NULL THEN
      PERFORM create_notification(
        v_arrangement.arranger_id,
        'Invoice Status Updated',
        'Invoice ' || NEW.invoice_number || ' is now ' || NEW.status,
        CASE
          WHEN NEW.status = 'paid' THEN 'success'
          WHEN NEW.status = 'overdue' THEN 'error'
          ELSE 'info'
        END,
        'invoice',
        'invoice',
        NEW.id,
        '/invoicing'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix message received trigger
CREATE OR REPLACE FUNCTION notify_message_received()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify arrangement arranger if exists
  IF NEW.arrangement_id IS NOT NULL THEN
    DECLARE
      v_arrangement RECORD;
    BEGIN
      SELECT * INTO v_arrangement FROM arrangements WHERE id = NEW.arrangement_id;

      -- Use arranger_id instead of assigned_to
      IF v_arrangement.arranger_id IS NOT NULL AND v_arrangement.arranger_id != NEW.sender_id THEN
        DECLARE
          v_sender RECORD;
        BEGIN
          SELECT name, phone_number INTO v_sender FROM users WHERE id = NEW.sender_id;
          PERFORM create_notification(
            v_arrangement.arranger_id,
            'New Message Received',
            'New message from ' || COALESCE(v_sender.name, v_sender.phone_number, 'Unknown'),
            'info',
            'message',
            'message',
            NEW.id,
            '/arrangements/' || NEW.arrangement_id
          );
        END;
      END IF;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION notify_arrangement_assignment() IS 'Disabled - arrangements use arranger_id not assigned_to';
COMMENT ON FUNCTION notify_arrangement_status_change() IS 'Notifies arranger when arrangement status changes';
COMMENT ON FUNCTION notify_invoice_created() IS 'Notifies arranger when invoice is created for their arrangement';
COMMENT ON FUNCTION notify_invoice_status_change() IS 'Notifies arranger when invoice status changes';
COMMENT ON FUNCTION notify_message_received() IS 'Notifies arranger when new message received for their arrangement';
