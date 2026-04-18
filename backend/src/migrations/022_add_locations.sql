-- Migration 022: Add location values for dropdown management

-- Insert default location values covering various location types
INSERT INTO config_values (category, value, label, sort_order) VALUES
  -- Office Branches
  ('location', 'head_office', 'Head Office', 1),
  ('location', 'north_branch', 'North Branch', 2),
  ('location', 'south_branch', 'South Branch', 3),
  ('location', 'east_branch', 'East Branch', 4),
  ('location', 'west_branch', 'West Branch', 5),

  -- Cemeteries
  ('location', 'memorial_gardens', 'Memorial Gardens Cemetery', 10),
  ('location', 'lawn_cemetery', 'Lawn Cemetery', 11),
  ('location', 'heritage_cemetery', 'Heritage Memorial Park', 12),

  -- Crematories
  ('location', 'city_crematorium', 'City Crematorium', 20),
  ('location', 'memorial_crematorium', 'Memorial Crematorium', 21),

  -- Airports
  ('location', 'airport_terminal', 'Airport Terminal', 30),
  ('location', 'airport_freight', 'Airport Freight Terminal', 31),

  -- Reception Venues
  ('location', 'community_hall', 'Community Hall', 40),
  ('location', 'memorial_chapel', 'Memorial Chapel', 41),
  ('location', 'reception_centre', 'Reception Centre', 42),

  -- Countries (for repatriation)
  ('location', 'australia', 'Australia', 50),
  ('location', 'new_zealand', 'New Zealand', 51),
  ('location', 'united_kingdom', 'United Kingdom', 52),
  ('location', 'united_states', 'United States', 53),
  ('location', 'canada', 'Canada', 54),

  -- Other common locations
  ('location', 'church', 'Church', 60),
  ('location', 'hospital', 'Hospital', 61),
  ('location', 'nursing_home', 'Nursing Home', 62),
  ('location', 'private_residence', 'Private Residence', 63),
  ('location', 'other', 'Other', 99)
ON CONFLICT (category, value) DO NOTHING;

COMMENT ON TABLE config_values IS 'System-wide dropdown configuration values including locations';
