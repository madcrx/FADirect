-- Migration: Add videos table for arrangement video uploads
-- Date: 2024-04-17

-- Create videos table
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arrangement_id UUID REFERENCES arrangements(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_size BIGINT,
  duration INTEGER, -- Duration in seconds
  caption TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Create index on arrangement_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_videos_arrangement_id ON videos(arrangement_id);

-- Create index on deleted_at for trash queries
CREATE INDEX IF NOT EXISTS idx_videos_deleted_at ON videos(deleted_at);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_videos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER videos_updated_at
  BEFORE UPDATE ON videos
  FOR EACH ROW
  EXECUTE FUNCTION update_videos_updated_at();
