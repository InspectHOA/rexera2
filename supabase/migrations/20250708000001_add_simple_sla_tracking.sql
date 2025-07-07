-- =====================================================
-- Simple SLA Tracking Migration
-- Adds ultra-simple SLA tracking fields to task_executions table
-- Also removes the complex SLA tables that we're not using
-- =====================================================

-- Drop the complex SLA tables that we're replacing with simple approach
DROP TABLE IF EXISTS sla_alerts CASCADE;
DROP TABLE IF EXISTS sla_tracking CASCADE;
DROP TABLE IF EXISTS sla_definitions CASCADE;

-- Drop unused SLA-related enums and types
DROP TYPE IF EXISTS sla_tracking_status CASCADE;
DROP TYPE IF EXISTS alert_level CASCADE;

-- Add SLA tracking fields to task_executions table
ALTER TABLE task_executions 
ADD COLUMN sla_hours INTEGER DEFAULT 24,           -- How many hours this task should take (configurable per task)
ADD COLUMN sla_due_at TIMESTAMPTZ,                 -- When this task is due (calculated: started_at + sla_hours)
ADD COLUMN sla_status TEXT DEFAULT 'ON_TIME';      -- Current SLA status: 'ON_TIME', 'AT_RISK', 'BREACHED'

-- Add constraint to ensure valid SLA status values
ALTER TABLE task_executions 
ADD CONSTRAINT check_sla_status 
CHECK (sla_status IN ('ON_TIME', 'AT_RISK', 'BREACHED'));

-- Add constraint to ensure positive SLA hours
ALTER TABLE task_executions 
ADD CONSTRAINT check_positive_sla_hours 
CHECK (sla_hours > 0);

-- Create index for efficient SLA monitoring queries
CREATE INDEX idx_task_executions_sla_monitoring 
ON task_executions (sla_due_at, sla_status, status) 
WHERE status != 'COMPLETED';

-- Create function to automatically set sla_due_at when started_at is updated
CREATE OR REPLACE FUNCTION update_sla_due_at()
RETURNS TRIGGER AS $$
BEGIN
    -- When a task starts (started_at is set), calculate the due date
    IF NEW.started_at IS NOT NULL AND OLD.started_at IS NULL THEN
        NEW.sla_due_at = NEW.started_at + (NEW.sla_hours || ' hours')::INTERVAL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update sla_due_at when task starts
CREATE TRIGGER trigger_update_sla_due_at
    BEFORE UPDATE ON task_executions
    FOR EACH ROW
    EXECUTE FUNCTION update_sla_due_at();

-- Add comment explaining the simplified SLA approach
COMMENT ON COLUMN task_executions.sla_hours IS 'Hours allocated for this task (default 24). Can be customized per task type or individual task.';
COMMENT ON COLUMN task_executions.sla_due_at IS 'Calculated deadline for this task (started_at + sla_hours). Auto-populated when task starts.';
COMMENT ON COLUMN task_executions.sla_status IS 'Current SLA status: ON_TIME (before due), AT_RISK (approaching due), BREACHED (past due)';

-- Create a view for easy SLA monitoring
CREATE VIEW task_sla_status AS
SELECT 
    id,
    workflow_id,
    title,
    task_type,
    status,
    started_at,
    sla_hours,
    sla_due_at,
    sla_status,
    -- Calculate time remaining (negative = overdue)
    EXTRACT(EPOCH FROM (sla_due_at - NOW())) / 3600 AS hours_remaining,
    -- Calculate percentage of SLA time elapsed
    CASE 
        WHEN started_at IS NULL THEN 0
        WHEN sla_due_at IS NULL THEN 0
        ELSE GREATEST(0, LEAST(100, 
            EXTRACT(EPOCH FROM (NOW() - started_at)) / 
            EXTRACT(EPOCH FROM (sla_due_at - started_at)) * 100
        ))
    END AS sla_percent_elapsed
FROM task_executions
WHERE status != 'COMPLETED';

COMMENT ON VIEW task_sla_status IS 'Convenient view for monitoring SLA status with calculated time remaining and percentage elapsed';