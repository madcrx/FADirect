-- Migration 027: Add location_of_deceased config values
-- Add default values for location of deceased dropdown

INSERT INTO config_values (category, value, label, sort_order, is_active)
VALUES
  ('location_of_deceased', 'hospital', 'Hospital', 1, true),
  ('location_of_deceased', 'morgue', 'Morgue', 2, true),
  ('location_of_deceased', 'funeral_home', 'Funeral Home', 3, true),
  ('location_of_deceased', 'private_residence', 'Private Residence', 4, true),
  ('location_of_deceased', 'nursing_home', 'Nursing Home', 5, true),
  ('location_of_deceased', 'hospice', 'Hospice', 6, true),
  ('location_of_deceased', 'coroner', 'Coroner', 7, true)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE config_values IS 'Configuration dropdown values for various categories including location of deceased';
