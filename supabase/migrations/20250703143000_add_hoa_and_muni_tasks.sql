-- =====================================================
-- ADD HOA ACQUISITION AND MUNICIPAL LIEN TASKS
-- Based on workflow types and agent capabilities
-- =====================================================

-- Insert tasks for HOA-0002 workflow (HOA Acquisition)
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
-- HOA-0002 Tasks
-- Task 1: Find HOA Contact Information
(
    'HOA-0002',
    'Find HOA Contact Information',
    'Research and locate HOA management company and contact details',
    'COMPLETED',
    'AI',
    'HIGH',
    '{
        "agent_name": "Nina",
        "agent_emoji": "🔍",
        "confidence": 92,
        "hoa_found": true,
        "management_company": "Sunshine Property Management",
        "contact_person": "Michelle Torres",
        "phone_number": "(407) 555-0198",
        "email": "hoa@sunshinepm.com",
        "hoa_name": "Paradise Lane Homeowners Association"
    }',
    '2025-07-03T21:26:49Z',
    '2025-07-03T21:45:00Z',
    '2025-07-03T21:45:00Z',
    '2025-07-03T22:30:00Z'
),

-- Task 2: Email HOA Document Request
(
    'HOA-0002',
    'Email HOA Document Request',
    'Send formal email request for HOA documents and certificates',
    'COMPLETED',
    'AI',
    'HIGH',
    '{
        "agent_name": "Mia",
        "agent_emoji": "📧",
        "email_sent": true,
        "sent_to": "hoa@sunshinepm.com",
        "sent_time": "2025-07-03T22:15:00Z",
        "template_used": "HOA Document Request",
        "documents_requested": [
            "Certificate of Good Standing",
            "Current Budget",
            "Meeting Minutes",
            "Bylaws and CC&Rs",
            "Financial Statements"
        ]
    }',
    '2025-07-03T21:45:00Z',
    '2025-07-03T22:15:00Z',
    '2025-07-03T22:15:00Z',
    '2025-07-04T09:00:00Z'
),

-- Task 3: Phone Follow-up
(
    'HOA-0002',
    'Phone Follow-up',
    'Follow up via phone call to ensure request was received and expedite processing',
    'PENDING',
    'AI',
    'NORMAL',
    '{
        "agent_name": "Florian",
        "agent_emoji": "🗣️",
        "call_attempts": 2,
        "last_attempt": "2025-07-04T10:30:00Z",
        "contact_reached": true,
        "spoke_with": "Michelle Torres",
        "outcome": "Confirmed receipt, documents ready by end of day",
        "callback_scheduled": "2025-07-04T16:00:00Z"
    }',
    '2025-07-04T09:00:00Z',
    '2025-07-04T10:30:00Z',
    null,
    '2025-07-04T12:00:00Z'
),

-- Task 4: HOA Document Analysis
(
    'HOA-0002',
    'HOA Document Analysis',
    'Review and analyze received HOA documents for completeness and compliance',
    'PENDING',
    'AI',
    'NORMAL',
    '{
        "agent_name": "Corey",
        "agent_emoji": "🏢",
        "depends_on": ["phone-followup"],
        "analysis_checklist": [
            "Certificate validity",
            "Assessment status",
            "Violation history",
            "Financial health",
            "Governing documents review"
        ]
    }',
    '2025-07-04T12:00:00Z',
    '2025-07-04T12:00:00Z',
    null,
    '2025-07-04T18:00:00Z'
),

-- Task 5: Quality Review and Package
(
    'HOA-0002',
    'Quality Review and Package',
    'Final quality review and package all HOA documents for client delivery',
    'PENDING',
    'AI',
    'NORMAL',
    '{
        "agent_name": "Cassy",
        "agent_emoji": "✓",
        "depends_on": ["hoa-analysis"],
        "deliverable_format": "PDF package",
        "quality_checks": [
            "Document completeness",
            "Date validity",
            "Signature verification",
            "Format compliance"
        ]
    }',
    '2025-07-04T18:00:00Z',
    '2025-07-04T18:00:00Z',
    null,
    '2025-07-05T10:00:00Z'
);

-- Insert tasks for MUNI-0001 workflow (Municipal Lien Search)
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
-- MUNI-0001 Tasks
-- Task 1: Research Municipality
(
    'MUNI-0001',
    'Research Municipality',
    'Identify the correct municipal authority and available search methods',
    'COMPLETED',
    'AI',
    'HIGH',
    '{
        "agent_name": "Nina",
        "agent_emoji": "🔍",
        "confidence": 98,
        "municipality": "City of Tampa",
        "department": "Code Enforcement",
        "search_methods": ["online_portal", "phone_inquiry"],
        "portal_url": "https://tampa.gov/code-enforcement",
        "phone": "(813) 274-8211"
    }',
    '2025-07-03T21:27:13Z',
    '2025-07-03T21:40:00Z',
    '2025-07-03T21:40:00Z',
    '2025-07-03T22:00:00Z'
),

-- Task 2: Portal Access and Search
(
    'MUNI-0001',
    'Portal Access and Search',
    'Access municipal portal and conduct comprehensive lien search',
    'COMPLETED',
    'AI',
    'HIGH',
    '{
        "agent_name": "Rex",
        "agent_emoji": "🌐",
        "portal_access": "successful",
        "search_completed": true,
        "property_found": true,
        "liens_found": 2,
        "search_date": "2025-07-04T08:30:00Z",
        "parcel_number": "123456789",
        "liens_summary": [
            {
                "type": "Code Violation",
                "amount": 250.00,
                "date": "2023-08-15",
                "status": "Active"
            },
            {
                "type": "Utility Lien",
                "amount": 89.50,
                "date": "2024-01-10",
                "status": "Active"
            }
        ]
    }',
    '2025-07-03T22:00:00Z',
    '2025-07-04T08:45:00Z',
    '2025-07-04T08:45:00Z',
    '2025-07-04T10:00:00Z'
),

-- Task 3: Document Processing
(
    'MUNI-0001',
    'Document Processing',
    'Process and extract data from municipal lien search results',
    'AWAITING_REVIEW',
    'AI',
    'NORMAL',
    '{
        "agent_name": "Iris",
        "agent_emoji": "📄",
        "documents_processed": 4,
        "extraction_confidence": 89,
        "total_lien_amount": 339.50,
        "review_required": true,
        "review_reason": "Multiple lien types detected, verification recommended",
        "processed_files": [
            "code_violation_report.pdf",
            "utility_lien_notice.pdf",
            "property_history.pdf",
            "municipal_search_results.pdf"
        ]
    }',
    '2025-07-04T08:45:00Z',
    '2025-07-04T09:15:00Z',
    null,
    '2025-07-04T12:00:00Z'
),

-- Task 4: Lien Validation
(
    'MUNI-0001',
    'Lien Validation',
    'Validate lien amounts and status with municipal records',
    'PENDING',
    'AI',
    'NORMAL',
    '{
        "agent_name": "Nina",
        "agent_emoji": "🔍",
        "depends_on": ["document-processing"],
        "validation_method": "phone_verification",
        "liens_to_verify": 2,
        "contact_department": "Tampa Code Enforcement"
    }',
    '2025-07-04T12:00:00Z',
    '2025-07-04T12:00:00Z',
    null,
    '2025-07-04T15:00:00Z'
),

-- Task 5: Generate Lien Report
(
    'MUNI-0001',
    'Generate Lien Report',
    'Compile comprehensive municipal lien search report for client',
    'PENDING',
    'AI',
    'NORMAL',
    '{
        "agent_name": "Cassy",
        "agent_emoji": "✓",
        "depends_on": ["lien-validation"],
        "report_sections": [
            "Executive Summary",
            "Property Information",
            "Lien Details",
            "Recommendations",
            "Supporting Documentation"
        ],
        "delivery_format": "PDF report with attachments"
    }',
    '2025-07-04T15:00:00Z',
    '2025-07-04T15:00:00Z',
    null,
    '2025-07-04T17:00:00Z'
),

-- Task 6: Client Notification
(
    'MUNI-0001',
    'Client Notification',
    'Notify client of lien search completion and provide recommendations',
    'PENDING',
    'AI',
    'LOW',
    '{
        "agent_name": "Ria",
        "agent_emoji": "👩‍💼",
        "depends_on": ["generate-report"],
        "notification_method": "email_with_attachment",
        "urgency_level": "medium",
        "include_recommendations": true
    }',
    '2025-07-04T17:00:00Z',
    '2025-07-04T17:00:00Z',
    null,
    '2025-07-04T18:00:00Z'
);