-- =====================================================
-- Rexera 2.0 Complete Seed Data
-- Essential seed data for system operation
-- =====================================================

-- =====================================================
-- 1. CLIENTS
-- =====================================================

INSERT INTO clients (id, name, domain) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'First National Bank', 'firstnational.com'),
('550e8400-e29b-41d4-a716-446655440001', 'City Bank & Trust', 'citybank.com'),
('550e8400-e29b-41d4-a716-446655440002', 'Prime Lending Corp', 'primelending.com'),
('550e8400-e29b-41d4-a716-446655440003', 'Metro Credit Union', 'metrocredit.com'),
('550e8400-e29b-41d4-a716-446655440004', 'Wells Fargo Bank', 'wellsfargo.com')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. AI AGENTS
-- =====================================================

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
 'https://api.rexera-agents.com/corey', '{"model": "gpt-4", "timeout": 60000}')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 3. SLA DEFINITIONS
-- =====================================================

INSERT INTO sla_definitions (id, workflow_type, task_type, client_id, hours_to_complete, alert_hours_before, is_business_hours_only) VALUES
-- Municipal Lien Search SLAs
('a2000000-0000-0000-0000-000000000001', 'MUNI_LIEN_SEARCH', NULL, NULL, 24, ARRAY[4, 2], true),
('a2000000-0000-0000-0000-000000000002', 'MUNI_LIEN_SEARCH', 'research', NULL, 8, ARRAY[2, 1], true),
('a2000000-0000-0000-0000-000000000003', 'MUNI_LIEN_SEARCH', 'document_processing', NULL, 4, ARRAY[1], true),

-- HOA Acquisition SLAs
('a2000000-0000-0000-0000-000000000004', 'HOA_ACQUISITION', NULL, NULL, 48, ARRAY[12, 4], true),
('a2000000-0000-0000-0000-000000000005', 'HOA_ACQUISITION', 'research', NULL, 16, ARRAY[4, 2], true),
('a2000000-0000-0000-0000-000000000006', 'HOA_ACQUISITION', 'communication', NULL, 8, ARRAY[2, 1], true),
('a2000000-0000-0000-0000-000000000007', 'HOA_ACQUISITION', 'document_processing', NULL, 12, ARRAY[3, 1], true),

-- Payoff Request SLAs
('a2000000-0000-0000-0000-000000000008', 'PAYOFF', NULL, NULL, 12, ARRAY[3, 1], true),
('a2000000-0000-0000-0000-000000000009', 'PAYOFF', 'communication', NULL, 4, ARRAY[1], true),
('a2000000-0000-0000-0000-000000000010', 'PAYOFF', 'document_processing', NULL, 2, ARRAY[1], true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 4. COUNTERPARTIES
-- =====================================================

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
 '{"website": "https://www.miamidade.gov/water", "account_transfer": true, "deposit_required": false}')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 5. AGENT PERFORMANCE METRICS
-- =====================================================

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
('a1000000-0000-0000-0000-000000000004', 'avg_confidence_score', 0.85, CURRENT_DATE),
('a1000000-0000-0000-0000-000000000004', 'cost_per_task_cents', 900, CURRENT_DATE),

-- Iris (Document Processing Agent) metrics
('a1000000-0000-0000-0000-000000000005', 'avg_execution_time_ms', 25000, CURRENT_DATE),
('a1000000-0000-0000-0000-000000000005', 'success_rate', 0.93, CURRENT_DATE),
('a1000000-0000-0000-0000-000000000005', 'avg_confidence_score', 0.91, CURRENT_DATE),
('a1000000-0000-0000-0000-000000000005', 'cost_per_task_cents', 350, CURRENT_DATE)
ON CONFLICT (agent_id, metric_type, measurement_date) DO NOTHING;

-- =====================================================
-- 6. CONTACT LABELS
-- =====================================================

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

-- Generic workflow contacts
('primary_contact', 'Primary Contact', 'Main contact person for this workflow', ARRAY['PAYOFF', 'HOA_ACQUISITION', 'MUNI_LIEN_SEARCH'], false, '{"notify_on_status_change": true, "notify_on_completion": true, "notify_on_issues": true}'),
('secondary_contact', 'Secondary Contact', 'Backup contact person', ARRAY['PAYOFF', 'HOA_ACQUISITION', 'MUNI_LIEN_SEARCH'], false, '{"notify_on_completion": true}'),
('project_manager', 'Project Manager', 'Project or case manager', ARRAY['PAYOFF', 'HOA_ACQUISITION', 'MUNI_LIEN_SEARCH'], false, '{"notify_on_status_change": true, "notify_on_issues": true}'),
('client_representative', 'Client Representative', 'Client organization representative', ARRAY['PAYOFF', 'HOA_ACQUISITION', 'MUNI_LIEN_SEARCH'], false, '{"notify_on_status_change": true, "notify_on_completion": true}'),
('vendor_contact', 'Vendor Contact', 'Third-party vendor or service provider', ARRAY['PAYOFF', 'HOA_ACQUISITION', 'MUNI_LIEN_SEARCH'], false, '{"notify_on_completion": true}'),
('compliance_officer', 'Compliance Officer', 'Regulatory or compliance contact', ARRAY['PAYOFF', 'HOA_ACQUISITION', 'MUNI_LIEN_SEARCH'], false, '{"notify_on_documents": true, "notify_on_completion": true}')
ON CONFLICT (label) DO NOTHING;

-- =====================================================
-- 7. SAMPLE WORKFLOWS (For Testing)
-- =====================================================

-- First, we need to create a system user since workflows require created_by
-- Note: This will need to be properly set up with actual auth.users
-- For now, we'll comment this out and rely on the frontend fallback data

-- Sample data can be added later once proper user authentication is set up

-- =====================================================
-- 8. COMPLETION LOG
-- =====================================================

INSERT INTO audit_events (
    actor_type, actor_id, actor_name,
    event_type, action,
    resource_type, resource_id,
    event_data
) VALUES (
    'system', 'migration', 'Database Seed System',
    'data.seeded', 'create',
    'database', gen_random_uuid(),
    '{"migration": "seed_data", "version": "20250703133000", "clients": 5, "agents": 10, "slas": 10, "counterparties": 8, "contact_labels": 15, "performance_metrics": 20}'
) ON CONFLICT DO NOTHING;