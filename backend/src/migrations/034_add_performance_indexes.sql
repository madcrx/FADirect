-- Add missing database indexes for performance optimization
-- These indexes address N+1 query problems and improve search performance

-- Enable required extensions first
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Arrangements table indexes
CREATE INDEX IF NOT EXISTS idx_arrangements_arranger_id ON arrangements(arranger_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_arrangements_mourner_id ON arrangements(mourner_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_arrangements_status ON arrangements(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_arrangements_service_date ON arrangements(service_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_arrangements_deceased_name ON arrangements(deceased_name) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_arrangements_created_at ON arrangements(created_at) WHERE deleted_at IS NULL;

-- Messages table indexes
CREATE INDEX IF NOT EXISTS idx_messages_arrangement_id ON messages(arrangement_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Documents table indexes
CREATE INDEX IF NOT EXISTS idx_documents_arrangement_id ON documents(arrangement_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at) WHERE deleted_at IS NULL;

-- Photos table indexes
CREATE INDEX IF NOT EXISTS idx_photos_arrangement_id ON photos(arrangement_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_photos_uploaded_by ON photos(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at) WHERE deleted_at IS NULL;

-- Videos table indexes (if table exists)
CREATE INDEX IF NOT EXISTS idx_videos_arrangement_id ON videos(arrangement_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_videos_uploaded_by ON videos(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at) WHERE deleted_at IS NULL;

-- Workflow steps indexes
CREATE INDEX IF NOT EXISTS idx_workflow_steps_arrangement_id ON workflow_steps(arrangement_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_assigned_to ON workflow_steps(assigned_to);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_due_date ON workflow_steps(due_date);

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_entity ON notifications(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- File sends table indexes
CREATE INDEX IF NOT EXISTS idx_file_sends_arrangement_id ON file_sends(arrangement_id);
CREATE INDEX IF NOT EXISTS idx_file_sends_sent_to_user_id ON file_sends(sent_to_user_id);
CREATE INDEX IF NOT EXISTS idx_file_sends_sent_by_user_id ON file_sends(sent_by_user_id);
CREATE INDEX IF NOT EXISTS idx_file_sends_status ON file_sends(status);
CREATE INDEX IF NOT EXISTS idx_file_sends_sent_at ON file_sends(sent_at);

-- Pre-arrangement forms table indexes
CREATE INDEX IF NOT EXISTS idx_pre_arrangement_forms_arrangement_id ON pre_arrangement_forms(arrangement_id);
CREATE INDEX IF NOT EXISTS idx_pre_arrangement_forms_sent_to ON pre_arrangement_forms(sent_to_user_id);
CREATE INDEX IF NOT EXISTS idx_pre_arrangement_forms_status ON pre_arrangement_forms(status);

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users USING GIN(role) WHERE deleted_at IS NULL;

-- Arrangement participants indexes
CREATE INDEX IF NOT EXISTS idx_arrangement_participants_arrangement_id ON arrangement_participants(arrangement_id);
CREATE INDEX IF NOT EXISTS idx_arrangement_participants_user_id ON arrangement_participants(user_id);

-- Staff profiles indexes
CREATE INDEX IF NOT EXISTS idx_staff_profiles_user_id ON staff_profiles(user_id);

-- Vehicles table indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_registration ON vehicles(registration) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status) WHERE deleted_at IS NULL;

-- Equipment table indexes
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_equipment_type ON equipment(equipment_type) WHERE deleted_at IS NULL;

-- Leave table indexes (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'leave') THEN
        CREATE INDEX IF NOT EXISTS idx_leave_staff_id ON leave(staff_id);
        CREATE INDEX IF NOT EXISTS idx_leave_status ON leave(status);
        CREATE INDEX IF NOT EXISTS idx_leave_dates ON leave(start_date, end_date);
    END IF;
END $$;

-- Roster jobs indexes (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'roster_jobs') THEN
        CREATE INDEX IF NOT EXISTS idx_roster_jobs_start_time ON roster_jobs(start_time);
        CREATE INDEX IF NOT EXISTS idx_roster_jobs_job_type_id ON roster_jobs(job_type_id);
        CREATE INDEX IF NOT EXISTS idx_roster_jobs_arrangement_id ON roster_jobs(arrangement_id);
    END IF;
END $$;

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_arrangements_arranger_status ON arrangements(arranger_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_messages_arrangement_created_at ON messages(arrangement_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, created_at DESC) WHERE read = false;

-- Full-text search indexes for common search fields
CREATE INDEX IF NOT EXISTS idx_arrangements_deceased_name_trgm ON arrangements USING gin(deceased_name gin_trgm_ops) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_name_trgm ON users USING gin(name gin_trgm_ops) WHERE deleted_at IS NULL;
