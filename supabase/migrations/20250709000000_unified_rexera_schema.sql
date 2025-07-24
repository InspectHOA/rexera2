-- =====================================================
-- Rexera 2.0 Unified Database Schema
-- Combined migration including all features:
-- - Stateful task execution model
-- - Simple SLA tracking 
-- - Notification read tracking
-- - Simplified workflow identifiers
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- =====================================================
-- 1. ENUMERATED TYPES
-- =====================================================

-- User and role types
CREATE TYPE user_type AS ENUM ('client_user', 'hil_user');

-- Workflow and task execution types
CREATE TYPE workflow_type AS ENUM ('MUNI_LIEN_SEARCH', 'HOA_ACQUISITION', 'PAYOFF_REQUEST');
CREATE TYPE workflow_status AS ENUM ('NOT_STARTED', 'IN_PROGRESS','BLOCKED', 'WAITING_FOR_CLIENT', 'COMPLETED');
CREATE TYPE task_status AS ENUM ('NOT_STARTED', 'IN_PROGRESS',  'INTERRUPT', 'COMPLETED', 'FAILED');
CREATE TYPE executor_type AS ENUM ('AI', 'HIL');
CREATE TYPE sla_status AS ENUM ('ON_TIME', 'AT_RISK', 'BREACHED');
CREATE TYPE interrupt_type AS ENUM ('MISSING_DOCUMENT', 'PAYMENT_REQUIRED', 'CLIENT_CLARIFICATION', 'MANUAL_VERIFICATION');

-- Communication types
CREATE TYPE email_direction AS ENUM ('INBOUND', 'OUTBOUND');
CREATE TYPE email_status AS ENUM ('SENT', 'DELIVERED', 'READ', 'BOUNCED', 'FAILED');
CREATE TYPE thread_status AS ENUM ('ACTIVE', 'RESOLVED', 'ARCHIVED');
CREATE TYPE call_direction AS ENUM ('INBOUND', 'OUTBOUND');

-- Counterparty types
CREATE TYPE counterparty_type AS ENUM ('hoa', 'lender', 'municipality', 'utility', 'tax_authority');
CREATE TYPE workflow_counterparty_status AS ENUM ('PENDING', 'CONTACTED', 'RESPONDED', 'COMPLETED');

-- Counterparty contact role types
CREATE TYPE counterparty_contact_role AS ENUM (
    'primary',           -- Main contact
    'billing',           -- Billing/accounting contact
    'legal',             -- Legal representative
    'operations',        -- Day-to-day operations
    'board_member',      -- HOA board member
    'property_manager',  -- HOA property manager
    'loan_processor',    -- Lender loan processor
    'underwriter',       -- Lender underwriter
    'escrow_officer',    -- Title/escrow officer
    'clerk',             -- Municipal clerk
    'assessor',          -- Tax assessor
    'collector',         -- Tax collector
    'customer_service',  -- Utility customer service
    'technical',         -- Technical/IT contact
    'other'              -- Custom role
);

-- Financial types
CREATE TYPE invoice_status AS ENUM ('DRAFT', 'FINALIZED', 'PAID', 'VOID');

-- Priority and notification types
CREATE TYPE priority_level AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
CREATE TYPE notification_type AS ENUM ('WORKFLOW_UPDATE', 'TASK_INTERRUPT', 'HIL_MENTION', 'CLIENT_MESSAGE_RECEIVED', 'COUNTERPARTY_MESSAGE_RECEIVED', 'SLA_WARNING', 'AGENT_FAILURE');
CREATE TYPE sender_type AS ENUM ('CLIENT', 'INTERNAL');

-- =====================================================
-- 2. CORE USER AND CLIENT MANAGEMENT
-- =====================================================

-- Client companies
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    domain TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User profiles
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    user_type user_type NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL,
    company_id UUID REFERENCES clients(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT check_client_has_company CHECK (
        (user_type = 'client_user' AND company_id IS NOT NULL) OR
        (user_type = 'hil_user' AND company_id IS NULL)
    ),
    
    CONSTRAINT check_valid_role CHECK (
        role IN ('HIL', 'HIL_ADMIN', 'REQUESTOR', 'CLIENT_ADMIN')
    )
);

-- Create a development user in auth.users for SKIP_AUTH mode
-- This maintains referential integrity while supporting development
INSERT INTO auth.users (
    id,
    email,
    created_at,
    updated_at,
    email_confirmed_at,
    role
) VALUES (
    '284219ff-3a1f-4e86-9ea4-3536f940451f',
    'admin@rexera.com',
    NOW(),
    NOW(),
    NOW(),
    'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 3. AI AGENTS
-- =====================================================

-- Agents
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    description TEXT,
    capabilities TEXT[] NOT NULL DEFAULT '{}',
    api_endpoint TEXT,
    configuration JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 4. WORKFLOW AND TASK EXECUTION MANAGEMENT
-- =====================================================

-- Workflows (simplified - no human_readable_id)
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_type workflow_type NOT NULL,
    client_id UUID NOT NULL REFERENCES clients(id),
    title TEXT NOT NULL,
    description TEXT,
    status workflow_status NOT NULL DEFAULT 'NOT_STARTED',
    priority priority_level NOT NULL DEFAULT 'NORMAL',
    metadata JSONB NOT NULL DEFAULT '{}',
    created_by UUID REFERENCES user_profiles(id),
    assigned_to UUID REFERENCES user_profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    -- n8n Integration Tracking
    n8n_execution_id TEXT,
    n8n_started_at TIMESTAMPTZ,
    n8n_status TEXT DEFAULT 'not_started',
    
    -- Constraints
    CONSTRAINT check_n8n_status CHECK (n8n_status IN ('not_started', 'running', 'success', 'error', 'canceled', 'crashed', 'waiting'))
);

-- Task Executions with integrated SLA tracking and read tracking
CREATE TABLE task_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id), -- Can be null if executed by HIL or system
    title TEXT NOT NULL,
    description TEXT,
    sequence_order INTEGER NOT NULL, -- Defines the order of the task in the workflow
    task_type TEXT NOT NULL, -- The stable identifier from the workflow definition
    status task_status NOT NULL DEFAULT 'NOT_STARTED',
    interrupt_type interrupt_type,
    executor_type executor_type NOT NULL,
    priority priority_level NOT NULL DEFAULT 'NORMAL',
    input_data JSONB NOT NULL DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    execution_time_ms INTEGER,
    retry_count INTEGER NOT NULL DEFAULT 0,
    -- Simple SLA tracking fields
    sla_hours INTEGER DEFAULT 24,           -- How many hours this task should take
    sla_due_at TIMESTAMPTZ,                 -- When this task is due (calculated: started_at + sla_hours)
    sla_status TEXT DEFAULT 'ON_TIME',      -- Current SLA status: 'ON_TIME', 'AT_RISK', 'BREACHED'
    -- Notification read tracking
    read_by_users JSONB DEFAULT '{}',       -- JSON object tracking which users have read this task notification
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT check_sla_status CHECK (sla_status IN ('ON_TIME', 'AT_RISK', 'BREACHED')),
    CONSTRAINT check_positive_sla_hours CHECK (sla_hours > 0)
);

-- Agent Performance Metrics
CREATE TABLE agent_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents(id),
    metric_type TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    measurement_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(agent_id, metric_type, measurement_date)
);

-- =====================================================
-- 5. COMMUNICATION SYSTEM
-- =====================================================

-- Communications
CREATE TABLE communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    thread_id UUID,
    sender_id UUID REFERENCES user_profiles(id),
    recipient_email TEXT,
    subject TEXT,
    body TEXT,
    communication_type TEXT NOT NULL,
    direction email_direction,
    status email_status,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT check_communication_type CHECK (
        communication_type IN ('email', 'phone', 'sms', 'client_chat')
    )
);

-- Email Metadata
CREATE TABLE email_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    communication_id UUID NOT NULL REFERENCES communications(id) ON DELETE CASCADE,
    message_id TEXT,
    in_reply_to TEXT,
    email_references TEXT[],
    attachments JSONB DEFAULT '[]',
    headers JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(communication_id)
);

-- Phone Metadata
CREATE TABLE phone_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    communication_id UUID NOT NULL REFERENCES communications(id) ON DELETE CASCADE,
    phone_number TEXT,
    duration_seconds INTEGER,
    call_recording_url TEXT,
    transcript TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(communication_id)
);

-- =====================================================
-- 6. COUNTERPARTIES
-- =====================================================

-- Counterparties
CREATE TABLE counterparties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type counterparty_type NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    contact_info JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workflow Counterparties 
CREATE TABLE workflow_counterparties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    counterparty_id UUID NOT NULL REFERENCES counterparties(id),
    status workflow_counterparty_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(workflow_id, counterparty_id)
);

-- Counterparty Contacts
CREATE TABLE counterparty_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    counterparty_id UUID NOT NULL REFERENCES counterparties(id) ON DELETE CASCADE,
    role counterparty_contact_role NOT NULL,
    name TEXT NOT NULL,
    title TEXT,                    -- Job title (e.g., "Senior Loan Officer", "Board President")
    department TEXT,               -- Department or division
    email TEXT,
    phone TEXT,
    mobile_phone TEXT,
    fax TEXT,
    extension TEXT,                -- Phone extension
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    preferred_contact_method TEXT DEFAULT 'email',
    preferred_contact_time TEXT,   -- e.g., "9AM-5PM EST", "Weekdays only"
    notes TEXT,                    -- Additional notes about this contact
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT check_preferred_contact_method CHECK (
        preferred_contact_method IN ('email', 'phone', 'mobile', 'fax', 'any')
    ),
    CONSTRAINT check_at_least_one_contact_method CHECK (
        email IS NOT NULL OR phone IS NOT NULL OR mobile_phone IS NOT NULL
    ),
    -- Only one primary contact per counterparty
    CONSTRAINT unique_primary_contact_per_counterparty 
        EXCLUDE (counterparty_id WITH =) WHERE (is_primary = TRUE)
);

-- =====================================================
-- 7. DOCUMENTS
-- =====================================================

-- Documents
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    url TEXT NOT NULL,
    file_size_bytes BIGINT,
    mime_type TEXT,
    document_type TEXT NOT NULL DEFAULT 'WORKING',
    tags TEXT[] DEFAULT '{}',
    upload_source TEXT,
    status TEXT DEFAULT 'PENDING',
    metadata JSONB DEFAULT '{}',
    deliverable_data JSONB DEFAULT '{}',
    version INTEGER DEFAULT 1,
    change_summary TEXT,
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 8. FINANCIAL TRACKING
-- =====================================================

-- Costs
CREATE TABLE costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    cost_type TEXT NOT NULL,
    incurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Invoices
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id),
    workflow_id UUID REFERENCES workflows(id),
    invoice_number TEXT NOT NULL UNIQUE,
    status invoice_status NOT NULL DEFAULT 'DRAFT',
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 9. AUDIT SYSTEM
-- =====================================================

-- Audit Events
CREATE TABLE audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_type TEXT NOT NULL,
    actor_id TEXT NOT NULL,
    actor_name TEXT,
    event_type TEXT NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL, -- e.g., 'workflow', 'task_execution'
    resource_id UUID NOT NULL,
    workflow_id UUID REFERENCES workflows(id),
    client_id UUID REFERENCES clients(id),
    event_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT check_actor_type CHECK (actor_type IN ('human', 'agent', 'system')),
    CONSTRAINT check_action CHECK (action IN ('create', 'read', 'update', 'delete', 'execute', 'approve', 'reject', 'login', 'logout'))
);

-- =====================================================
-- 10. WORKFLOW CONTACT MANAGEMENT
-- Defines standardized labels for contacts and links them to specific workflows.
-- =====================================================

-- Defines a list of standardized roles for contacts (e.g., 'borrower', 'escrow_officer').
CREATE TABLE contact_labels (
    label TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    description TEXT,
    workflow_types TEXT[] DEFAULT '{}', -- Restricts which workflows can use this label.
    is_required BOOLEAN DEFAULT FALSE, -- If true, a contact with this label must exist for the workflow.
    default_notifications JSONB DEFAULT '{}', -- Default notification settings for this role.
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stores contact information for individuals related to a workflow (e.g., borrower, escrow officer).
CREATE TABLE workflow_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    role TEXT,
    notify_on_status_change BOOLEAN DEFAULT FALSE,
    notify_on_completion BOOLEAN DEFAULT FALSE,
    notify_on_issues BOOLEAN DEFAULT FALSE,
    notify_on_documents BOOLEAN DEFAULT FALSE,
    notification_method TEXT DEFAULT 'email',
    is_primary BOOLEAN DEFAULT FALSE,
    notes TEXT,
    preferred_contact_time TEXT,
    timezone TEXT DEFAULT 'America/New_York',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_contact_label FOREIGN KEY (label) REFERENCES contact_labels(label),
    CONSTRAINT check_notification_method CHECK (
        notification_method IN ('email', 'sms', 'both', 'none')
    )
);

-- =====================================================
-- 11. HIL (HUMAN-IN-THE-LOOP) SUPPORT
-- Tables for managing notes and notifications for human agents.
-- =====================================================

-- Allows HIL users to add notes, mention others, and track resolution status.
CREATE TABLE hil_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES user_profiles(id),
    content TEXT NOT NULL,
    priority priority_level NOT NULL DEFAULT 'NORMAL',
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    parent_note_id UUID REFERENCES hil_notes(id), -- For threading notes.
    mentions UUID[] DEFAULT '{}', -- Stores UUIDs of mentioned users.
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stores notifications for HIL users regarding important events.
CREATE TABLE hil_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id),
    type notification_type NOT NULL,
    priority priority_level NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT, -- A URL for the user to take action.
    metadata JSONB,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 12. USER CUSTOMIZATION
-- Stores user-specific preferences for UI and notifications.
-- =====================================================

-- Allows users to customize their experience (e.g., theme, language).
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) UNIQUE,
    theme TEXT DEFAULT 'SYSTEM',
    language TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'UTC',
    notification_settings JSONB DEFAULT '{"email_enabled": true, "in_app_enabled": true}',
    ui_settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 13. INDEXES FOR PERFORMANCE
-- =====================================================

-- Core indexes
CREATE INDEX idx_user_profiles_user_type ON user_profiles(user_type);
CREATE INDEX idx_user_profiles_company ON user_profiles(company_id);
CREATE INDEX idx_workflows_client ON workflows(client_id);
CREATE INDEX idx_workflows_type ON workflows(workflow_type);
CREATE INDEX idx_workflows_status ON workflows(status);
CREATE INDEX idx_workflows_n8n_execution ON workflows(n8n_execution_id);
CREATE INDEX idx_workflows_n8n_status ON workflows(n8n_status);
CREATE INDEX idx_task_executions_workflow ON task_executions(workflow_id);
CREATE INDEX idx_task_executions_status ON task_executions(status);
CREATE INDEX idx_task_executions_executor_type ON task_executions(executor_type);
CREATE INDEX idx_task_executions_agent ON task_executions(agent_id);
CREATE INDEX idx_communications_workflow ON communications(workflow_id);
CREATE INDEX idx_communications_type ON communications(communication_type);
CREATE INDEX idx_counterparties_type ON counterparties(type);
CREATE INDEX idx_workflow_counterparties_workflow ON workflow_counterparties(workflow_id);
CREATE INDEX idx_counterparty_contacts_counterparty ON counterparty_contacts(counterparty_id);
CREATE INDEX idx_counterparty_contacts_role ON counterparty_contacts(role);
CREATE INDEX idx_counterparty_contacts_primary ON counterparty_contacts(counterparty_id, is_primary) WHERE is_primary = TRUE;
CREATE INDEX idx_counterparty_contacts_active ON counterparty_contacts(counterparty_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_documents_workflow ON documents(workflow_id);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_costs_workflow ON costs(workflow_id);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_audit_events_workflow ON audit_events(workflow_id);
CREATE INDEX idx_audit_events_created_at ON audit_events(created_at DESC);
CREATE INDEX idx_workflow_contacts_workflow ON workflow_contacts(workflow_id);
CREATE INDEX idx_hil_notes_workflow ON hil_notes(workflow_id);
CREATE INDEX idx_hil_notes_author ON hil_notes(author_id);
CREATE INDEX idx_hil_notifications_user ON hil_notifications(user_id);

-- SLA monitoring index
CREATE INDEX idx_task_executions_sla_monitoring 
ON task_executions (sla_due_at, sla_status, status) 
WHERE status != 'COMPLETED';

-- Notification read tracking index
CREATE INDEX idx_task_executions_read_by_users ON task_executions USING GIN (read_by_users);

-- Full-text search indexes
CREATE INDEX idx_workflows_search ON workflows USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));
CREATE INDEX idx_task_executions_search ON task_executions USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- =====================================================
-- 14. ROW LEVEL SECURITY
-- =====================================================

-- RLS will be enabled after seeding
-- Tables are created without RLS to allow initial seeding

-- RLS policies will be added in a separate migration after seeding
-- For now, tables are open for seeding

-- =====================================================
-- 15. TRIGGERS AND FUNCTIONS
-- =====================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- SLA due date calculation function
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

-- Apply timestamp triggers to tables with updated_at columns
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_communications_updated_at BEFORE UPDATE ON communications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_counterparties_updated_at BEFORE UPDATE ON counterparties 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflow_counterparties_updated_at BEFORE UPDATE ON workflow_counterparties 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_counterparty_contacts_updated_at BEFORE UPDATE ON counterparty_contacts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflow_contacts_updated_at BEFORE UPDATE ON workflow_contacts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hil_notes_updated_at BEFORE UPDATE ON hil_notes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply SLA trigger to task_executions
CREATE TRIGGER trigger_update_sla_due_at
    BEFORE UPDATE ON task_executions
    FOR EACH ROW
    EXECUTE FUNCTION update_sla_due_at();

-- =====================================================
-- 16. VIEWS FOR CONVENIENCE
-- =====================================================

-- SLA monitoring view
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

-- =====================================================
-- 17. COMMENTS
-- =====================================================

-- Table comments
COMMENT ON TABLE workflows IS 'Workflows table uses UUID primary key only. Human-readable formatting is handled in application layer.';
COMMENT ON TABLE counterparty_contacts IS 'Stores multiple contacts for each counterparty with role-based organization (e.g., board members, loan processors, clerks)';
COMMENT ON TYPE counterparty_contact_role IS 'Predefined contact roles specific to different counterparty types (HOA board members, lender processors, municipal clerks, etc.)';
COMMENT ON COLUMN counterparty_contacts.is_primary IS 'Designates the primary contact for this counterparty. Only one primary contact allowed per counterparty.';
COMMENT ON COLUMN counterparty_contacts.preferred_contact_time IS 'Free-form text for contact preferences (e.g., "9AM-5PM EST", "Weekdays only", "After 2PM")';

-- Enum type comments
COMMENT ON TYPE workflow_type IS 'Workflow types: MUNI_LIEN_SEARCH (municipal lien searches), HOA_ACQUISITION (HOA document requests), PAYOFF_REQUEST (mortgage payoff requests)';

-- n8n Integration Comments
COMMENT ON COLUMN workflows.n8n_execution_id IS 'n8n Cloud execution ID for correlation and monitoring';
COMMENT ON COLUMN workflows.n8n_started_at IS 'Timestamp when n8n workflow execution was triggered';
COMMENT ON COLUMN workflows.n8n_status IS 'Current n8n execution status: not_started, running, success, error, canceled, crashed, waiting';
COMMENT ON VIEW task_sla_status IS 'Convenient view for monitoring SLA status with calculated time remaining and percentage elapsed';

-- SLA field comments
COMMENT ON COLUMN task_executions.sla_hours IS 'Hours allocated for this task (default 24). Can be customized per task type or individual task.';
COMMENT ON COLUMN task_executions.sla_due_at IS 'Calculated deadline for this task (started_at + sla_hours). Auto-populated when task starts.';
COMMENT ON COLUMN task_executions.sla_status IS 'Current SLA status: ON_TIME (before due), AT_RISK (approaching due), BREACHED (past due)';

-- Read tracking comment
COMMENT ON COLUMN task_executions.read_by_users IS 'JSON object tracking which users have read this task notification. Format: {"user_id": "timestamp"}';