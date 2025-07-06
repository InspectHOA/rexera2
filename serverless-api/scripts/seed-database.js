const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Set environment variables
const SUPABASE_URL = 'https://wmgidablmqotriwlefhq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZ2lkYWJsbXFvdHJpd2xlZmhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTEzNzk2NywiZXhwIjoyMDY2NzEzOTY3fQ.viSjS9PV2aDSOIzayHv6zJG-rjmjOBOVMsHlm77h6ns';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function seedDatabase() {
  console.log('Starting database seeding...');
  
  try {
    // Since we can't modify the schema constraint directly, let's work around it
    // by using the service role to execute raw SQL that temporarily disables constraints
    console.log('Clearing existing data...');
    await supabase.from('task_executions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('workflows').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('agents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('clients').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // 1. Seed clients
    console.log('Seeding clients...');
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .insert([
        { name: 'Prestige Title Co.', domain: 'prestige-title.com' },
        { name: 'Gateway Escrow', domain: 'gateway-escrow.com' },
        { name: 'Secure Closing Services', domain: 'secure-closing.com' }
      ])
      .select();
    
    if (clientError) throw clientError;
    console.log(`✅ Inserted ${clients.length} clients`);
    
    // 2. Seed agents
    console.log('Seeding agents...');
    const { data: agents, error: agentError } = await supabase
      .from('agents')
      .insert([
        { name: 'nina', type: 'research', description: 'Research and Data Discovery Agent', capabilities: ['document_search', 'data_extraction'] },
        { name: 'mia', type: 'communication', description: 'Email Communication Agent', capabilities: ['email_sending', 'template_processing'] },
        { name: 'florian', type: 'communication', description: 'Phone Outreach Agent', capabilities: ['phone_calling', 'ivr_navigation'] },
        { name: 'rex', type: 'automation', description: 'Web Portal Navigation Agent', capabilities: ['portal_login', 'form_filling'] },
        { name: 'iris', type: 'document_processing', description: 'Document Analysis Agent', capabilities: ['document_parsing', 'ocr'] },
        { name: 'ria', type: 'support', description: 'Support and Coordination Agent', capabilities: ['status_updates', 'client_communication'] },
        { name: 'kosha', type: 'financial', description: 'Financial Analysis Agent', capabilities: ['cost_calculation', 'invoice_processing'] },
        { name: 'cassy', type: 'quality_assurance', description: 'Quality Validation Agent', capabilities: ['data_validation', 'quality_checks'] },
        { name: 'max', type: 'communication', description: 'IVR Navigation Agent', capabilities: ['ivr_navigation', 'phone_automation'] },
        { name: 'corey', type: 'specialist', description: 'HOA Specialist Agent', capabilities: ['hoa_document_processing', 'estoppel_requests'] }
      ])
      .select();
    
    if (agentError) throw agentError;
    console.log(`✅ Inserted ${agents.length} agents`);
    
    // 3. Seed workflows
    console.log('Seeding workflows...');
    const prestigeClient = clients.find(c => c.name === 'Prestige Title Co.');
    const gatewayClient = clients.find(c => c.name === 'Gateway Escrow');
    const secureClient = clients.find(c => c.name === 'Secure Closing Services');
    
    const { data: workflows, error: workflowError } = await supabase
      .from('workflows')
      .insert([
        {
          workflow_type: 'PAYOFF',
          client_id: prestigeClient.id,
          title: 'Payoff Request - 123 Main St',
          description: 'Payoff request for John Doe loan LN123456',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          // Skip created_by for now - we'll need to fix the schema constraint
          metadata: {
            property_address: '123 Main St, Anytown, USA',
            borrower_name: 'John Doe',
            loan_number: 'LN123456',
            estimated_balance: 250000.00
          }
        },
        {
          workflow_type: 'PAYOFF',
          client_id: gatewayClient.id,
          title: 'Payoff Request - 456 Oak Ave',
          description: 'Payoff request for Jane Smith loan LN654321',
          status: 'COMPLETED',
          priority: 'NORMAL',
          // Skip created_by for now - we'll need to fix the schema constraint
          metadata: {
            property_address: '456 Oak Ave, Sometown, USA',
            borrower_name: 'Jane Smith',
            loan_number: 'LN654321',
            estimated_balance: 175000.00
          }
        },
        {
          workflow_type: 'HOA_ACQUISITION',
          client_id: secureClient.id,
          title: 'HOA Estoppel - 789 Pine Ln',
          description: 'HOA estoppel request for Peter Jones property',
          status: 'BLOCKED',
          priority: 'URGENT',
          // Skip created_by for now - we'll need to fix the schema constraint
          metadata: {
            property_address: '789 Pine Ln, Othertown, USA',
            borrower_name: 'Peter Jones',
            estimated_balance: 5000.00
          }
        },
        {
          workflow_type: 'MUNI_LIEN_SEARCH',
          client_id: prestigeClient.id,
          title: 'Municipal Lien Search - 101 Maple Dr',
          description: 'Municipal lien search for Mary Williams property',
          status: 'PENDING',
          priority: 'NORMAL',
          // Skip created_by for now - we'll need to fix the schema constraint
          metadata: {
            property_address: '101 Maple Dr, Anycity, USA',
            borrower_name: 'Mary Williams',
            estimated_balance: 1200.00
          }
        },
        {
          workflow_type: 'PAYOFF',
          client_id: gatewayClient.id,
          title: 'Payoff Request - 555 Broadway',
          description: 'Payoff request for Robert Wilson loan LN789123',
          status: 'IN_PROGRESS',
          priority: 'NORMAL',
          // Skip created_by for now - we'll need to fix the schema constraint
          metadata: {
            property_address: '555 Broadway, Capital City, USA',
            borrower_name: 'Robert Wilson',
            loan_number: 'LN789123',
            estimated_balance: 320000.00
          }
        }
      ])
      .select();
    
    if (workflowError) throw workflowError;
    console.log(`✅ Inserted ${workflows.length} workflows`);
    
    // 4. Seed task executions
    console.log('Seeding task executions...');
    const ninaAgent = agents.find(a => a.name === 'nina');
    const miaAgent = agents.find(a => a.name === 'mia');
    const coreyAgent = agents.find(a => a.name === 'corey');
    
    const workflow1 = workflows.find(w => w.title.includes('123 Main St'));
    const workflow2 = workflows.find(w => w.title.includes('456 Oak Ave'));
    const workflow3 = workflows.find(w => w.title.includes('789 Pine Ln'));
    
    const { data: taskExecutions, error: taskError } = await supabase
      .from('task_executions')
      .insert([
        // Workflow 1 tasks
        {
          workflow_id: workflow1.id,
          agent_id: ninaAgent.id,
          title: 'Identify Lender',
          description: 'Research and identify the current lender for the property',
          sequence_order: 1,
          task_type: 'identify_lender_contact',
          status: 'COMPLETED',
          executor_type: 'AI',
          priority: 'HIGH',
          input_data: { loan_number: 'LN123456' },
          output_data: { lender_name: 'Wells Fargo', confidence: 0.95 }
        },
        {
          workflow_id: workflow1.id,
          agent_id: ninaAgent.id,
          title: 'Research Contact Information',
          description: 'Find the correct contact person at the lender',
          sequence_order: 2,
          task_type: 'research_lender_contact',
          status: 'AWAITING_REVIEW',
          executor_type: 'AI',
          priority: 'HIGH',
          input_data: { lender_name: 'Wells Fargo' },
          output_data: { contact_name: 'Sarah Johnson', email: 'payoffs@wellsfargo.com' }
        },
        {
          workflow_id: workflow1.id,
          agent_id: miaAgent.id,
          title: 'Submit Payoff Request',
          description: 'Send formal payoff request to the lender',
          sequence_order: 3,
          task_type: 'submit_payoff_request',
          status: 'PENDING',
          executor_type: 'AI',
          priority: 'HIGH',
          input_data: { contact_email: 'payoffs@wellsfargo.com' }
        },
        // Workflow 2 tasks (completed)
        {
          workflow_id: workflow2.id,
          agent_id: ninaAgent.id,
          title: 'Identify Lender',
          description: 'Research and identify the current lender',
          sequence_order: 1,
          task_type: 'identify_lender_contact',
          status: 'COMPLETED',
          executor_type: 'AI',
          priority: 'NORMAL',
          input_data: { loan_number: 'LN654321' },
          output_data: { lender_name: 'Bank of America', confidence: 0.98 }
        },
        {
          workflow_id: workflow2.id,
          agent_id: miaAgent.id,
          title: 'Submit Payoff Request',
          description: 'Send formal payoff request',
          sequence_order: 2,
          task_type: 'submit_payoff_request',
          status: 'COMPLETED',
          executor_type: 'AI',
          priority: 'NORMAL',
          input_data: {},
          output_data: { request_sent: true, confirmation_number: 'PAY123456' }
        },
        // Workflow 3 tasks (blocked)
        {
          workflow_id: workflow3.id,
          agent_id: coreyAgent.id,
          title: 'Identify HOA',
          description: 'Research and identify the HOA',
          sequence_order: 1,
          task_type: 'identify_hoa',
          status: 'COMPLETED',
          executor_type: 'AI',
          priority: 'URGENT',
          input_data: {}
        },
        {
          workflow_id: workflow3.id,
          agent_id: ninaAgent.id,
          title: 'Research HOA Contact',
          description: 'Find contact information for the HOA',
          sequence_order: 2,
          task_type: 'research_hoa_contact',
          status: 'FAILED',
          interrupt_type: 'CLIENT_CLARIFICATION',
          executor_type: 'AI',
          priority: 'URGENT',
          input_data: {},
          error_message: 'Unable to locate current contact information. Manual verification required.'
        }
      ])
      .select();
    
    if (taskError) throw taskError;
    console.log(`✅ Inserted ${taskExecutions.length} task executions`);
    
    console.log('\n✅ Database seeding completed successfully!');
    
    // Verify the seeding worked
    const { data: finalWorkflows, error: workflowVerifyError } = await supabase
      .from('workflows')
      .select('id, title, status')
      .limit(10);
    
    if (workflowVerifyError) {
      console.error('Error verifying workflows:', workflowVerifyError);
    } else {
      console.log(`\n📊 Verification: Found ${finalWorkflows.length} workflows in database:`);
      finalWorkflows.forEach(w => console.log(`  - ${w.title} (${w.status})`));
    }
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();