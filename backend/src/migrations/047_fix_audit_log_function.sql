-- Fix the log_audit_event function to match the actual audit_logs table structure
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
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_audit_id UUID;
  v_changes JSONB;
BEGIN
  -- Build changes JSON object
  v_changes := jsonb_build_object(
    'field_name', p_field_name,
    'old_value', p_old_value,
    'new_value', p_new_value,
    'notes', p_notes
  );

  -- Remove null values from changes
  v_changes := (SELECT jsonb_object_agg(key, value)
                FROM jsonb_each(v_changes)
                WHERE value IS NOT NULL AND value::text != 'null');

  INSERT INTO audit_logs (
    entity_type,
    entity_id,
    action,
    user_id,
    changes
  ) VALUES (
    p_entity_type,
    p_entity_id,
    p_action,
    p_user_id,
    v_changes
  )
  RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$;

COMMENT ON FUNCTION log_audit_event IS 'Fixed version that uses JSONB changes column instead of individual columns';
