-- =====================================================
-- Rexera 2.0 PostgreSQL Schema
-- Complete database schema for AI-powered real estate workflow automation
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

-- Workflow and task types
CREATE TYPE workflow_type AS ENUM ('MUNI_LIEN_SEARCH', 'HOA_ACQUISITION', 'PAYOFF');
CREATE TYPE workflow_status AS ENUM ('PENDING', 'IN_PROGRESS', 'AWAITING_REVIEW','BLOCKED', 'COMPLETED');
CREATE TYPE task_status AS ENUM ('PENDING', 'AWAITING_REVIEW', 'COMPLETED', 'FAILED');
CREATE TYPE executor_type AS ENUM ('AI', 'HIL');
CREATE TYPE sla_status AS ENUM ('ON_TIME', 'AT_RISK', 'BREACHED');

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

-- Client companies - Stores information about client organizations that use the platform
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    domain TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User profiles with role information (from Supabase Auth integration)
-- Single source of truth for all users - both HIL (Human-in-Loop) staff and client users
-- Links to Supabase auth.users table for authentication, adds business logic fields
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    user_type user_type NOT NULL, -- 'client_user' or 'hil_user'
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL, -- 'HIL', 'ADMIN', 'REQUESTOR'
    company_id UUID REFERENCES clients(id), -- NULL for HIL users, required for client users
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure client users have a company and HIL users don't
    CONSTRAINT check_client_has_company CHECK (
        (user_type = 'client_user' AND company_id IS NOT NULL) OR
        (user_type = 'hil_user' AND company_id IS NULL)
    ),
    
    -- Ensure role values are valid
    CONSTRAINT check_valid_role CHECK (
        role IN ('HIL', 'HIL_ADMIN', 'REQUESTOR', 'CLIENT_ADMIN')
    )
);

-- =====================================================
-- 3. WORKFLOW AND TASK MANAGEMENT
-- =====================================================

-- Workflows - Core workflow tracking table
-- Represents complete business processes like "Municipal Lien Search" or "HOA Acquisition"
-- Tracks workflow-level status, SLA compliance, and business metadata
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_type workflow_type NOT NULL,
    client_id UUID NOT NULL REFERENCES clients(id),
    title TEXT NOT NULL,
    description TEXT,
    status workflow_status NOT NULL DEFAULT 'PENDING',
    priority priority_level NOT NULL DEFAULT 'NORMAL',
    metadata JSONB NOT NULL DEFAULT '{}', -- Workflow-specific data (property info, loan details, etc.)
    created_by UUID NOT NULL REFERENCES user_profiles(id),
    assigned_to UUID REFERENCES user_profiles(id), -- Primary HIL operator
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    due_date TIMESTAMPTZ
);

-- Tasks - Individual work items within workflows
-- Each task represents a specific action to be performed by an AI agent or HIL operator
-- Tasks can have dependencies and are tracked for performance and SLA compliance
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status task_status NOT NULL DEFAULT 'PENDING',
    executor_type executor_type NOT NULL,
    assigned_to UUID REFERENCES user_profiles(id), -- For HIL tasks
    priority priority_level NOT NULL DEFAULT 'NORMAL',
    metadata JSONB NOT NULL DEFAULT '{}', -- Task-specific configuration and data
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    
    -- Ensure HIL tasks are assigned to HIL users
    CONSTRAINT check_hil_assignment CHECK (
        (executor_type = 'AI' AND assigned_to IS NULL) OR
        (executor_type = 'HIL' AND assigned_to IS NOT NULL AND
         EXISTS (SELECT 1 FROM user_profiles WHERE id = assigned_to AND user_type = 'hil_user'))
    )
);

-- Task Dependencies - Defines execution order and data flow between tasks
-- Supports complex workflow coordination with conditional dependencies
CREATE TABLE task_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dependent_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    prerequisite_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure no self-dependencies
    CONSTRAINT check_no_self_dependency CHECK (dependent_task_id != prerequisite_task_id),
    
    -- Ensure no duplicate dependencies
    UNIQUE(dependent_task_id, prerequisite_task_id)
);

-- Task Executions - Detailed execution tracking for action-based task operations
-- Tracks specific attempts to execute tasks, including retries and partial results
CREATE TABLE task_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    executor_id UUID REFERENCES user_profiles(id), -- Who executed this (HIL user or system)
    execution_data JSONB NOT NULL DEFAULT '{}', -- Input data and parameters for execution
    result_data JSONB DEFAULT '{}', -- Output data and results from execution
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status task_status NOT NULL DEFAULT 'PENDING'
);

-- =====================================================
-- 4. COUNTERPARTY MANAGEMENT
-- =====================================================

-- Counterparties - External organizations we interact with
-- Includes HOAs, lenders, municipalities, utilities, and tax authorities
CREATE TABLE counterparties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type counterparty_type NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    contact_info JSONB NOT NULL DEFAULT '{}', -- Additional contact details and metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Create index for efficient searching
    UNIQUE(name, type)
);

-- Workflow Counterparties - Links specific workflows to the counterparties they interact with
-- Tracks the status of each counterparty relationship (contacted, responded, completed, etc.)
CREATE TABLE workflow_counterparties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    counterparty_id UUID NOT NULL REFERENCES counterparties(id) ON DELETE CASCADE,
    role TEXT NOT NULL, -- 'primary_hoa', 'management_company', 'lender', etc.
    status workflow_counterparty_status NOT NULL DEFAULT 'PENDING',
    contact_priority INTEGER NOT NULL DEFAULT 1, -- Order of contact preference
    last_contacted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(workflow_id, counterparty_id)
);

-- =====================================================
-- 5. COMMUNICATION SYSTEM
-- =====================================================

-- Communications - Core unified table for all communication types
-- Consolidates emails, messages, calls into a single system with threading support
CREATE TABLE communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    thread_id UUID, -- Self-referencing for threading
    sender_id UUID REFERENCES user_profiles(id),
    recipient_email TEXT,
    subject TEXT,
    body TEXT,
    communication_type TEXT NOT NULL, -- 'email', 'phone', 'sms', 'internal_note'
    direction email_direction,
    status email_status,
    metadata JSONB NOT NULL DEFAULT '{}', -- Type-specific data and headers
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure valid communication types
    CONSTRAINT check_communication_type CHECK (
        communication_type IN ('email', 'phone', 'sms', 'internal_note')
    )
);

-- Email Metadata - Email-specific information for better threading and tracking
CREATE TABLE email_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    communication_id UUID NOT NULL REFERENCES communications(id) ON DELETE CASCADE,
    message_id TEXT, -- RFC 2822 Message-ID header
    in_reply_to TEXT, -- RFC 2822 In-Reply-To header for threading
    email_references TEXT[], -- RFC 2822 References header (renamed to avoid keyword conflict)
    attachments JSONB DEFAULT '[]', -- Array of attachment objects
    headers JSONB DEFAULT '{}', -- Full email headers
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(communication_id)
);

-- Phone Metadata - Call-specific information
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

-- Threads - Conversation threading for communications
CREATE TABLE threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    subject TEXT,
    status thread_status NOT NULL DEFAULT 'ACTIVE',
    participant_emails TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 6. DOCUMENT MANAGEMENT
-- =====================================================

-- Documents - File and document tracking with versioning and tagging
-- Supports both input documents and workflow deliverables
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL, -- Storage path or URL
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    document_type TEXT, -- 'hoa_docs', 'lien_report', 'payoff_letter', etc.
    tags TEXT[] NOT NULL DEFAULT '{}',
    metadata JSONB NOT NULL DEFAULT '{}', -- File-specific metadata
    deliverable_data JSONB, -- Workflow deliverable information if applicable
    version INTEGER NOT NULL DEFAULT 1,
    uploaded_by UUID NOT NULL REFERENCES user_profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure positive file size
    CONSTRAINT check_positive_file_size CHECK (file_size > 0),
    
    -- Ensure positive version
    CONSTRAINT check_positive_version CHECK (version > 0)
);

-- =====================================================
-- 7. AI AGENT SYSTEM
-- =====================================================

-- Agents - Configuration and metadata for AI agents
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE, -- 'nina', 'mia', 'florian', etc.
    type TEXT NOT NULL, -- Agent type identifier
    description TEXT,
    capabilities TEXT[] NOT NULL DEFAULT '{}',
    api_endpoint TEXT NOT NULL,
    configuration JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agent Executions - Tracking of AI agent task executions
CREATE TABLE agent_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents(id),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    execution_data JSONB NOT NULL DEFAULT '{}',
    result_data JSONB DEFAULT '{}',
    confidence_score NUMERIC(5,4), -- 0.0000 to 1.0000
    execution_time_ms INTEGER,
    cost_cents INTEGER,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status task_status NOT NULL DEFAULT 'PENDING'
);

-- Agent Performance Metrics - Performance tracking for agents
CREATE TABLE agent_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents(id),
    metric_type TEXT NOT NULL, -- 'avg_execution_time', 'success_rate', 'cost_per_task', etc.
    metric_value NUMERIC NOT NULL,
    measurement_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(agent_id, metric_type, measurement_date)
);

-- =====================================================
-- 8. SLA AND TRACKING SYSTEM
-- =====================================================

-- SLA Definitions - Service level agreement rules
CREATE TABLE sla_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_type workflow_type NOT NULL,
    task_type TEXT, -- NULL means applies to entire workflow
    client_id UUID REFERENCES clients(id), -- Client-specific SLA overrides
    hours_to_complete INTEGER NOT NULL,
    alert_hours_before INTEGER[] NOT NULL DEFAULT '{}',
    is_business_hours_only BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure positive hours
    CONSTRAINT check_positive_hours CHECK (hours_to_complete > 0)
);

-- SLA Tracking - Real-time SLA monitoring for workflows and tasks
CREATE TABLE sla_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    sla_definition_id UUID NOT NULL REFERENCES sla_definitions(id),
    start_time TIMESTAMPTZ NOT NULL,
    due_time TIMESTAMPTZ NOT NULL,
    completed_time TIMESTAMPTZ,
    status sla_tracking_status NOT NULL DEFAULT 'ACTIVE',
    alert_level alert_level NOT NULL DEFAULT 'GREEN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure either workflow_id or task_id is provided
    CONSTRAINT check_sla_target CHECK (
        (workflow_id IS NOT NULL AND task_id IS NULL) OR
        (workflow_id IS NULL AND task_id IS NOT NULL)
    )
);

-- SLA Alerts - Alerts generated when SLA thresholds are approached or breached
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
-- 9. HIL ASSIGNMENT AND INTERVENTION
-- =====================================================

-- HIL Assignments - Tasks requiring human intervention
CREATE TABLE hil_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    assigned_to UUID NOT NULL REFERENCES user_profiles(id),
    assignment_type TEXT NOT NULL, -- 'approval', 'review', 'intervention', 'escalation'
    priority priority_level NOT NULL DEFAULT 'NORMAL',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    
    -- Ensure either workflow_id or task_id is provided
    CONSTRAINT check_hil_target CHECK (
        (workflow_id IS NOT NULL AND task_id IS NULL) OR
        (workflow_id IS NULL AND task_id IS NOT NULL)
    ),
    
    -- Ensure assigned to HIL user
    CONSTRAINT check_hil_user CHECK (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = assigned_to AND user_type = 'hil_user')
    )
);

-- HIL Interventions - Record of human interventions in workflows
CREATE TABLE hil_interventions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    intervened_by UUID NOT NULL REFERENCES user_profiles(id),
    intervention_type TEXT NOT NULL,
    reason TEXT NOT NULL,
    action_taken TEXT NOT NULL,
    result TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure either workflow_id or task_id is provided
    CONSTRAINT check_intervention_target CHECK (
        (workflow_id IS NOT NULL AND task_id IS NULL) OR
        (workflow_id IS NULL AND task_id IS NOT NULL)
    )
);

-- =====================================================
-- 10. FINANCIAL TRACKING
-- =====================================================

-- Invoices - Client billing and invoice management
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE SET NULL,
    client_id UUID NOT NULL REFERENCES clients(id),
    invoice_number TEXT NOT NULL UNIQUE,
    status invoice_status NOT NULL DEFAULT 'DRAFT',
    line_items JSONB NOT NULL DEFAULT '[]',
    subtotal_cents INTEGER NOT NULL,
    tax_cents INTEGER NOT NULL DEFAULT 0,
    total_cents INTEGER NOT NULL,
    issued_date DATE NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure positive amounts
    CONSTRAINT check_positive_amounts CHECK (
        subtotal_cents >= 0 AND tax_cents >= 0 AND total_cents >= 0
    ),
    
    -- Ensure total calculation is correct
    CONSTRAINT check_total_calculation CHECK (
        total_cents = subtotal_cents + tax_cents
    )
);

-- Costs - Cost tracking for workflows, tasks, and agent executions
CREATE TABLE costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    agent_execution_id UUID REFERENCES agent_executions(id) ON DELETE CASCADE,
    cost_type TEXT NOT NULL, -- 'agent_execution', 'external_service', 'manual_labor', etc.
    amount_cents INTEGER NOT NULL,
    description TEXT,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure positive amount
    CONSTRAINT check_positive_cost CHECK (amount_cents >= 0)
);

-- =====================================================
-- 11. AUDIT AND LOGGING
-- =====================================================

-- Audit Events - Comprehensive audit trail for compliance and debugging
CREATE TABLE audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    user_id UUID REFERENCES user_profiles(id),
    workflow_id UUID REFERENCES workflows(id),
    task_id UUID REFERENCES tasks(id),
    resource_type TEXT NOT NULL,
    resource_id UUID NOT NULL,
    changes JSONB NOT NULL DEFAULT '{}',
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 12. PERFORMANCE INDEXES
-- =====================================================

-- Workflow indexes
CREATE INDEX idx_workflows_client_status ON workflows(client_id, status);
CREATE INDEX idx_workflows_type_status ON workflows(workflow_type, status);
CREATE INDEX idx_workflows_assigned_to ON workflows(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_workflows_created_at ON workflows(created_at);
CREATE INDEX idx_workflows_due_date ON workflows(due_date) WHERE due_date IS NOT NULL;

-- Task indexes
CREATE INDEX idx_tasks_workflow_id ON tasks(workflow_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_executor_type ON tasks(executor_type);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;

-- Communication indexes
CREATE INDEX idx_communications_workflow_id ON communications(workflow_id);
CREATE INDEX idx_communications_task_id ON communications(task_id);
CREATE INDEX idx_communications_thread_id ON communications(thread_id);
CREATE INDEX idx_communications_type ON communications(communication_type);
CREATE INDEX idx_communications_created_at ON communications(created_at);

-- Document indexes
CREATE INDEX idx_documents_workflow_id ON documents(workflow_id);
CREATE INDEX idx_documents_task_id ON documents(task_id);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_tags ON documents USING GIN(tags);
CREATE INDEX idx_documents_created_at ON documents(created_at);

-- Agent execution indexes
CREATE INDEX idx_agent_executions_agent_id ON agent_executions(agent_id);
CREATE INDEX idx_agent_executions_workflow_id ON agent_executions(workflow_id);
CREATE INDEX idx_agent_executions_task_id ON agent_executions(task_id);
CREATE INDEX idx_agent_executions_status ON agent_executions(status);
CREATE INDEX idx_agent_executions_started_at ON agent_executions(started_at);

-- SLA tracking indexes
CREATE INDEX idx_sla_tracking_workflow_id ON sla_tracking(workflow_id);
CREATE INDEX idx_sla_tracking_task_id ON sla_tracking(task_id);
CREATE INDEX idx_sla_tracking_status ON sla_tracking(status);
CREATE INDEX idx_sla_tracking_alert_level ON sla_tracking(alert_level);
CREATE INDEX idx_sla_tracking_due_time ON sla_tracking(due_time);

-- Audit event indexes
CREATE INDEX idx_audit_events_event_type ON audit_events(event_type);
CREATE INDEX idx_audit_events_user_id ON audit_events(user_id);
CREATE INDEX idx_audit_events_workflow_id ON audit_events(workflow_id);
CREATE INDEX idx_audit_events_resource ON audit_events(resource_type, resource_id);
CREATE INDEX idx_audit_events_created_at ON audit_events(created_at);

-- Full-text search indexes
CREATE INDEX idx_workflows_search ON workflows USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));
CREATE INDEX idx_tasks_search ON tasks USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));
CREATE INDEX idx_communications_search ON communications USING GIN(to_tsvector('english', COALESCE(subject, '') || ' ' || COALESCE(body, '')));

-- =====================================================
-- 13. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE counterparties ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_counterparties ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hil_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hil_interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- Client isolation policy - Users can only see data from their own client
CREATE POLICY client_isolation ON workflows
    USING (
        -- HIL users can see all workflows
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type = 'hil_user')
        OR
        -- Client users can only see their own client's workflows
        client_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid())
    );

-- Apply similar policies to other tables
CREATE POLICY client_isolation ON tasks
    USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type = 'hil_user')
        OR
        workflow_id IN (
            SELECT id FROM workflows 
            WHERE client_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid())
        )
    );

CREATE POLICY client_isolation ON communications
    USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type = 'hil_user')
        OR
        workflow_id IN (
            SELECT id FROM workflows 
            WHERE client_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid())
        )
    );

CREATE POLICY client_isolation ON documents
    USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type = 'hil_user')
        OR
        workflow_id IN (
            SELECT id FROM workflows 
            WHERE client_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid())
        )
    );

-- HIL-only policies for sensitive tables
CREATE POLICY hil_only ON agent_executions
    USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type = 'hil_user'));

CREATE POLICY hil_only ON hil_assignments
    USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type = 'hil_user'));

CREATE POLICY hil_only ON hil_interventions
    USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type = 'hil_user'));

CREATE POLICY hil_only ON costs
    USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type = 'hil_user'));

CREATE POLICY hil_only ON audit_events
    USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type = 'hil_user'));

-- Client financial data policy
CREATE POLICY client_financial ON invoices
    USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type = 'hil_user')
        OR
        client_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid())
    );

-- =====================================================
-- 14. UTILITY FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_communications_updated_at BEFORE UPDATE ON communications FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_counterparties_updated_at BEFORE UPDATE ON counterparties FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_workflow_counterparties_updated_at BEFORE UPDATE ON workflow_counterparties FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_sla_definitions_updated_at BEFORE UPDATE ON sla_definitions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_sla_tracking_updated_at BEFORE UPDATE ON sla_tracking FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_threads_updated_at BEFORE UPDATE ON threads FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Function to calculate business hours between two timestamps
CREATE OR REPLACE FUNCTION calculate_business_hours(start_time TIMESTAMPTZ, end_time TIMESTAMPTZ)
RETURNS INTERVAL AS $$
DECLARE
    iter_time TIMESTAMPTZ := start_time;
    business_hours INTERVAL := '0 hours';
    day_of_week INTEGER;
    hour_of_day INTEGER;
BEGIN
    WHILE iter_time < end_time LOOP
        day_of_week := EXTRACT(DOW FROM iter_time); -- 0=Sunday, 1=Monday, ..., 6=Saturday
        hour_of_day := EXTRACT(HOUR FROM iter_time);
        
        -- Check if it's a business day (Monday-Friday) and business hours (9 AM - 5 PM)
        IF day_of_week BETWEEN 1 AND 5 AND hour_of_day BETWEEN 9 AND 16 THEN
            business_hours := business_hours + '1 hour';
        END IF;
        
        iter_time := iter_time + '1 hour';
    END LOOP;
    
    RETURN business_hours;
END;
$$ LANGUAGE plpgsql;

-- Function to check if a timestamp is during business hours
CREATE OR REPLACE FUNCTION is_business_hours(check_time TIMESTAMPTZ)
RETURNS BOOLEAN AS $$
DECLARE
    day_of_week INTEGER;
    hour_of_day INTEGER;
BEGIN
    day_of_week := EXTRACT(DOW FROM check_time);
    hour_of_day := EXTRACT(HOUR FROM check_time);
    
    RETURN day_of_week BETWEEN 1 AND 5 AND hour_of_day BETWEEN 9 AND 16;
END;
$$ LANGUAGE plpgsql;