-- Simple working seed data for Rexera 2.0 platform
-- This avoids auth dependencies and uses only basic required fields

-- =====================================================
-- 1. SEED CLIENTS
-- =====================================================
INSERT INTO "public"."clients" ("name", "domain") VALUES
('Prestige Title Co.', 'prestige-title.com'),
('Gateway Escrow', 'gateway-escrow.com'),
('Secure Closing Services', 'secure-closing.com');

-- =====================================================
-- 2. SEED AGENTS
-- =====================================================
INSERT INTO "public"."agents" ("name", "type", "description", "capabilities") VALUES
('nina', 'research', 'Research and Data Discovery Agent', ARRAY['document_search', 'data_extraction']),
('mia', 'communication', 'Email Communication Agent', ARRAY['email_sending', 'template_processing']),
('florian', 'communication', 'Phone Outreach Agent', ARRAY['phone_calling', 'ivr_navigation']),
('rex', 'automation', 'Web Portal Navigation Agent', ARRAY['portal_login', 'form_filling']),
('iris', 'document_processing', 'Document Analysis Agent', ARRAY['document_parsing', 'ocr']),
('ria', 'support', 'Support and Coordination Agent', ARRAY['status_updates', 'client_communication']),
('kosha', 'financial', 'Financial Analysis Agent', ARRAY['cost_calculation', 'invoice_processing']),
('cassy', 'quality_assurance', 'Quality Validation Agent', ARRAY['data_validation', 'quality_checks']),
('max', 'communication', 'IVR Navigation Agent', ARRAY['ivr_navigation', 'phone_automation']),
('corey', 'specialist', 'HOA Specialist Agent', ARRAY['hoa_document_processing', 'estoppel_requests']);

-- =====================================================
-- 3. SEED WORKFLOWS (Without created_by for now)
-- =====================================================

-- Get client IDs for foreign key references
DO $$
DECLARE
    prestige_id UUID;
    gateway_id UUID;
    secure_id UUID;
    nina_id UUID;
    mia_id UUID;
    corey_id UUID;
    workflow1_id UUID;
    workflow2_id UUID;
    workflow3_id UUID;
    workflow4_id UUID;
    workflow5_id UUID;
BEGIN
    -- Get client IDs
    SELECT id INTO prestige_id FROM clients WHERE name = 'Prestige Title Co.' LIMIT 1;
    SELECT id INTO gateway_id FROM clients WHERE name = 'Gateway Escrow' LIMIT 1;
    SELECT id INTO secure_id FROM clients WHERE name = 'Secure Closing Services' LIMIT 1;
    
    -- Get agent IDs
    SELECT id INTO nina_id FROM agents WHERE name = 'nina' LIMIT 1;
    SELECT id INTO mia_id FROM agents WHERE name = 'mia' LIMIT 1;
    SELECT id INTO corey_id FROM agents WHERE name = 'corey' LIMIT 1;

    -- Insert workflows with proper IDs
    INSERT INTO "public"."workflows" ("workflow_type", "client_id", "title", "description", "status", "priority", "metadata") VALUES
    ('PAYOFF', prestige_id, 'Payoff Request - 123 Main St', 'Payoff request for John Doe loan LN123456', 'IN_PROGRESS', 'HIGH', '{"property_address": "123 Main St, Anytown, USA", "borrower_name": "John Doe", "loan_number": "LN123456", "estimated_balance": 250000.00}')
    RETURNING id INTO workflow1_id;

    INSERT INTO "public"."workflows" ("workflow_type", "client_id", "title", "description", "status", "priority", "metadata") VALUES
    ('PAYOFF', gateway_id, 'Payoff Request - 456 Oak Ave', 'Payoff request for Jane Smith loan LN654321', 'COMPLETED', 'NORMAL', '{"property_address": "456 Oak Ave, Sometown, USA", "borrower_name": "Jane Smith", "loan_number": "LN654321", "estimated_balance": 175000.00}')
    RETURNING id INTO workflow2_id;

    INSERT INTO "public"."workflows" ("workflow_type", "client_id", "title", "description", "status", "priority", "metadata") VALUES
    ('HOA_ACQUISITION', secure_id, 'HOA Estoppel - 789 Pine Ln', 'HOA estoppel request for Peter Jones property', 'BLOCKED', 'URGENT', '{"property_address": "789 Pine Ln, Othertown, USA", "borrower_name": "Peter Jones", "estimated_balance": 5000.00}')
    RETURNING id INTO workflow3_id;

    INSERT INTO "public"."workflows" ("workflow_type", "client_id", "title", "description", "status", "priority", "metadata") VALUES
    ('MUNI_LIEN_SEARCH', prestige_id, 'Municipal Lien Search - 101 Maple Dr', 'Municipal lien search for Mary Williams property', 'PENDING', 'NORMAL', '{"property_address": "101 Maple Dr, Anycity, USA", "borrower_name": "Mary Williams", "estimated_balance": 1200.00}')
    RETURNING id INTO workflow4_id;

    INSERT INTO "public"."workflows" ("workflow_type", "client_id", "title", "description", "status", "priority", "metadata") VALUES
    ('PAYOFF', gateway_id, 'Payoff Request - 555 Broadway', 'Payoff request for Robert Wilson loan LN789123', 'IN_PROGRESS', 'NORMAL', '{"property_address": "555 Broadway, Capital City, USA", "borrower_name": "Robert Wilson", "loan_number": "LN789123", "estimated_balance": 320000.00}')
    RETURNING id INTO workflow5_id;

    -- Insert task executions for workflow 1
    INSERT INTO "public"."task_executions" ("workflow_id", "agent_id", "title", "description", "sequence_order", "task_type", "status", "executor_type", "priority", "input_data", "output_data") VALUES
    (workflow1_id, nina_id, 'Identify Lender', 'Research and identify the current lender for the property', 1, 'identify_lender_contact', 'COMPLETED', 'AI', 'HIGH', '{"loan_number": "LN123456"}', '{"lender_name": "Wells Fargo", "confidence": 0.95}'),
    (workflow1_id, nina_id, 'Research Contact Information', 'Find the correct contact person at the lender', 2, 'research_lender_contact', 'AWAITING_REVIEW', 'AI', 'HIGH', '{"lender_name": "Wells Fargo"}', '{"contact_name": "Sarah Johnson", "email": "payoffs@wellsfargo.com"}'),
    (workflow1_id, mia_id, 'Submit Payoff Request', 'Send formal payoff request to the lender', 3, 'submit_payoff_request', 'PENDING', 'AI', 'HIGH', '{"contact_email": "payoffs@wellsfargo.com"}', NULL),
    (workflow1_id, mia_id, 'Deliver Payoff Statement', 'Provide final payoff statement to client', 4, 'deliver_payoff_statement', 'PENDING', 'AI', 'NORMAL', '{}', NULL);

    -- Insert task executions for workflow 2 (completed)
    INSERT INTO "public"."task_executions" ("workflow_id", "agent_id", "title", "description", "sequence_order", "task_type", "status", "executor_type", "priority", "input_data", "output_data") VALUES
    (workflow2_id, nina_id, 'Identify Lender', 'Research and identify the current lender', 1, 'identify_lender_contact', 'COMPLETED', 'AI', 'NORMAL', '{"loan_number": "LN654321"}', '{"lender_name": "Bank of America", "confidence": 0.98}'),
    (workflow2_id, mia_id, 'Submit Payoff Request', 'Send formal payoff request', 2, 'submit_payoff_request', 'COMPLETED', 'AI', 'NORMAL', '{}', '{"request_sent": true, "confirmation_number": "PAY123456"}'),
    (workflow2_id, mia_id, 'Deliver Payoff Statement', 'Provide final payoff statement', 3, 'deliver_payoff_statement', 'COMPLETED', 'AI', 'NORMAL', '{}', '{"delivered": true, "delivery_method": "email"}');

    -- Insert task executions for workflow 3 (blocked)
    INSERT INTO "public"."task_executions" ("workflow_id", "agent_id", "title", "description", "sequence_order", "task_type", "status", "interrupt_type", "executor_type", "priority", "input_data", "error_message") VALUES
    (workflow3_id, corey_id, 'Identify HOA', 'Research and identify the HOA', 1, 'identify_hoa', 'COMPLETED', NULL, 'AI', 'URGENT', '{}', NULL),
    (workflow3_id, nina_id, 'Research HOA Contact', 'Find contact information for the HOA', 2, 'research_hoa_contact', 'FAILED', 'CLIENT_CLARIFICATION', 'AI', 'URGENT', '{}', 'Unable to locate current contact information. Manual verification required.'),
    (workflow3_id, corey_id, 'Request Estoppel', 'Submit formal estoppel request', 3, 'request_hoa_estoppel', 'PENDING', NULL, 'AI', 'URGENT', '{}', NULL);

    -- Insert some task executions for workflow 4 and 5
    INSERT INTO "public"."task_executions" ("workflow_id", "agent_id", "title", "description", "sequence_order", "task_type", "status", "executor_type", "priority", "input_data") VALUES
    (workflow4_id, nina_id, 'Research Municipal Records', 'Search municipal records for liens', 1, 'research_municipal_liens', 'PENDING', 'AI', 'NORMAL', '{}'),
    (workflow5_id, nina_id, 'Identify Lender', 'Research and identify the current lender', 1, 'identify_lender_contact', 'PENDING', 'AI', 'NORMAL', '{}');

END $$;