import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';

// Set environment variables
const SUPABASE_URL = 'https://wmgidablmqotriwlefhq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZ2lkYWJsbXFvdHJpd2xlZmhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTEzNzk2NywiZXhwIjoyMDY2NzEzOTY3fQ.viSjS9PV2aDSOIzayHv6zJG-rjmjOBOVMsHlm77h6ns';

const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function seedDatabase(): Promise<void> {
  console.log('Starting database seeding...');
  
  try {
    // Since we can't modify the schema constraint directly, let's work around it
    // by using the service role to execute raw SQL that temporarily disables constraints
    
    console.log('Seeding clients...');
    await seedClients();
    
    console.log('Seeding agents...');
    await seedAgents();
    
    console.log('Seeding workflows...');
    await seedWorkflows();
    
    console.log('Seeding task executions...');
    await seedTaskExecutions();
    
    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
}

async function seedClients(): Promise<void> {
  const clients = [
    {
      name: 'Acme Corporation',
      domain: 'acme.com',
      type: 'ENTERPRISE',
      metadata: { industry: 'Technology', size: 'Large' }
    },
    {
      name: 'Beta Holdings',
      domain: 'betaholdings.com', 
      type: 'BUSINESS',
      metadata: { industry: 'Finance', size: 'Medium' }
    }
  ];

  const { error } = await supabase
    .from('clients')
    .upsert(clients, { onConflict: 'domain' });

  if (error) {
    throw new Error(`Failed to seed clients: ${error.message}`);
  }
}

async function seedAgents(): Promise<void> {
  const agents = [
    {
      name: 'Nina',
      type: 'RESEARCH',
      description: 'Research and data collection agent',
      capabilities: ['web_research', 'document_analysis'],
      status: 'ONLINE',
      is_active: true,
      metadata: { version: '2.1', model: 'gpt-4' }
    },
    {
      name: 'Marcus',
      type: 'COMMUNICATION',
      description: 'Email and communication handling agent',
      capabilities: ['email_processing', 'phone_calls'],
      status: 'ONLINE', 
      is_active: true,
      metadata: { version: '2.0', model: 'gpt-4' }
    }
  ];

  const { error } = await supabase
    .from('agents')
    .upsert(agents, { onConflict: 'name' });

  if (error) {
    throw new Error(`Failed to seed agents: ${error.message}`);
  }
}

async function seedWorkflows(): Promise<void> {
  // Get client IDs for foreign key references
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name');

  if (!clients || clients.length === 0) {
    throw new Error('No clients found for workflow seeding');
  }

  const workflows = [
    {
      human_readable_id: 'PAY-250706-001',
      workflow_type: 'PAYOFF',
      client_id: clients[0].id,
      title: 'Payoff Request - 123 Main St',
      description: 'Process payoff request for mortgage at 123 Main St',
      status: 'IN_PROGRESS',
      priority: 'NORMAL',
      metadata: {
        property_address: '123 Main St, Anytown, USA',
        borrower_name: 'John Doe',
        loan_number: 'LN123456',
        estimated_balance: 250000.00,
        lender_name: 'Wells Fargo'
      },
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
    }
  ];

  const { error } = await supabase
    .from('workflows')
    .upsert(workflows, { onConflict: 'human_readable_id' });

  if (error) {
    throw new Error(`Failed to seed workflows: ${error.message}`);
  }
}

async function seedTaskExecutions(): Promise<void> {
  // Get workflow and agent IDs for foreign key references
  const { data: workflows } = await supabase
    .from('workflows')
    .select('id, human_readable_id');

  const { data: agents } = await supabase
    .from('agents')
    .select('id, name');

  if (!workflows || workflows.length === 0) {
    throw new Error('No workflows found for task execution seeding');
  }

  if (!agents || agents.length === 0) {
    throw new Error('No agents found for task execution seeding');
  }

  const workflowId = workflows[0].id;
  const agentId = agents[0].id;

  const taskExecutions = [
    {
      workflow_id: workflowId,
      task_type: 'research_lender_contact',
      title: 'Research Lender Contact Information',
      description: 'Find contact information for Wells Fargo payoff department',
      status: 'COMPLETED',
      priority: 'NORMAL',
      agent_id: agentId,
      sequence_order: 1,
      output_data: {
        contacts: [
          {
            name: 'Wells Fargo Payoff Dept',
            email: 'payoffs@wellsfargo.com',
            phone: '1-800-869-3557'
          }
        ],
        confidence_score: 0.95
      },
      completed_at: new Date().toISOString()
    },
    {
      workflow_id: workflowId,
      task_type: 'submit_payoff_request',
      title: 'Submit Payoff Request',
      description: 'Submit formal payoff request to Wells Fargo',
      status: 'AWAITING_REVIEW',
      priority: 'NORMAL',
      agent_id: agentId,
      sequence_order: 2,
      output_data: {
        submission_method: 'email',
        submitted_at: new Date().toISOString(),
        reference_number: 'WF-PAY-20250706-001'
      }
    }
  ];

  const { error } = await supabase
    .from('task_executions')
    .upsert(taskExecutions, { onConflict: 'workflow_id,sequence_order' });

  if (error) {
    throw new Error(`Failed to seed task executions: ${error.message}`);
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('🎉 Database seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database seeding failed:', error);
      process.exit(1);
    });
}

export { seedDatabase };