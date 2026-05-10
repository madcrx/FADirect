-- Migration: Add Policy Management System
-- Description: Creates tables for policy documents, categories, and acknowledgment tracking

-- Policy Categories Table
CREATE TABLE IF NOT EXISTS policy_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Policy Documents Table
CREATE TABLE IF NOT EXISTS policy_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  category_id UUID REFERENCES policy_categories(id) ON DELETE SET NULL,
  version VARCHAR(50) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  requires_acknowledgment BOOLEAN DEFAULT false,
  description TEXT,
  effective_date DATE,
  review_date DATE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Policy Acknowledgments Table
CREATE TABLE IF NOT EXISTS policy_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES policy_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  acknowledged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  UNIQUE(policy_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_policy_documents_category
  ON policy_documents(category_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_policy_documents_created_at
  ON policy_documents(created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_policy_documents_requires_ack
  ON policy_documents(requires_acknowledgment)
  WHERE deleted_at IS NULL AND requires_acknowledgment = true;

CREATE INDEX IF NOT EXISTS idx_policy_acknowledgments_policy
  ON policy_acknowledgments(policy_id);

CREATE INDEX IF NOT EXISTS idx_policy_acknowledgments_user
  ON policy_acknowledgments(user_id);

CREATE INDEX IF NOT EXISTS idx_policy_acknowledgments_date
  ON policy_acknowledgments(acknowledged_at DESC);

-- Insert default categories
INSERT INTO policy_categories (name, description, display_order) VALUES
  ('HR Policies', 'Human Resources policies and procedures', 1),
  ('Health & Safety', 'Health and safety protocols and guidelines', 2),
  ('Service Standards', 'Service delivery standards and best practices', 3),
  ('Operations', 'Operational procedures and workflows', 4),
  ('Compliance', 'Regulatory compliance and legal requirements', 5)
ON CONFLICT (name) DO NOTHING;

-- Add trigger for updated_at on policy_categories
CREATE OR REPLACE FUNCTION update_policy_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_policy_categories_updated_at
  BEFORE UPDATE ON policy_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_policy_categories_updated_at();

-- Add trigger for updated_at on policy_documents
CREATE OR REPLACE FUNCTION update_policy_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_policy_documents_updated_at
  BEFORE UPDATE ON policy_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_policy_documents_updated_at();
