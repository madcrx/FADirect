-- Migration: Add leave_type to leave_requests table
-- Description: Adds leave_type column to support different types of leave requests

ALTER TABLE leave_requests
ADD COLUMN IF NOT EXISTS leave_type VARCHAR(20) DEFAULT 'annual'
CHECK (leave_type IN ('annual', 'sick', 'personal', 'unpaid', 'other'));

-- Create index for leave type queries
CREATE INDEX IF NOT EXISTS idx_leave_requests_type ON leave_requests(leave_type);
