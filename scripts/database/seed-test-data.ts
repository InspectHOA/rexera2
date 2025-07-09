#!/usr/bin/env tsx

/**
 * Test Data Seeding Script
 * 
 * Seeds the database with comprehensive test data for development and testing.
 * Creates realistic workflows, tasks, and data relationships.
 * 
 * Usage:
 *   tsx scripts/database/seed-test-data.ts [--count=N] [--type=TYPE]
 * 
 * Options:
 *   --count     Number of workflows to create (default: 20)
 *   --type      Specific workflow type to create (default: all types)
 */

import { BaseScript } from '../utils/base-script.js';

class TestDataSeedScript extends BaseScript {
  constructor() {
    super({
      name: 'Test Data Seed',
      description: 'Seed database with comprehensive test data',
      requiresDb: true
    });
  }

  async run(): Promise<void> {
    this.log('Starting comprehensive test data seeding...');
    
    const workflowCount = parseInt(this.getArg('count', '20'));
    const workflowType = this.getArg('type');
    
    this.log(`Creating ${workflowCount} workflows${workflowType ? ` of type ${workflowType}` : ''}`);
    
    try {
      // Ensure basic data exists
      await this.ensureBasicData();
      
      // Create comprehensive test data (order matters for foreign keys)
      await this.seedTestClients();
      await this.seedTestUsers();
      await this.seedAllAgents();
      await this.seedTestWorkflows(workflowCount, workflowType);
      await this.seedRealisticTasks();
      await this.seedCounterparties();
      await this.seedWorkflowCounterparties();
      await this.seedCommunications();
      await this.seedDocuments();
      await this.seedFinancialData();
      await this.seedWorkflowContacts();
      await this.seedContactLabels();
      await this.seedHilNotes();
      await this.seedTestNotifications();
      await this.seedUserPreferences();
      await this.seedAgentPerformanceMetrics();
      await this.seedAuditEvents();
      
      this.success(`Comprehensive test data seeding completed successfully!`);
      this.log(`📊 Summary:`);
      this.log(`   - Clients, users, agents with full profiles`);
      this.log(`   - ${workflowCount} workflows with complete task sequences`);
      this.log(`   - Communications, documents, and financial tracking`);
      this.log(`   - HIL notes, contacts, and preferences`);
      this.log(`   - Performance metrics and audit trails`);
      
    } catch (error) {
      this.error(`Test data seeding failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async ensureBasicData(): Promise<void> {
    this.log('Ensuring basic data exists...');
    
    // Check if basic data already exists
    const { data: existingClients } = await this.supabase!
      .from('clients')
      .select('id')
      .limit(1);
    
    if (existingClients && existingClients.length > 0) {
      this.log('✅ Basic data already exists, adding to existing data');
    } else {
      this.log('📊 No existing data found, creating from scratch');
    }
  }

  private async seedTestClients(): Promise<void> {
    this.log('Seeding test clients...');
    
    const testClients = [
      { name: 'Premier Title Services', domain: 'premiertitle.com' },
      { name: 'Acme Real Estate Group', domain: 'acme-re.com' },
      { name: 'Sunset Escrow Company', domain: 'sunsetescrow.com' },
      { name: 'Metro Closing Solutions', domain: 'metroclosing.com' },
      { name: 'First American Title', domain: 'firstam.com' },
      { name: 'Chicago Title Company', domain: 'chicagotitle.com' },
      { name: 'Fidelity National Title', domain: 'fnf.com' },
      { name: 'Stewart Title Guaranty', domain: 'stewart.com' },
      { name: 'Old Republic Title', domain: 'oldrepublictitle.com' },
      { name: 'Republic Title Company', domain: 'republictitle.com' }
    ];

    const { data, error } = await this.supabase!
      .from('clients')
      .upsert(testClients, { 
        onConflict: 'domain',
        ignoreDuplicates: true 
      })
      .select();

    if (error && !error.message.includes('duplicate')) {
      throw new Error(`Failed to seed test clients: ${error.message}`);
    }

    this.log(`✅ Test clients ready (${testClients.length} total)`);
  }

  private async seedAllAgents(): Promise<void> {
    this.log('Seeding complete agent roster...');
    
    const agents = [
      {
        name: 'Nina',
        type: 'RESEARCH',
        description: 'Research and discovery specialist 🔍',
        capabilities: ['research', 'contact_discovery', 'data_analysis', 'lender_identification'],
        is_active: true,
        configuration: { version: '2.1.0', specialties: ['payoff_research', 'hoa_research'] }
      },
      {
        name: 'Rex', 
        type: 'WEB_NAVIGATION',
        description: 'Web portal navigation and data extraction 🌐',
        capabilities: ['web_navigation', 'portal_access', 'document_download', 'form_submission'],
        is_active: true,
        configuration: { version: '1.8.0', browser_capabilities: ['chrome', 'firefox'] }
      },
      {
        name: 'Mia',
        type: 'COMMUNICATION',
        description: 'Email and communication specialist 📧',
        capabilities: ['email_composition', 'client_communication', 'status_updates', 'professional_writing'],
        is_active: true,
        configuration: { version: '2.0.0', languages: ['en', 'es'] }
      },
      {
        name: 'Florian',
        type: 'PHONE_COMMUNICATION', 
        description: 'Phone call and voice communication 🗣️',
        capabilities: ['phone_calls', 'voice_communication', 'conversation_handling', 'appointment_scheduling'],
        is_active: true,
        configuration: { version: '1.5.0', voice_models: ['professional', 'friendly'] }
      },
      {
        name: 'Max',
        type: 'IVR_SPECIALIST',
        description: 'Interactive Voice Response system navigation 📞',
        capabilities: ['ivr_navigation', 'automated_calls', 'phone_trees', 'dtmf_input'],
        is_active: true,
        configuration: { version: '1.3.0', supported_systems: ['avaya', 'cisco', 'asterisk'] }
      },
      {
        name: 'Iris',
        type: 'DOCUMENT_PROCESSING',
        description: 'OCR and document data extraction 📄',
        capabilities: ['ocr_processing', 'document_analysis', 'data_extraction', 'pdf_processing'],
        is_active: true,
        configuration: { version: '3.2.0', supported_formats: ['pdf', 'docx', 'jpg', 'png'] }
      },
      {
        name: 'Corey',
        type: 'HOA_SPECIALIST',
        description: 'HOA document analysis specialist 🏢',
        capabilities: ['hoa_document_analysis', 'community_research', 'document_validation', 'bylaws_analysis'],
        is_active: true,
        configuration: { version: '1.6.0', specialties: ['condo_associations', 'master_associations'] }
      },
      {
        name: 'Cassy',
        type: 'QUALITY_ASSURANCE',
        description: 'Quality validation and verification ✓',
        capabilities: ['quality_validation', 'data_verification', 'accuracy_checking', 'compliance_review'],
        is_active: true,
        configuration: { version: '2.3.0', accuracy_threshold: 0.95 }
      },
      {
        name: 'Kosha',
        type: 'FINANCIAL_TRACKING',
        description: 'Cost tracking and billing 💰',
        capabilities: ['cost_tracking', 'invoice_generation', 'billing_analysis', 'fee_calculation'],
        is_active: true,
        configuration: { version: '1.4.0', currencies: ['USD'], tax_calculation: true }
      },
      {
        name: 'Ria',
        type: 'CLIENT_RELATIONS',
        description: 'Client relationship management 👩‍💼',
        capabilities: ['client_management', 'status_updates', 'relationship_tracking', 'satisfaction_monitoring'],
        is_active: true,
        configuration: { version: '1.9.0', communication_styles: ['formal', 'casual'] }
      }
    ];

    const { data, error } = await this.supabase!
      .from('agents')
      .upsert(agents, { 
        onConflict: 'name',
        ignoreDuplicates: true 
      })
      .select();

    if (error && !error.message.includes('duplicate')) {
      throw new Error(`Failed to seed agents: ${error.message}`);
    }

    this.log(`✅ Complete agent roster ready (${agents.length} agents)`);
  }

  private async seedTestWorkflows(count: number, workflowType?: string): Promise<void> {
    this.log(`Seeding ${count} test workflows...`);
    
    // Get clients and ensure we have enough
    const { data: clients } = await this.supabase!
      .from('clients')
      .select('id, name');

    if (!clients || clients.length === 0) {
      throw new Error('No clients found - ensure clients are seeded first');
    }

    const workflowTypes = workflowType ? [workflowType] : ['PAYOFF_REQUEST', 'HOA_ACQUISITION', 'MUNI_LIEN_SEARCH'];
    const statuses = ['PENDING', 'IN_PROGRESS', 'AWAITING_REVIEW', 'BLOCKED', 'COMPLETED'];
    const priorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

    const workflows = [];
    for (let i = 0; i < count; i++) {
      const type = workflowTypes[i % workflowTypes.length];
      const client = clients[i % clients.length];
      const status = statuses[i % statuses.length];
      const priority = priorities[i % priorities.length];
      
      // Create realistic addresses
      const streetNumbers = [123, 456, 789, 1001, 2500, 3456, 7890, 1234, 5678, 9012];
      const streetNames = ['Main St', 'Oak Ave', 'Pine Rd', 'Elm Dr', 'Maple Blvd', 'Cedar Ln', 'Birch Way', 'Ash Ct', 'Willow St', 'Cherry Ave'];
      const cities = ['Springfield', 'Franklin', 'Georgetown', 'Clinton', 'Salem', 'Bristol', 'Manchester', 'Newport', 'Richmond', 'Auburn'];
      const states = ['CA', 'TX', 'FL', 'NY', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI'];
      
      const address = `${streetNumbers[i % streetNumbers.length]} ${streetNames[i % streetNames.length]}, ${cities[i % cities.length]}, ${states[i % states.length]} ${10000 + (i % 90000)}`;
      
      workflows.push({
        workflow_type: type,
        client_id: client.id,
        title: `${type.replace('_', ' ')} - ${address.split(',')[0]}`,
        description: `${this.getWorkflowDescription(type)} for ${address}`,
        status,
        priority,
        metadata: {
          property_address: address,
          test_data: true,
          batch: 'comprehensive_seed',
          estimated_value: Math.floor(Math.random() * 500000) + 200000,
          loan_number: `LN${Date.now()}${i}`.slice(-12)
        },
        due_date: new Date(Date.now() + (Math.floor(Math.random() * 30) + 1) * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    const { data: createdWorkflows, error } = await this.supabase!
      .from('workflows')
      .insert(workflows)
      .select();

    if (error) {
      throw new Error(`Failed to seed workflows: ${error.message}`);
    }

    this.log(`✅ Created ${createdWorkflows?.length || 0} test workflows`);
    
    // Store for use in task creation
    this.createdWorkflows = createdWorkflows || [];
  }

  private getWorkflowDescription(type: string): string {
    switch (type) {
      case 'PAYOFF_REQUEST':
        return 'Processing mortgage payoff request';
      case 'HOA_ACQUISITION':
        return 'Acquiring HOA documents and community information';
      case 'MUNI_LIEN_SEARCH':
        return 'Comprehensive municipal lien search';
      default:
        return 'Workflow processing';
    }
  }

  private async seedRealisticTasks(): Promise<void> {
    this.log('Creating realistic task executions...');
    
    const { data: agents } = await this.supabase!
      .from('agents')
      .select('id, name, type');

    if (!agents || agents.length === 0) {
      throw new Error('No agents found - ensure agents are seeded first');
    }

    const taskTemplates = {
      PAYOFF_REQUEST: [
        { type: 'identify_lender_contact', agent: 'Nina', title: 'Identify Lender Contact', description: 'Research and identify lender payoff department contact information' },
        { type: 'send_payoff_request', agent: 'Mia', title: 'Send Payoff Request', description: 'Send formal payoff request to lender' },
        { type: 'extract_payoff_data', agent: 'Iris', title: 'Extract Payoff Data', description: 'Extract payoff amount and terms from lender response' },
        { type: 'verify_payoff_amount', agent: 'Cassy', title: 'Verify Payoff Amount', description: 'Quality check payoff calculations and terms' },
        { type: 'generate_payoff_statement', agent: 'Iris', title: 'Generate Payoff Statement', description: 'Create formatted payoff statement document' },
        { type: 'client_notification', agent: 'Ria', title: 'Notify Client', description: 'Send payoff information to client' }
      ],
      HOA_ACQUISITION: [
        { type: 'research_hoa_contact', agent: 'Nina', title: 'Research HOA Contact', description: 'Find HOA management company and contact information' },
        { type: 'send_hoa_request', agent: 'Mia', title: 'Send Document Request', description: 'Request HOA documents and disclosures' },
        { type: 'analyze_hoa_docs', agent: 'Corey', title: 'Analyze HOA Documents', description: 'Review and analyze received HOA documentation' },
        { type: 'extract_hoa_financials', agent: 'Kosha', title: 'Extract Financial Data', description: 'Extract HOA fees and financial information' },
        { type: 'quality_validation', agent: 'Cassy', title: 'Quality Validation', description: 'Validate completeness and accuracy of HOA data' }
      ],
      MUNI_LIEN_SEARCH: [
        { type: 'research_municipality', agent: 'Nina', title: 'Research Municipality', description: 'Identify relevant municipal departments and portals' },
        { type: 'portal_access', agent: 'Rex', title: 'Access Municipal Portals', description: 'Search municipal databases for liens and violations' },
        { type: 'process_documents', agent: 'Iris', title: 'Process Retrieved Documents', description: 'Extract data from municipal records and documents' },
        { type: 'verify_lien_status', agent: 'Cassy', title: 'Verify Lien Status', description: 'Confirm accuracy of lien search results' },
        { type: 'generate_lien_report', agent: 'Iris', title: 'Generate Lien Report', description: 'Create comprehensive municipal lien search report' }
      ]
    };

    const taskStatuses = ['PENDING', 'AWAITING_REVIEW', 'COMPLETED', 'FAILED'];
    const interruptTypes = ['MISSING_DOCUMENT', 'PAYMENT_REQUIRED', 'CLIENT_CLARIFICATION', 'MANUAL_VERIFICATION'];
    const priorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

    const allTasks = [];
    for (const workflow of this.createdWorkflows) {
      const templates = taskTemplates[workflow.workflow_type as keyof typeof taskTemplates] || taskTemplates.PAYOFF_REQUEST;
      
      for (let i = 0; i < templates.length; i++) {
        const template = templates[i];
        const agent = agents.find(a => a.name === template.agent);
        if (!agent) continue;

        const status = this.getRealisticTaskStatus(i, templates.length);
        const task: any = {
          workflow_id: workflow.id,
          agent_id: agent.id,
          title: template.title,
          description: template.description,
          sequence_order: i + 1,
          task_type: template.type,
          status,
          executor_type: Math.random() > 0.2 ? 'AI' : 'HIL',
          priority: priorities[Math.floor(Math.random() * priorities.length)],
          input_data: { 
            workflow_type: workflow.workflow_type,
            property_address: workflow.metadata?.property_address,
            test_data: true 
          },
          sla_hours: 24 + (i * 4), // Staggered SLA times
          retry_count: Math.floor(Math.random() * 3)
        };

        // Add realistic timestamps and outputs based on status
        if (status === 'COMPLETED') {
          const hoursAgo = Math.floor(Math.random() * 72) + 1;
          task.started_at = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
          task.completed_at = new Date(Date.now() - (hoursAgo - Math.floor(Math.random() * 3) - 1) * 60 * 60 * 1000).toISOString();
          task.execution_time_ms = (Math.floor(Math.random() * 3600) + 300) * 1000; // 5min - 1hr
          task.output_data = {
            confidence_score: Math.random() * 0.3 + 0.7, // 0.7-1.0
            result_summary: `${template.title} completed successfully`,
            test_data: true
          };
        } else if (status === 'FAILED') {
          const hoursAgo = Math.floor(Math.random() * 48) + 1;
          task.started_at = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
          task.error_message = `Simulated failure: ${this.getRandomErrorMessage()}`;
          task.interrupt_type = interruptTypes[Math.floor(Math.random() * interruptTypes.length)];
        } else if (status === 'AWAITING_REVIEW') {
          const hoursAgo = Math.floor(Math.random() * 24) + 1;
          task.started_at = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
          if (Math.random() > 0.5) {
            task.interrupt_type = interruptTypes[Math.floor(Math.random() * interruptTypes.length)];
          }
        }

        allTasks.push(task);
      }
    }

    // Insert in batches to avoid timeout
    const batchSize = 50;
    let totalInserted = 0;
    
    for (let i = 0; i < allTasks.length; i += batchSize) {
      const batch = allTasks.slice(i, i + batchSize);
      const { data, error } = await this.supabase!
        .from('task_executions')
        .insert(batch)
        .select();
      
      if (error) {
        this.log(`⚠️  Warning: Failed to insert task batch: ${error.message}`);
      } else {
        totalInserted += data?.length || 0;
      }
    }

    this.log(`✅ Created ${totalInserted} realistic task executions`);
  }

  private getRealisticTaskStatus(taskIndex: number, totalTasks: number): string {
    // Earlier tasks more likely to be completed
    const completionProbability = Math.max(0.2, 1 - (taskIndex / totalTasks));
    const rand = Math.random();
    
    if (rand < completionProbability * 0.8) return 'COMPLETED';
    if (rand < completionProbability * 0.9) return 'AWAITING_REVIEW';
    if (rand < completionProbability * 0.95) return 'FAILED';
    return 'PENDING';
  }

  private getRandomErrorMessage(): string {
    const errors = [
      'Lender portal temporarily unavailable',
      'Document format not recognized',
      'Missing required client information',
      'HOA management company not responding',
      'Municipal website maintenance',
      'Authentication credentials expired',
      'Document quality insufficient for OCR',
      'Phone system busy, retry needed'
    ];
    return errors[Math.floor(Math.random() * errors.length)];
  }

  private async seedCounterparties(): Promise<void> {
    this.log('Seeding test counterparties...');
    
    const counterparties = [
      {
        name: 'Wells Fargo Bank',
        type: 'lender',
        email: 'payoffs@wellsfargo.com',
        phone: '1-800-869-3557',
        contact_info: { department: 'Payoff Department', hours: '8AM-8PM EST', fax: '1-800-869-3558' }
      },
      {
        name: 'Bank of America',
        type: 'lender', 
        email: 'mortgage.payoffs@bankofamerica.com',
        phone: '1-800-669-6607',
        contact_info: { department: 'Mortgage Payoffs', hours: '7AM-10PM EST' }
      },
      {
        name: 'Quicken Loans/Rocket Mortgage',
        type: 'lender',
        email: 'payoff@quickenloans.com',
        phone: '1-800-251-9080',
        contact_info: { department: 'Payoff Services', hours: '24/7', portal: 'rocket-mortgage.com' }
      },
      {
        name: 'Oakwood Community Association',
        type: 'hoa',
        email: 'management@oakwoodcommunity.com',
        phone: '555-0123',
        contact_info: { management_company: 'Community First Management', president: 'Jane Smith' }
      },
      {
        name: 'Sunset Ridge HOA',
        type: 'hoa',
        email: 'board@sunsetridge.org',
        phone: '555-0234',
        contact_info: { management_company: 'Premier HOA Services', dues: 150 }
      },
      {
        name: 'City of Springfield',
        type: 'municipality',
        email: 'clerk@springfield.gov',
        phone: '555-0345',
        contact_info: { department: 'City Clerk', office_hours: '9AM-5PM', permits_dept: 'Building & Safety' }
      },
      {
        name: 'Franklin County',
        type: 'municipality',
        email: 'records@franklincounty.gov',
        phone: '555-0456',
        contact_info: { department: 'County Recorder', office_hours: '8AM-4:30PM' }
      }
    ];

    const { data, error } = await this.supabase!
      .from('counterparties')
      .upsert(counterparties, { 
        onConflict: 'name',
        ignoreDuplicates: true 
      })
      .select();

    if (error && !error.message.includes('duplicate')) {
      throw new Error(`Failed to seed counterparties: ${error.message}`);
    }

    this.log(`✅ Test counterparties ready (${counterparties.length} total)`);
  }

  private async seedTestNotifications(): Promise<void> {
    this.log('Creating test notifications...');
    
    // Get a default user or create system notifications
    const { data: users } = await this.supabase!
      .from('user_profiles')
      .select('id')
      .limit(5);

    if (!users || users.length === 0) {
      this.log('⚠️  No users found, skipping notification seeding');
      return;
    }

    const notificationTypes = ['WORKFLOW_UPDATE', 'TASK_INTERRUPT', 'SLA_WARNING', 'AGENT_FAILURE'];
    const priorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
    
    const notifications = [];
    for (let i = 0; i < 10; i++) {
      const user = users[i % users.length];
      const type = notificationTypes[i % notificationTypes.length];
      const priority = priorities[i % priorities.length];
      
      notifications.push({
        user_id: user.id,
        type,
        priority,
        title: `Test ${type.replace('_', ' ')} Notification`,
        message: `This is a test notification for ${type.toLowerCase().replace('_', ' ')} scenarios.`,
        action_url: `/workflow/${this.createdWorkflows[i % this.createdWorkflows.length]?.id || 'test'}`,
        metadata: { test_data: true, batch: 'comprehensive_seed' },
        read: Math.random() > 0.5, // 50% read
        created_at: new Date(Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000)).toISOString()
      });
    }

    const { error } = await this.supabase!
      .from('hil_notifications')
      .insert(notifications);

    if (error) {
      this.log(`⚠️  Warning: Failed to create test notifications: ${error.message}`);
    } else {
      this.log(`✅ Created ${notifications.length} test notifications`);
    }
  }

  private createdWorkflows: any[] = [];
}

// Run script if called directly
if (require.main === module) {
  const script = new TestDataSeedScript();
  script.run().catch(console.error);
}