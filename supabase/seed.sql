-- =====================================================
-- Rexera 2.0 Initial Seed Data
-- Essential data for system operation
-- =====================================================

-- Insert sample clients
INSERT INTO clients (id, name, domain) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'First National Bank', 'firstnational.com'),
('550e8400-e29b-41d4-a716-446655440001', 'City Bank & Trust', 'citybank.com'),
('550e8400-e29b-41d4-a716-446655440002', 'Prime Lending Corp', 'primelending.com'),
('550e8400-e29b-41d4-a716-446655440003', 'Metro Credit Union', 'metrocredit.com'),
('550e8400-e29b-41d4-a716-446655440004', 'Wells Fargo Bank', 'wellsfargo.com');

-- Insert AI agents configuration
INSERT INTO agents (id, name, type, description, capabilities, api_endpoint, configuration) VALUES
('a1000000-0000-0000-0000-000000000001', 'nina', 'research', 'Research & Data Discovery Agent', 
 ARRAY['contact_research', 'property_research', 'company_research', 'municipal_research', 'web_search', 'data_validation'],
 'https://api.rexera-agents.com/nina', '{"model": "gpt-4", "timeout": 30000}'),

('a1000000-0000-0000-0000-000000000002', 'mia', 'communication', 'Email Communication Agent',
 ARRAY['email_composition', 'email_sending', 'email_parsing', 'template_generation', 'follow_up_scheduling', 'sentiment_analysis'],
 'https://api.rexera-agents.com/mia', '{"model": "gpt-4", "timeout": 30000}'),

('a1000000-0000-0000-0000-000000000003', 'florian', 'phone', 'Phone Outreach Agent',
 ARRAY['phone_calls', 'voicemail_analysis', 'call_scheduling', 'conversation_transcription', 'call_summarization', 'phone_number_validation'],
 'https://api.rexera-agents.com/florian', '{"model": "gpt-4", "timeout": 60000}'),

('a1000000-0000-0000-0000-000000000004', 'rex', 'web_navigation', 'Web Portal Navigation Agent',
 ARRAY['portal_login', 'form_filling', 'document_download', 'status_checking', 'data_extraction', 'captcha_solving'],
 'https://api.rexera-agents.com/rex', '{"model": "gpt-4", "timeout": 120000}'),

('a1000000-0000-0000-0000-000000000005', 'iris', 'document_processing', 'Document Processing Agent',
 ARRAY['ocr_processing', 'document_classification', 'data_extraction', 'document_validation', 'format_conversion', 'content_analysis'],
 'https://api.rexera-agents.com/iris', '{"model": "gpt-4-vision", "timeout": 60000}'),

('a1000000-0000-0000-0000-000000000006', 'ria', 'client_communication', 'Client Communication Agent',
 ARRAY['client_updates', 'status_reporting', 'issue_escalation', 'client_onboarding', 'satisfaction_monitoring', 'communication_routing'],
 'https://api.rexera-agents.com/ria', '{"model": "gpt-4", "timeout": 30000}'),

('a1000000-0000-0000-0000-000000000007', 'kosha', 'financial', 'Financial Tracking Agent',
 ARRAY['cost_tracking', 'invoice_generation', 'payment_processing', 'budget_monitoring', 'financial_reporting', 'expense_categorization'],
 'https://api.rexera-agents.com/kosha', '{"model": "gpt-4", "timeout": 30000}'),

('a1000000-0000-0000-0000-000000000008', 'cassy', 'quality_assurance', 'Quality Assurance Agent',
 ARRAY['data_validation', 'quality_scoring', 'error_detection', 'compliance_checking', 'review_coordination', 'audit_trail_analysis'],
 'https://api.rexera-agents.com/cassy', '{"model": "gpt-4", "timeout": 45000}'),

('a1000000-0000-0000-0000-000000000009', 'max', 'ivr_navigation', 'IVR Navigation Agent',
 ARRAY['ivr_navigation', 'automated_calling', 'menu_option_selection', 'hold_time_management', 'call_transfer_handling', 'dtmf_input'],
 'https://api.rexera-agents.com/max', '{"model": "gpt-4", "timeout": 90000}'),

('a1000000-0000-0000-0000-000000000010', 'corey', 'hoa_specialist', 'HOA Specialist Agent',
 ARRAY['hoa_document_analysis', 'bylaw_interpretation', 'fee_calculation', 'compliance_checking', 'hoa_contact_research', 'governing_document_review'],
 'https://api.rexera-agents.com/corey', '{"model": "gpt-4", "timeout": 60000}');

-- Insert default SLA definitions
INSERT INTO sla_definitions (id, workflow_type, task_type, client_id, hours_to_complete, alert_hours_before, is_business_hours_only) VALUES
-- Municipal Lien Search SLAs
('s1000000-0000-0000-0000-000000000001', 'MUNI_LIEN_SEARCH', NULL, NULL, 24, ARRAY[4, 2], true),
('s1000000-0000-0000-0000-000000000002', 'MUNI_LIEN_SEARCH', 'research', NULL, 8, ARRAY[2, 1], true),
('s1000000-0000-0000-0000-000000000003', 'MUNI_LIEN_SEARCH', 'document_processing', NULL, 4, ARRAY[1], true),

-- HOA Acquisition SLAs
('s1000000-0000-0000-0000-000000000004', 'HOA_ACQUISITION', NULL, NULL, 48, ARRAY[12, 4], true),
('s1000000-0000-0000-0000-000000000005', 'HOA_ACQUISITION', 'research', NULL, 16, ARRAY[4, 2], true),
('s1000000-0000-0000-0000-000000000006', 'HOA_ACQUISITION', 'communication', NULL, 8, ARRAY[2, 1], true),
('s1000000-0000-0000-0000-000000000007', 'HOA_ACQUISITION', 'document_processing', NULL, 12, ARRAY[3, 1], true),

-- Payoff Request SLAs
('s1000000-0000-0000-0000-000000000008', 'PAYOFF', NULL, NULL, 12, ARRAY[3, 1], true),
('s1000000-0000-0000-0000-000000000009', 'PAYOFF', 'communication', NULL, 4, ARRAY[1], true),
('s1000000-0000-0000-0000-000000000010', 'PAYOFF', 'document_processing', NULL, 2, ARRAY[1], true);

-- Insert sample counterparties
INSERT INTO counterparties (id, name, type, email, phone, address, contact_info) VALUES
-- HOAs
('c1000000-0000-0000-0000-000000000001', 'Sunset Hills HOA', 'hoa', 'info@sunsethillshoa.com', '(555) 123-4567', 
 '123 Community Blvd, Sunset Hills, FL 12345', 
 '{"website": "https://sunsethillshoa.com", "management_company": "ABC Property Management", "established": "1995"}'),

('c1000000-0000-0000-0000-000000000002', 'Ocean View Condominiums', 'hoa', 'board@oceanviewcondos.org', '(555) 234-5678',
 '456 Coastal Drive, Miami Beach, FL 33139',
 '{"website": "https://oceanviewcondos.org", "management_company": "Coastal Properties", "units": 150}'),

-- Lenders
('c1000000-0000-0000-0000-000000000003', 'Chase Bank Mortgage', 'lender', 'payoffs@chase.com', '(800) 848-9136',
 '1111 Chase Tower, Chicago, IL 60603',
 '{"department": "Payoff Department", "hours": "8 AM - 8 PM EST", "fax": "(800) 123-4567"}'),

('c1000000-0000-0000-0000-000000000004', 'Bank of America Home Loans', 'lender', 'payoff.requests@bankofamerica.com', '(800) 669-6607',
 '100 N Tryon St, Charlotte, NC 28255',
 '{"department": "Mortgage Payoff", "portal": "https://mortgageservicing.bankofamerica.com", "turnaround": "3-5 business days"}'),

-- Municipalities
('c1000000-0000-0000-0000-000000000005', 'Miami-Dade County Tax Collector', 'municipality', 'info@miamidade.gov', '(305) 270-4636',
 '200 NW 2nd Ave, Miami, FL 33128',
 '{"website": "https://www.miamidade.gov/taxcollector", "online_portal": true, "accepts_credit_cards": true}'),

('c1000000-0000-0000-0000-000000000006', 'Broward County Clerk of Courts', 'municipality', 'records@browardclerk.org', '(954) 831-6565',
 '201 SE 6th St, Fort Lauderdale, FL 33301',
 '{"website": "https://www.browardclerk.org", "search_fee": "$2.00", "copy_fee": "$1.00 per page"}'),

-- Utilities
('c1000000-0000-0000-0000-000000000007', 'Florida Power & Light', 'utility', 'customer.service@fpl.com', '(800) 468-8243',
 '700 Universe Blvd, Juno Beach, FL 33408',
 '{"website": "https://www.fpl.com", "account_lookup": true, "final_bill_department": "(800) 375-2434"}'),

('c1000000-0000-0000-0000-000000000008', 'Miami-Dade Water and Sewer', 'utility', 'water@miamidade.gov', '(305) 665-7477',
 '3071 SW 38th Ave, Miami, FL 33146',
 '{"website": "https://www.miamidade.gov/water", "account_transfer": true, "deposit_required": false}');

-- Insert sample workflow contacts labels
INSERT INTO contact_labels (label, display_name, description, workflow_types, is_required, default_notifications) VALUES
('buyer', 'Buyer', 'Property buyer or borrower', ARRAY['HOA_ACQUISITION', 'MUNI_LIEN_SEARCH', 'PAYOFF'], true,
 '{"notify_on_completion": true, "notify_on_issues": true, "notification_method": "email"}'),

('seller', 'Seller', 'Property seller', ARRAY['HOA_ACQUISITION', 'MUNI_LIEN_SEARCH'], false,
 '{"notify_on_completion": false, "notify_on_issues": false, "notification_method": "none"}'),

('title_officer', 'Title Officer', 'Title company officer handling the transaction', ARRAY['HOA_ACQUISITION', 'MUNI_LIEN_SEARCH', 'PAYOFF'], true,
 '{"notify_on_completion": true, "notify_on_issues": true, "notification_method": "email"}'),

('escrow_officer', 'Escrow Officer', 'Escrow company officer', ARRAY['PAYOFF'], false,
 '{"notify_on_completion": true, "notify_on_issues": true, "notification_method": "email"}'),

('loan_officer', 'Loan Officer', 'Lending institution loan officer', ARRAY['PAYOFF'], false,
 '{"notify_on_completion": true, "notify_on_issues": false, "notification_method": "email"}'),

('attorney', 'Attorney', 'Real estate attorney', ARRAY['HOA_ACQUISITION', 'MUNI_LIEN_SEARCH', 'PAYOFF'], false,
 '{"notify_on_completion": true, "notify_on_issues": true, "notification_method": "email"}'),

('realtor_buyer', 'Buyer''s Realtor', 'Real estate agent representing buyer', ARRAY['HOA_ACQUISITION', 'MUNI_LIEN_SEARCH'], false,
 '{"notify_on_completion": false, "notify_on_issues": false, "notification_method": "none"}'),

('realtor_seller', 'Seller''s Realtor', 'Real estate agent representing seller', ARRAY['HOA_ACQUISITION', 'MUNI_LIEN_SEARCH'], false,
 '{"notify_on_completion": false, "notify_on_issues": false, "notification_method": "none"}'),

('processor', 'Loan Processor', 'Loan processing specialist', ARRAY['PAYOFF', 'HOA_ACQUISITION'], false,
 '{"notify_on_completion": true, "notify_on_issues": true, "notification_method": "email"}'),

('underwriter', 'Underwriter', 'Loan underwriter', ARRAY['HOA_ACQUISITION', 'MUNI_LIEN_SEARCH'], false,
 '{"notify_on_completion": true, "notify_on_issues": true, "notification_method": "email"}');

-- Insert contact types for counterparty contacts
INSERT INTO contact_types (code, description) VALUES
('primary', 'Primary contact person'),
('billing', 'Billing and financial contact'),
('technical', 'Technical support contact'),
('legal', 'Legal department contact'),
('management', 'Management company contact'),
('board_president', 'HOA Board President'),
('board_treasurer', 'HOA Board Treasurer'),
('property_manager', 'Property Manager'),
('assistant', 'Administrative Assistant'),
('supervisor', 'Department Supervisor');

-- Insert sample counterparty contacts
INSERT INTO counterparty_contacts (counterparty_id, type_code, name, email, phone, is_primary) VALUES
-- Sunset Hills HOA contacts
('c1000000-0000-0000-0000-000000000001', 'primary', 'Sarah Johnson', 'sarah.johnson@sunsethillshoa.com', '(555) 123-4567', true),
('c1000000-0000-0000-0000-000000000001', 'board_president', 'Michael Davis', 'president@sunsethillshoa.com', '(555) 123-4568', false),
('c1000000-0000-0000-0000-000000000001', 'property_manager', 'Lisa Chen', 'lisa.chen@abcproperties.com', '(555) 123-4569', false),

-- Ocean View Condominiums contacts
('c1000000-0000-0000-0000-000000000002', 'primary', 'Robert Martinez', 'robert@oceanviewcondos.org', '(555) 234-5678', true),
('c1000000-0000-0000-0000-000000000002', 'board_treasurer', 'Jennifer Wilson', 'treasurer@oceanviewcondos.org', '(555) 234-5679', false),

-- Chase Bank Mortgage contacts
('c1000000-0000-0000-0000-000000000003', 'primary', 'Payoff Department', 'payoffs@chase.com', '(800) 848-9136', true),
('c1000000-0000-0000-0000-000000000003', 'supervisor', 'David Thompson', 'david.thompson@chase.com', '(800) 848-9137', false),

-- Bank of America contacts
('c1000000-0000-0000-0000-000000000004', 'primary', 'Mortgage Servicing', 'payoff.requests@bankofamerica.com', '(800) 669-6607', true),
('c1000000-0000-0000-0000-000000000004', 'technical', 'Portal Support', 'portal.support@bankofamerica.com', '(800) 669-6608', false);

-- Initialize agent performance metrics with baseline data
INSERT INTO agent_performance_metrics (agent_id, metric_type, metric_value, measurement_date) VALUES
-- Nina (Research Agent) metrics
('a1000000-0000-0000-0000-000000000001', 'avg_execution_time_ms', 15000, CURRENT_DATE),
('a1000000-0000-0000-0000-000000000001', 'success_rate', 0.95, CURRENT_DATE),
('a1000000-0000-0000-0000-000000000001', 'avg_confidence_score', 0.88, CURRENT_DATE),
('a1000000-0000-0000-0000-000000000001', 'cost_per_task_cents', 250, CURRENT_DATE),

-- Mia (Email Agent) metrics
('a1000000-0000-0000-0000-000000000002', 'avg_execution_time_ms', 8000, CURRENT_DATE),
('a1000000-0000-0000-0000-000000000002', 'success_rate', 0.98, CURRENT_DATE),
('a1000000-0000-0000-0000-000000000002', 'avg_confidence_score', 0.92, CURRENT_DATE),
('a1000000-0000-0000-0000-000000000002', 'cost_per_task_cents', 150, CURRENT_DATE),

-- Florian (Phone Agent) metrics
('a1000000-0000-0000-0000-000000000003', 'avg_execution_time_ms', 45000, CURRENT_DATE),
('a1000000-0000-0000-0000-000000000003', 'success_rate', 0.85, CURRENT_DATE),
('a1000000-0000-0000-0000-000000000003', 'avg_confidence_score', 0.78, CURRENT_DATE),
('a1000000-0000-0000-0000-000000000003', 'cost_per_task_cents', 800, CURRENT_DATE),

-- Rex (Web Navigation Agent) metrics
('a1000000-0000-0000-0000-000000000004', 'avg_execution_time_ms', 60000, CURRENT_DATE),
('a1000000-0000-0000-0000-000000000004', 'success_rate', 0.82, CURRENT_DATE),
('a1000000-0000-0000-0000-000000000004', 'avg_confidence_score', 0.75, CURRENT_DATE),
('a1000000-0000-0000-0000-000000000004', 'cost_per_task_cents', 500, CURRENT_DATE),

-- Iris (Document Processing Agent) metrics
('a1000000-0000-0000-0000-000000000005', 'avg_execution_time_ms', 20000, CURRENT_DATE),
('a1000000-0000-0000-0000-000000000005', 'success_rate', 0.93, CURRENT_DATE),
('a1000000-0000-0000-0000-000000000005', 'avg_confidence_score', 0.91, CURRENT_DATE),
('a1000000-0000-0000-0000-000000000005', 'cost_per_task_cents', 300, CURRENT_DATE),

-- Ria (Client Communication Agent) metrics
('a1000000-0000-0000-0000-000000000006', 'avg_execution_time_ms', 12000, CURRENT_DATE),
('a1000000-0000-0000-0000-000000000006', 'success_rate', 0.96, CURRENT_DATE),
('a1000000-0000-0000-0000-000000000006', 'avg_confidence_score', 0.89, CURRENT_DATE),
('a1000000-0000-0000-0000-000000000006', 'cost_per_task_cents', 200, CURRENT_DATE),

-- Kosha (Financial Agent) metrics
('a1000000-0000-0000-0000-000000000007', 'avg_execution_time_ms', 10000, CURRENT_DATE),
('a1000000-0000-0000-0000-000000000007', 'success_rate', 0.99, CURRENT_DATE),
('a1000000-0000-0000-0000-000000000007', 'avg_confidence_score', 0.95, CURRENT_DATE),
('a1000000-0000-0000-0000-000000000007', 'cost_per_task_cents', 100, CURRENT_DATE),

-- Cassy (QA Agent) metrics
('a1000000-0000-0000-0000-000000000008', 'avg_execution_time_ms', 18000, CURRENT_DATE),
('a1000000-0000-0000-0000-000000000008', 'success_rate', 0.94, CURRENT_DATE),
('a1000000-0000-0000-0000-000000000008', 'avg_confidence_score', 0.87, CURRENT_DATE),
('a1000000-0000-0000-0000-000000000008', 'cost_per_task_cents', 275, CURRENT_DATE),

-- Max (IVR Navigation Agent) metrics
('a1000000-0000-0000-0000-000000000009', 'avg_execution_time_ms', 90000, CURRENT_DATE),
('a1000000-0000-0000-0000-000000000009', 'success_rate', 0.78, CURRENT_DATE),
('a1000000-0000-0000-0000-000000000009', 'avg_confidence_score', 0.72, CURRENT_DATE),
('a1000000-0000-0000-0000-000000000009', 'cost_per_task_cents', 600, CURRENT_DATE),

-- Corey (HOA Specialist Agent) metrics
('a1000000-0000-0000-0000-000000000010', 'avg_execution_time_ms', 25000, CURRENT_DATE),
('a1000000-0000-0000-0000-000000000010', 'success_rate', 0.90, CURRENT_DATE),
('a1000000-0000-0000-0000-000000000010', 'avg_confidence_score', 0.85, CURRENT_DATE),
('a1000000-0000-0000-0000-000000000010', 'cost_per_task_cents', 350, CURRENT_DATE);