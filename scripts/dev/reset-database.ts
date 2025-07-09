#!/usr/bin/env tsx

/**
 * Database Reset Script
 * 
 * DESTRUCTIVE OPERATION: Completely clears all data from the database
 * and optionally reseeds with fresh test data.
 * 
 * Usage:
 *   tsx scripts/dev/reset-database.ts [--confirm] [--seed] [--test-data]
 * 
 * Options:
 *   --confirm     Skip interactive confirmation (for automation)
 *   --seed        Reseed with basic data after reset
 *   --test-data   Seed with comprehensive test data after reset
 */

import { BaseScript } from '../utils/base-script.js';
import readline from 'readline';

class DatabaseResetScript extends BaseScript {
  constructor() {
    super({
      name: 'Database Reset',
      description: 'Reset database to clean state (DESTRUCTIVE)',
      requiresDb: true
    });
  }

  async run(): Promise<void> {
    const skipConfirm = this.hasFlag('confirm');
    const seedBasic = this.hasFlag('seed');
    const seedTestData = this.hasFlag('test-data');
    
    this.log('🚨 DATABASE RESET - DESTRUCTIVE OPERATION 🚨');
    this.log('This will permanently delete ALL data in the database');
    
    if (!skipConfirm) {
      const confirmed = await this.confirmDestruction();
      if (!confirmed) {
        this.log('Operation cancelled');
        return;
      }
    }
    
    try {
      await this.resetDatabase();
      
      if (seedBasic || seedTestData) {
        this.log('\n📊 Seeding database...');
        if (seedTestData) {
          await this.seedTestData();
        } else {
          await this.seedBasicData();
        }
      }
      
      this.success('Database reset completed successfully');
      
    } catch (error) {
      this.error(`Reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async confirmDestruction(): Promise<boolean> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question('\nType "DESTROY" to confirm database reset: ', (answer) => {
        rl.close();
        resolve(answer === 'DESTROY');
      });
    });
  }

  private async resetDatabase(): Promise<void> {
    this.log('🗑️  Clearing all tables...');
    
    // Order matters due to foreign key constraints
    const tablesToClear = [
      'hil_notifications',
      'user_preferences', 
      'hil_notes',
      'workflow_contacts',
      'audit_events',
      'costs',
      'invoices',
      'documents',
      'workflow_counterparties',
      'counterparties',
      'phone_metadata',
      'email_metadata',
      'communications',
      'task_executions',
      'agent_performance_metrics',
      'workflows',
      'user_profiles',
      'agents',
      'clients',
      'contact_labels'
    ];

    for (const table of tablesToClear) {
      try {
        let query;
        if (table === 'contact_labels') {
          // contact_labels uses 'label' as primary key, not 'id'
          query = this.supabase!
            .from(table)
            .delete()
            .neq('label', '__system__');
        } else {
          query = this.supabase!
            .from(table)
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');
        }
        
        const { error } = await query;
        
        if (error) {
          this.log(`⚠️  Warning: Could not clear ${table}: ${error.message}`);
        } else {
          this.log(`✅ Cleared ${table}`);
        }
      } catch (error) {
        this.log(`⚠️  Warning: Error clearing ${table}: ${error}`);
      }
    }
    
    this.log('🗑️  Database cleared');
  }

  private async seedBasicData(): Promise<void> {
    this.log('📊 Seeding basic data...');
    
    // Create basic clients
    const { data: clients } = await this.supabase!
      .from('clients')
      .insert([
        { name: 'Demo Client', domain: 'demo.example.com' },
        { name: 'Test Corp', domain: 'test.example.com' }
      ])
      .select();

    // Create basic agents
    await this.supabase!
      .from('agents')
      .insert([
        {
          name: 'Nina',
          type: 'RESEARCH',
          description: 'Research and discovery agent',
          capabilities: ['research', 'contact_discovery']
        },
        {
          name: 'Mia', 
          type: 'COMMUNICATION',
          description: 'Communication and email agent',
          capabilities: ['email', 'communication']
        }
      ]);

    this.log('✅ Basic data seeded');
  }

  private async seedTestData(): Promise<void> {
    this.log('📊 Seeding comprehensive test data...');
    
    // Create test clients
    const { data: clients } = await this.supabase!
      .from('clients')
      .insert([
        { name: 'Acme Corporation', domain: 'acme.com' },
        { name: 'Beta Holdings', domain: 'beta.com' },
        { name: 'Gamma LLC', domain: 'gamma.com' },
        { name: 'Delta Industries', domain: 'delta.com' },
        { name: 'Echo Enterprises', domain: 'echo.com' }
      ])
      .select();

    if (!clients) throw new Error('Failed to create test clients');

    // Create comprehensive agent roster
    const { data: agents } = await this.supabase!
      .from('agents')
      .insert([
        {
          name: 'Nina',
          type: 'RESEARCH',
          description: 'Research and discovery specialist',
          capabilities: ['research', 'contact_discovery', 'data_analysis'],
          is_active: true
        },
        {
          name: 'Rex',
          type: 'WEB_NAVIGATION',
          description: 'Web portal navigation and data extraction',
          capabilities: ['web_navigation', 'portal_access', 'document_download'],
          is_active: true
        },
        {
          name: 'Mia',
          type: 'COMMUNICATION',
          description: 'Email and communication specialist',
          capabilities: ['email_composition', 'client_communication', 'status_updates'],
          is_active: true
        },
        {
          name: 'Florian',
          type: 'PHONE_COMMUNICATION',
          description: 'Phone call and voice communication',
          capabilities: ['phone_calls', 'voice_communication', 'ivr_navigation'],
          is_active: true
        },
        {
          name: 'Max',
          type: 'IVR_SPECIALIST',
          description: 'Interactive Voice Response system navigation',
          capabilities: ['ivr_navigation', 'automated_calls', 'phone_trees'],
          is_active: true
        },
        {
          name: 'Iris',
          type: 'DOCUMENT_PROCESSING',
          description: 'OCR and document data extraction',
          capabilities: ['ocr_processing', 'document_analysis', 'data_extraction'],
          is_active: true
        },
        {
          name: 'Corey',
          type: 'HOA_SPECIALIST',
          description: 'HOA document analysis specialist',
          capabilities: ['hoa_document_analysis', 'community_research', 'document_validation'],
          is_active: true
        },
        {
          name: 'Cassy',
          type: 'QUALITY_ASSURANCE',
          description: 'Quality validation and verification',
          capabilities: ['quality_validation', 'data_verification', 'accuracy_checking'],
          is_active: true
        },
        {
          name: 'Kosha',
          type: 'FINANCIAL_TRACKING',
          description: 'Cost tracking and billing',
          capabilities: ['cost_tracking', 'invoice_generation', 'billing_analysis'],
          is_active: true
        },
        {
          name: 'Ria',
          type: 'CLIENT_RELATIONS',
          description: 'Client relationship management',
          capabilities: ['client_management', 'status_updates', 'relationship_tracking'],
          is_active: true
        }
      ])
      .select();

    if (!agents) throw new Error('Failed to create test agents');

    // Create diverse workflows
    const workflowTypes = ['PAYOFF', 'HOA_ACQUISITION', 'MUNI_LIEN_SEARCH'] as const;
    const statuses = ['PENDING', 'IN_PROGRESS', 'AWAITING_REVIEW', 'BLOCKED', 'COMPLETED'] as const;
    const priorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const;

    const workflows = [];
    for (let i = 0; i < 15; i++) {
      const workflowType = workflowTypes[i % workflowTypes.length];
      const client = clients[i % clients.length];
      const status = statuses[i % statuses.length];
      const priority = priorities[i % priorities.length];
      
      workflows.push({
        workflow_type: workflowType,
        client_id: client.id,
        title: `${workflowType.replace('_', ' ')} #${1000 + i}`,
        description: `Test ${workflowType.toLowerCase().replace('_', ' ')} for development`,
        status,
        priority,
        metadata: {
          test_data: true,
          batch: 'dev_seed',
          property_address: `${100 + i} Test St, Demo City, ST ${10000 + i}`
        },
        due_date: new Date(Date.now() + (i % 10 + 1) * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    const { data: createdWorkflows } = await this.supabase!
      .from('workflows')
      .insert(workflows)
      .select();

    if (!createdWorkflows) throw new Error('Failed to create test workflows');

    // Create realistic task executions
    const taskTypes = [
      'identify_lender_contact',
      'send_payoff_request', 
      'extract_payoff_data',
      'research_hoa_contact',
      'analyze_hoa_docs',
      'research_municipality',
      'portal_access',
      'process_documents',
      'quality_validation',
      'generate_invoice'
    ];

    const taskStatuses = ['PENDING', 'AWAITING_REVIEW', 'COMPLETED', 'FAILED'] as const;
    const interruptTypes = ['MISSING_DOCUMENT', 'PAYMENT_REQUIRED', 'CLIENT_CLARIFICATION', 'MANUAL_VERIFICATION'] as const;

    const tasks = [];
    for (const workflow of createdWorkflows) {
      const taskCount = Math.floor(Math.random() * 5) + 2; // 2-6 tasks per workflow
      
      for (let j = 0; j < taskCount; j++) {
        const taskStatus = taskStatuses[Math.floor(Math.random() * taskStatuses.length)];
        const agent = agents[Math.floor(Math.random() * agents.length)];
        const taskType = taskTypes[j % taskTypes.length];
        
        const task: any = {
          workflow_id: workflow.id,
          agent_id: agent.id,
          title: `${taskType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
          description: `Test task for ${taskType}`,
          sequence_order: j + 1,
          task_type: taskType,
          status: taskStatus,
          executor_type: Math.random() > 0.3 ? 'AI' : 'HIL',
          priority: priorities[Math.floor(Math.random() * priorities.length)],
          input_data: { test: true, batch: 'dev_seed' },
          sla_hours: 24 + (j * 4), // Staggered SLA times
          retry_count: Math.floor(Math.random() * 3)
        };

        // Add interrupt for some failed/awaiting review tasks
        if (taskStatus === 'FAILED' || (taskStatus === 'AWAITING_REVIEW' && Math.random() > 0.5)) {
          task.interrupt_type = interruptTypes[Math.floor(Math.random() * interruptTypes.length)];
        }

        // Add timestamps for completed/failed tasks
        if (taskStatus === 'COMPLETED' || taskStatus === 'FAILED') {
          const hoursAgo = Math.floor(Math.random() * 48) + 1;
          task.started_at = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
          task.completed_at = new Date(Date.now() - (hoursAgo - 1) * 60 * 60 * 1000).toISOString();
          task.execution_time_ms = 3600000; // 1 hour
          
          if (taskStatus === 'COMPLETED') {
            task.output_data = {
              confidence_score: Math.random() * 0.3 + 0.7, // 0.7-1.0
              result: 'Task completed successfully',
              test: true
            };
          } else {
            task.error_message = 'Simulated error for testing purposes';
          }
        }

        tasks.push(task);
      }
    }

    const { data: createdTasks } = await this.supabase!
      .from('task_executions')
      .insert(tasks)
      .select();

    // Create test counterparties
    await this.supabase!
      .from('counterparties')
      .insert([
        {
          name: 'Big Bank Mortgage',
          type: 'lender',
          email: 'payoffs@bigbank.com',
          phone: '1-800-555-0100',
          contact_info: { department: 'Payoff Department', hours: '9-5 EST' }
        },
        {
          name: 'Oak Ridge HOA',
          type: 'hoa',
          email: 'board@oakridge.com',
          phone: '555-0200',
          contact_info: { management_company: 'Premium HOA Management' }
        },
        {
          name: 'City of Example',
          type: 'municipality',
          email: 'clerk@cityofexample.gov',
          phone: '555-0300',
          contact_info: { department: 'City Clerk', permits_office: 'Room 101' }
        }
      ]);

    this.log(`✅ Test data seeded:`);
    this.log(`   - ${clients.length} clients`);
    this.log(`   - ${agents.length} agents`);
    this.log(`   - ${createdWorkflows.length} workflows`);
    this.log(`   - ${tasks.length} task executions`);
    this.log(`   - 3 counterparties`);
  }
}

// Run script if called directly
if (require.main === module) {
  const script = new DatabaseResetScript();
  script.run().catch(console.error);
}