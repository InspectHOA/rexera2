-- Fixed comprehensive seed data for Rexera 2.0 platform
-- This version resolves auth dependencies and UUID issues

-- =====================================================
-- 1. SEED CLIENTS
-- =====================================================
INSERT INTO "public"."clients" ("name", "domain") VALUES
('Prestige Title Co.', 'prestige-title.com'),
('Gateway Escrow', 'gateway-escrow.com'),
('Secure Closing Services', 'secure-closing.com');

-- =====================================================
-- 2. SEED AGENTS (All 10 Rexera Agents)
-- =====================================================
INSERT INTO "public"."agents" ("name", "type", "description", "capabilities", "api_endpoint", "configuration", "is_active") VALUES
('nina', 'research', 'Research and Data Discovery Agent', ARRAY['document_search', 'data_extraction', 'web_research'], 'https://nina.rexera-agents.com', '{"timeout": 30000, "retries": 3}', true),
('mia', 'communication', 'Email Communication Agent', ARRAY['email_sending', 'template_processing'], 'https://mia.rexera-agents.com', '{"timeout": 15000, "retries": 2}', true),
('florian', 'communication', 'Phone Outreach Agent', ARRAY['phone_calling', 'ivr_navigation'], 'https://florian.rexera-agents.com', '{"timeout": 60000, "retries": 1}', true),
('rex', 'automation', 'Web Portal Navigation Agent', ARRAY['portal_login', 'form_filling'], 'https://rex.rexera-agents.com', '{"timeout": 45000, "retries": 2}', true),
('iris', 'document_processing', 'Document Analysis Agent', ARRAY['document_parsing', 'ocr', 'data_extraction'], 'https://iris.rexera-agents.com', '{"timeout": 90000, "retries": 1}', true),
('ria', 'support', 'Support and Coordination Agent', ARRAY['status_updates', 'client_communication'], 'https://ria.rexera-agents.com', '{"timeout": 20000, "retries": 2}', true),
('kosha', 'financial', 'Financial Analysis Agent', ARRAY['cost_calculation', 'invoice_processing'], 'https://kosha.rexera-agents.com', '{"timeout": 30000, "retries": 2}', true),
('cassy', 'quality_assurance', 'Quality Validation Agent', ARRAY['data_validation', 'quality_checks'], 'https://cassy.rexera-agents.com', '{"timeout": 25000, "retries": 3}', true),
('max', 'communication', 'IVR Navigation Agent', ARRAY['ivr_navigation', 'phone_automation'], 'https://max.rexera-agents.com', '{"timeout": 120000, "retries": 1}', true),
('corey', 'specialist', 'HOA Specialist Agent', ARRAY['hoa_document_processing', 'estoppel_requests'], 'https://corey.rexera-agents.com', '{"timeout": 45000, "retries": 2}', true);

-- =====================================================
-- 3. CREATE MOCK AUTH USER AND USER PROFILE
-- =====================================================
-- Create a mock auth user (bypass RLS by using service role)
DO $$
DECLARE
    mock_user_id UUID := '8a7b3c2e-3e4f-4b1a-8c9d-2e3f4b1a8c9d';
BEGIN
    -- Try to insert into auth.users
    BEGIN
        INSERT INTO auth.users (
            id, 
            instance_id, 
            aud, 
            role, 
            email, 
            encrypted_password, 
            email_confirmed_at, 
            created_at, 
            updated_at, 
            confirmation_token, 
            email_change, 
            email_change_token_new, 
            recovery_token
        ) VALUES (
            mock_user_id,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'test@rexera.com',
            '$2a$10$test.encrypted.password.hash.placeholder',
            NOW(),
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        );
    EXCEPTION 
        WHEN unique_violation THEN
            -- User already exists, continue
            NULL;
    END;
END $$;

-- Create user profile
INSERT INTO "public"."user_profiles" ("id", "user_type", "email", "full_name", "role", "company_id") VALUES
('8a7b3c2e-3e4f-4b1a-8c9d-2e3f4b1a8c9d', 'hil_user', 'test@rexera.com', 'Test HIL User', 'HIL', NULL);

-- =====================================================
-- 4. SEED WORKFLOWS 
-- =====================================================

-- Workflow 1: In Progress Payoff Request
INSERT INTO "public"."workflows" ("workflow_type", "client_id", "title", "description", "status", "priority", "metadata", "created_by", "due_date") VALUES
('PAYOFF_REQUEST', (SELECT id FROM clients WHERE name = 'Prestige Title Co.' LIMIT 1), 'Payoff Request - 123 Main St', 'Payoff request for John Doe loan LN123456', 'IN_PROGRESS', 'HIGH', '{"property_address": "123 Main St, Anytown, USA", "borrower_name": "John Doe", "loan_number": "LN123456", "estimated_balance": 250000.00, "lender_name": "Wells Fargo"}', '8a7b3c2e-3e4f-4b1a-8c9d-2e3f4b1a8c9d', NOW() + INTERVAL '5 days');

-- Workflow 2: Completed Payoff Request  
INSERT INTO "public"."workflows" ("workflow_type", "client_id", "title", "description", "status", "priority", "metadata", "created_by", "completed_at") VALUES
('PAYOFF_REQUEST', (SELECT id FROM clients WHERE name = 'Gateway Escrow' LIMIT 1), 'Payoff Request - 456 Oak Ave', 'Payoff request for Jane Smith loan LN654321', 'COMPLETED', 'NORMAL', '{"property_address": "456 Oak Ave, Sometown, USA", "borrower_name": "Jane Smith", "loan_number": "LN654321", "estimated_balance": 175000.00, "lender_name": "Bank of America"}', '8a7b3c2e-3e4f-4b1a-8c9d-2e3f4b1a8c9d', NOW() - INTERVAL '1 day');

-- Workflow 3: Blocked HOA Acquisition
INSERT INTO "public"."workflows" ("workflow_type", "client_id", "title", "description", "status", "priority", "metadata", "created_by") VALUES
('HOA_ACQUISITION', (SELECT id FROM clients WHERE name = 'Secure Closing Services' LIMIT 1), 'HOA Estoppel - 789 Pine Ln', 'HOA estoppel request for Peter Jones property', 'BLOCKED', 'URGENT', '{"property_address": "789 Pine Ln, Othertown, USA", "borrower_name": "Peter Jones", "estimated_balance": 5000.00, "hoa_name": "Pine Meadows HOA"}', '8a7b3c2e-3e4f-4b1a-8c9d-2e3f4b1a8c9d');

-- Workflow 4: Pending Municipal Lien Search
INSERT INTO "public"."workflows" ("workflow_type", "client_id", "title", "description", "status", "priority", "metadata", "created_by") VALUES
('MUNI_LIEN_SEARCH', (SELECT id FROM clients WHERE name = 'Prestige Title Co.' LIMIT 1), 'Municipal Lien Search - 101 Maple Dr', 'Municipal lien search for Mary Williams property', 'PENDING', 'NORMAL', '{"property_address": "101 Maple Dr, Anycity, USA", "borrower_name": "Mary Williams", "estimated_balance": 1200.00}', '8a7b3c2e-3e4f-4b1a-8c9d-2e3f4b1a8c9d');

-- Workflow 5: Another In Progress Workflow
INSERT INTO "public"."workflows" ("workflow_type", "client_id", "title", "description", "status", "priority", "metadata", "created_by") VALUES
('PAYOFF_REQUEST', (SELECT id FROM clients WHERE name = 'Gateway Escrow' LIMIT 1), 'Payoff Request - 555 Broadway', 'Payoff request for Robert Wilson loan LN789123', 'IN_PROGRESS', 'NORMAL', '{"property_address": "555 Broadway, Capital City, USA", "borrower_name": "Robert Wilson", "loan_number": "LN789123", "estimated_balance": 320000.00, "lender_name": "Chase Bank"}', '8a7b3c2e-3e4f-4b1a-8c9d-2e3f4b1a8c9d');

-- =====================================================
-- 5. SEED TASK EXECUTIONS
-- =====================================================

-- Get workflow and agent IDs for referencing
DO $$
DECLARE
    workflow1_id UUID;
    workflow2_id UUID; 
    workflow3_id UUID;
    workflow5_id UUID;
    nina_id UUID;
    mia_id UUID;
    corey_id UUID;
    ria_id UUID;
BEGIN
    -- Get workflow IDs
    SELECT id INTO workflow1_id FROM workflows WHERE title = 'Payoff Request - 123 Main St' LIMIT 1;
    SELECT id INTO workflow2_id FROM workflows WHERE title = 'Payoff Request - 456 Oak Ave' LIMIT 1;
    SELECT id INTO workflow3_id FROM workflows WHERE title = 'HOA Estoppel - 789 Pine Ln' LIMIT 1;
    SELECT id INTO workflow5_id FROM workflows WHERE title = 'Payoff Request - 555 Broadway' LIMIT 1;
    
    -- Get agent IDs
    SELECT id INTO nina_id FROM agents WHERE name = 'nina' LIMIT 1;
    SELECT id INTO mia_id FROM agents WHERE name = 'mia' LIMIT 1;
    SELECT id INTO corey_id FROM agents WHERE name = 'corey' LIMIT 1;
    SELECT id INTO ria_id FROM agents WHERE name = 'ria' LIMIT 1;

    -- Task Executions for Workflow 1 (In Progress)
    INSERT INTO "public"."task_executions" ("workflow_id", "agent_id", "title", "description", "sequence_order", "task_type", "status", "executor_type", "priority", "input_data", "output_data", "started_at", "completed_at", "execution_time_ms", "retry_count") VALUES
    (workflow1_id, nina_id, 'Identify Lender', 'Research and identify the current lender', 1, 'identify_lender_contact', 'COMPLETED', 'AI', 'HIGH', '{"loan_number": "LN123456"}', '{"lender_name": "Wells Fargo", "confidence": 0.95}', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour 55 minutes', 300000, 0),
    
    (workflow1_id, nina_id, 'Research Contact Information', 'Find correct contact person at lender', 2, 'research_lender_contact', 'AWAITING_REVIEW', 'AI', 'HIGH', '{"lender_name": "Wells Fargo"}', '{"contact_name": "Sarah Johnson", "email": "payoffs@wellsfargo.com"}', NOW() - INTERVAL '1 hour 55 minutes', NOW() - INTERVAL '30 minutes', 5100000, 1),
    
    (workflow1_id, mia_id, 'Submit Payoff Request', 'Send formal payoff request to lender', 3, 'submit_payoff_request', 'PENDING', 'AI', 'HIGH', '{"contact_email": "payoffs@wellsfargo.com"}', NULL, NULL, NULL, NULL, 0),
    
    (workflow1_id, ria_id, 'Deliver Payoff Statement', 'Provide final payoff statement to client', 4, 'deliver_payoff_statement', 'PENDING', 'AI', 'NORMAL', '{"client_id": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d"}', NULL, NULL, NULL, NULL, 0);

    -- Task Executions for Workflow 2 (Completed)
    INSERT INTO "public"."task_executions" ("workflow_id", "agent_id", "title", "description", "sequence_order", "task_type", "status", "executor_type", "priority", "input_data", "output_data", "started_at", "completed_at", "execution_time_ms", "retry_count") VALUES
    (workflow2_id, nina_id, 'Identify Lender', 'Research and identify the current lender', 1, 'identify_lender_contact', 'COMPLETED', 'AI', 'NORMAL', '{"loan_number": "LN654321"}', '{"lender_name": "Bank of America", "confidence": 0.98}', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '5 minutes', 300000, 0),
    
    (workflow2_id, mia_id, 'Submit Payoff Request', 'Send formal payoff request to lender', 2, 'submit_payoff_request', 'COMPLETED', 'AI', 'NORMAL', '{"contact_email": "payoffs@bofa.com"}', '{"request_sent": true, "confirmation_number": "PAY123456"}', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '1 hour', 3600000, 0),
    
    (workflow2_id, ria_id, 'Deliver Payoff Statement', 'Provide final payoff statement to client', 3, 'deliver_payoff_statement', 'COMPLETED', 'AI', 'NORMAL', '{"payoff_amount": 175250.42}', '{"delivered": true, "delivery_method": "email"}', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '15 minutes', 900000, 0);

    -- Task Executions for Workflow 3 (Blocked)
    INSERT INTO "public"."task_executions" ("workflow_id", "agent_id", "title", "description", "sequence_order", "task_type", "status", "interrupt_type", "executor_type", "priority", "input_data", "output_data", "error_message", "started_at", "completed_at", "execution_time_ms", "retry_count") VALUES
    (workflow3_id, corey_id, 'Identify HOA', 'Research and identify the HOA for property', 1, 'identify_hoa', 'COMPLETED', NULL, 'AI', 'URGENT', '{"property_address": "789 Pine Ln"}', '{"hoa_name": "Pine Meadows HOA"}', NULL, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '10 minutes', 600000, 0),
    
    (workflow3_id, nina_id, 'Research HOA Contact', 'Find contact information for HOA', 2, 'research_hoa_contact', 'FAILED', 'CLIENT_CLARIFICATION', 'AI', 'URGENT', '{"hoa_name": "Pine Meadows HOA"}', NULL, 'Unable to locate current contact information. Manual verification required.', NOW() - INTERVAL '1 day' + INTERVAL '10 minutes', NOW() - INTERVAL '1 day' + INTERVAL '45 minutes', 2100000, 3),
    
    (workflow3_id, corey_id, 'Request Estoppel', 'Submit formal estoppel request to HOA', 3, 'request_hoa_estoppel', 'PENDING', NULL, 'AI', 'URGENT', '{"hoa_contact": "TBD"}', NULL, NULL, NULL, NULL, NULL, 0);

    -- Task Executions for Workflow 5 (Another In Progress)
    INSERT INTO "public"."task_executions" ("workflow_id", "agent_id", "title", "description", "sequence_order", "task_type", "status", "executor_type", "priority", "input_data", "started_at", "retry_count") VALUES
    (workflow5_id, nina_id, 'Identify Lender', 'Research and identify current lender for Chase loan', 1, 'identify_lender_contact', 'PENDING', 'AI', 'NORMAL', '{"loan_number": "LN789123"}', NOW() - INTERVAL '4 hours', 0),
    
    (workflow5_id, mia_id, 'Contact Lender', 'Reach out to lender for payoff information', 2, 'contact_lender', 'PENDING', 'AI', 'NORMAL', '{"lender_contact": "TBD"}', NULL, 0);

END $$;

-- =====================================================
-- 6. SEED SOME SAMPLE DOCUMENTS
-- =====================================================
INSERT INTO "public"."documents" ("workflow_id", "filename", "url", "file_size_bytes", "mime_type", "document_type", "tags", "status", "metadata") VALUES
((SELECT id FROM workflows WHERE title = 'Payoff Request - 456 Oak Ave' LIMIT 1), 'payoff_statement_LN654321.pdf', 'https://storage.supabase.co/object/public/documents/payoff_statement_LN654321.pdf', 245760, 'application/pdf', 'DELIVERABLE', ARRAY['payoff', 'final'], 'DELIVERED', '{"pages": 2, "generated_by": "agent"}'),

((SELECT id FROM workflows WHERE title = 'Payoff Request - 123 Main St' LIMIT 1), 'lender_correspondence_LN123456.pdf', 'https://storage.supabase.co/object/public/documents/lender_correspondence_LN123456.pdf', 89432, 'application/pdf', 'WORKING', ARRAY['correspondence', 'research'], 'PROCESSING', '{"pages": 1, "source": "agent_research"}');

-- =====================================================
-- 7. SEED SOME COSTS
-- =====================================================
INSERT INTO "public"."costs" ("workflow_id", "description", "amount", "cost_type", "incurred_at") VALUES
((SELECT id FROM workflows WHERE title = 'Payoff Request - 456 Oak Ave' LIMIT 1), 'Agent execution time - Nina (identify lender)', 12.50, 'AGENT_EXECUTION', NOW() - INTERVAL '3 days'),
((SELECT id FROM workflows WHERE title = 'Payoff Request - 456 Oak Ave' LIMIT 1), 'Agent execution time - Mia (email communication)', 8.75, 'AGENT_EXECUTION', NOW() - INTERVAL '2 days'),
((SELECT id FROM workflows WHERE title = 'Payoff Request - 123 Main St' LIMIT 1), 'Agent execution time - Nina (research)', 15.25, 'AGENT_EXECUTION', NOW() - INTERVAL '1 hour');