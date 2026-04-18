-- Migration 023: Add job reference to arrangements for linking to scheduled services

ALTER TABLE arrangements ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES jobs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_arrangements_job ON arrangements(job_id);

COMMENT ON COLUMN arrangements.job_id IS 'Reference to scheduled job/service for this arrangement';
