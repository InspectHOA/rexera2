-- =====================================================
-- Rexera 2.0 Stateful Task Execution Schema
-- This is the definitive schema for the stateful task execution model.
-- It builds upon the simplified proposal and finalizes the structure.
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
CREATE TYPE workflow_status AS ENUM ('PENDING', 'IN_PROGRESS', 'AWAITING_REVIEW','BLOCKED', 'COMPLETED');
CREATE TYPE task_status AS ENUM ('PENDING', 'AWAITING_REVIEW', 'COMPLETED', 'FAILED');
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

-- Financial types
CREATE TYPE invoice_status AS ENUM ('DRAFT', 'FINALIZED', 'PAID', 'VOID');

-- Priority and notification types
CREATE TYPE priority_level AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
CREATE TYPE notification_type AS ENUM ('WORKFLOW_UPDATE', 'TASK_INTERRUPT', 'HIL_MENTION', 'CLIENT_MESSAGE_RECEIVED', 'COUNTERPARTY_MESSAGE_RECEIVED', 'SLA_WARNING', 'AGENT_FAILURE');
CREATE TYPE sender_type AS ENUM ('CLIENT', 'INTERNAL');

-- SLA and alert types
CREATE TYPE sla_tracking_status AS ENUM ('ACTIVE', 'COMPLETED', 'BREACHED', 'PAUSED');
CREATE TYPE alert_level AS ENUM ('GREEN', 'YELLOW', 'ORANGE', 'RED');

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

-- Workflows
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    human_readable_id TEXT,
    workflow_type workflow_type NOT NULL,
    client_id UUID NOT NULL REFERENCES clients(id),
    title TEXT NOT NULL,
    description TEXT,
    status workflow_status NOT NULL DEFAULT 'PENDING',
    priority priority_level NOT NULL DEFAULT 'NORMAL',
    metadata JSONB NOT NULL DEFAULT '{}',
    created_by UUID REFERENCES user_profiles(id),
    assigned_to UUID REFERENCES user_profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    due_date TIMESTAMPTZ
);

-- Task Executions (Functioning as complete task definitions)
CREATE TABLE task_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id), -- Can be null if executed by HIL or system
    title TEXT NOT NULL,
    description TEXT,
    sequence_order INTEGER NOT NULL, -- Defines the order of the task in the workflow
    task_type TEXT NOT NULL, -- The stable identifier from the workflow definition
    status task_status NOT NULL DEFAULT 'PENDING',
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
        communication_type IN ('email', 'phone', 'sms', 'internal_note')
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
-- 8. SLA MANAGEMENT
-- =====================================================

-- SLA Definitions
CREATE TABLE sla_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_type workflow_type NOT NULL,
    task_type TEXT, -- Now references task_executions.task_type
    client_id UUID REFERENCES clients(id),
    hours_to_complete INTEGER NOT NULL,
    alert_hours_before INTEGER[] NOT NULL DEFAULT '{}',
    is_business_hours_only BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT check_positive_hours CHECK (hours_to_complete > 0)
);

-- SLA Tracking
CREATE TABLE sla_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    task_execution_id UUID REFERENCES task_executions(id) ON DELETE CASCADE,
    sla_definition_id UUID NOT NULL REFERENCES sla_definitions(id),
    start_time TIMESTAMPTZ NOT NULL,
    due_time TIMESTAMPTZ NOT NULL,
    completed_time TIMESTAMPTZ,
    status sla_tracking_status NOT NULL DEFAULT 'ACTIVE',
    alert_level alert_level NOT NULL DEFAULT 'GREEN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT check_sla_target CHECK (
        (workflow_id IS NOT NULL AND task_execution_id IS NULL) OR
        (workflow_id IS NULL AND task_execution_id IS NOT NULL)
    )
);

-- SLA Alerts
CREATE TABLE sla_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sla_tracking_id UUID NOT NULL REFERENCES sla_tracking(id) ON DELETE CASCADE,
    alert_level alert_level NOT NULL,
    message TEXT NOT NULL,
    notified_users UUID[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- =====================================================
-- 9. FINANCIAL TRACKING
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
-- 10. AUDIT SYSTEM
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
-- 11. ENHANCED FEATURES
-- =====================================================

-- Contact Labels
CREATE TABLE contact_labels (
    label TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    description TEXT,
    workflow_types TEXT[] DEFAULT '{}',
    is_required BOOLEAN DEFAULT FALSE,
    default_notifications JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workflow Contacts
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
    
    CONSTRAINT check_notification_method CHECK (
        notification_method IN ('email', 'sms', 'both', 'none')
    )
);

-- HIL Notes
CREATE TABLE hil_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES user_profiles(id),
    content TEXT NOT NULL,
    priority priority_level NOT NULL DEFAULT 'NORMAL',
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    parent_note_id UUID REFERENCES hil_notes(id),
    mentions UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- HIL Notifications
CREATE TABLE hil_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id),
    type notification_type NOT NULL,
    priority priority_level NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    metadata JSONB,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User Preferences
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
-- 12. INDEXES FOR PERFORMANCE
-- =====================================================

-- Core indexes
CREATE INDEX idx_user_profiles_user_type ON user_profiles(user_type);
CREATE INDEX idx_user_profiles_company ON user_profiles(company_id);
CREATE INDEX idx_workflows_client ON workflows(client_id);
CREATE INDEX idx_workflows_type ON workflows(workflow_type);
CREATE INDEX idx_workflows_status ON workflows(status);
CREATE INDEX idx_task_executions_workflow ON task_executions(workflow_id);
CREATE INDEX idx_task_executions_status ON task_executions(status);
CREATE INDEX idx_task_executions_executor_type ON task_executions(executor_type);
CREATE INDEX idx_task_executions_agent ON task_executions(agent_id);
CREATE INDEX idx_communications_workflow ON communications(workflow_id);
CREATE INDEX idx_communications_type ON communications(communication_type);
CREATE INDEX idx_counterparties_type ON counterparties(type);
CREATE INDEX idx_workflow_counterparties_workflow ON workflow_counterparties(workflow_id);
CREATE INDEX idx_documents_workflow ON documents(workflow_id);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_sla_tracking_workflow ON sla_tracking(workflow_id);
CREATE INDEX idx_sla_tracking_status ON sla_tracking(status);
CREATE INDEX idx_costs_workflow ON costs(workflow_id);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_audit_events_workflow ON audit_events(workflow_id);
CREATE INDEX idx_audit_events_created_at ON audit_events(created_at DESC);
CREATE INDEX idx_workflow_contacts_workflow ON workflow_contacts(workflow_id);
CREATE INDEX idx_hil_notes_workflow ON hil_notes(workflow_id);
CREATE INDEX idx_hil_notes_author ON hil_notes(author_id);
CREATE INDEX idx_hil_notifications_user ON hil_notifications(user_id);

-- Full-text search indexes
CREATE INDEX idx_workflows_search ON workflows USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));
CREATE INDEX idx_task_executions_search ON task_executions USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- =====================================================
-- 13. ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE counterparties ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_counterparties ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hil_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hil_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (Allow all for now - can be refined later)
CREATE POLICY "Enable all access for authenticated users" ON clients FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON user_profiles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON workflows FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON task_executions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON agents FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON agent_performance_metrics FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON communications FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON email_metadata FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON phone_metadata FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON counterparties FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON workflow_counterparties FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON documents FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON sla_definitions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON sla_tracking FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON sla_alerts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON costs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON invoices FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON audit_events FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON contact_labels FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON workflow_contacts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON hil_notes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON hil_notifications FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON user_preferences FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- 14. TRIGGERS
-- =====================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
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
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sla_definitions_updated_at BEFORE UPDATE ON sla_definitions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sla_tracking_updated_at BEFORE UPDATE ON sla_tracking 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflow_contacts_updated_at BEFORE UPDATE ON workflow_contacts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hil_notes_updated_at BEFORE UPDATE ON hil_notes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();