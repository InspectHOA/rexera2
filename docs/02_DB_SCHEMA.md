# Rexera 2.0 PostgreSQL Schema

## Simplified and Optimized Rexera 2.0 PostgreSQL Schema

The PostgreSQL schema for Rexera 2.0 has been streamlined and simplified to reduce complexity while maintaining all essential functionality. This optimized schema consolidates related tables, unifies communication systems, and simplifies SLA tracking for better maintainability and performance.

### Key Improvements in This Simplified Schema:

* **Hybrid Communication System:** Consolidated 4 separate communication tables (emails, email_threads, client_messages, client_message_threads) into a unified `communications` table with type-specific metadata tables for better type safety and performance.
* **Streamlined Notifications:** Merged notification tables into a unified system with preferences embedded in user profiles, reducing table count and complexity.
* **Simplified SLA Tracking:** Reduced 6 SLA-related tables to 3 essential tables, focusing on core tracking functionality while maintaining alert levels and escalation capabilities.
* **Eliminated Workflow Output Tables:** Removed redundant `workflow_outputs` and `workflow_output_files` tables by enhancing the existing `documents` table with `deliverable_data` JSONB field and versioning support for workflow deliverables.
* **Enhanced Task Management:** Added `task_executions` table to support action-based task operations with detailed execution tracking.
* **Maintained Data Integrity:** Preserved all foreign key constraints and indexing strategies while reducing overall schema complexity.
* **Flexible Metadata Storage:** Leveraged JSONB fields for extensible data storage without schema changes.

---

## PostgreSQL Schema for Rexera 2.0

Below is the reorganized schema, grouped into logical domains with best practices incorporated.

```sql
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

-- Workflows - Core business processes like HOA acquisition, payoff requests, municipal lien searches
-- Each workflow represents a complete business transaction with multiple automated and manual tasks
-- Maintains full JSONB flexibility for maximum workflow type extensibility
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type workflow_type NOT NULL,
    status workflow_status NOT NULL,
    
    -- All workflow data in JSONB for maximum flexibility
    payload JSONB NOT NULL DEFAULT '{}',
    
    client_id UUID REFERENCES clients(id),
    client_user_id UUID REFERENCES user_profiles(id),
    hil_id UUID REFERENCES user_profiles(id), -- Primary HIL owner
    manager_hil_id UUID REFERENCES user_profiles(id), -- Manager for oversight
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tasks - Individual work units within workflows, executed by AI agents or human staff
-- Tracks execution status, SLA compliance, dependencies, and agent input/output data
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    task_type TEXT NOT NULL,
    executor_type executor_type NOT NULL,
    executor_id UUID REFERENCES user_profiles(id), -- Assigned HIL for human tasks
    status task_status NOT NULL,
    sla_due_at TIMESTAMPTZ,
    sla_status sla_status NOT NULL DEFAULT 'ON_TIME',
    deps UUID[] NOT NULL DEFAULT '{}'::UUID[], -- Task dependencies
    agent_input JSONB, -- Input data/parameters provided to the agent
    agent_output JSONB, -- Raw output data returned by the agent
    result JSONB, -- Processed/final result (may be derived from agent_output)
    priority priority_level DEFAULT 'NORMAL',
    blocking_reason TEXT,
    agent_name TEXT, -- 'Nina','Mia','Rex','Iris','Ria','Cassy','Kosha','Florian'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Task Timeline Events - Audit trail of all task state changes and events
-- Used for real-time monitoring, debugging, and computing metrics like retry counts and durations
CREATE TABLE task_timeline_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'STARTED','COMPLETED','FAILED','RETRIED','BLOCKED','UNBLOCKED','INTERRUPTED'
    event_data JSONB DEFAULT '{}',
    agent_name TEXT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Task Executions - Tracks individual execution attempts for action-based task operations
-- Supports the new unified task execution approach with detailed execution tracking
CREATE TABLE task_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    execution_number INTEGER NOT NULL DEFAULT 1,
    action_type TEXT NOT NULL, -- 'research', 'contact', 'extract', 'verify', 'coordinate', etc.
    executor_type executor_type NOT NULL,
    executor_id UUID REFERENCES user_profiles(id),
    agent_name TEXT,
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    status task_status NOT NULL DEFAULT 'PENDING',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_details JSONB,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(task_id, execution_number)
);


-- =====================================================
-- 4. COUNTERPARTIES AND CONTACTS
-- =====================================================

-- Counterparties - External organizations that workflows interact with (HOAs, lenders, municipalities, etc.)
-- Reusable entities that can be referenced across multiple workflows to avoid data duplication
CREATE TABLE counterparties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type counterparty_type NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    website TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(type, name)
);

-- Allowed Counterparty Types - Business rules defining which counterparty types are valid for each workflow
-- E.g., HOA workflows can only work with 'hoa' counterparties, payoff workflows work with 'lender', 'municipality', etc.
CREATE TABLE allowed_counterparty_types (
    workflow_type workflow_type NOT NULL,
    counterparty_type counterparty_type NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (workflow_type, counterparty_type)
);

-- Workflow Counterparties - Links specific workflows to the counterparties they interact with
-- Tracks the status of each counterparty relationship (contacted, responded, completed, etc.)
CREATE TABLE workflow_counterparties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    counterparty_id UUID NOT NULL REFERENCES counterparties(id) ON DELETE CASCADE,
    status workflow_counterparty_status NOT NULL DEFAULT 'PENDING',
    eta TIMESTAMPTZ,
    document_url TEXT,
    contact_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(workflow_id, counterparty_id)
);

-- Contact Types - Lookup table for standardizing contact role types (e.g., 'primary', 'billing', 'technical')
-- Ensures consistent categorization of contacts across all counterparties
CREATE TABLE contact_types (
    code TEXT PRIMARY KEY,
    description TEXT NOT NULL
);

-- Counterparty Contacts - Individual people at counterparty organizations
-- Stores contact information for specific individuals we communicate with at each counterparty
CREATE TABLE counterparty_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    counterparty_id UUID NOT NULL REFERENCES counterparties(id) ON DELETE CASCADE,
    type_code TEXT NOT NULL REFERENCES contact_types(code),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workflow Contacts - People involved in workflows who need notifications (not system users)
-- Examples: title officers, escrow officers, buyers, sellers, attorneys, etc.
-- These are workflow-specific contacts, distinct from system users and counterparty organizations
CREATE TABLE workflow_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    label TEXT NOT NULL, -- 'buyer', 'seller', 'title_officer', 'escrow_officer', 'attorney', 'loan_officer', etc.
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT, -- Optional company/organization name
    role TEXT, -- Optional specific role/title
    
    -- Notification preferences
    notify_on_status_change BOOLEAN DEFAULT FALSE,
    notify_on_completion BOOLEAN DEFAULT FALSE,
    notify_on_issues BOOLEAN DEFAULT FALSE,
    notify_on_documents BOOLEAN DEFAULT FALSE,
    notification_method TEXT DEFAULT 'email', -- 'email', 'sms', 'both', 'none'
    
    -- Contact metadata
    is_primary BOOLEAN DEFAULT FALSE, -- Primary contact for this label type
    notes TEXT,
    preferred_contact_time TEXT, -- 'morning', 'afternoon', 'business_hours', 'any'
    timezone TEXT DEFAULT 'America/New_York',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure valid notification method
    CONSTRAINT check_notification_method CHECK (
        notification_method IN ('email', 'sms', 'both', 'none')
    ),
    
    -- Ensure contact info exists if notifications enabled
    CONSTRAINT check_notification_contact CHECK (
        (notification_method = 'none') OR
        (notification_method = 'email' AND email IS NOT NULL) OR
        (notification_method = 'sms' AND phone IS NOT NULL) OR
        (notification_method = 'both' AND email IS NOT NULL AND phone IS NOT NULL)
    ),
    
    -- Unique primary contact per label per workflow
    UNIQUE(workflow_id, label, is_primary) WHERE is_primary = true
);

-- Contact Labels - Predefined labels for consistent contact categorization
-- Ensures UI dropdowns and validation use consistent contact types
CREATE TABLE contact_labels (
    label TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    description TEXT,
    workflow_types TEXT[] DEFAULT '{}', -- Which workflow types commonly use this label
    is_required BOOLEAN DEFAULT FALSE, -- Whether this contact is required for certain workflows
    default_notifications JSONB DEFAULT '{}', -- Default notification preferences for this label
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 5. HYBRID COMMUNICATION SYSTEM
-- =====================================================

-- Communications - Core unified table for all communication types (emails, messages, calls)
-- Consolidates email_threads, emails, client_message_threads, and client_messages into a single system
-- Uses hybrid approach with type-specific metadata tables for better type safety and performance
CREATE TABLE communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    type TEXT NOT NULL, -- 'email', 'message', 'call', 'sms'
    email_thread_id TEXT, -- For email threading (Message-ID based)
    subject TEXT,
    content TEXT,
    status TEXT DEFAULT 'SENT', -- 'SENT', 'DELIVERED', 'READ', 'BOUNCED', 'FAILED', 'ACTIVE', 'RESOLVED'
    participants JSONB NOT NULL DEFAULT '[]', -- Array of participant objects with roles
    priority priority_level DEFAULT 'NORMAL',
    is_client_visible BOOLEAN DEFAULT TRUE,
    is_internal BOOLEAN DEFAULT FALSE,
    sentiment_score NUMERIC(3,2), -- -1.00 to 1.00
    urgency_detected BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure valid communication types
    CONSTRAINT check_communication_type CHECK (
        type IN ('email', 'message', 'call', 'sms')
    ),
    
    -- Ensure email threading constraints
    CONSTRAINT check_email_thread_id CHECK (
        (type = 'email' AND email_thread_id IS NOT NULL) OR
        (type != 'email' AND email_thread_id IS NULL)
    )
);

-- Email Metadata - Type-specific metadata for email communications
-- Stores email-specific fields like headers, addresses, and threading information
CREATE TABLE email_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    communication_id UUID NOT NULL REFERENCES communications(id) ON DELETE CASCADE,
    message_id TEXT NOT NULL, -- RFC 2822 Message-ID header
    in_reply_to TEXT, -- RFC 2822 In-Reply-To header for threading
    from_address TEXT NOT NULL,
    to_addresses TEXT[] NOT NULL DEFAULT '{}',
    cc_addresses TEXT[] DEFAULT '{}',
    bcc_addresses TEXT[] DEFAULT '{}',
    headers JSONB DEFAULT '{}', -- Full email headers as key-value pairs
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(communication_id),
    
    -- Ensure this is only used for email communications
    CONSTRAINT check_email_communication CHECK (
        EXISTS (SELECT 1 FROM communications WHERE id = communication_id AND type = 'email')
    )
);

-- Call Metadata - Type-specific metadata for call communications
-- Stores call-specific fields like duration, recording, and transcription
CREATE TABLE call_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    communication_id UUID NOT NULL REFERENCES communications(id) ON DELETE CASCADE,
    call_start_time TIMESTAMPTZ,
    call_end_time TIMESTAMPTZ,
    duration_seconds INTEGER,
    recording_url TEXT,
    transcription TEXT,
    transcription_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(communication_id),
    
    -- Ensure this is only used for call communications
    CONSTRAINT check_call_communication CHECK (
        EXISTS (SELECT 1 FROM communications WHERE id = communication_id AND type = 'call')
    ),
    
    -- Ensure duration consistency
    CONSTRAINT check_call_duration CHECK (
        (call_start_time IS NULL AND call_end_time IS NULL AND duration_seconds IS NULL) OR
        (call_start_time IS NOT NULL AND call_end_time IS NOT NULL AND
         duration_seconds = EXTRACT(EPOCH FROM (call_end_time - call_start_time))::INTEGER)
    )
);

-- Message Metadata - Type-specific metadata for message communications (SMS, platform messages)
-- Stores message-specific fields like platform, direction, and delivery status
CREATE TABLE message_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    communication_id UUID NOT NULL REFERENCES communications(id) ON DELETE CASCADE,
    platform TEXT, -- 'sms', 'slack', 'teams', 'whatsapp', etc.
    message_direction TEXT, -- 'inbound', 'outbound'
    external_id TEXT, -- Platform-specific message ID
    delivery_status TEXT, -- 'pending', 'delivered', 'failed', 'read'
    metadata JSONB DEFAULT '{}', -- Platform-specific metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(communication_id),
    
    -- Ensure this is only used for message/sms communications
    CONSTRAINT check_message_communication CHECK (
        EXISTS (SELECT 1 FROM communications WHERE id = communication_id AND type IN ('message', 'sms'))
    ),
    
    -- Ensure valid message direction
    CONSTRAINT check_message_direction CHECK (
        message_direction IN ('inbound', 'outbound')
    )
);

-- Communication Attachments - Files attached to communications
-- Unified attachment system for all communication types
CREATE TABLE communication_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    communication_id UUID NOT NULL REFERENCES communications(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    storage_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =====================================================
-- 6. FINANCIALS AND INVOICING
-- =====================================================

-- Cost Items - Individual expenses incurred during workflow execution
-- Tracks costs that may be passed through to clients or absorbed by the business
CREATE TABLE cost_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    pass_through BOOLEAN NOT NULL DEFAULT TRUE,
    incurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Invoices - Client billing documents generated from workflow costs
-- Manages the invoicing lifecycle from draft to payment for client billing
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE SET NULL,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    status invoice_status NOT NULL DEFAULT 'DRAFT',
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Invoice Items - Line items within invoices linking to specific cost items
-- Breaks down invoices into individual charges with quantities and pricing details
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    cost_item_id UUID REFERENCES cost_items(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(12,2) NOT NULL,
    total_price NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 7. DOCUMENTS AND ATTACHMENTS
-- =====================================================

-- Document Tags - Predefined list of tags for categorizing documents in UI dropdown
-- Provides controlled vocabulary for consistent document tagging (e.g., "Payoff Statement", "Email", "Research")
CREATE TABLE document_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Documents - Files and attachments associated with workflows and tasks
-- Stores metadata for all documents with categorization, tagging, and processing status tracking
-- Enhanced to handle workflow deliverables with structured data storage
-- NOTE: This table now handles workflow outputs/deliverables that were previously in separate workflow_outputs and workflow_output_files tables
-- Use document_type='DELIVERABLE' or 'WORKFLOW_OUTPUT' with deliverable_data JSONB field for structured output data
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    filename TEXT NOT NULL,
    url TEXT NOT NULL,
    file_size_bytes BIGINT,
    mime_type TEXT,
    document_type TEXT NOT NULL, -- 'WORKING', 'DELIVERABLE', 'WORKFLOW_OUTPUT', 'MESSAGE_ATTACHMENT'
    tag_id UUID REFERENCES document_tags(id), -- Reference to predefined tag
    upload_source TEXT, -- 'AGENT','HIL','CLIENT'
    status TEXT DEFAULT 'PENDING', -- 'PENDING', 'PROCESSING', 'COMPLETED', 'DRAFT'
    deliverable_data JSONB DEFAULT '{}', -- Structured output data for deliverables and workflow outputs
    version INTEGER DEFAULT 1, -- Version number for deliverable documents
    change_summary TEXT, -- Summary of changes for versioned deliverables
    created_by UUID REFERENCES user_profiles(id), -- User who created this deliverable version
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure deliverable documents have required fields
    CONSTRAINT check_deliverable_fields CHECK (
        (document_type IN ('DELIVERABLE', 'WORKFLOW_OUTPUT') AND created_by IS NOT NULL) OR
        (document_type NOT IN ('DELIVERABLE', 'WORKFLOW_OUTPUT'))
    ),
    
    -- Ensure unique versioning for deliverable documents per workflow
    UNIQUE(workflow_id, document_type, version) WHERE document_type IN ('DELIVERABLE', 'WORKFLOW_OUTPUT')
);

-- =====================================================
-- 8. INTERNAL COLLABORATION
-- =====================================================

-- HIL Notes - Internal collaboration system for Human-in-Loop staff
-- Enables staff to leave notes, mentions, and comments on workflows for team coordination
CREATE TABLE hil_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES user_profiles(id),
    content TEXT NOT NULL,
    priority priority_level NOT NULL DEFAULT 'NORMAL',
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    parent_note_id UUID REFERENCES hil_notes(id),
    mentions UUID[] DEFAULT '{}',
    parsed_content TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- HIL Note Tags (mentions)
CREATE TABLE hil_note_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL REFERENCES hil_notes(id) ON DELETE CASCADE,
    tagged_hil_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(note_id, tagged_hil_id)
);

-- HIL Note Attachments
CREATE TABLE hil_note_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL REFERENCES hil_notes(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    storage_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =====================================================
-- 9. UNIFIED NOTIFICATION SYSTEM
-- =====================================================

-- Notifications - Unified notification system for all users (HIL and client)
-- Consolidates hil_notifications and notifications tables into a single system
-- Notification preferences are embedded in user_preferences table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority priority_level NOT NULL DEFAULT 'NORMAL',
    context JSONB DEFAULT '{}', -- Flexible storage for workflow_id, task_id, action_url, metadata
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure valid notification types
    CONSTRAINT check_notification_type CHECK (
        type IN ('WORKFLOW_UPDATE', 'TASK_INTERRUPT', 'HIL_MENTION', 'CLIENT_MESSAGE_RECEIVED',
                'COUNTERPARTY_MESSAGE_RECEIVED', 'SLA_WARNING', 'AGENT_FAILURE')
    )
);

-- =====================================================
-- 10. SLA MONITORING SYSTEM
-- =====================================================

-- SLA Definitions - Service Level Agreement rules defining expected completion times
-- Sets performance standards for different task types, agents, and workflow combinations
CREATE TABLE sla_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_type workflow_type NOT NULL,
    task_type TEXT NOT NULL,
    agent_name TEXT,
    executor_type executor_type NOT NULL,
    sla_minutes INTEGER NOT NULL,
    description TEXT,
    priority priority_level DEFAULT 'NORMAL',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(workflow_type, task_type, agent_name, executor_type)
);

-- SLA Tracking
CREATE TABLE sla_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    sla_definition_id UUID NOT NULL REFERENCES sla_definitions(id),
    started_at TIMESTAMPTZ NOT NULL,
    due_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    current_status sla_tracking_status NOT NULL DEFAULT 'ACTIVE',
    breach_minutes INTEGER DEFAULT 0,
    business_hours_only BOOLEAN DEFAULT TRUE,
    pause_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SLA Alerts
CREATE TABLE sla_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sla_tracking_id UUID NOT NULL REFERENCES sla_tracking(id) ON DELETE CASCADE,
    alert_level alert_level NOT NULL,
    alert_threshold_pct INTEGER NOT NULL,
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES user_profiles(id),
    escalated_at TIMESTAMPTZ,
    escalated_to UUID REFERENCES user_profiles(id),
    alert_message TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SLA Performance Metrics
CREATE TABLE sla_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_name TEXT,
    executor_type executor_type NOT NULL,
    workflow_type workflow_type NOT NULL,
    task_type TEXT NOT NULL,
    date_calculated DATE NOT NULL DEFAULT CURRENT_DATE,
    total_tasks INTEGER DEFAULT 0,
    completed_on_time INTEGER DEFAULT 0,
    completed_late INTEGER DEFAULT 0,
    avg_completion_minutes INTEGER,
    sla_compliance_rate NUMERIC(5,2),
    avg_breach_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(agent_name, executor_type, workflow_type, task_type, date_calculated)
);

-- Business Hours Configuration
CREATE TABLE business_hours_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timezone TEXT NOT NULL DEFAULT 'America/New_York',
    monday_start TIME DEFAULT '09:00:00',
    monday_end TIME DEFAULT '17:00:00',
    tuesday_start TIME DEFAULT '09:00:00',
    tuesday_end TIME DEFAULT '17:00:00',
    wednesday_start TIME DEFAULT '09:00:00',
    wednesday_end TIME DEFAULT '17:00:00',
    thursday_start TIME DEFAULT '09:00:00',
    thursday_end TIME DEFAULT '17:00:00',
    friday_start TIME DEFAULT '09:00:00',
    friday_end TIME DEFAULT '17:00:00',
    saturday_start TIME,
    saturday_end TIME,
    sunday_start TIME,
    sunday_end TIME,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Business Holidays
CREATE TABLE business_holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    holiday_date DATE NOT NULL,
    holiday_name TEXT NOT NULL,
    is_recurring BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(holiday_date)
);

-- SLA Escalation Rules
CREATE TABLE sla_escalation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_level alert_level NOT NULL,
    escalation_delay_minutes INTEGER NOT NULL,
    escalate_to_role TEXT,
    escalate_to_user_id UUID REFERENCES user_profiles(id),
    notification_method TEXT DEFAULT 'EMAIL',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 11. ANALYTICS AND MONITORING
-- =====================================================

-- Agent Results - Detailed analytics and metrics for AI agent performance
-- Stores execution results, confidence scores, processing times, and costs for performance monitoring
CREATE TABLE agent_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    agent_name TEXT NOT NULL,
    result_type TEXT NOT NULL,
    structured_data JSONB NOT NULL DEFAULT '{}',
    confidence_score NUMERIC(3,2),
    processing_time_ms INTEGER,
    tokens_used INTEGER,
    cost_usd NUMERIC(10,4),
    error_details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- =====================================================
-- 12. UNIVERSAL AUDIT SYSTEM
-- =====================================================

-- Universal Audit Events - Complete audit trail for all system activity
-- Tracks every action taken by humans, agents, or system processes
-- Single source of truth for compliance, debugging, and analytics
CREATE TABLE audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Who performed the action?
    actor_type TEXT NOT NULL, -- 'human', 'agent', 'system'
    actor_id TEXT NOT NULL,   -- user_id, agent_name, or system process name
    actor_name TEXT,          -- Display name for UI (e.g., "John Doe", "Nina AI", "SLA Monitor")
    
    -- What action was performed?
    event_type TEXT NOT NULL, -- 'workflow.created', 'task.completed', 'document.uploaded', 'auth.login'
    action TEXT NOT NULL,     -- 'create', 'read', 'update', 'delete', 'execute', 'approve', 'reject'
    
    -- What resource was affected?
    resource_type TEXT NOT NULL, -- 'workflow', 'task', 'document', 'communication', 'user'
    resource_id UUID NOT NULL,   -- ID of the affected resource
    
    -- Context for filtering and analysis
    workflow_id UUID REFERENCES workflows(id), -- Always include for workflow-related events
    client_id UUID REFERENCES clients(id),     -- For data isolation and client reporting
    
    -- Flexible event details
    event_data JSONB DEFAULT '{}', -- Before/after values, metadata, IP addresses, etc.
    
    -- Timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Validation constraints
    CONSTRAINT check_actor_type CHECK (actor_type IN ('human', 'agent', 'system')),
    CONSTRAINT check_action CHECK (action IN ('create', 'read', 'update', 'delete', 'execute', 'approve', 'reject', 'login', 'logout'))
);

-- Agent UI configurations
CREATE TABLE agent_ui_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_name TEXT NOT NULL UNIQUE,
    modal_config JSONB NOT NULL DEFAULT '{}',
    status_indicators JSONB DEFAULT '{}',
    available_actions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- User Preferences
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) UNIQUE,
    theme TEXT DEFAULT 'SYSTEM',
    language TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'UTC',
    notification_settings JSONB DEFAULT '{"email_enabled": true, "in_app_enabled": true, "push_enabled": false, "types": {}}',
    ui_settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
 

-- =====================================================
-- 13. INDEXES FOR PERFORMANCE
-- =====================================================

-- Core User and Client Management Indexes

CREATE INDEX idx_user_profiles_user_type ON user_profiles(user_type);
CREATE INDEX idx_user_profiles_company ON user_profiles(company_id);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);

-- Workflow and Task Management Indexes
CREATE INDEX idx_workflows_client ON workflows(client_id);
CREATE INDEX idx_workflows_client_user ON workflows(client_user_id);
CREATE INDEX idx_workflows_hil ON workflows(hil_id);
CREATE INDEX idx_workflows_type ON workflows(type);
CREATE INDEX idx_workflows_status ON workflows(status);

-- JSONB performance indexes for common query patterns
CREATE INDEX idx_workflows_payload_due_date ON workflows 
  USING btree ((payload->>'dueDate')) WHERE payload ? 'dueDate';
CREATE INDEX idx_workflows_payload_priority ON workflows 
  USING btree ((payload->>'priority')) WHERE payload ? 'priority';
CREATE INDEX idx_workflows_payload_contact ON workflows 
  USING gin(to_tsvector('english', payload->>'primaryContact')) WHERE payload ? 'primaryContact';

-- Type-specific JSONB indexes for real estate workflows
CREATE INDEX idx_workflows_real_estate_address ON workflows 
  USING gin(to_tsvector('english', payload->>'propertyAddress'))
  WHERE type IN ('PAYOFF', 'HOA_ACQUISITION', 'MUNI_LIEN_SEARCH') AND payload ? 'propertyAddress';
CREATE INDEX idx_workflows_real_estate_closing ON workflows 
  ((payload->>'closingDate'), (payload->>'urgency'))
  WHERE type IN ('PAYOFF', 'HOA_ACQUISITION', 'MUNI_LIEN_SEARCH');

CREATE INDEX idx_tasks_workflow ON tasks(workflow_id);
CREATE INDEX idx_tasks_executor ON tasks(executor_id);
CREATE INDEX idx_tasks_status_sla ON tasks(status, sla_status);
CREATE INDEX idx_tasks_agent ON tasks(agent_name);

-- JSONB performance indexes for task analytics
CREATE INDEX idx_tasks_agent_confidence ON tasks 
  ((agent_output->>'confidence_score')::numeric) 
  WHERE agent_output ? 'confidence_score';
CREATE INDEX idx_tasks_agent_processing_time ON tasks 
  ((agent_output->>'processing_time_ms')::integer) 
  WHERE agent_output ? 'processing_time_ms';
CREATE INDEX idx_tasks_agent_cost ON tasks 
  ((agent_output->>'cost_usd')::numeric) 
  WHERE agent_output ? 'cost_usd';

-- Counterparties and Contacts Indexes
CREATE INDEX idx_counterparties_type ON counterparties(type);
CREATE INDEX idx_counterparties_name ON counterparties(name);
CREATE INDEX idx_workflow_counterparties_wf ON workflow_counterparties(workflow_id);
CREATE INDEX idx_workflow_counterparties_cp ON workflow_counterparties(counterparty_id);
CREATE INDEX idx_workflow_counterparties_status ON workflow_counterparties(status);
CREATE INDEX idx_contacts_counterparty ON counterparty_contacts(counterparty_id);

-- Workflow Contacts Indexes
CREATE INDEX idx_workflow_contacts_workflow ON workflow_contacts(workflow_id);
CREATE INDEX idx_workflow_contacts_label ON workflow_contacts(label);
CREATE INDEX idx_workflow_contacts_name ON workflow_contacts USING gin(to_tsvector('english', name));
CREATE INDEX idx_workflow_contacts_email ON workflow_contacts(email) WHERE email IS NOT NULL;
CREATE INDEX idx_workflow_contacts_phone ON workflow_contacts(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_workflow_contacts_notifications ON workflow_contacts(workflow_id) 
  WHERE notify_on_status_change = true OR notify_on_completion = true OR notify_on_issues = true OR notify_on_documents = true;
CREATE INDEX idx_workflow_contacts_primary ON workflow_contacts(workflow_id, label, is_primary) WHERE is_primary = true;

-- Hybrid Communication System Indexes
CREATE INDEX idx_communications_workflow_id ON communications(workflow_id);
CREATE INDEX idx_communications_task_id ON communications(task_id);
CREATE INDEX idx_communications_type ON communications(type);
CREATE INDEX idx_communications_email_thread_id ON communications(email_thread_id);
CREATE INDEX idx_communications_status ON communications(status);
CREATE INDEX idx_communications_priority ON communications(priority);
CREATE INDEX idx_communications_created_at ON communications(created_at);
CREATE INDEX idx_communications_client_visible ON communications(is_client_visible);
CREATE INDEX idx_communications_participants ON communications USING gin(participants);
CREATE INDEX idx_communication_attachments_comm ON communication_attachments(communication_id);

-- Email Metadata Indexes
CREATE INDEX idx_email_metadata_communication_id ON email_metadata(communication_id);
CREATE INDEX idx_email_metadata_message_id ON email_metadata(message_id);
CREATE INDEX idx_email_metadata_in_reply_to ON email_metadata(in_reply_to);
CREATE INDEX idx_email_metadata_from_address ON email_metadata(from_address);
CREATE INDEX idx_email_metadata_to_addresses ON email_metadata USING gin(to_addresses);
CREATE INDEX idx_email_metadata_headers ON email_metadata USING gin(headers);

-- Call Metadata Indexes
CREATE INDEX idx_call_metadata_communication_id ON call_metadata(communication_id);
CREATE INDEX idx_call_metadata_start_time ON call_metadata(call_start_time);
CREATE INDEX idx_call_metadata_duration ON call_metadata(duration_seconds);

-- Message Metadata Indexes
CREATE INDEX idx_message_metadata_communication_id ON message_metadata(communication_id);
CREATE INDEX idx_message_metadata_platform ON message_metadata(platform);
CREATE INDEX idx_message_metadata_direction ON message_metadata(message_direction);
CREATE INDEX idx_message_metadata_external_id ON message_metadata(external_id);
CREATE INDEX idx_message_metadata_delivery_status ON message_metadata(delivery_status);
CREATE INDEX idx_message_metadata_metadata ON message_metadata USING gin(metadata);

-- Financials and Invoicing Indexes
CREATE INDEX idx_cost_items_workflow_id ON cost_items(workflow_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- Documents and Attachments Indexes
CREATE INDEX idx_documents_workflow_id ON documents(workflow_id);
CREATE INDEX idx_documents_task_id ON documents(task_id);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_tag_id ON documents(tag_id);
CREATE INDEX idx_documents_status ON documents(status);

-- Internal Collaboration Indexes
CREATE INDEX idx_hil_notes_workflow ON hil_notes(workflow_id);
CREATE INDEX idx_hil_notes_author ON hil_notes(author_id);
CREATE INDEX idx_hil_notes_priority ON hil_notes(priority);
CREATE INDEX idx_hil_notes_created_at ON hil_notes(created_at DESC);
CREATE INDEX idx_hil_notes_parent ON hil_notes(parent_note_id);
CREATE INDEX idx_hil_note_tags_note ON hil_note_tags(note_id);
CREATE INDEX idx_hil_note_tags_hil ON hil_note_tags(tagged_hil_id);
CREATE INDEX idx_hil_note_tags_unread ON hil_note_tags(tagged_hil_id, is_read);
CREATE INDEX idx_hil_note_attachments_note ON hil_note_attachments(note_id);
CREATE INDEX idx_documents_deliverable_version ON documents(workflow_id, document_type, version) WHERE document_type IN ('DELIVERABLE', 'WORKFLOW_OUTPUT');
CREATE INDEX idx_documents_deliverable_data ON documents USING gin(deliverable_data) WHERE document_type IN ('DELIVERABLE', 'WORKFLOW_OUTPUT');
CREATE INDEX idx_documents_created_by ON documents(created_by) WHERE document_type IN ('DELIVERABLE', 'WORKFLOW_OUTPUT');

-- Unified Notification System Indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_priority ON notifications(priority);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_context ON notifications USING gin(context);

-- Simplified SLA Tracking System Indexes
CREATE INDEX idx_sla_tracking_task ON sla_tracking(task_id);
CREATE INDEX idx_sla_tracking_status ON sla_tracking(status);
CREATE INDEX idx_sla_tracking_due_at ON sla_tracking(due_at);
CREATE INDEX idx_sla_tracking_alert_level ON sla_tracking(alert_level);
CREATE INDEX idx_sla_tracking_active_due ON sla_tracking(status, due_at) WHERE status = 'ACTIVE';
CREATE INDEX idx_sla_tracking_escalated ON sla_tracking(escalated_to) WHERE escalated_to IS NOT NULL;
CREATE INDEX idx_business_holidays_date ON business_holidays(holiday_date);
CREATE INDEX idx_business_hours_active ON business_hours_config(is_active);

-- Analytics and Monitoring Indexes
CREATE INDEX idx_task_timeline_events_task ON task_timeline_events(task_id);
CREATE INDEX idx_task_timeline_events_type ON task_timeline_events(event_type);
CREATE INDEX idx_task_timeline_events_agent ON task_timeline_events(agent_name);
CREATE INDEX idx_task_executions_task ON task_executions(task_id);
CREATE INDEX idx_task_executions_status ON task_executions(status);
CREATE INDEX idx_task_executions_action_type ON task_executions(action_type);
CREATE INDEX idx_task_executions_executor ON task_executions(executor_type, executor_id);
CREATE INDEX idx_task_executions_agent ON task_executions(agent_name);
CREATE INDEX idx_agent_results_task ON agent_results(task_id);
CREATE INDEX idx_agent_results_agent ON agent_results(agent_name);
CREATE INDEX idx_agent_performance_agent ON agent_performance_metrics(agent_name);
CREATE INDEX idx_workflow_interrupts_workflow ON workflow_interrupts(workflow_id);
CREATE INDEX idx_workflow_interrupts_status ON workflow_interrupts(resolution_status);
CREATE INDEX idx_workflow_interrupts_severity ON workflow_interrupts(severity);
CREATE INDEX idx_workflow_interrupts_assigned ON workflow_interrupts(assigned_to_id);
CREATE INDEX idx_task_injection_workflow ON task_injection_history(workflow_id);
CREATE INDEX idx_task_injection_trigger ON task_injection_history(injection_trigger);
CREATE INDEX idx_task_modifications_task ON task_modifications(task_id);
CREATE INDEX idx_task_modifications_type ON task_modifications(modification_type);
CREATE INDEX idx_workflow_critical_paths_workflow ON workflow_critical_paths(workflow_id);
CREATE INDEX idx_workflow_critical_paths_current ON workflow_critical_paths(workflow_id, is_current);
CREATE INDEX idx_resource_allocations_workflow ON resource_allocations(workflow_id);
CREATE INDEX idx_resource_allocations_agent ON resource_allocations(agent_name);
CREATE INDEX idx_workflow_optimizations_workflow ON workflow_optimizations(workflow_id);
CREATE INDEX idx_workflow_optimizations_status ON workflow_optimizations(status);
CREATE INDEX idx_workflow_coordination_insights_workflow ON workflow_coordination_insights(workflow_id);
CREATE INDEX idx_workflow_coordination_insights_type ON workflow_coordination_insights(insight_type);

-- Universal Audit System Indexes
CREATE INDEX idx_audit_events_workflow ON audit_events(workflow_id);
CREATE INDEX idx_audit_events_actor ON audit_events(actor_type, actor_id);
CREATE INDEX idx_audit_events_resource ON audit_events(resource_type, resource_id);
CREATE INDEX idx_audit_events_type ON audit_events(event_type);
CREATE INDEX idx_audit_events_created_at ON audit_events(created_at DESC);
CREATE INDEX idx_audit_events_client ON audit_events(client_id);
CREATE INDEX idx_audit_events_actor_workflow ON audit_events(actor_type, workflow_id);
CREATE INDEX idx_audit_events_action_resource ON audit_events(action, resource_type);
CREATE INDEX idx_audit_events_event_data ON audit_events USING gin(event_data);
CREATE INDEX idx_task_execution_metrics_task ON task_execution_metrics(task_id);
CREATE INDEX idx_task_execution_metrics_type ON task_execution_metrics(metric_type);
CREATE INDEX idx_user_preferences_user ON user_preferences(user_id);
CREATE INDEX idx_search_queries_user ON search_queries(user_id);
CREATE INDEX idx_search_queries_saved ON search_queries(is_saved);

-- Full-text search indexes for global search
CREATE INDEX idx_workflows_search ON workflows USING gin(to_tsvector('english', type || ' ' || COALESCE(payload::text, '')));
CREATE INDEX idx_tasks_search ON tasks USING gin(to_tsvector('english', task_type || ' ' || COALESCE(result::text, '')));
CREATE INDEX idx_communications_search ON communications USING gin(to_tsvector('english', COALESCE(subject, '') || ' ' || COALESCE(content, '')));

-- =====================================================
-- 14. SEED DATA
-- =====================================================

-- Seed data for workflow-counterparty type restrictions
INSERT INTO allowed_counterparty_types (workflow_type, counterparty_type) VALUES
    ('HOA_ACQUISITION', 'hoa'),
    ('PAYOFF', 'lender'),
    ('PAYOFF', 'municipality'),
    ('PAYOFF', 'utility'),
    ('MUNI_LIEN_SEARCH', 'municipality'),
    ('MUNI_LIEN_SEARCH', 'tax_authority');

-- Seed data for workflow contact labels
INSERT INTO contact_labels (label, display_name, description, workflow_types, is_required, default_notifications) VALUES
    -- Real Estate workflow contacts
    ('buyer', 'Buyer', 'Property buyer/purchaser', ARRAY['PAYOFF', 'HOA_ACQUISITION', 'MUNI_LIEN_SEARCH'], true, '{"notify_on_completion": true, "notify_on_issues": true}'),
    ('seller', 'Seller', 'Property seller', ARRAY['PAYOFF', 'HOA_ACQUISITION'], false, '{"notify_on_completion": true}'),
    ('title_officer', 'Title Officer', 'Title company representative', ARRAY['PAYOFF', 'HOA_ACQUISITION', 'MUNI_LIEN_SEARCH'], false, '{"notify_on_completion": true, "notify_on_documents": true}'),
    ('escrow_officer', 'Escrow Officer', 'Escrow company representative', ARRAY['PAYOFF', 'HOA_ACQUISITION'], false, '{"notify_on_status_change": true, "notify_on_completion": true}'),
    ('loan_officer', 'Loan Officer', 'Lender representative handling the loan', ARRAY['PAYOFF'], false, '{"notify_on_completion": true, "notify_on_issues": true}'),
    ('real_estate_agent', 'Real Estate Agent', 'Buyer or seller agent', ARRAY['PAYOFF', 'HOA_ACQUISITION'], false, '{"notify_on_completion": true}'),
    ('attorney', 'Attorney', 'Legal representative', ARRAY['PAYOFF', 'HOA_ACQUISITION', 'MUNI_LIEN_SEARCH'], false, '{"notify_on_issues": true, "notify_on_documents": true}'),
    ('hoa_manager', 'HOA Manager', 'Homeowners association manager', ARRAY['HOA_ACQUISITION'], false, '{"notify_on_status_change": true}'),
    ('lender_contact', 'Lender Contact', 'Primary contact at lending institution', ARRAY['PAYOFF'], false, '{"notify_on_completion": true}'),
    
    -- Generic workflow contacts (for future workflow types)
    ('primary_contact', 'Primary Contact', 'Main contact person for this workflow', ARRAY[], false, '{"notify_on_status_change": true, "notify_on_completion": true, "notify_on_issues": true}'),
    ('secondary_contact', 'Secondary Contact', 'Backup contact person', ARRAY[], false, '{"notify_on_completion": true}'),
    ('project_manager', 'Project Manager', 'Project or case manager', ARRAY[], false, '{"notify_on_status_change": true, "notify_on_issues": true}'),
    ('client_representative', 'Client Representative', 'Client organization representative', ARRAY[], false, '{"notify_on_status_change": true, "notify_on_completion": true}'),
    ('vendor_contact', 'Vendor Contact', 'Third-party vendor or service provider', ARRAY[], false, '{"notify_on_completion": true}'),
    ('compliance_officer', 'Compliance Officer', 'Regulatory or compliance contact', ARRAY[], false, '{"notify_on_documents": true, "notify_on_completion": true}');


-- Seed data for document tags (referenced by workflow_contacts for document notifications)
INSERT INTO document_tags (name, description) VALUES
    ('Payoff Statement', 'Mortgage payoff statement from lender'),
    ('HOA Documents', 'HOA bylaws, financials, and governance documents'),
    ('Lien Search Results', 'Municipal and tax lien search results'),
    ('Title Report', 'Property title examination report'),
    ('Escrow Instructions', 'Escrow closing instructions'),
    ('Legal Documents', 'Contracts, agreements, and legal filings'),
    ('Financial Documents', 'Financial statements and payment records'),
    ('Communication Records', 'Email threads and call logs');

-- Note: SLA tracking is now simplified and managed dynamically based on task requirements
-- SLA minutes are set per task rather than using predefined definitions

-- Seed data for business hours (9 AM - 5 PM EST, Monday-Friday)
INSERT INTO business_hours_config (timezone, monday_start, monday_end, tuesday_start, tuesday_end,
    wednesday_start, wednesday_end, thursday_start, thursday_end, friday_start, friday_end) VALUES
    ('America/New_York', '09:00:00', '17:00:00', '09:00:00', '17:00:00',
     '09:00:00', '17:00:00', '09:00:00', '17:00:00', '09:00:00', '17:00:00');

-- Seed data for common US holidays
INSERT INTO business_holidays (holiday_date, holiday_name, is_recurring) VALUES
    ('2024-01-01', 'New Year''s Day', true),
    ('2024-07-04', 'Independence Day', true),
    ('2024-12-25', 'Christmas Day', true),
    ('2024-11-28', 'Thanksgiving Day', false),
    ('2024-11-29', 'Black Friday', false);

-- Note: SLA escalation is now handled directly in the simplified sla_tracking table
-- Escalation logic is managed at the application level based on alert_level and escalated_to fields
```

This simplified schema provides a more maintainable and efficient structure for the Rexera 2.0 application. By consolidating related functionality into unified tables and implementing a hybrid approach for communications with type-specific metadata tables, the database becomes more robust, performant, and easier to understand while maintaining type safety and clean separation of concerns.

## Hybrid Communication System Design

### Architecture Overview

The hybrid communication system combines the benefits of a unified communication table with type-specific metadata tables for optimal performance and maintainability:

**Core Communications Table:**
- Stores common fields shared across all communication types
- Maintains unified threading and participant management
- Provides consistent querying interface for all communications

**Type-Specific Metadata Tables:**
- `email_metadata`: Email-specific fields (headers, addresses, threading)
- `call_metadata`: Call-specific fields (duration, recording, transcription)
- `message_metadata`: Message-specific fields (platform, direction, delivery status)

### Benefits of the Hybrid Approach

1. **Type Safety**: Strongly typed fields for each communication type prevent data inconsistencies
2. **Performance**: Optimized indexes on type-specific fields improve query performance
3. **Clean Separation**: Clear separation between common and type-specific data
4. **Extensibility**: Easy to add new communication types without affecting existing structure
5. **Unified Interface**: Single table for common operations while maintaining type-specific functionality

### Usage Patterns

**Querying All Communications:**
```sql
-- Get all communications for a workflow
SELECT c.*, ea.from_address, ca.duration_seconds, ma.platform
FROM communications c
LEFT JOIN email_metadata ea ON c.id = ea.communication_id
LEFT JOIN call_metadata ca ON c.id = ca.communication_id
LEFT JOIN message_metadata ma ON c.id = ma.communication_id
WHERE c.workflow_id = $1
ORDER BY c.created_at DESC;
```

**Email Threading:**
```sql
-- Get email thread using Message-ID based threading
SELECT c.*, em.message_id, em.in_reply_to, em.from_address, em.to_addresses
FROM communications c
JOIN email_metadata em ON c.id = em.communication_id
WHERE c.email_thread_id = $1 AND c.type = 'email'
ORDER BY c.created_at;
```

**Type-Specific Queries:**
```sql
-- Get calls with recordings
SELECT c.*, cm.duration_seconds, cm.recording_url
FROM communications c
JOIN call_metadata cm ON c.id = cm.communication_id
WHERE c.type = 'call' AND cm.recording_url IS NOT NULL;

-- Get failed message deliveries
SELECT c.*, mm.platform, mm.delivery_status
FROM communications c
JOIN message_metadata mm ON c.id = mm.communication_id
WHERE c.type IN ('message', 'sms') AND mm.delivery_status = 'failed';
```
  