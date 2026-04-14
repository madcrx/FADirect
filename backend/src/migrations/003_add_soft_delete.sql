-- Add soft delete support with deleted_at timestamps

ALTER TABLE arrangements ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Create indexes for soft delete queries
CREATE INDEX IF NOT EXISTS idx_arrangements_deleted ON arrangements(deleted_at);
CREATE INDEX IF NOT EXISTS idx_messages_deleted ON messages(deleted_at);
CREATE INDEX IF NOT EXISTS idx_documents_deleted ON documents(deleted_at);
CREATE INDEX IF NOT EXISTS idx_photos_deleted ON photos(deleted_at);
