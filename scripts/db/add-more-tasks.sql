-- Add more task executions to PAY-250706-001 for scrolling test
-- Get the workflow ID for PAY-250706-001
DO $$
DECLARE
    workflow_id UUID;
    nina_id UUID;
    mia_id UUID;
    florian_id UUID;
    rex_id UUID;
    iris_id UUID;
    ria_id UUID;
    kosha_id UUID;
    cassy_id UUID;
    max_id UUID;
    corey_id UUID;
BEGIN
    -- Get workflow ID
    SELECT id INTO workflow_id FROM workflows WHERE human_readable_id = 'PAY-250706-001' LIMIT 1;
    
    -- Get agent IDs
    SELECT id INTO nina_id FROM agents WHERE name = 'nina' LIMIT 1;
    SELECT id INTO mia_id FROM agents WHERE name = 'mia' LIMIT 1;
    SELECT id INTO florian_id FROM agents WHERE name = 'florian' LIMIT 1;
    SELECT id INTO rex_id FROM agents WHERE name = 'rex' LIMIT 1;
    SELECT id INTO iris_id FROM agents WHERE name = 'iris' LIMIT 1;
    SELECT id INTO ria_id FROM agents WHERE name = 'ria' LIMIT 1;
    SELECT id INTO kosha_id FROM agents WHERE name = 'kosha' LIMIT 1;
    SELECT id INTO cassy_id FROM agents WHERE name = 'cassy' LIMIT 1;
    SELECT id INTO max_id FROM agents WHERE name = 'max' LIMIT 1;
    SELECT id INTO corey_id FROM agents WHERE name = 'corey' LIMIT 1;

    -- Add many more task executions to test scrolling
    INSERT INTO "public"."task_executions" ("workflow_id", "agent_id", "title", "description", "sequence_order", "task_type", "status", "executor_type", "priority", "input_data", "output_data", "started_at", "completed_at", "execution_time_ms", "retry_count") VALUES
    
    -- Task 4
    (workflow_id, iris_id, 'Document Analysis', 'Analyze loan documents for payoff requirements', 4, 'document_analysis', 'COMPLETED', 'AI', 'MEDIUM', '{"document_type": "loan_agreement"}', '{"payoff_terms": "standard", "confidence": 0.92}', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours 45 minutes', 900000, 0),
    
    -- Task 5
    (workflow_id, rex_id, 'Lender Portal Access', 'Access lender portal for payoff information', 5, 'portal_access', 'COMPLETED', 'AI', 'HIGH', '{"portal_url": "wellsfargo.com/payoffs"}', '{"access_successful": true, "data_retrieved": true}', NOW() - INTERVAL '2 hours 45 minutes', NOW() - INTERVAL '2 hours 30 minutes', 450000, 0),
    
    -- Task 6
    (workflow_id, kosha_id, 'Calculate Fees', 'Calculate total payoff amount including fees', 6, 'fee_calculation', 'COMPLETED', 'AI', 'HIGH', '{"principal": 250000, "interest_rate": 3.5}', '{"total_payoff": 251247.83, "fees": 1247.83}', NOW() - INTERVAL '2 hours 30 minutes', NOW() - INTERVAL '2 hours 15 minutes', 300000, 0),
    
    -- Task 7
    (workflow_id, florian_id, 'Phone Verification', 'Call lender to verify payoff details', 7, 'phone_verification', 'AWAITING_REVIEW', 'AI', 'HIGH', '{"phone_number": "1-800-869-3557"}', '{"call_completed": true, "verification_pending": true}', NOW() - INTERVAL '2 hours 15 minutes', NOW() - INTERVAL '1 hour 45 minutes', 1800000, 1),
    
    -- Task 8
    (workflow_id, max_id, 'IVR Navigation', 'Navigate phone system for payoff department', 8, 'ivr_navigation', 'COMPLETED', 'AI', 'MEDIUM', '{"department": "payoffs", "extension": "4"}', '{"connected": true, "department_reached": "payoffs"}', NOW() - INTERVAL '1 hour 45 minutes', NOW() - INTERVAL '1 hour 30 minutes', 600000, 0),
    
    -- Task 9
    (workflow_id, cassy_id, 'Quality Check', 'Verify all payoff information accuracy', 9, 'quality_verification', 'IN_PROGRESS', 'AI', 'HIGH', '{"data_points": 15}', NULL, NOW() - INTERVAL '1 hour 30 minutes', NULL, NULL, 0),
    
    -- Task 10
    (workflow_id, nina_id, 'Lien Research', 'Research any additional liens on property', 10, 'lien_research', 'PENDING', 'AI', 'MEDIUM', '{"property_address": "123 Main St"}', NULL, NULL, NULL, NULL, 0),
    
    -- Task 11
    (workflow_id, iris_id, 'Document Preparation', 'Prepare payoff statement documents', 11, 'document_preparation', 'PENDING', 'AI', 'NORMAL', '{"template": "payoff_statement"}', NULL, NULL, NULL, NULL, 0),
    
    -- Task 12
    (workflow_id, mia_id, 'Client Notification', 'Notify client of payoff amount', 12, 'client_notification', 'PENDING', 'AI', 'HIGH', '{"client_email": "john.doe@email.com"}', NULL, NULL, NULL, NULL, 0),
    
    -- Task 13
    (workflow_id, ria_id, 'Closing Coordination', 'Coordinate with closing agent', 13, 'closing_coordination', 'PENDING', 'AI', 'NORMAL', '{"closing_date": "2025-07-15"}', NULL, NULL, NULL, NULL, 0),
    
    -- Task 14
    (workflow_id, kosha_id, 'Final Cost Review', 'Review all costs and fees', 14, 'cost_review', 'PENDING', 'AI', 'NORMAL', '{"estimated_costs": 1500}', NULL, NULL, NULL, NULL, 0),
    
    -- Task 15
    (workflow_id, cassy_id, 'Final Quality Check', 'Final verification before delivery', 15, 'final_quality_check', 'PENDING', 'AI', 'HIGH', '{"checklist_items": 20}', NULL, NULL, NULL, NULL, 0),
    
    -- Task 16
    (workflow_id, mia_id, 'Payoff Delivery', 'Deliver final payoff statement', 16, 'payoff_delivery', 'PENDING', 'AI', 'HIGH', '{"delivery_method": "secure_email"}', NULL, NULL, NULL, NULL, 0),
    
    -- Task 17
    (workflow_id, ria_id, 'Follow-up Confirmation', 'Confirm receipt and satisfaction', 17, 'follow_up', 'PENDING', 'AI', 'LOW', '{"follow_up_date": "2025-07-16"}', NULL, NULL, NULL, NULL, 0),
    
    -- Task 18
    (workflow_id, kosha_id, 'Invoice Generation', 'Generate invoice for services', 18, 'invoice_generation', 'PENDING', 'AI', 'NORMAL', '{"service_fees": 75}', NULL, NULL, NULL, NULL, 0);

END $$;