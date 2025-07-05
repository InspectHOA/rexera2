-- =====================================================
-- Add n8n integration support to workflows table
-- Phase 1: Foundation for n8n integration
-- =====================================================

-- Add n8n_execution_id column to workflows table
ALTER TABLE workflows 
ADD COLUMN n8n_execution_id TEXT;

-- Add index for n8n_execution_id for efficient lookups
CREATE INDEX idx_workflows_n8n_execution_id ON workflows(n8n_execution_id);

-- Add comment for documentation
COMMENT ON COLUMN workflows.n8n_execution_id IS 'n8n workflow execution ID for external orchestration tracking';