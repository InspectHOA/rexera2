#!/usr/bin/env tsx

/**
 * Database Seeding Script
 * 
 * Seeds the database with initial data for development and testing.
 * Uses environment variables instead of hardcoded credentials.
 */

import { BaseScript } from '../utils/base-script.js';

class DatabaseSeedScript extends BaseScript {
  constructor() {
    super({
      name: 'Database Seed',
      description: 'Seed database with initial data',
      requiresDb: true
    });
  }

  async run(): Promise<void> {
    this.log('Starting database seeding...');
    
    const env = this.getArg('env', 'development');
    this.log(`Seeding for environment: ${env}`);
    
    try {
      await this.seedClients();
      await this.seedAgents();
      await this.seedWorkflows();
      await this.seedTaskExecutions();
      
      this.success('Database seeding completed successfully');
      
    } catch (error) {
      this.error(`Seeding failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async seedClients(): Promise<void> {
    this.log('Seeding clients...');
    
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
      },
      {
        name: 'Gamma LLC',
        domain: 'gamma.io',
        type: 'STARTUP',
        metadata: { industry: 'SaaS', size: 'Small' }
      }
    ];

    const { data, error } = await this.supabase!
      .from('clients')
      .insert(clients)
      .select();

    if (error) {
      throw new Error(`Failed to seed clients: ${error.message}`);
    }

    this.log(`✅ Seeded ${data?.length || 0} clients`);
  }

  private async seedAgents(): Promise<void> {
    this.log('Seeding agents...');
    
    const agents = [
      {
        name: 'Nina',
        type: 'PAYOFF_SPECIALIST',
        status: 'ACTIVE',
        capabilities: ['document_review', 'lender_communication', 'payoff_calculation'],
        metadata: { 
          version: '2.1.0',
          description: 'Specialized in payoff request processing'
        }
      },
      {
        name: 'Mia',
        type: 'COMMUNICATION_SPECIALIST', 
        status: 'ACTIVE',
        capabilities: ['email_composition', 'client_communication', 'status_updates'],
        metadata: {
          version: '1.8.0',
          description: 'Handles all client and counterparty communications'
        }
      },
      {
        name: 'Iris',
        type: 'DOCUMENT_SPECIALIST',
        status: 'ACTIVE', 
        capabilities: ['document_analysis', 'data_extraction', 'ocr_processing'],
        metadata: {
          version: '3.2.0',
          description: 'Document processing and data extraction expert'
        }
      }
    ];

    const { data, error } = await this.supabase!
      .from('agents')
      .insert(agents)
      .select();

    if (error) {
      throw new Error(`Failed to seed agents: ${error.message}`);
    }

    this.log(`✅ Seeded ${data?.length || 0} agents`);
  }

  private async seedWorkflows(): Promise<void> {
    this.log('Seeding workflows...');
    
    // Get client IDs for foreign key references
    const { data: clients } = await this.supabase!
      .from('clients')
      .select('id')
      .limit(3);

    if (!clients || clients.length === 0) {
      throw new Error('No clients found - ensure clients are seeded first');
    }

    // Create a default user if none exists
    let userId = '00000000-0000-0000-0000-000000000001'; // Default system user ID
    try {
      const { data: existingUser } = await this.supabase!
        .from('user_profiles')
        .select('id')
        .limit(1)
        .single();
      
      if (existingUser) {
        userId = existingUser.id;
      }
    } catch (error) {
      this.log('No existing users found, using default system user ID');
    }

    const workflows = [
      {
        workflow_type: 'PAYOFF_REQUEST',
        client_id: clients[0].id,
        title: 'Payoff Request - 123 Main St',
        description: 'Processing payoff request for residential property',
        status: 'IN_PROGRESS',
        priority: 'NORMAL',
        metadata: {
          property_address: '123 Main St, Anytown, ST 12345',
          loan_number: 'LN123456789'
        },
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        created_by: userId
      },
      {
        workflow_type: 'HOA_ACQUISITION',
        client_id: clients[1].id,
        title: 'HOA Document Acquisition - Oak Ridge',
        description: 'Acquiring HOA documents for Oak Ridge community',
        status: 'PENDING',
        priority: 'HIGH',
        metadata: {
          hoa_name: 'Oak Ridge Community Association',
          property_count: 245
        },
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
        created_by: userId
      },
      {
        workflow_type: 'MUNI_LIEN_SEARCH',
        client_id: clients[2].id,
        title: 'Municipal Lien Search - Downtown Plaza',
        description: 'Comprehensive municipal lien search for commercial property',
        status: 'AWAITING_REVIEW',
        priority: 'URGENT',
        metadata: {
          property_type: 'commercial',
          jurisdiction: 'City of Example'
        },
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        created_by: userId
      }
    ];

    const { data, error } = await this.supabase!
      .from('workflows')
      .insert(workflows)
      .select();

    if (error) {
      throw new Error(`Failed to seed workflows: ${error.message}`);
    }

    this.log(`✅ Seeded ${data?.length || 0} workflows`);
  }

  private async seedTaskExecutions(): Promise<void> {
    this.log('Seeding task executions...');
    
    // Get workflow IDs and agent IDs for foreign key references
    const { data: workflows } = await this.supabase!
      .from('workflows')
      .select('id')
      .limit(3);

    const { data: agents } = await this.supabase!
      .from('agents')
      .select('id, name')
      .limit(3);

    if (!workflows || !agents || workflows.length === 0 || agents.length === 0) {
      throw new Error('Missing workflows or agents - ensure they are seeded first');
    }

    const tasks = [
      {
        workflow_id: workflows[0].id,
        agent_id: agents[0].id, // Nina
        title: 'Review Payoff Request Documents',
        description: 'Analyze incoming payoff request and extract key information',
        sequence_order: 1,
        task_type: 'DOCUMENT_REVIEW',
        status: 'COMPLETED',
        executor_type: 'AI',
        priority: 'NORMAL',
        input_data: { document_count: 3 },
        output_data: { 
          loan_amount: 245000,
          property_address: '123 Main St',
          confidence_score: 0.95
        },
        started_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        completed_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
        execution_time_ms: 3600000 // 1 hour
      },
      {
        workflow_id: workflows[0].id,
        agent_id: agents[1].id, // Mia
        title: 'Contact Lender for Payoff Information',
        description: 'Communicate with lender to obtain payoff details',
        sequence_order: 2,
        task_type: 'LENDER_COMMUNICATION',
        status: 'AWAITING_REVIEW',
        interrupt_type: 'MANUAL_VERIFICATION',
        executor_type: 'HIL',
        priority: 'HIGH',
        input_data: { 
          lender_contact: 'payoffs@bigbank.com',
          loan_number: 'LN123456789'
        },
        started_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        execution_time_ms: null
      },
      {
        workflow_id: workflows[1].id,
        agent_id: agents[2].id, // Iris
        title: 'Extract HOA Contact Information',
        description: 'Process HOA documents to extract contact details',
        sequence_order: 1,
        task_type: 'DATA_EXTRACTION',
        status: 'IN_PROGRESS',
        executor_type: 'AI',
        priority: 'NORMAL',
        input_data: { document_types: ['bylaws', 'contact_sheet'] },
        started_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
        execution_time_ms: null
      }
    ];

    const { data, error } = await this.supabase!
      .from('task_executions')
      .insert(tasks)
      .select();

    if (error) {
      throw new Error(`Failed to seed task executions: ${error.message}`);
    }

    this.log(`✅ Seeded ${data?.length || 0} task executions`);
  }
}

// Run script if called directly
if (require.main === module) {
  const script = new DatabaseSeedScript();
  script.run().catch(console.error);
}