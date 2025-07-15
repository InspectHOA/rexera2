-- =====================================================
-- Add n8n Integration Tracking to Workflows
-- =====================================================

-- Add n8n execution tracking fields to workflows table
ALTER TABLE workflows 
ADD COLUMN n8n_execution_id TEXT,
ADD COLUMN n8n_started_at TIMESTAMPTZ,
ADD COLUMN n8n_status TEXT DEFAULT 'not_started';

-- Add index for n8n execution lookups
CREATE INDEX idx_workflows_n8n_execution ON workflows(n8n_execution_id);
CREATE INDEX idx_workflows_n8n_status ON workflows(n8n_status);

-- Add constraint for valid n8n status values
ALTER TABLE workflows 
ADD CONSTRAINT check_n8n_status 
CHECK (n8n_status IN ('not_started', 'running', 'success', 'error', 'canceled', 'crashed', 'waiting'));

-- Add comments for documentation
COMMENT ON COLUMN workflows.n8n_execution_id IS 'n8n Cloud execution ID for correlation and monitoring';
COMMENT ON COLUMN workflows.n8n_started_at IS 'Timestamp when n8n workflow execution was triggered';
COMMENT ON COLUMN workflows.n8n_status IS 'Current n8n execution status: not_started, running, success, error, canceled, crashed, waiting';