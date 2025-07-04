-- =====================================================
-- CONVERT WORKFLOW IDS TO STRINGS
-- Update workflows table to use string IDs like PAY-0891, HOA-0440, MUNI-0123
-- =====================================================

-- First, drop existing foreign key constraints that reference workflows.id
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_workflow_id_fkey;
ALTER TABLE communications DROP CONSTRAINT IF EXISTS communications_workflow_id_fkey;
ALTER TABLE workflow_counterparties DROP CONSTRAINT IF EXISTS workflow_counterparties_workflow_id_fkey;
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_workflow_id_fkey;
ALTER TABLE sla_tracking DROP CONSTRAINT IF EXISTS sla_tracking_workflow_id_fkey;
ALTER TABLE costs DROP CONSTRAINT IF EXISTS costs_workflow_id_fkey;
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_workflow_id_fkey;
ALTER TABLE audit_events DROP CONSTRAINT IF EXISTS audit_events_workflow_id_fkey;
ALTER TABLE workflow_contacts DROP CONSTRAINT IF EXISTS workflow_contacts_workflow_id_fkey;
ALTER TABLE hil_notes DROP CONSTRAINT IF EXISTS hil_notes_workflow_id_fkey;

-- Create sequence for workflow counters
CREATE SEQUENCE IF NOT EXISTS workflow_payoff_seq START 1;
CREATE SEQUENCE IF NOT EXISTS workflow_hoa_seq START 1;
CREATE SEQUENCE IF NOT EXISTS workflow_muni_seq START 1;

-- Create function to generate workflow IDs
CREATE OR REPLACE FUNCTION generate_workflow_id(workflow_type_param workflow_type)
RETURNS TEXT AS $$
BEGIN
    CASE workflow_type_param
        WHEN 'PAYOFF' THEN
            RETURN 'PAY-' || LPAD(nextval('workflow_payoff_seq')::TEXT, 4, '0');
        WHEN 'HOA_ACQUISITION' THEN
            RETURN 'HOA-' || LPAD(nextval('workflow_hoa_seq')::TEXT, 4, '0');
        WHEN 'MUNI_LIEN_SEARCH' THEN
            RETURN 'MUNI-' || LPAD(nextval('workflow_muni_seq')::TEXT, 4, '0');
        ELSE
            RAISE EXCEPTION 'Unknown workflow type: %', workflow_type_param;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Create new workflows table with string IDs
CREATE TABLE workflows_new (
    id TEXT PRIMARY KEY,
    workflow_type workflow_type NOT NULL,
    client_id UUID NOT NULL REFERENCES clients(id),
    title TEXT NOT NULL,
    description TEXT,
    status workflow_status NOT NULL DEFAULT 'PENDING',
    priority priority_level NOT NULL DEFAULT 'NORMAL',
    metadata JSONB NOT NULL DEFAULT '{}',
    created_by UUID NOT NULL REFERENCES user_profiles(id),
    assigned_to UUID REFERENCES user_profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    due_date TIMESTAMPTZ
);

-- Copy existing data with new string IDs
INSERT INTO workflows_new (
    id, workflow_type, client_id, title, description, status, priority, 
    metadata, created_by, assigned_to, created_at, updated_at, completed_at, due_date
)
SELECT 
    generate_workflow_id(workflow_type),
    workflow_type,
    client_id,
    title,
    description,
    status,
    priority,
    metadata,
    created_by,
    assigned_to,
    created_at,
    updated_at,
    completed_at,
    due_date
FROM workflows;

-- Create mapping table for UUID to string conversion
CREATE TEMP TABLE workflow_id_mapping AS
SELECT 
    w_old.id as old_id,
    w_new.id as new_id
FROM workflows w_old
JOIN workflows_new w_new ON (
    w_old.workflow_type = w_new.workflow_type AND
    w_old.title = w_new.title AND
    w_old.created_at = w_new.created_at
);

-- Update related tables with new string IDs

-- Update tasks table
ALTER TABLE tasks ADD COLUMN workflow_id_new TEXT;
UPDATE tasks SET workflow_id_new = (
    SELECT new_id FROM workflow_id_mapping WHERE old_id = tasks.workflow_id
);
ALTER TABLE tasks DROP COLUMN workflow_id;
ALTER TABLE tasks RENAME COLUMN workflow_id_new TO workflow_id;
ALTER TABLE tasks ALTER COLUMN workflow_id SET NOT NULL;

-- Update communications table
ALTER TABLE communications ADD COLUMN workflow_id_new TEXT;
UPDATE communications SET workflow_id_new = (
    SELECT new_id FROM workflow_id_mapping WHERE old_id = communications.workflow_id
) WHERE workflow_id IS NOT NULL;
ALTER TABLE communications DROP COLUMN workflow_id;
ALTER TABLE communications RENAME COLUMN workflow_id_new TO workflow_id;

-- Update workflow_counterparties table
ALTER TABLE workflow_counterparties ADD COLUMN workflow_id_new TEXT;
UPDATE workflow_counterparties SET workflow_id_new = (
    SELECT new_id FROM workflow_id_mapping WHERE old_id = workflow_counterparties.workflow_id
);
ALTER TABLE workflow_counterparties DROP COLUMN workflow_id;
ALTER TABLE workflow_counterparties RENAME COLUMN workflow_id_new TO workflow_id;
ALTER TABLE workflow_counterparties ALTER COLUMN workflow_id SET NOT NULL;

-- Update documents table
ALTER TABLE documents ADD COLUMN workflow_id_new TEXT;
UPDATE documents SET workflow_id_new = (
    SELECT new_id FROM workflow_id_mapping WHERE old_id = documents.workflow_id
);
ALTER TABLE documents DROP COLUMN workflow_id;
ALTER TABLE documents RENAME COLUMN workflow_id_new TO workflow_id;
ALTER TABLE documents ALTER COLUMN workflow_id SET NOT NULL;

-- Update sla_tracking table (only where workflow_id is not null)
ALTER TABLE sla_tracking ADD COLUMN workflow_id_new TEXT;
UPDATE sla_tracking SET workflow_id_new = (
    SELECT new_id FROM workflow_id_mapping WHERE old_id = sla_tracking.workflow_id
) WHERE workflow_id IS NOT NULL;
ALTER TABLE sla_tracking DROP COLUMN workflow_id;
ALTER TABLE sla_tracking RENAME COLUMN workflow_id_new TO workflow_id;

-- Update costs table
ALTER TABLE costs ADD COLUMN workflow_id_new TEXT;
UPDATE costs SET workflow_id_new = (
    SELECT new_id FROM workflow_id_mapping WHERE old_id = costs.workflow_id
);
ALTER TABLE costs DROP COLUMN workflow_id;
ALTER TABLE costs RENAME COLUMN workflow_id_new TO workflow_id;
ALTER TABLE costs ALTER COLUMN workflow_id SET NOT NULL;

-- Update invoices table
ALTER TABLE invoices ADD COLUMN workflow_id_new TEXT;
UPDATE invoices SET workflow_id_new = (
    SELECT new_id FROM workflow_id_mapping WHERE old_id = invoices.workflow_id
) WHERE workflow_id IS NOT NULL;
ALTER TABLE invoices DROP COLUMN workflow_id;
ALTER TABLE invoices RENAME COLUMN workflow_id_new TO workflow_id;

-- Update audit_events table
ALTER TABLE audit_events ADD COLUMN workflow_id_new TEXT;
UPDATE audit_events SET workflow_id_new = (
    SELECT new_id FROM workflow_id_mapping WHERE old_id = audit_events.workflow_id
) WHERE workflow_id IS NOT NULL;
ALTER TABLE audit_events DROP COLUMN workflow_id;
ALTER TABLE audit_events RENAME COLUMN workflow_id_new TO workflow_id;

-- Update workflow_contacts table
ALTER TABLE workflow_contacts ADD COLUMN workflow_id_new TEXT;
UPDATE workflow_contacts SET workflow_id_new = (
    SELECT new_id FROM workflow_id_mapping WHERE old_id = workflow_contacts.workflow_id
);
ALTER TABLE workflow_contacts DROP COLUMN workflow_id;
ALTER TABLE workflow_contacts RENAME COLUMN workflow_id_new TO workflow_id;
ALTER TABLE workflow_contacts ALTER COLUMN workflow_id SET NOT NULL;

-- Update hil_notes table
ALTER TABLE hil_notes ADD COLUMN workflow_id_new TEXT;
UPDATE hil_notes SET workflow_id_new = (
    SELECT new_id FROM workflow_id_mapping WHERE old_id = hil_notes.workflow_id
);
ALTER TABLE hil_notes DROP COLUMN workflow_id;
ALTER TABLE hil_notes RENAME COLUMN workflow_id_new TO workflow_id;
ALTER TABLE hil_notes ALTER COLUMN workflow_id SET NOT NULL;

-- Drop old workflows table and rename new one
DROP TABLE workflows;
ALTER TABLE workflows_new RENAME TO workflows;

-- Recreate foreign key constraints with new string IDs
ALTER TABLE tasks ADD CONSTRAINT tasks_workflow_id_fkey 
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE;

ALTER TABLE communications ADD CONSTRAINT communications_workflow_id_fkey 
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE;

ALTER TABLE workflow_counterparties ADD CONSTRAINT workflow_counterparties_workflow_id_fkey 
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE;

ALTER TABLE documents ADD CONSTRAINT documents_workflow_id_fkey 
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE;

ALTER TABLE sla_tracking ADD CONSTRAINT sla_tracking_workflow_id_fkey 
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE;

ALTER TABLE costs ADD CONSTRAINT costs_workflow_id_fkey 
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE;

ALTER TABLE invoices ADD CONSTRAINT invoices_workflow_id_fkey 
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE SET NULL;

ALTER TABLE audit_events ADD CONSTRAINT audit_events_workflow_id_fkey 
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE SET NULL;

ALTER TABLE workflow_contacts ADD CONSTRAINT workflow_contacts_workflow_id_fkey 
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE;

ALTER TABLE hil_notes ADD CONSTRAINT hil_notes_workflow_id_fkey 
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE;

-- Enable RLS on new workflows table
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies for workflows
CREATE POLICY "Enable all access for authenticated users" ON workflows FOR ALL 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow anonymous read access to workflows" ON workflows FOR SELECT 
    USING (auth.role() = 'anon' OR auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY "Allow service role all access to workflows" ON workflows FOR ALL 
    USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- Recreate indexes
CREATE INDEX idx_workflows_client ON workflows(client_id);
CREATE INDEX idx_workflows_type ON workflows(workflow_type);
CREATE INDEX idx_workflows_status ON workflows(status);
CREATE INDEX idx_workflows_search ON workflows USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Recreate trigger
CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to auto-generate workflow IDs
CREATE OR REPLACE FUNCTION set_workflow_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.id IS NULL OR NEW.id = '' THEN
        NEW.id := generate_workflow_id(NEW.workflow_type);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_workflow_id_trigger
    BEFORE INSERT ON workflows
    FOR EACH ROW
    EXECUTE FUNCTION set_workflow_id();