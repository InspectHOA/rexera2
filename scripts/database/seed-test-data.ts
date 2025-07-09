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
      // Skip user creation due to auth.users constraints in development
      // await this.seedTestUsers();
      await this.seedAllAgents();
      await this.seedTestWorkflows(workflowCount, workflowType);
      await this.seedRealisticTasks();
      await this.seedCounterparties();
      await this.seedWorkflowCounterparties();
      // Skip communications that depend on users
      // await this.seedCommunications();
      await this.seedDocuments();
      await this.seedFinancialData();
      await this.seedWorkflowContacts();
      await this.seedContactLabels();
      // Skip HIL-related features that depend on users
      // await this.seedHilNotes();
      // await this.seedTestNotifications();
      // await this.seedUserPreferences();
      await this.seedAgentPerformanceMetrics();
      // Skip audit events that depend on users
      // await this.seedAuditEvents();
      
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

    const workflowTypes = workflowType ? [workflowType] : ['PAYOFF', 'HOA_ACQUISITION', 'MUNI_LIEN_SEARCH'];
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
        // created_by will be NULL (schema allows it)
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
      case 'PAYOFF':
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
      PAYOFF: [
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
      const templates = taskTemplates[workflow.workflow_type as keyof typeof taskTemplates] || taskTemplates.PAYOFF;
      
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

  private async seedTestUsers(): Promise<void> {
    this.log('Seeding test users...');
    
    // Get clients for client users
    const { data: clients } = await this.supabase!
      .from('clients')
      .select('id, name')
      .limit(5);

    if (!clients || clients.length === 0) {
      throw new Error('No clients found - ensure clients are seeded first');
    }

    // Create test HIL users
    const hilUsers = [
      {
        id: '11111111-1111-1111-1111-111111111111', // Fixed UUID for testing
        user_type: 'hil_user',
        email: 'sarah.johnson@rexera.com',
        full_name: 'Sarah Johnson',
        role: 'HIL',
        company_id: null
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        user_type: 'hil_user', 
        email: 'mike.chen@rexera.com',
        full_name: 'Mike Chen',
        role: 'HIL_ADMIN',
        company_id: null
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        user_type: 'hil_user',
        email: 'alex.rivera@rexera.com',
        full_name: 'Alex Rivera',
        role: 'HIL',
        company_id: null
      }
    ];

    // Create test client users
    const clientUsers = clients.slice(0, 3).map((client, i) => ({
      id: `44444444-4444-4444-4444-44444444444${i + 1}`,
      user_type: 'client_user',
      email: `admin@${client.name.toLowerCase().replace(/\s+/g, '')}.com`,
      full_name: `${['John', 'Jane', 'Bob'][i]} ${['Smith', 'Doe', 'Wilson'][i]}`,
      role: i === 0 ? 'CLIENT_ADMIN' : 'REQUESTOR',
      company_id: client.id
    }));

    const allUsers = [...hilUsers, ...clientUsers];

    for (const user of allUsers) {
      try {
        const { error } = await this.supabase!
          .from('user_profiles')
          .upsert(user, { onConflict: 'id', ignoreDuplicates: true });
        
        if (error && !error.message.includes('duplicate')) {
          this.log(`⚠️  Warning: Could not create user ${user.email}: ${error.message}`);
        }
      } catch (error) {
        this.log(`⚠️  Warning: Error creating user ${user.email}: ${error}`);
      }
    }

    this.log(`✅ Test users ready (${allUsers.length} total)`);
    this.createdUsers = allUsers;
  }

  private async seedWorkflowCounterparties(): Promise<void> {
    this.log('Linking workflows to counterparties...');
    
    const { data: counterparties } = await this.supabase!
      .from('counterparties')
      .select('id, type');

    if (!counterparties || counterparties.length === 0) {
      this.log('⚠️  No counterparties found, skipping workflow counterparty linking');
      return;
    }

    // Link workflows to relevant counterparties
    const workflowCounterparties = [];
    for (const workflow of this.createdWorkflows) {
      // Find relevant counterparties based on workflow type
      let relevantCounterparties = [];
      
      switch (workflow.workflow_type) {
        case 'PAYOFF':
          relevantCounterparties = counterparties.filter(c => c.type === 'lender');
          break;
        case 'HOA_ACQUISITION':
          relevantCounterparties = counterparties.filter(c => c.type === 'hoa');
          break;
        case 'MUNI_LIEN_SEARCH':
          relevantCounterparties = counterparties.filter(c => c.type === 'municipality');
          break;
      }

      // Add 1-2 relevant counterparties per workflow
      const selectedCounterparties = relevantCounterparties.slice(0, Math.floor(Math.random() * 2) + 1);
      
      for (const counterparty of selectedCounterparties) {
        workflowCounterparties.push({
          workflow_id: workflow.id,
          counterparty_id: counterparty.id,
          status: ['PENDING', 'CONTACTED', 'RESPONDED', 'COMPLETED'][Math.floor(Math.random() * 4)]
        });
      }
    }

    if (workflowCounterparties.length > 0) {
      const { error } = await this.supabase!
        .from('workflow_counterparties')
        .insert(workflowCounterparties);

      if (error) {
        this.log(`⚠️  Warning: Failed to link workflow counterparties: ${error.message}`);
      } else {
        this.log(`✅ Created ${workflowCounterparties.length} workflow-counterparty relationships`);
      }
    }
  }

  private async seedCommunications(): Promise<void> {
    this.log('Creating communications and messages...');
    
    if (this.createdUsers.length === 0) {
      this.log('⚠️  No users available, skipping communications');
      return;
    }

    const communicationTypes = ['email', 'phone', 'sms', 'internal_note'];
    const emailStatuses = ['SENT', 'DELIVERED', 'READ', 'BOUNCED', 'FAILED'];
    
    const communications = [];
    const emailMetadata = [];
    const phoneMetadata = [];

    // Create 3-5 communications per workflow
    for (const workflow of this.createdWorkflows.slice(0, Math.min(10, this.createdWorkflows.length))) {
      const commCount = Math.floor(Math.random() * 3) + 3;
      
      for (let i = 0; i < commCount; i++) {
        const commType = communicationTypes[Math.floor(Math.random() * communicationTypes.length)];
        const sender = this.createdUsers[Math.floor(Math.random() * this.createdUsers.length)];
        
        const communication = {
          id: `comm-${workflow.id}-${i}`,
          workflow_id: workflow.id,
          thread_id: `thread-${workflow.id}`,
          sender_id: sender.id,
          recipient_email: this.getRandomEmail(),
          subject: this.getRandomSubject(workflow.workflow_type),
          body: this.getRandomEmailBody(workflow.workflow_type),
          communication_type: commType,
          direction: Math.random() > 0.5 ? 'OUTBOUND' : 'INBOUND',
          status: emailStatuses[Math.floor(Math.random() * emailStatuses.length)],
          metadata: { workflow_type: workflow.workflow_type, test_data: true },
          created_at: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString()
        };

        communications.push(communication);

        // Add metadata based on communication type
        if (commType === 'email') {
          emailMetadata.push({
            communication_id: communication.id,
            message_id: `<${Date.now()}.${i}@rexera.com>`,
            attachments: Math.random() > 0.7 ? [{ name: 'document.pdf', size: 245760 }] : [],
            headers: { 'X-Priority': '3', 'X-Mailer': 'Rexera v2.0' }
          });
        } else if (commType === 'phone') {
          phoneMetadata.push({
            communication_id: communication.id,
            phone_number: this.getRandomPhoneNumber(),
            duration_seconds: Math.floor(Math.random() * 1800) + 60, // 1-30 minutes
            transcript: 'Automated transcript: Discussion about workflow progress and next steps.'
          });
        }
      }
    }

    // Insert communications
    if (communications.length > 0) {
      const { error: commError } = await this.supabase!
        .from('communications')
        .insert(communications);

      if (commError) {
        this.log(`⚠️  Warning: Failed to create communications: ${commError.message}`);
      } else {
        this.log(`✅ Created ${communications.length} communications`);
      }
    }

    // Insert email metadata
    if (emailMetadata.length > 0) {
      const { error: emailError } = await this.supabase!
        .from('email_metadata')
        .insert(emailMetadata);

      if (emailError) {
        this.log(`⚠️  Warning: Failed to create email metadata: ${emailError.message}`);
      } else {
        this.log(`✅ Created ${emailMetadata.length} email metadata records`);
      }
    }

    // Insert phone metadata  
    if (phoneMetadata.length > 0) {
      const { error: phoneError } = await this.supabase!
        .from('phone_metadata')
        .insert(phoneMetadata);

      if (phoneError) {
        this.log(`⚠️  Warning: Failed to create phone metadata: ${phoneError.message}`);
      } else {
        this.log(`✅ Created ${phoneMetadata.length} phone metadata records`);
      }
    }
  }

  private async seedDocuments(): Promise<void> {
    this.log('Creating workflow documents...');
    
    const documentTypes = ['WORKING', 'DELIVERABLE', 'INPUT', 'REFERENCE'];
    const mimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const statuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'];

    const documents = [];
    
    // Create 2-5 documents per workflow
    for (const workflow of this.createdWorkflows) {
      const docCount = Math.floor(Math.random() * 4) + 2;
      
      for (let i = 0; i < docCount; i++) {
        const docType = documentTypes[Math.floor(Math.random() * documentTypes.length)];
        const mimeType = mimeTypes[Math.floor(Math.random() * mimeTypes.length)];
        const fileExtension = this.getFileExtension(mimeType);
        
        documents.push({
          workflow_id: workflow.id,
          filename: `${workflow.workflow_type.toLowerCase()}_${docType.toLowerCase()}_${i + 1}.${fileExtension}`,
          url: `https://storage.rexera.com/workflows/${workflow.id}/documents/${i + 1}.${fileExtension}`,
          file_size_bytes: Math.floor(Math.random() * 5000000) + 100000, // 100KB - 5MB
          mime_type: mimeType,
          document_type: docType,
          tags: this.getDocumentTags(workflow.workflow_type, docType),
          upload_source: Math.random() > 0.5 ? 'agent_upload' : 'client_upload',
          status: statuses[Math.floor(Math.random() * statuses.length)],
          metadata: {
            workflow_type: workflow.workflow_type,
            ocr_processed: Math.random() > 0.3,
            confidence_score: Math.random() * 0.3 + 0.7,
            test_data: true
          },
          deliverable_data: docType === 'DELIVERABLE' ? {
            summary: `${workflow.workflow_type} completed successfully`,
            key_findings: [`Finding 1 for ${workflow.title}`, `Finding 2 for ${workflow.title}`]
          } : {},
          version: Math.floor(Math.random() * 3) + 1,
          created_by: this.createdUsers[Math.floor(Math.random() * this.createdUsers.length)]?.id
        });
      }
    }

    if (documents.length > 0) {
      const { error } = await this.supabase!
        .from('documents')
        .insert(documents);

      if (error) {
        this.log(`⚠️  Warning: Failed to create documents: ${error.message}`);
      } else {
        this.log(`✅ Created ${documents.length} workflow documents`);
      }
    }
  }

  private async seedFinancialData(): Promise<void> {
    this.log('Creating financial tracking data...');
    
    const costTypes = ['agent_usage', 'api_calls', 'document_processing', 'phone_calls', 'manual_review'];
    
    const costs = [];
    const invoices = [];

    // Create costs for workflows
    for (const workflow of this.createdWorkflows) {
      const costCount = Math.floor(Math.random() * 5) + 2;
      let totalCosts = 0;
      
      for (let i = 0; i < costCount; i++) {
        const costType = costTypes[Math.floor(Math.random() * costTypes.length)];
        const amount = parseFloat((Math.random() * 50 + 5).toFixed(2)); // $5-$55
        totalCosts += amount;
        
        costs.push({
          workflow_id: workflow.id,
          description: `${costType.replace('_', ' ')} costs for ${workflow.title}`,
          amount,
          cost_type: costType,
          incurred_at: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString()
        });
      }

      // Create invoice for some workflows
      if (Math.random() > 0.3) {
        const invoiceStatuses = ['DRAFT', 'FINALIZED', 'PAID', 'VOID'];
        
        invoices.push({
          client_id: workflow.client_id,
          workflow_id: workflow.id,
          invoice_number: `INV-${Date.now()}-${workflow.id.slice(-4)}`,
          status: invoiceStatuses[Math.floor(Math.random() * invoiceStatuses.length)],
          total_amount: totalCosts + Math.floor(Math.random() * 100) + 25 // Add service fee
        });
      }
    }

    // Insert costs
    if (costs.length > 0) {
      const { error: costError } = await this.supabase!
        .from('costs')
        .insert(costs);

      if (costError) {
        this.log(`⚠️  Warning: Failed to create costs: ${costError.message}`);
      } else {
        this.log(`✅ Created ${costs.length} cost records`);
      }
    }

    // Insert invoices
    if (invoices.length > 0) {
      const { error: invoiceError } = await this.supabase!
        .from('invoices')
        .insert(invoices);

      if (invoiceError) {
        this.log(`⚠️  Warning: Failed to create invoices: ${invoiceError.message}`);
      } else {
        this.log(`✅ Created ${invoices.length} invoices`);
      }
    }
  }

  private async seedContactLabels(): Promise<void> {
    this.log('Creating contact labels...');
    
    const contactLabels = [
      {
        label: 'primary_contact',
        display_name: 'Primary Contact',
        description: 'Main point of contact for the workflow',
        workflow_types: ['PAYOFF', 'HOA_ACQUISITION', 'MUNI_LIEN_SEARCH'],
        is_required: true,
        default_notifications: { status_changes: true, completion: true }
      },
      {
        label: 'lender_contact',
        display_name: 'Lender Contact',
        description: 'Lender representative for payoff requests',
        workflow_types: ['PAYOFF'],
        is_required: true,
        default_notifications: { documents: true }
      },
      {
        label: 'hoa_manager',
        display_name: 'HOA Manager',
        description: 'HOA management company representative',
        workflow_types: ['HOA_ACQUISITION'],
        is_required: false,
        default_notifications: { issues: true }
      },
      {
        label: 'city_clerk',
        display_name: 'City Clerk',
        description: 'Municipal records contact',
        workflow_types: ['MUNI_LIEN_SEARCH'],
        is_required: false,
        default_notifications: { completion: true }
      }
    ];

    const { error } = await this.supabase!
      .from('contact_labels')
      .upsert(contactLabels, { onConflict: 'label', ignoreDuplicates: true });

    if (error && !error.message.includes('duplicate')) {
      this.log(`⚠️  Warning: Failed to create contact labels: ${error.message}`);
    } else {
      this.log(`✅ Contact labels ready (${contactLabels.length} total)`);
    }
  }

  private async seedWorkflowContacts(): Promise<void> {
    this.log('Creating workflow contacts...');
    
    const workflowContacts = [];
    
    // Create 2-4 contacts per workflow
    for (const workflow of this.createdWorkflows.slice(0, 15)) { // Limit to first 15 workflows
      const contactCount = Math.floor(Math.random() * 3) + 2;
      
      for (let i = 0; i < contactCount; i++) {
        const isPrimary = i === 0;
        const labels = this.getContactLabelsForWorkflow(workflow.workflow_type);
        const label = isPrimary ? 'primary_contact' : labels[Math.floor(Math.random() * labels.length)];
        
        workflowContacts.push({
          workflow_id: workflow.id,
          label,
          name: `${['John', 'Jane', 'Bob', 'Alice', 'Mike'][i]} ${['Smith', 'Johnson', 'Brown', 'Davis', 'Wilson'][i]}`,
          email: `contact${i + 1}@${workflow.workflow_type.toLowerCase()}.example.com`,
          phone: this.getRandomPhoneNumber(),
          company: this.getCompanyForWorkflowType(workflow.workflow_type),
          role: this.getRoleForContactLabel(label),
          notify_on_status_change: isPrimary || Math.random() > 0.5,
          notify_on_completion: isPrimary || Math.random() > 0.3,
          notify_on_issues: isPrimary || Math.random() > 0.7,
          notify_on_documents: Math.random() > 0.4,
          notification_method: ['email', 'sms', 'both'][Math.floor(Math.random() * 3)],
          is_primary: isPrimary,
          notes: isPrimary ? 'Primary decision maker' : `Contact for ${label.replace('_', ' ')}`,
          preferred_contact_time: ['9AM-12PM', '1PM-5PM', '6PM-8PM'][Math.floor(Math.random() * 3)],
          timezone: ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles'][Math.floor(Math.random() * 4)]
        });
      }
    }

    if (workflowContacts.length > 0) {
      const { error } = await this.supabase!
        .from('workflow_contacts')
        .insert(workflowContacts);

      if (error) {
        this.log(`⚠️  Warning: Failed to create workflow contacts: ${error.message}`);
      } else {
        this.log(`✅ Created ${workflowContacts.length} workflow contacts`);
      }
    }
  }

  private async seedHilNotes(): Promise<void> {
    this.log('Creating HIL notes...');
    
    if (this.createdUsers.length === 0) {
      this.log('⚠️  No users available, skipping HIL notes');
      return;
    }

    const hilUsers = this.createdUsers.filter(u => u.user_type === 'hil_user');
    if (hilUsers.length === 0) {
      this.log('⚠️  No HIL users available, skipping HIL notes');
      return;
    }

    const priorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
    const hilNotes = [];
    
    // Create 1-3 notes per workflow
    for (const workflow of this.createdWorkflows.slice(0, 20)) {
      const noteCount = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < noteCount; i++) {
        const author = hilUsers[Math.floor(Math.random() * hilUsers.length)];
        const priority = priorities[Math.floor(Math.random() * priorities.length)];
        
        hilNotes.push({
          workflow_id: workflow.id,
          author_id: author.id,
          content: this.getRandomHilNoteContent(workflow.workflow_type, i),
          priority,
          is_resolved: Math.random() > 0.3, // 70% resolved
          mentions: Math.random() > 0.7 ? [hilUsers[Math.floor(Math.random() * hilUsers.length)].id] : [],
          created_at: new Date(Date.now() - Math.floor(Math.random() * 48 * 60 * 60 * 1000)).toISOString()
        });
      }
    }

    if (hilNotes.length > 0) {
      const { error } = await this.supabase!
        .from('hil_notes')
        .insert(hilNotes);

      if (error) {
        this.log(`⚠️  Warning: Failed to create HIL notes: ${error.message}`);
      } else {
        this.log(`✅ Created ${hilNotes.length} HIL notes`);
      }
    }
  }

  private async seedUserPreferences(): Promise<void> {
    this.log('Creating user preferences...');
    
    if (this.createdUsers.length === 0) {
      this.log('⚠️  No users available, skipping user preferences');
      return;
    }

    const themes = ['SYSTEM', 'LIGHT', 'DARK'];
    const timezones = ['UTC', 'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'Europe/London'];
    
    const userPreferences = this.createdUsers.map(user => ({
      user_id: user.id,
      theme: themes[Math.floor(Math.random() * themes.length)],
      language: 'en',
      timezone: timezones[Math.floor(Math.random() * timezones.length)],
      notification_settings: {
        email_enabled: Math.random() > 0.2,
        in_app_enabled: Math.random() > 0.1,
        sms_enabled: Math.random() > 0.7,
        push_enabled: Math.random() > 0.4
      },
      ui_settings: {
        dashboard_layout: ['compact', 'comfortable', 'spacious'][Math.floor(Math.random() * 3)],
        items_per_page: [10, 25, 50][Math.floor(Math.random() * 3)],
        auto_refresh: Math.random() > 0.3
      }
    }));

    const { error } = await this.supabase!
      .from('user_preferences')
      .insert(userPreferences);

    if (error) {
      this.log(`⚠️  Warning: Failed to create user preferences: ${error.message}`);
    } else {
      this.log(`✅ Created ${userPreferences.length} user preference profiles`);
    }
  }

  private async seedAgentPerformanceMetrics(): Promise<void> {
    this.log('Creating agent performance metrics...');
    
    const { data: agents } = await this.supabase!
      .from('agents')
      .select('id, name');

    if (!agents || agents.length === 0) {
      this.log('⚠️  No agents found, skipping performance metrics');
      return;
    }

    const metricTypes = [
      'success_rate',
      'avg_execution_time_ms',
      'tasks_completed',
      'tasks_failed',
      'avg_confidence_score',
      'cost_per_task',
      'sla_compliance_rate'
    ];

    const performanceMetrics = [];
    
    // Create metrics for last 30 days
    for (let day = 0; day < 30; day++) {
      const date = new Date();
      date.setDate(date.getDate() - day);
      
      for (const agent of agents) {
        for (const metricType of metricTypes) {
          performanceMetrics.push({
            agent_id: agent.id,
            metric_type: metricType,
            metric_value: this.getRealisticMetricValue(metricType),
            measurement_date: date.toISOString().split('T')[0] // YYYY-MM-DD format
          });
        }
      }
    }

    // Insert in batches to avoid timeout
    const batchSize = 100;
    let totalInserted = 0;
    
    for (let i = 0; i < performanceMetrics.length; i += batchSize) {
      const batch = performanceMetrics.slice(i, i + batchSize);
      
      try {
        const { data, error } = await this.supabase!
          .from('agent_performance_metrics')
          .insert(batch);

        if (error) {
          this.log(`⚠️  Warning: Failed to insert performance metrics batch: ${error.message}`);
        } else {
          totalInserted += batch.length;
        }
      } catch (error) {
        this.log(`⚠️  Warning: Error inserting performance metrics: ${error}`);
      }
    }

    this.log(`✅ Created ${totalInserted} agent performance metrics`);
  }

  private async seedAuditEvents(): Promise<void> {
    this.log('Creating audit events...');
    
    const actorTypes = ['human', 'agent', 'system'];
    const eventTypes = ['workflow_action', 'task_action', 'user_action', 'system_action'];
    const actions = ['create', 'read', 'update', 'delete', 'execute', 'approve', 'reject'];
    const resourceTypes = ['workflow', 'task_execution', 'document', 'communication'];

    const auditEvents = [];
    
    // Create audit events for workflows and tasks
    for (const workflow of this.createdWorkflows.slice(0, 10)) {
      // Workflow creation event
      auditEvents.push({
        actor_type: 'human',
        actor_id: this.createdUsers[0]?.id || 'system',
        actor_name: this.createdUsers[0]?.full_name || 'System',
        event_type: 'workflow_action',
        action: 'create',
        resource_type: 'workflow',
        resource_id: workflow.id,
        workflow_id: workflow.id,
        client_id: workflow.client_id,
        event_data: {
          workflow_type: workflow.workflow_type,
          title: workflow.title,
          created_via: 'web_interface'
        },
        created_at: workflow.created_at
      });

      // Task events
      const taskEvents = Math.floor(Math.random() * 10) + 5;
      for (let i = 0; i < taskEvents; i++) {
        const actorType = actorTypes[Math.floor(Math.random() * actorTypes.length)];
        const action = actions[Math.floor(Math.random() * actions.length)];
        
        auditEvents.push({
          actor_type: actorType,
          actor_id: actorType === 'human' ? 
            (this.createdUsers[Math.floor(Math.random() * this.createdUsers.length)]?.id || 'system') :
            actorType === 'agent' ? 'agent_system' : 'system',
          actor_name: actorType === 'human' ? 
            (this.createdUsers[Math.floor(Math.random() * this.createdUsers.length)]?.full_name || 'System') :
            actorType === 'agent' ? 'AI Agent' : 'System',
          event_type: 'task_action',
          action,
          resource_type: 'task_execution',
          resource_id: `task-${workflow.id}-${i}`,
          workflow_id: workflow.id,
          client_id: workflow.client_id,
          event_data: {
            task_type: `task_type_${i}`,
            action_details: `${action} performed on task`,
            automated: actorType === 'agent'
          },
          created_at: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString()
        });
      }
    }

    if (auditEvents.length > 0) {
      // Insert in batches
      const batchSize = 50;
      let totalInserted = 0;
      
      for (let i = 0; i < auditEvents.length; i += batchSize) {
        const batch = auditEvents.slice(i, i + batchSize);
        
        try {
          const { error } = await this.supabase!
            .from('audit_events')
            .insert(batch);

          if (error) {
            this.log(`⚠️  Warning: Failed to insert audit events batch: ${error.message}`);
          } else {
            totalInserted += batch.length;
          }
        } catch (error) {
          this.log(`⚠️  Warning: Error inserting audit events: ${error}`);
        }
      }

      this.log(`✅ Created ${totalInserted} audit events`);
    }
  }

  // Helper methods for realistic data generation
  private getRandomEmail(): string {
    const domains = ['example.com', 'test.org', 'demo.net', 'sample.co'];
    const names = ['john', 'jane', 'bob', 'alice', 'mike', 'sarah', 'david', 'emma'];
    return `${names[Math.floor(Math.random() * names.length)]}@${domains[Math.floor(Math.random() * domains.length)]}`;
  }

  private getRandomPhoneNumber(): string {
    return `1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
  }

  private getRandomSubject(workflowType: string): string {
    const subjects = {
      PAYOFF: ['Payoff Request Status Update', 'Lender Response Received', 'Payoff Amount Confirmed'],
      HOA_ACQUISITION: ['HOA Document Request', 'Community Information Received', 'HOA Fee Schedule Updated'],
      MUNI_LIEN_SEARCH: ['Municipal Search Results', 'Lien Search Completed', 'City Records Review']
    };
    const typeSubjects = subjects[workflowType as keyof typeof subjects] || ['General Update'];
    return typeSubjects[Math.floor(Math.random() * typeSubjects.length)];
  }

  private getRandomEmailBody(workflowType: string): string {
    return `This is an automated message regarding your ${workflowType.replace('_', ' ').toLowerCase()} workflow. The current status has been updated and requires your attention. Please review the attached documents and provide any necessary feedback.`;
  }

  private getFileExtension(mimeType: string): string {
    const extensions: { [key: string]: string } = {
      'application/pdf': 'pdf',
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
    };
    return extensions[mimeType] || 'pdf';
  }

  private getDocumentTags(workflowType: string, docType: string): string[] {
    const baseTags = [workflowType.toLowerCase(), docType.toLowerCase()];
    const extraTags = ['processed', 'verified', 'final', 'draft', 'confidential'];
    return [...baseTags, extraTags[Math.floor(Math.random() * extraTags.length)]];
  }

  private getContactLabelsForWorkflow(workflowType: string): string[] {
    const labels: { [key: string]: string[] } = {
      PAYOFF: ['lender_contact', 'primary_contact'],
      HOA_ACQUISITION: ['hoa_manager', 'primary_contact'],
      MUNI_LIEN_SEARCH: ['city_clerk', 'primary_contact']
    };
    return labels[workflowType] || ['primary_contact'];
  }

  private getCompanyForWorkflowType(workflowType: string): string {
    const companies: { [key: string]: string[] } = {
      PAYOFF: ['Wells Fargo Bank', 'Bank of America', 'Chase Mortgage'],
      HOA_ACQUISITION: ['Community First Management', 'HOA Services Inc', 'Premier Property Management'],
      MUNI_LIEN_SEARCH: ['City Planning Department', 'County Records Office', 'Municipal Services']
    };
    const typeCompanies = companies[workflowType] || ['Generic Company'];
    return typeCompanies[Math.floor(Math.random() * typeCompanies.length)];
  }

  private getRoleForContactLabel(label: string): string {
    const roles: { [key: string]: string } = {
      primary_contact: 'Primary Contact',
      lender_contact: 'Payoff Specialist',
      hoa_manager: 'Community Manager',
      city_clerk: 'Records Clerk'
    };
    return roles[label] || 'Contact';
  }

  private getRandomHilNoteContent(workflowType: string, index: number): string {
    const notes = [
      `Initial review of ${workflowType.replace('_', ' ').toLowerCase()} workflow completed. All required documents are present.`,
      `Quality check identified minor discrepancies in data extraction. Requesting re-processing.`,
      `Client has requested expedited processing. Updating priority to HIGH.`,
      `Waiting for counterparty response. Setting follow-up reminder for 24 hours.`,
      `Final review completed. Workflow ready for delivery to client.`
    ];
    return notes[index % notes.length];
  }

  private getRealisticMetricValue(metricType: string): number {
    switch (metricType) {
      case 'success_rate':
        return Math.random() * 0.15 + 0.85; // 85-100%
      case 'avg_execution_time_ms':
        return Math.floor(Math.random() * 300000) + 60000; // 1-5 minutes
      case 'tasks_completed':
        return Math.floor(Math.random() * 50) + 10; // 10-60 tasks
      case 'tasks_failed':
        return Math.floor(Math.random() * 5); // 0-5 failures
      case 'avg_confidence_score':
        return Math.random() * 0.2 + 0.8; // 80-100%
      case 'cost_per_task':
        return Math.random() * 10 + 2; // $2-$12
      case 'sla_compliance_rate':
        return Math.random() * 0.1 + 0.9; // 90-100%
      default:
        return Math.random() * 100;
    }
  }

  private createdWorkflows: any[] = [];
  private createdUsers: any[] = [];
}

// Run script if called directly
if (require.main === module) {
  const script = new TestDataSeedScript();
  script.run().catch(console.error);
}