-- =====================================================
-- ADD PAYOFF WORKFLOW TASKS
-- Based on mockup file for PAY-0891 workflow tasks
-- =====================================================

-- Insert tasks for PAY-0001 workflow
INSERT INTO tasks (
    workflow_id,
    title,
    description,
    status,
    executor_type,
    priority,
    metadata,
    created_at,
    updated_at,
    completed_at,
    due_date
) VALUES 
-- Task 1: Lookup Lender Contact Information (Completed)
(
    'PAY-0001',
    'Lookup Lender Contact Information',
    'Research and gather lender contact details for payoff request processing',
    'COMPLETED',
    'AI',
    'HIGH',
    '{
        "agent_name": "Nina",
        "agent_emoji": "🔍",
        "confidence": 95,
        "lender_found": true,
        "contact_verified": true,
        "phone_number": "(555) 123-4567",
        "email": "payoffs@firstnational.com",
        "portal_url": "https://portal.firstnational.com"
    }',
    '2025-07-02T10:30:00Z',
    '2025-07-02T11:15:00Z',
    '2025-07-02T11:15:00Z',
    '2025-07-02T12:00:00Z'
),

-- Task 2: Portal Access (Failed - needs HIL)
(
    'PAY-0001',
    'Portal Access',
    'Access lender portal to retrieve payoff statement and loan details',
    'FAILED',
    'AI',
    'HIGH',
    '{
        "agent_name": "Rex",
        "agent_emoji": "🌐",
        "error_reason": "Authentication failed - Lender portal requires 2FA",
        "attempts": 3,
        "last_attempt": "2025-07-02T14:30:00Z",
        "portal_url": "https://portal.firstnational.com",
        "requires_hil": true
    }',
    '2025-07-02T12:00:00Z',
    '2025-07-02T14:30:00Z',
    null,
    '2025-07-02T16:00:00Z'
),

-- Task 3: Process Payoff Document (Awaiting Review)
(
    'PAY-0001',
    'Process Payoff Document',
    'Process received payoff statement document and extract key financial information',
    'AWAITING_REVIEW',
    'AI',
    'URGENT',
    '{
        "agent_name": "Iris",
        "agent_emoji": "📄",
        "document_filename": "payoff_statement_fnb.pdf",
        "file_size": "2.3 MB",
        "page_count": 1,
        "confidence_overall": 67,
        "confidence_breakdown": {
            "borrower_info": 98,
            "loan_number": 95,
            "property_address": 92,
            "payoff_amount": 67
        },
        "review_required": true,
        "low_confidence_fields": ["payoff_amount"],
        "extraction_completed": "2025-07-03T13:45:00Z"
    }',
    '2025-07-03T13:30:00Z',
    '2025-07-03T13:45:00Z',
    null,
    '2025-07-03T15:00:00Z'
),

-- Task 4: Quality Assurance Review (Pending)
(
    'PAY-0001',
    'Quality Assurance Review',
    'Comprehensive quality assurance review of all workflow outputs to ensure accuracy and completeness',
    'PENDING',
    'AI',
    'NORMAL',
    '{
        "agent_name": "Cassy",
        "agent_emoji": "✓",
        "depends_on": ["portal-access", "process-document"],
        "blocked_by": "Portal Access failure and Document Processing review",
        "auto_start": true
    }',
    '2025-07-03T14:00:00Z',
    '2025-07-03T14:00:00Z',
    null,
    '2025-07-03T17:00:00Z'
),

-- Task 5: Generate Invoice (Pending)
(
    'PAY-0001',
    'Generate Invoice',
    'Generate client invoice based on completed workflow costs and billable items',
    'PENDING',
    'AI',
    'NORMAL',
    '{
        "agent_name": "Kosha",
        "agent_emoji": "💰",
        "depends_on": ["qa-review"],
        "estimated_amount": 150.00,
        "billable_items": ["Payoff Request Processing", "Document Review", "Lender Communication"]
    }',
    '2025-07-03T14:00:00Z',
    '2025-07-03T14:00:00Z',
    null,
    '2025-07-03T18:00:00Z'
),

-- Task 6: Update CRM Records (Pending)
(
    'PAY-0001',
    'Update CRM Records',
    'Update client CRM system with workflow completion and payoff details',
    'PENDING',
    'AI',
    'LOW',
    '{
        "agent_name": "Ria",
        "agent_emoji": "👩‍💼",
        "depends_on": ["generate-invoice"],
        "crm_system": "Salesforce",
        "update_fields": ["payoff_amount", "completion_date", "invoice_number"]
    }',
    '2025-07-03T14:00:00Z',
    '2025-07-03T14:00:00Z',
    null,
    '2025-07-03T19:00:00Z'
);

-- Remove the old generic tasks that were created earlier
DELETE FROM tasks WHERE workflow_id = 'PAY-0001' AND title IN ('Lookup Lender', 'Process Document');