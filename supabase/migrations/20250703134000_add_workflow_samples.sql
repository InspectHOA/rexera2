-- =====================================================
-- SAMPLE WORKFLOWS FOR TESTING
-- =====================================================

-- Create system user for workflows since they require created_by
INSERT INTO auth.users (
    id, 
    email, 
    encrypted_password, 
    email_confirmed_at, 
    created_at, 
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'system@rexera.com',
    '$2a$10$dummy.encrypted.password.hash',
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "system", "providers": ["system"]}',
    '{"full_name": "System User", "avatar_url": null}',
    false,
    'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Create user profile for system user
INSERT INTO user_profiles (
    id,
    user_type,
    full_name,
    email,
    company_id,
    role
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'hil_user',
    'System User',
    'system@rexera.com',
    NULL::uuid,
    'HIL_ADMIN'
) ON CONFLICT (id) DO NOTHING;

-- Store workflow IDs in a temporary table for reference
CREATE TEMP TABLE temp_workflow_ids (
    workflow_key TEXT,
    workflow_id UUID DEFAULT gen_random_uuid()
);

INSERT INTO temp_workflow_ids (workflow_key) VALUES 
('PAY-0891'),
('HOA-0440'), 
('MUN-0332'),
('PAY-0892'),
('HOA-0441');

-- Sample Workflows
INSERT INTO workflows (
    workflow_type,
    client_id,
    title,
    description,
    status,
    priority,
    metadata,
    created_by,
    assigned_to,
    due_date,
    created_at,
    updated_at
) 
SELECT 
    'PAYOFF'::workflow_type,
    (SELECT id FROM clients WHERE name = 'First National Bank' LIMIT 1),
    '123 Oak Street, Miami, FL 33101',
    'Payoff request for property at 123 Oak Street',
    'AWAITING_REVIEW'::workflow_status,
    'URGENT'::priority_level,
    '{
        "property_address": "123 Oak Street, Miami, FL 33101",
        "borrower_name": "John Rodriguez",
        "loan_number": "FNB-2019-445821",
        "loan_amount": 425000,
        "requested_payoff_date": "2025-07-05"
    }'::jsonb,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '2025-07-03 23:59:59'::timestamptz,
    '2025-07-02 10:30:00'::timestamptz,
    NOW()
WHERE EXISTS (SELECT 1 FROM clients WHERE name = 'First National Bank')

UNION ALL

SELECT 
    'HOA_ACQUISITION'::workflow_type,
    (SELECT id FROM clients WHERE name = 'Realty Plus' LIMIT 1),
    '456 Paradise Lane, Orlando, FL 32801',
    'HOA document acquisition for property purchase',
    'PENDING'::workflow_status,
    'NORMAL'::priority_level,
    '{
        "property_address": "456 Paradise Lane, Orlando, FL 32801",
        "borrower_name": "Maria Santos",
        "loan_number": "RP-2024-112233",
        "hoa_name": "Paradise Estates HOA",
        "closing_date": "2025-07-15"
    }'::jsonb,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '2025-07-04 17:00:00'::timestamptz,
    '2025-07-02 14:15:00'::timestamptz,
    NOW()
WHERE EXISTS (SELECT 1 FROM clients WHERE name = 'Realty Plus')

UNION ALL

SELECT 
    'MUNI_LIEN_SEARCH'::workflow_type,
    (SELECT id FROM clients WHERE name = 'City Bank' LIMIT 1),
    '789 Pine Avenue, Tampa, FL 33602',
    'Municipal lien search for property title clearance',
    'COMPLETED'::workflow_status,
    'NORMAL'::priority_level,
    '{
        "property_address": "789 Pine Avenue, Tampa, FL 33602",
        "borrower_name": "David Kim",
        "loan_number": "CB-2024-998877",
        "municipality": "City of Tampa",
        "parcel_id": "12-34-56-789"
    }'::jsonb,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '2025-07-02 16:00:00'::timestamptz,
    '2025-07-01 09:00:00'::timestamptz,
    NOW()
WHERE EXISTS (SELECT 1 FROM clients WHERE name = 'City Bank')

UNION ALL

SELECT 
    'PAYOFF'::workflow_type,
    (SELECT id FROM clients WHERE name = 'Citizens Bank' LIMIT 1),
    '567 Maple Drive, Jacksonville, FL 32207',
    'Urgent payoff request for commercial property',
    'PENDING'::workflow_status,
    'HIGH'::priority_level,
    '{
        "property_address": "567 Maple Drive, Jacksonville, FL 32207",
        "borrower_name": "ABC Properties LLC",
        "loan_number": "CB-2023-778899",
        "loan_amount": 1200000,
        "property_type": "commercial"
    }'::jsonb,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '2025-07-05 12:00:00'::timestamptz,
    '2025-07-03 08:45:00'::timestamptz,
    NOW()
WHERE EXISTS (SELECT 1 FROM clients WHERE name = 'Citizens Bank')

UNION ALL

SELECT 
    'HOA_ACQUISITION'::workflow_type,
    (SELECT id FROM clients WHERE name = 'Sunshine Mortgage' LIMIT 1),
    '890 Beach Boulevard, Fort Lauderdale, FL 33304',
    'HOA certification and financial documents needed',
    'PENDING'::workflow_status,
    'NORMAL'::priority_level,
    '{
        "property_address": "890 Beach Boulevard, Fort Lauderdale, FL 33304",
        "borrower_name": "Jennifer Walsh",
        "loan_number": "SM-2024-445566",
        "hoa_name": "Oceanview Towers Condominium Association"
    }'::jsonb,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '2025-07-06 15:30:00'::timestamptz,
    '2025-07-03 11:20:00'::timestamptz,
    NOW()
WHERE EXISTS (SELECT 1 FROM clients WHERE name = 'Sunshine Mortgage');

-- Update completed workflow with completion timestamp
UPDATE workflows 
SET completed_at = '2025-07-02 11:15:00'::timestamptz
WHERE status = 'COMPLETED' 
AND title = '789 Pine Avenue, Tampa, FL 33602';

-- Sample Tasks for the workflows (simplified without hardcoded IDs)
INSERT INTO tasks (
    workflow_id,
    title,
    description,
    executor_type,
    status,
    priority,
    assigned_to,
    metadata,
    due_date,
    created_at,
    updated_at
) 
SELECT 
    w.id,
    'Lookup Lender',
    'Research and identify the correct payoff contact information',
    'AI'::executor_type,
    'COMPLETED'::task_status,
    'HIGH'::priority_level,
    NULL::uuid,
    '{"lender_found": true, "contact_verified": true, "agent_name": "Nina"}'::jsonb,
    '2025-07-02 12:00:00'::timestamptz,
    '2025-07-02 10:30:00'::timestamptz,
    '2025-07-02 11:45:00'::timestamptz
FROM workflows w
WHERE w.title = '123 Oak Street, Miami, FL 33101'
AND w.workflow_type = 'PAYOFF'

UNION ALL

SELECT 
    w.id,
    'Process Document',
    'Review and process the payoff statement document',
    'AI'::executor_type,
    'AWAITING_REVIEW'::task_status,
    'URGENT'::priority_level,
    NULL::uuid,
    '{"document_type": "payoff_statement", "agent_name": "Iris", "review_required": true}'::jsonb,
    '2025-07-03 14:00:00'::timestamptz,
    '2025-07-02 12:00:00'::timestamptz,
    NOW()
FROM workflows w
WHERE w.title = '123 Oak Street, Miami, FL 33101'
AND w.workflow_type = 'PAYOFF'

UNION ALL

SELECT 
    w.id,
    'Research HOA',
    'Identify HOA management company and contact information',
    'AI'::executor_type,
    'COMPLETED'::task_status,
    'NORMAL'::priority_level,
    NULL::uuid,
    '{"hoa_identified": true, "management_company": "Paradise Management Group", "agent_name": "Corey"}'::jsonb,
    '2025-07-02 17:00:00'::timestamptz,
    '2025-07-02 14:15:00'::timestamptz,
    '2025-07-02 16:30:00'::timestamptz
FROM workflows w
WHERE w.title = '456 Paradise Lane, Orlando, FL 32801'
AND w.workflow_type = 'HOA_ACQUISITION'

UNION ALL

SELECT 
    w.id,
    'Request Documents',
    'Contact HOA to request required documents and certificates',
    'AI'::executor_type,
    'PENDING'::task_status,
    'NORMAL'::priority_level,
    NULL::uuid,
    '{"documents_requested": ["hoa_certificate", "financial_statement", "bylaws"], "agent_name": "Mia"}'::jsonb,
    '2025-07-04 10:00:00'::timestamptz,
    '2025-07-02 16:30:00'::timestamptz,
    NOW()
FROM workflows w
WHERE w.title = '456 Paradise Lane, Orlando, FL 32801'
AND w.workflow_type = 'HOA_ACQUISITION'

UNION ALL

SELECT 
    w.id,
    'Municipal Search',
    'Search municipal records for liens and violations',
    'AI'::executor_type,
    'COMPLETED'::task_status,
    'NORMAL'::priority_level,
    NULL::uuid,
    '{"liens_found": false, "violations_found": false, "search_complete": true, "agent_name": "Nina"}'::jsonb,
    '2025-07-01 15:00:00'::timestamptz,
    '2025-07-01 09:00:00'::timestamptz,
    '2025-07-01 14:30:00'::timestamptz
FROM workflows w
WHERE w.title = '789 Pine Avenue, Tampa, FL 33602'
AND w.workflow_type = 'MUNI_LIEN_SEARCH'

UNION ALL

SELECT 
    w.id,
    'Generate Report',
    'Compile and generate the municipal lien search report',
    'AI'::executor_type,
    'COMPLETED'::task_status,
    'NORMAL'::priority_level,
    NULL::uuid,
    '{"report_generated": true, "clean_title": true, "agent_name": "Iris"}'::jsonb,
    '2025-07-02 12:00:00'::timestamptz,
    '2025-07-01 14:30:00'::timestamptz,
    '2025-07-02 11:15:00'::timestamptz
FROM workflows w
WHERE w.title = '789 Pine Avenue, Tampa, FL 33602'
AND w.workflow_type = 'MUNI_LIEN_SEARCH';

-- Log the sample data creation
INSERT INTO audit_events (
    actor_type, actor_id, actor_name,
    event_type, action,
    resource_type, resource_id,
    event_data
) VALUES (
    'system', 'migration', 'Database Seed System',
    'data.seeded', 'create',
    'workflows', gen_random_uuid(),
    '{"migration": "add_workflow_samples", "version": "20250703134000", "workflows": 5, "tasks": 6, "system_user_created": true}'
) ON CONFLICT DO NOTHING;