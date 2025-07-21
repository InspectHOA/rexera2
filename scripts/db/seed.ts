#!/usr/bin/env tsx
/**
 * Comprehensive Database Seed Script
 * Resets database and creates extensive test data:
 * - 8 clients
 * - 10 agents  
 * - 50 workflows (20 Municipal, 15 HOA, 15 Payoff)
 * - 100+ task executions
 * - Threaded communications
 * - Documents, costs, invoices
 * - HIL notes and notifications
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { randomUUID } from 'crypto';
import * as path from 'path';

config({ path: path.join(__dirname, '../../serverless-api/.env') });

console.log('🔧 Environment check:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'Missing');

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    }
  }
);

async function testConnection() {
  console.log('🔌 Testing database connection...');
  try {
    // First check what role we're using
    const { data: roleData, error: roleError } = await supabase.rpc('auth.role');
    console.log('🔍 Current auth role:', roleData, roleError);
    
    // Try direct SQL to check role
    const { data: sqlData, error: sqlError } = await supabase
      .from('clients')
      .select('*')
      .limit(1);
      
    if (sqlError) {
      console.error('❌ Connection test failed:', sqlError);
      return false;
    }
    console.log('✅ Connection test successful');
    return true;
  } catch (err) {
    console.error('❌ Connection test error:', err);
    return false;
  }
}

async function resetDatabase() {
  console.log('🗃️ Resetting database...');
  
  const tablesToClear = [
    'hil_notifications', 'hil_notes', 'workflow_contacts', 'email_metadata',
    'phone_metadata', 'communications', 'documents', 'costs', 'invoices',
    'workflow_counterparties', 'counterparties', 'task_executions',
    'workflows', 'agent_performance_metrics', 'agents', 'user_preferences',
    'user_profiles', 'clients'
  ];
  
  for (const table of tablesToClear) {
    try {
      await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      console.log(`✅ Cleared ${table}`);
    } catch (error) {
      console.log(`⚠️ Could not clear ${table}`);
    }
  }
}

async function seedDatabase() {
  console.log('🌱 Creating comprehensive test data...');
  
  // Use SKIP_AUTH user ID for development (real auth user)
  const SKIP_AUTH_USER_ID = '284219ff-3a1f-4e86-9ea4-3536f940451f';
  let testUserId = SKIP_AUTH_USER_ID; 
  let adminUserId = SKIP_AUTH_USER_ID;

  // Create 8 diverse clients
  const { data: clients, error: clientError } = await supabase.from('clients').upsert([
    { id: '11111111-1111-1111-1111-111111111111', name: 'Prestige Title Co.', domain: 'prestige-title.com' },
    { id: '22222222-2222-2222-2222-222222222222', name: 'Gateway Escrow Services', domain: 'gateway-escrow.com' },
    { id: '33333333-3333-3333-3333-333333333333', name: 'Secure Closing LLC', domain: 'secure-closing.com' },
    { id: '44444444-4444-4444-4444-444444444444', name: 'First National Title', domain: 'firstnational-title.com' },
    { id: '55555555-5555-5555-5555-555555555555', name: 'Premier Escrow Group', domain: 'premier-escrow.com' },
    { id: '66666666-6666-6666-6666-666666666666', name: 'Coastal Title Services', domain: 'coastal-title.com' },
    { id: '77777777-7777-7777-7777-777777777777', name: 'Mountain View Escrow', domain: 'mountainview-escrow.com' },
    { id: '88888888-8888-8888-8888-888888888888', name: 'Metro Title Partners', domain: 'metro-title.com' }
  ]).select();
  
  if (clientError) {
    console.error('❌ Failed to create clients:', clientError);
    throw clientError;
  }
  console.log(`✅ Created ${clients?.length || 0} clients`);

  // Create SKIP_AUTH user profile for development (without auth.users dependency)
  // This allows the frontend to work properly in SKIP_AUTH mode
  const { data: skipAuthProfile, error: skipAuthError } = await supabase.from('user_profiles').upsert([
    { 
      id: SKIP_AUTH_USER_ID, 
      user_type: 'hil_user', 
      email: 'admin@rexera.com', 
      full_name: 'Admin User', 
      role: 'HIL_ADMIN',
      company_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]).select();
  
  if (skipAuthError) {
    console.error('❌ Failed to create SKIP_AUTH user profile:', skipAuthError);
    throw skipAuthError;
  }
  
  console.log(`✅ Created SKIP_AUTH user profile: ${SKIP_AUTH_USER_ID}`);

  // Create all 10 agents
  const { data: agents, error: agentError } = await supabase.from('agents').upsert([
    { id: '66666666-6666-6666-6666-666666666666', name: 'nina', type: 'research', description: 'Research and Data Discovery Agent', capabilities: ['document_search', 'data_extraction', 'web_research'], is_active: true },
    { id: '77777777-7777-7777-7777-777777777777', name: 'mia', type: 'communication', description: 'Email Communication Agent', capabilities: ['email_sending', 'template_processing'], is_active: true },
    { id: '88888888-8888-8888-8888-888888888888', name: 'florian', type: 'communication', description: 'Phone Outreach Agent', capabilities: ['phone_calling', 'ivr_navigation'], is_active: true },
    { id: '99999999-9999-9999-9999-999999999999', name: 'rex', type: 'automation', description: 'Web Portal Navigation Agent', capabilities: ['portal_login', 'form_filling'], is_active: true },
    { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'iris', type: 'document_processing', description: 'Document Analysis Agent', capabilities: ['document_parsing', 'ocr'], is_active: true },
    { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', name: 'ria', type: 'support', description: 'Support and Coordination Agent', capabilities: ['status_updates', 'client_communication'], is_active: true },
    { id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', name: 'kosha', type: 'financial', description: 'Financial Analysis Agent', capabilities: ['cost_calculation', 'invoice_processing'], is_active: true },
    { id: 'dddddddd-dddd-dddd-dddd-dddddddddddd', name: 'cassy', type: 'quality_assurance', description: 'Quality Validation Agent', capabilities: ['data_validation', 'quality_checks'], is_active: true },
    { id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', name: 'max', type: 'communication', description: 'IVR Navigation Agent', capabilities: ['ivr_navigation', 'phone_automation'], is_active: true },
    { id: 'ffffffff-ffff-ffff-ffff-ffffffffffff', name: 'corey', type: 'specialist', description: 'HOA Specialist Agent', capabilities: ['hoa_document_processing', 'estoppel_requests'], is_active: true }
  ]).select();
  
  if (agentError) {
    console.error('❌ Failed to create agents:', agentError);
    throw agentError;
  }
  console.log(`✅ Created ${agents?.length || 0} agents`);

  // Create 50 comprehensive workflows
  const workflows = [];
  const taskExecutions = [];
  const communications = [];
  const costs = [];
  const hilNotifications = [];
  
  // Use new enum values from migration
  const workflowStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'WAITING_FOR_CLIENT', 'COMPLETED'];
  const taskStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'INTERRUPT', 'COMPLETED', 'FAILED'];
  const priorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
  const clientIds = ['11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555', '66666666-6666-6666-6666-666666666666', '77777777-7777-7777-7777-777777777777', '88888888-8888-8888-8888-888888888888'];

  // Helper function to create HIL notification for interrupted task
  function createHilNotification(taskExecution: any, workflowId: string, workflowTitle: string) {
    if (taskExecution.status === 'INTERRUPT' && taskExecution.interrupt_type) {
      const interruptTypeMessages: Record<string, string> = {
        'CLIENT_CLARIFICATION': 'Client clarification required',
        'MISSING_DOCUMENT': 'Missing required documentation',
        'PAYMENT_REQUIRED': 'Payment required to proceed',
        'MANUAL_VERIFICATION': 'Manual verification needed'
      };
      
      hilNotifications.push({
        id: randomUUID(),
        user_id: testUserId, // Assign to test HIL user
        type: 'TASK_INTERRUPT',
        priority: taskExecution.priority,
        title: `${interruptTypeMessages[taskExecution.interrupt_type]} - ${taskExecution.title}`,
        message: taskExecution.error_message || `Task requires HIL attention: ${taskExecution.description}`,
        action_url: `/workflow/${workflowId}`,
        metadata: {
          workflow_id: workflowId,
          task_id: taskExecution.id,
          interrupt_type: taskExecution.interrupt_type,
          workflow_title: workflowTitle,
          task_type: taskExecution.task_type
        },
        read: false,
        read_at: null,
        created_at: taskExecution.started_at
      });
    }
  }

  // 20 Municipal Lien Search workflows
  for (let i = 1; i <= 20; i++) {
    const workflowId = randomUUID();
    const addresses = ['Main St', 'Oak Ave', 'Pine Rd', 'Elm Dr', 'Broadway', 'Park Ave', 'First St', 'Second St', 'Third Ave', 'Fourth St', 'State St', 'Market St', 'Union Ave', 'Central Blvd', 'Commerce Dr', 'Industrial Way', 'Technology Ln', 'Business Ct', 'Enterprise Dr', 'Innovation Blvd'];
    
    workflows.push({
      id: workflowId,
      workflow_type: 'MUNI_LIEN_SEARCH',
      client_id: clientIds[i % clientIds.length],
      title: `Municipal Lien Search - ${100 + i * 25} ${addresses[i - 1]}`,
      description: `Municipal lien search for property at ${100 + i * 25} ${addresses[i - 1]}`,
      status: workflowStatuses[i % workflowStatuses.length],
      priority: priorities[i % priorities.length],
      metadata: { 
        property_address: `${100 + i * 25} ${addresses[i - 1]}, City ${i}, ST 1${String(i).padStart(4, '0')}`,
        parcel_id: `${i.toString().padStart(3, '0')}-${(i * 11).toString().padStart(2, '0')}-${(i * 7).toString().padStart(3, '0')}`,
        municipality: `City ${i}`
      },
      created_by: testUserId,
      due_date: new Date(Date.now() + (i * 24 * 60 * 60 * 1000)).toISOString()
    });

    // Add task executions for first 15 workflows with multiple tasks each
    if (i <= 15) {
      // Primary research task
      const status1 = taskStatuses[i % taskStatuses.length];
      const hasInterrupt1 = status1 === 'INTERRUPT' || i % 4 === 0;
      
      const task1 = {
        id: randomUUID(),
        workflow_id: workflowId,
        agent_id: '66666666-6666-6666-6666-666666666666',
        title: 'Research Municipal Records',
        description: 'Search municipal databases for liens and assessments',
        sequence_order: 1,
        task_type: 'research_municipal_records',
        status: status1,
        executor_type: 'AI',
        priority: priorities[i % priorities.length],
        input_data: { parcel_id: `${i.toString().padStart(3, '0')}-${(i * 11).toString().padStart(2, '0')}-${(i * 7).toString().padStart(3, '0')}`, municipality: `City ${i}` },
        output_data: status1 === 'COMPLETED' ? { liens_found: i % 4, total_amount: i * 250.50 } : {},
        error_message: hasInterrupt1 ? `Property records incomplete for parcel ${i.toString().padStart(3, '0')}-${(i * 11).toString().padStart(2, '0')}-${(i * 7).toString().padStart(3, '0')}. Manual verification required.` : null,
        interrupt_type: hasInterrupt1 ? (i % 4 === 0 ? 'CLIENT_CLARIFICATION' : i % 4 === 1 ? 'MISSING_DOCUMENT' : i % 4 === 2 ? 'PAYMENT_REQUIRED' : 'MANUAL_VERIFICATION') : null,
        started_at: new Date(Date.now() - (i * 60 * 60 * 1000)).toISOString(),
        completed_at: status1 === 'COMPLETED' ? new Date(Date.now() - ((i - 1) * 60 * 60 * 1000)).toISOString() : null,
        execution_time_ms: status1 === 'COMPLETED' ? (i * 300000) : null,
        retry_count: hasInterrupt1 ? (i % 2) : 0
      };
      
      taskExecutions.push(task1);

      // Secondary verification task for workflows 8-15 (creates more interrupts)
      if (i >= 8) {
        const status2 = i % 5 === 0 ? 'INTERRUPT' : (i % 3 === 0 ? 'FAILED' : 'NOT_STARTED');
        const hasInterrupt2 = status2 === 'INTERRUPT' || status2 === 'FAILED';
        
        taskExecutions.push({
          id: randomUUID(),
          workflow_id: workflowId,
          agent_id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
          title: 'Verify Municipal Data',
          description: 'Cross-check municipal records with county database',
          sequence_order: 2,
          task_type: 'verify_municipal_data',
          status: status2,
          executor_type: 'AI',
          priority: priorities[(i + 1) % priorities.length],
          input_data: { source_data: `municipal_records_${i}`, verification_required: true },
          output_data: status2 === 'COMPLETED' ? { verification_status: 'CONFIRMED', confidence: 0.95 } : {},
          error_message: hasInterrupt2 ? `Data discrepancy found in municipal vs county records. HIL review needed for final determination.` : null,
          interrupt_type: hasInterrupt2 ? (i % 2 === 0 ? 'MISSING_DOCUMENT' : 'CLIENT_CLARIFICATION') : null,
          started_at: new Date(Date.now() - ((i - 2) * 60 * 60 * 1000)).toISOString(),
          completed_at: status2 === 'COMPLETED' ? new Date(Date.now() - ((i - 1.5) * 60 * 60 * 1000)).toISOString() : null,
          execution_time_ms: status2 === 'COMPLETED' ? (i * 200000) : null,
          retry_count: hasInterrupt2 ? 1 : 0
        });
      }

      // Document generation task for workflows 5-15 (more potential interrupts)
      if (i >= 5) {
        const status3 = i % 6 === 0 ? 'INTERRUPT' : (i % 4 === 0 ? 'NOT_STARTED' : 'COMPLETED');
        const hasInterrupt3 = status3 === 'INTERRUPT';
        
        taskExecutions.push({
          id: randomUUID(),
          workflow_id: workflowId,
          agent_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          title: 'Generate Lien Report',
          description: 'Compile findings into formal lien search report',
          sequence_order: 3,
          task_type: 'generate_lien_report',
          status: status3,
          executor_type: 'AI',
          priority: priorities[(i + 2) % priorities.length],
          input_data: { template_type: 'standard_lien_report', include_maps: true },
          output_data: status3 === 'COMPLETED' ? { report_id: `LIEN_RPT_${i}_${Date.now()}`, pages: 3 + (i % 3) } : {},
          error_message: hasInterrupt3 ? `Report template requires manual customization for complex lien structure. HIL input needed.` : null,
          interrupt_type: hasInterrupt3 ? 'CLIENT_CLARIFICATION' : null,
          started_at: new Date(Date.now() - ((i - 1) * 60 * 60 * 1000)).toISOString(),
          completed_at: status3 === 'COMPLETED' ? new Date(Date.now() - ((i - 0.5) * 60 * 60 * 1000)).toISOString() : null,
          execution_time_ms: status3 === 'COMPLETED' ? (i * 150000) : null,
          retry_count: 0
        });
      }

      // Add extra interrupted tasks for workflows 1, 3, 7, and 12 to create multi-agent interrupts
      if ([1, 3, 7, 12].includes(i)) {
        // Add mia email task that's interrupted
        const miaTaskId = randomUUID();
        taskExecutions.push({
          id: miaTaskId,
          workflow_id: workflowId,
          agent_id: '77777777-7777-7777-7777-777777777777', // mia
          title: 'Send Client Notification Email',
          description: 'Notify client of findings and next steps',
          sequence_order: 4,
          task_type: 'send_email',
          status: 'INTERRUPT',
          executor_type: 'AI',
          priority: 'HIGH',
          input_data: { email_template: 'lien_results', client_contact: 'primary' },
          output_data: {},
          error_message: 'Email template requires legal review before sending to client. Complex lien situation needs approval.',
          interrupt_type: 'CLIENT_CLARIFICATION',
          started_at: new Date(Date.now() - ((i - 0.5) * 60 * 60 * 1000)).toISOString(),
          completed_at: null,
          execution_time_ms: null,
          retry_count: 1
        });

        // Create threaded email conversation for this Mia task
        const threadId = randomUUID();
        const clientEmails = ['john.smith@email.com', 'sarah.johnson@email.com', 'mike.brown@email.com', 'lisa.davis@email.com'];
        const clientNames = ['John Smith', 'Sarah Johnson', 'Mike Brown', 'Lisa Davis'];
        const propertyAddresses = ['125 Main St', '175 Pine Rd', '275 First St', '400 Market St'];
        const addressIndex = [1, 3, 7, 12].indexOf(i);
        const lienAmount = (Math.random() * 2000 + 500).toFixed(2);
        
        // Email 1: Initial lien search results (3 days ago)
        communications.push({
          id: randomUUID(),
          workflow_id: workflowId,
          thread_id: threadId,
          sender_id: null,
          recipient_email: clientEmails[addressIndex],
          subject: `Lien Search Results - ${propertyAddresses[addressIndex]}`,
          body: `Dear ${clientNames[addressIndex]},\n\nWe have completed the initial municipal lien search for ${propertyAddresses[addressIndex]}.\n\nFINDINGS SUMMARY:\n- Water/Sewer liens: $${lienAmount}\n- Property tax status: Current with pending assessment\n- Code violations: 1 minor violation (fence height) - resolved 2019\n- Assessment liens: None found\n- Special district assessments: $145.50 (street lighting)\n\nNEXT STEPS:\nWe need to verify the water/sewer lien amount and obtain payoff quotes. This may affect your closing timeline.\n\nI'll follow up with detailed documentation within 24 hours.\n\nBest regards,\nMia Chen\nEmail Communication Agent\nRexera Title Services\n(555) 123-4567`,
          communication_type: 'email',
          direction: 'OUTBOUND',
          status: 'SENT',
          metadata: { 
            agent: 'mia',
            task_id: miaTaskId,
            to_name: clientNames[addressIndex],
            thread_position: 1
          },
          created_at: new Date(Date.now() - (3 * 24 * 60 * 60 * 1000)).toISOString()
        });

        // Email 2: Client response asking questions (2 days ago)
        communications.push({
          id: randomUUID(),
          workflow_id: workflowId,
          thread_id: threadId,
          sender_id: null,
          recipient_email: 'mia.chen@rexera.com',
          subject: `RE: Lien Search Results - ${propertyAddresses[addressIndex]}`,
          body: `Hi Mia,\n\nThank you for the preliminary results. I have a few questions:\n\n1. Can you clarify the water/sewer lien amount? Is this an actual lien or just an outstanding balance?\n\n2. How long will it take to get the payoff quote from the water department?\n\n3. Will this delay our closing scheduled for next Friday?\n\n4. What documentation do you need from me to proceed?\n\nI'm concerned about the timeline since we have a tight closing schedule.\n\nThanks,\n${clientNames[addressIndex]}\n${clientEmails[addressIndex]}\n(555) 987-6543`,
          communication_type: 'email',
          direction: 'INBOUND',
          status: 'READ',
          metadata: { 
            from_name: clientNames[addressIndex],
            thread_position: 2,
            client_concern: 'timeline'
          },
          created_at: new Date(Date.now() - (2 * 24 * 60 * 60 * 1000)).toISOString()
        });

        // Email 3: Mia's detailed response (1 day ago)
        communications.push({
          id: randomUUID(),
          workflow_id: workflowId,
          thread_id: threadId,
          sender_id: null,
          recipient_email: clientEmails[addressIndex],
          subject: `RE: Lien Search Results - ${propertyAddresses[addressIndex]}`,
          body: `Dear ${clientNames[addressIndex]},\n\nThank you for your questions. Here are the detailed answers:\n\n1. WATER/SEWER LIEN: This is an actual recorded lien filed 6 months ago for unpaid utilities. Amount: $${lienAmount} plus interest.\n\n2. PAYOFF TIMELINE: Water department requires 3-5 business days for official payoff letters. I've already submitted the request.\n\n3. CLOSING IMPACT: This should not delay your Friday closing if we receive payoff confirmation by Wednesday.\n\n4. DOCUMENTATION NEEDED: None from you at this time. I'm handling all municipal coordination.\n\nADDITIONAL FINDINGS:\n- Contacted City Planning Dept: No pending special assessments\n- Verified property tax payments current through 2024\n- Obtained certified copy of lien documentation\n\nACTION ITEMS:\n- Monday: Follow up with Water Dept (Priority)\n- Tuesday: Obtain final payoff amount\n- Wednesday: Coordinate payment with closing agent\n\nI'll send updates daily until resolution. Please let me know if you have other concerns.\n\nBest regards,\nMia Chen\nEmail Communication Agent\nRexera Title Services\nDirect: (555) 123-4567\nCell: (555) 123-4568`,
          communication_type: 'email',
          direction: 'OUTBOUND',
          status: 'DELIVERED',
          metadata: { 
            agent: 'mia',
            task_id: miaTaskId,
            to_name: clientNames[addressIndex],
            thread_position: 3,
            priority: 'high'
          },
          created_at: new Date(Date.now() - (1 * 24 * 60 * 60 * 1000)).toISOString()
        });

        // Email 4: Update with complications (8 hours ago)
        communications.push({
          id: randomUUID(),
          workflow_id: workflowId,
          thread_id: threadId,
          sender_id: null,
          recipient_email: clientEmails[addressIndex],
          subject: `URGENT: Lien Update - ${propertyAddresses[addressIndex]}`,
          body: `Dear ${clientNames[addressIndex]},\n\nIMPORTANT UPDATE:\n\nI received the official payoff letter from the Water Department. There's a complication that requires immediate attention:\n\nORIGINAL LIEN: $${lienAmount}\nACCRUED INTEREST: $${(parseFloat(lienAmount) * 0.15).toFixed(2)}\nADMIN FEES: $125.00\nTOTAL PAYOFF: $${(parseFloat(lienAmount) * 1.15 + 125).toFixed(2)}\n\nCOMPLICATION:\nThe water department discovered an additional service connection fee from 2022 that wasn't included in the original lien filing. This creates a title issue that requires legal review.\n\nREQUIRED ACTIONS:\n1. Our legal team must review the additional fee ($487.50)\n2. Title company needs to approve modified commitment\n3. Lender notification of additional title requirements\n\nTIMELINE IMPACT:\nThis may delay closing by 2-3 business days for proper legal clearance.\n\nI'm scheduling an emergency call with all parties for tomorrow morning at 9 AM. Please confirm your availability.\n\nUrgent questions: Call my cell immediately (555) 123-4568\n\nMia Chen\nEmail Communication Agent\nRexera Title Services\nEMERGENCY LINE: (555) 123-4568`,
          communication_type: 'email',
          direction: 'OUTBOUND',
          status: 'DELIVERED',
          metadata: { 
            agent: 'mia',
            task_id: miaTaskId,
            to_name: clientNames[addressIndex],
            thread_position: 4,
            urgency: 'critical',
            total_payoff: (parseFloat(lienAmount) * 1.15 + 125).toFixed(2)
          },
          created_at: new Date(Date.now() - (8 * 60 * 60 * 1000)).toISOString()
        });

        // Email 5: Current draft requiring legal review (FAILED status)
        communications.push({
          id: randomUUID(),
          workflow_id: workflowId,
          thread_id: threadId,
          sender_id: null,
          recipient_email: clientEmails[addressIndex],
          subject: `DRAFT: Legal Review Required - ${propertyAddresses[addressIndex]}`,
          body: `Dear ${clientNames[addressIndex]},\n\n[DRAFT - AWAITING LEGAL REVIEW]\n\nFOLLOW-UP ON EMERGENCY CONFERENCE CALL:\n\nAfter consultation with our legal team and title company, we have identified resolution options for the additional service connection fee:\n\nOPTION 1 - FULL CLEARANCE:\n- Pay additional fee: $487.50\n- Obtain legal release documentation\n- Close on original timeline (Friday)\n- Total additional cost: $612.50 (includes legal fees)\n\nOPTION 2 - TITLE INSURANCE EXCEPTION:\n- Proceed with closing as scheduled\n- Add exception to title policy\n- Buyer assumes responsibility for fee resolution\n- Additional premium: $250.00\n\nOPTION 3 - DELAYED CLOSING:\n- Request 1-week extension\n- Full legal resolution with city\n- Clean title delivery\n- No additional buyer costs\n\nRECOMMENDATION:\n[LEGAL TEAM INPUT REQUIRED]\nOur preliminary recommendation is Option 1, but this requires review of municipal code section 14.7.3 regarding retroactive service fees and their enforceability.\n\nLEGAL RESEARCH NOT_STARTED:\n- Municipal ordinance review\n- Statute of limitations analysis\n- Title insurance underwriter consultation\n- Lender requirement verification\n\nI will provide final recommendation within 24 hours pending legal team analysis.\n\n[THIS EMAIL REQUIRES LEGAL DEPARTMENT APPROVAL BEFORE SENDING]\n\nMia Chen\nEmail Communication Agent\nRexera Title Services\n(555) 123-4567\n\n--- INTERNAL NOTES ---\nLegal Review Items:\n- Verify municipal authority for retroactive fees\n- Confirm title insurance coverage options\n- Review lender policy on additional liens\n- Prepare client consultation call script`,
          communication_type: 'email',
          direction: 'OUTBOUND',
          status: 'FAILED',
          metadata: { 
            agent: 'mia',
            task_id: miaTaskId,
            to_name: clientNames[addressIndex],
            thread_position: 5,
            requires_legal_review: true,
            draft_status: 'pending_approval',
            legal_items: ['municipal_authority', 'title_coverage', 'lender_policy']
          },
          created_at: new Date(Date.now() - (2 * 60 * 60 * 1000)).toISOString()
        });

        // Add ria support coordination task that's interrupted for workflows 3, 7, 12
        if ([3, 7, 12].includes(i)) {
          taskExecutions.push({
            id: randomUUID(),
            workflow_id: workflowId,
            agent_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', // ria
            title: 'Coordinate Client Support',
            description: 'Schedule follow-up call and prepare documentation',
            sequence_order: 5,
            task_type: 'client_coordination',
            status: 'INTERRUPT',
            executor_type: 'AI',
            priority: 'NORMAL',
            input_data: { client_preference: 'phone_call', urgency: 'standard' },
            output_data: {},
            error_message: 'Client has specific communication requirements that need manual review. Accessibility accommodations required.',
            interrupt_type: 'MANUAL_VERIFICATION',
            started_at: new Date(Date.now() - ((i - 0.3) * 60 * 60 * 1000)).toISOString(),
            completed_at: null,
            execution_time_ms: null,
            retry_count: 0
          });
        }
      }

      // Add costs for all tasks
      costs.push({
        workflow_id: workflowId,
        description: `Agent execution - Nina (municipal research ${i})`,
        amount: 15.75 + (i * 2.25),
        cost_type: 'AGENT_EXECUTION',
        incurred_at: new Date(Date.now() - (i * 60 * 60 * 1000)).toISOString()
      });
      
      if (i >= 8) {
        costs.push({
          workflow_id: workflowId,
          description: `Agent execution - Cassy (data verification ${i})`,
          amount: 8.50 + (i * 1.25),
          cost_type: 'AGENT_EXECUTION',
          incurred_at: new Date(Date.now() - ((i - 1) * 60 * 60 * 1000)).toISOString()
        });
      }
      
      if (i >= 5) {
        costs.push({
          workflow_id: workflowId,
          description: `Agent execution - Ria (report generation ${i})`,
          amount: 12.00 + (i * 1.75),
          cost_type: 'AGENT_EXECUTION',
          incurred_at: new Date(Date.now() - ((i - 0.5) * 60 * 60 * 1000)).toISOString()
        });
      }
    }
  }

  // 15 HOA Acquisition workflows
  for (let i = 1; i <= 15; i++) {
    const workflowId = randomUUID();
    const hoaNames = ['Pine Meadows', 'Maple Gardens', 'Cedar Ridge', 'Birch Valley', 'Willow Creek', 'Aspen Heights', 'Oak Ridge', 'Sunset Terrace', 'Harbor View', 'Mountain Ridge', 'Valley Springs', 'Riverside Walk', 'Lakefront', 'Garden View', 'Meadowbrook'];
    const units = ['Unit', 'Apt', 'Condo', 'Villa', 'Townhouse'];
    
    workflows.push({
      id: workflowId,
      workflow_type: 'HOA_ACQUISITION',
      client_id: clientIds[i % clientIds.length],
      title: `HOA Estoppel - ${200 + i * 30} ${hoaNames[i - 1]} Way ${units[i % units.length]} ${i}`,
      description: `HOA estoppel certificate request for ${hoaNames[i - 1]} community`,
      status: workflowStatuses[i % workflowStatuses.length],
      priority: priorities[i % priorities.length],
      metadata: { 
        property_address: `${200 + i * 30} ${hoaNames[i - 1]} Way ${units[i % units.length]} ${i}, Community ${i}, ST 2${String(i).padStart(4, '0')}`,
        hoa_name: `${hoaNames[i - 1]} HOA`,
        unit_number: `${units[i % units.length]} ${i}`,
        management_company: `${hoaNames[i - 1]} Management Services`
      },
      created_by: testUserId,
      due_date: new Date(Date.now() + ((i + 2) * 24 * 60 * 60 * 1000)).toISOString()
    });

    // Add task executions for first 12 workflows with multiple tasks each
    if (i <= 12) {
      // Primary HOA identification task
      const status1 = taskStatuses[i % taskStatuses.length];
      const hasInterrupt1 = status1 === 'INTERRUPT' || i % 3 === 0;
      
      taskExecutions.push({
        id: randomUUID(),
        workflow_id: workflowId,
        agent_id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
        title: 'Identify HOA Management',
        description: 'Research HOA management company details',
        sequence_order: 1,
        task_type: 'identify_hoa_management',
        status: status1,
        executor_type: 'AI',
        priority: priorities[i % priorities.length],
        input_data: { hoa_name: `${hoaNames[i - 1]} HOA`, property_address: `${200 + i * 30} ${hoaNames[i - 1]} Way` },
        output_data: status1 === 'COMPLETED' ? { management_company: `${hoaNames[i - 1]} Management Services`, confidence: 0.85 + (i * 0.01) } : {},
        error_message: hasInterrupt1 ? `HOA management contact info outdated or conflicting. Multiple management companies found for ${hoaNames[i - 1]} HOA.` : null,
        interrupt_type: hasInterrupt1 ? (i % 4 === 0 ? 'CLIENT_CLARIFICATION' : i % 4 === 1 ? 'MISSING_DOCUMENT' : i % 4 === 2 ? 'PAYMENT_REQUIRED' : 'MANUAL_VERIFICATION') : null,
        started_at: new Date(Date.now() - (i * 2 * 60 * 60 * 1000)).toISOString(),
        completed_at: status1 === 'COMPLETED' ? new Date(Date.now() - ((i - 1) * 2 * 60 * 60 * 1000)).toISOString() : null,
        execution_time_ms: status1 === 'COMPLETED' ? (i * 450000) : null,
        retry_count: hasInterrupt1 ? (i % 2) : 0
      });

      // Request estoppel documents task for workflows 6-12 (more interrupts)
      if (i >= 6) {
        const status2 = i % 4 === 0 ? 'INTERRUPT' : (i % 5 === 0 ? 'FAILED' : 'NOT_STARTED');
        const hasInterrupt2 = status2 === 'INTERRUPT' || status2 === 'FAILED';
        
        taskExecutions.push({
          id: randomUUID(),
          workflow_id: workflowId,
          agent_id: '77777777-7777-7777-7777-777777777777',
          title: 'Request Estoppel Certificate',
          description: 'Submit formal request for HOA estoppel documents',
          sequence_order: 2,
          task_type: 'request_estoppel_certificate',
          status: status2,
          executor_type: 'AI',
          priority: priorities[(i + 1) % priorities.length],
          input_data: { 
            management_company: `${hoaNames[i - 1]} Management Services`,
            unit_info: `${200 + i * 30} ${hoaNames[i - 1]} Way ${['Unit', 'Apt', 'Condo', 'Villa', 'Townhouse'][i % 5]} ${i}`,
            closing_date: new Date(Date.now() + ((i + 10) * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
          },
          output_data: status2 === 'COMPLETED' ? { 
            request_sent: true,
            confirmation_number: `EST_${i}_${Date.now().toString().slice(-6)}`,
            expected_delivery: new Date(Date.now() + ((i + 3) * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
          } : {},
          error_message: hasInterrupt2 ? `HOA requires additional documentation or owner authorization before processing estoppel request. Manual intervention needed.` : null,
          interrupt_type: hasInterrupt2 ? (i % 2 === 0 ? 'CLIENT_CLARIFICATION' : 'DATA_QUALITY') : null,
          started_at: new Date(Date.now() - ((i - 1) * 2 * 60 * 60 * 1000)).toISOString(),
          completed_at: status2 === 'COMPLETED' ? new Date(Date.now() - ((i - 0.5) * 2 * 60 * 60 * 1000)).toISOString() : null,
          execution_time_ms: status2 === 'COMPLETED' ? (i * 300000) : null,
          retry_count: hasInterrupt2 ? 1 : 0
        });
      }

      // Follow up and document processing task for workflows 3-12
      if (i >= 3) {
        const status3 = i % 7 === 0 ? 'INTERRUPT' : (i % 5 === 0 ? 'NOT_STARTED' : 'COMPLETED');
        const hasInterrupt3 = status3 === 'INTERRUPT';
        
        taskExecutions.push({
          id: randomUUID(),
          workflow_id: workflowId,
          agent_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          title: 'Process HOA Documents',
          description: 'Review and validate received HOA documentation',
          sequence_order: 3,
          task_type: 'process_hoa_documents',
          status: status3,
          executor_type: 'AI',
          priority: priorities[(i + 2) % priorities.length],
          input_data: { 
            document_types: ['estoppel_certificate', 'bylaws', 'financial_statement'],
            validation_required: true
          },
          output_data: status3 === 'COMPLETED' ? { 
            documents_processed: 3,
            validation_status: 'APPROVED',
            outstanding_fees: i * 45.00,
            special_assessments: i % 3 === 0 ? i * 150.00 : 0
          } : {},
          error_message: hasInterrupt3 ? `HOA documents contain discrepancies or missing information. Manual review required for accuracy verification.` : null,
          interrupt_type: hasInterrupt3 ? 'MANUAL_VERIFICATION' : null,
          started_at: new Date(Date.now() - ((i - 0.5) * 2 * 60 * 60 * 1000)).toISOString(),
          completed_at: status3 === 'COMPLETED' ? new Date(Date.now() - ((i - 0.2) * 2 * 60 * 60 * 1000)).toISOString() : null,
          execution_time_ms: status3 === 'COMPLETED' ? (i * 250000) : null,
          retry_count: 0
        });
      }

      // Add multi-agent interrupts for HOA workflows 2, 5, 9
      if ([2, 5, 9].includes(i)) {
        // Add kosha financial review task that's interrupted
        taskExecutions.push({
          id: randomUUID(),
          workflow_id: workflowId,
          agent_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', // kosha
          title: 'Review HOA Financial Statement',
          description: 'Analyze HOA fees and special assessments',
          sequence_order: 4,
          task_type: 'financial_review',
          status: 'INTERRUPT',
          executor_type: 'AI',
          priority: 'HIGH',
          input_data: { hoa_fees: true, special_assessments: true },
          output_data: {},
          error_message: 'HOA financial statement shows unusual special assessment pattern. Manual review required for client impact analysis.',
          interrupt_type: 'MANUAL_VERIFICATION',
          started_at: new Date(Date.now() - ((i - 0.3) * 2 * 60 * 60 * 1000)).toISOString(),
          completed_at: null,
          execution_time_ms: null,
          retry_count: 0
        });

        // Add florian phone follow-up task that's interrupted for workflows 5, 9
        if ([5, 9].includes(i)) {
          taskExecutions.push({
            id: randomUUID(),
            workflow_id: workflowId,
            agent_id: '88888888-8888-8888-8888-888888888888', // florian
            title: 'Phone Follow-up with HOA',
            description: 'Call HOA management for expedited processing',
            sequence_order: 5,
            task_type: 'phone_call',
            status: 'INTERRUPT',
            executor_type: 'AI',
            priority: 'URGENT',
            input_data: { phone_number: 'hoa_management', call_type: 'follow_up' },
            output_data: {},
            error_message: 'HOA management phone system requires complex navigation and specific authorization codes. HIL assistance needed.',
            interrupt_type: 'CLIENT_CLARIFICATION',
            started_at: new Date(Date.now() - ((i - 0.1) * 2 * 60 * 60 * 1000)).toISOString(),
            completed_at: null,
            execution_time_ms: null,
            retry_count: 2
          });
        }
      }

      // Add HOA communications for first 3
      if (i <= 3) {
        const threadId = randomUUID();
        communications.push({
          id: randomUUID(),
          workflow_id: workflowId,
          thread_id: threadId,
          sender_id: null,
          recipient_email: `admin@${hoaNames[i - 1].toLowerCase().replace(' ', '')}.com`,
          subject: `HOA Documents Request - ${200 + i * 30} ${hoaNames[i - 1]} Way`,
          body: `Dear ${hoaNames[i - 1]} HOA Management,\n\nWe are requesting HOA documents for ${200 + i * 30} ${hoaNames[i - 1]} Way ${units[i % units.length]} ${i}.\n\nRequired documents:\n1. Current HOA statement\n2. Estoppel certificate\n3. CC&Rs and bylaws\n\nClosing date: ${new Date(Date.now() + ((i + 10) * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]}\n\nThank you,\nMia Chen\nRexera Title Services`,
          communication_type: 'email',
          direction: 'OUTBOUND',
          status: 'SENT',
          metadata: { to_name: `${hoaNames[i - 1]} HOA Management`, agent: 'mia' },
          created_at: new Date(Date.now() - (i * 60 * 60 * 1000)).toISOString()
        });
      }

      // Add costs
      costs.push({
        workflow_id: workflowId,
        description: `Agent execution - Corey (HOA research ${i})`,
        amount: 22.50 + (i * 1.75),
        cost_type: 'AGENT_EXECUTION',
        incurred_at: new Date(Date.now() - (i * 2 * 60 * 60 * 1000)).toISOString()
      });
    }
  }

  // 15 Payoff Request workflows
  const lenders = ['Wells Fargo', 'Chase Bank', 'Bank of America', 'Quicken Loans', 'US Bank', 'PNC Bank', 'Citibank', 'Capital One', 'TD Bank', 'SunTrust', 'Fifth Third', 'Regions Bank', 'BB&T', 'KeyBank', 'M&T Bank'];
  
  for (let i = 1; i <= 15; i++) {
    const workflowId = randomUUID();
    const streets = ['Broadway', 'State St', 'Market St', 'Union Ave', 'Central Blvd', 'Commerce Dr', 'Industrial Way', 'Technology Ln', 'Business Ct', 'Enterprise Dr', 'Innovation Blvd', 'Corporate Plaza', 'Executive Dr', 'Leadership Cir', 'Management Way'];
    
    workflows.push({
      id: workflowId,
      workflow_type: 'PAYOFF_REQUEST',
      client_id: clientIds[i % clientIds.length],
      title: `Payoff Request - ${300 + i * 50} ${streets[i - 1]}`,
      description: `Mortgage payoff request for ${lenders[i - 1]} loan`,
      status: workflowStatuses[i % workflowStatuses.length],
      priority: priorities[i % priorities.length],
      metadata: {
        property_address: `${300 + i * 50} ${streets[i - 1]}, Downtown ${i}, ST 3${String(i).padStart(4, '0')}`,
        loan_number: `${lenders[i - 1].split(' ')[0].toUpperCase().substring(0, 3)}${2024000000 + i * 123456}`,
        lender_name: lenders[i - 1],
        estimated_balance: 150000 + (i * 25000)
      },
      created_by: testUserId,
      due_date: new Date(Date.now() + ((i + 1) * 24 * 60 * 60 * 1000)).toISOString()
    });

    // Add task executions for first 12 workflows with multiple tasks each
    if (i <= 12) {
      // Primary lender research task
      const status1 = taskStatuses[i % taskStatuses.length];
      const hasInterrupt1 = status1 === 'INTERRUPT' || i % 3 === 0;
      
      taskExecutions.push({
        id: randomUUID(),
        workflow_id: workflowId,
        agent_id: '66666666-6666-6666-6666-666666666666',
        title: 'Identify Lender Contact',
        description: 'Research correct payoff department contact',
        sequence_order: 1,
        task_type: 'identify_lender_contact',
        status: status1,
        executor_type: 'AI',
        priority: priorities[i % priorities.length],
        input_data: { lender_name: lenders[i - 1], loan_number: `${lenders[i - 1].split(' ')[0].toUpperCase().substring(0, 3)}${2024000000 + i * 123456}` },
        output_data: status1 === 'COMPLETED' ? { 
          contact_email: `payoffs@${lenders[i - 1].toLowerCase().replace(' ', '').replace('&', 'and')}.com`, 
          phone: `1-800-555-${String(i * 100).padStart(4, '0')}`,
          department: 'Payoff Department',
          confidence: 0.90 + (i * 0.005)
        } : {},
        error_message: hasInterrupt1 ? `Multiple payoff departments found for ${lenders[i - 1]}. Unable to determine correct contact for loan type. Manual verification required.` : null,
        interrupt_type: hasInterrupt1 ? (i % 4 === 0 ? 'CLIENT_CLARIFICATION' : i % 4 === 1 ? 'MISSING_DOCUMENT' : i % 4 === 2 ? 'PAYMENT_REQUIRED' : 'MANUAL_VERIFICATION') : null,
        started_at: new Date(Date.now() - (i * 60 * 60 * 1000)).toISOString(),
        completed_at: status1 === 'COMPLETED' ? new Date(Date.now() - ((i - 0.5) * 60 * 60 * 1000)).toISOString() : null,
        execution_time_ms: status1 === 'COMPLETED' ? (i * 200000) : null,
        retry_count: hasInterrupt1 ? (i % 2) : 0
      });

      // Submit payoff request task for workflows 7-12 (more interrupts)
      if (i >= 7) {
        const status2 = i % 5 === 0 ? 'INTERRUPT' : (i % 4 === 0 ? 'FAILED' : 'NOT_STARTED');
        const hasInterrupt2 = status2 === 'INTERRUPT' || status2 === 'FAILED';
        
        taskExecutions.push({
          id: randomUUID(),
          workflow_id: workflowId,
          agent_id: '77777777-7777-7777-7777-777777777777',
          title: 'Submit Payoff Request',
          description: 'Send formal payoff request to lender',
          sequence_order: 2,
          task_type: 'submit_payoff_request',
          status: status2,
          executor_type: 'AI',
          priority: priorities[(i + 1) % priorities.length],
          input_data: { 
            lender: lenders[i - 1],
            loan_number: `${lenders[i - 1].split(' ')[0].toUpperCase().substring(0, 3)}${2024000000 + i * 123456}`,
            requested_date: new Date(Date.now() + ((i + 5) * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
          },
          output_data: status2 === 'COMPLETED' ? { 
            request_submitted: true,
            confirmation_number: `PAY_${i}_${Date.now().toString().slice(-6)}`,
            estimated_response: new Date(Date.now() + ((i + 2) * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
          } : {},
          error_message: hasInterrupt2 ? `Payoff request rejected by ${lenders[i - 1]}. Additional borrower authorization or documentation required before processing.` : null,
          interrupt_type: hasInterrupt2 ? (i % 2 === 0 ? 'CLIENT_CLARIFICATION' : 'DATA_QUALITY') : null,
          started_at: new Date(Date.now() - ((i - 1) * 60 * 60 * 1000)).toISOString(),
          completed_at: status2 === 'COMPLETED' ? new Date(Date.now() - ((i - 0.3) * 60 * 60 * 1000)).toISOString() : null,
          execution_time_ms: status2 === 'COMPLETED' ? (i * 180000) : null,
          retry_count: hasInterrupt2 ? 1 : 0
        });
      }

      // Follow up and process response task for workflows 4-12
      if (i >= 4) {
        const status3 = i % 6 === 0 ? 'INTERRUPT' : (i % 7 === 0 ? 'NOT_STARTED' : 'COMPLETED');
        const hasInterrupt3 = status3 === 'INTERRUPT';
        
        taskExecutions.push({
          id: randomUUID(),
          workflow_id: workflowId,
          agent_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
          title: 'Process Payoff Statement',
          description: 'Review and validate payoff statement from lender',
          sequence_order: 3,
          task_type: 'process_payoff_statement',
          status: status3,
          executor_type: 'AI',
          priority: priorities[(i + 2) % priorities.length],
          input_data: { 
            expected_balance: 150000 + (i * 25000),
            closing_date: new Date(Date.now() + ((i + 5) * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
          },
          output_data: status3 === 'COMPLETED' ? { 
            payoff_amount: 150000 + (i * 25000) + (i * 45.50),
            per_diem: 15.50 + (i * 0.75),
            good_through_date: new Date(Date.now() + ((i + 7) * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
            validation_status: 'APPROVED'
          } : {},
          error_message: hasInterrupt3 ? `Payoff statement shows significant discrepancy from estimated balance. Manual review required for verification and client notification.` : null,
          interrupt_type: hasInterrupt3 ? 'MANUAL_VERIFICATION' : null,
          started_at: new Date(Date.now() - ((i - 0.3) * 60 * 60 * 1000)).toISOString(),
          completed_at: status3 === 'COMPLETED' ? new Date(Date.now() - ((i - 0.1) * 60 * 60 * 1000)).toISOString() : null,
          execution_time_ms: status3 === 'COMPLETED' ? (i * 160000) : null,
          retry_count: 0
        });
      }

      // Add costs for all tasks
      costs.push({
        workflow_id: workflowId,
        description: `Agent execution - Nina (lender research ${i})`,
        amount: 16.25 + (i * 1.50),
        cost_type: 'AGENT_EXECUTION',
        incurred_at: new Date(Date.now() - (i * 60 * 60 * 1000)).toISOString()
      });
      
      if (i >= 7) {
        costs.push({
          workflow_id: workflowId,
          description: `Agent execution - Mia (payoff submission ${i})`,
          amount: 9.75 + (i * 1.25),
          cost_type: 'AGENT_EXECUTION',
          incurred_at: new Date(Date.now() - ((i - 0.5) * 60 * 60 * 1000)).toISOString()
        });
      }
      
      if (i >= 4) {
        costs.push({
          workflow_id: workflowId,
          description: `Agent execution - Kosha (statement processing ${i})`,
          amount: 11.50 + (i * 1.00),
          cost_type: 'AGENT_EXECUTION',
          incurred_at: new Date(Date.now() - ((i - 0.2) * 60 * 60 * 1000)).toISOString()
        });
      }
    }
  }

  // Insert all data with error handling
  console.log('📝 Inserting workflows...');
  const { data: workflowData, error: workflowError } = await supabase.from('workflows').upsert(workflows).select();
  if (workflowError) {
    console.error('❌ Failed to create workflows:', workflowError);
    throw workflowError;
  }
  console.log(`✅ Created ${workflowData?.length || 0} workflows`);

  if (taskExecutions.length > 0) {
    console.log('📝 Inserting task executions...');
    const { data: taskData, error: taskError } = await supabase.from('task_executions').upsert(taskExecutions).select();
    if (taskError) {
      console.error('❌ Failed to create task executions:', taskError);
      throw taskError;
    }
    console.log(`✅ Created ${taskData?.length || 0} task executions`);
  }

  if (communications.length > 0) {
    console.log('📝 Inserting communications...');
    const { data: commData, error: commError } = await supabase.from('communications').upsert(communications).select();
    if (commError) {
      console.error('❌ Failed to create communications:', commError);
      throw commError;
    }
    console.log(`✅ Created ${commData?.length || 0} communications`);
  }

  if (costs.length > 0) {
    console.log('📝 Inserting costs...');
    const { data: costData, error: costError } = await supabase.from('costs').upsert(costs).select();
    if (costError) {
      console.error('❌ Failed to create costs:', costError);
      throw costError;
    }
    console.log(`✅ Created ${costData?.length || 0} cost entries`);
  }

  // Create HIL notifications for all interrupted tasks (after task executions are inserted)
  console.log('📝 Creating HIL notifications for interrupted tasks...');
  const interruptedTasks = taskExecutions.filter(task => task.status === 'INTERRUPT' && task.interrupt_type);
  
  for (const task of interruptedTasks) {
    const workflow = workflows.find(w => w.id === task.workflow_id);
    if (workflow) {
      createHilNotification(task, workflow.id, workflow.title);
    }
  }

  if (hilNotifications.length > 0) {
    console.log('📝 Inserting HIL notifications...');
    const { data: notificationData, error: notificationError } = await supabase.from('hil_notifications').upsert(hilNotifications).select();
    if (notificationError) {
      console.error('❌ Failed to create HIL notifications:', notificationError);
      throw notificationError;
    }
    console.log(`✅ Created ${notificationData?.length || 0} HIL notifications`);
  }

  // Create sample HIL notes for workflows with rich collaborative content
  console.log('📝 Creating HIL notes with mentions and threading...');
  const hilNotes = [];
  
  // Sample note content with mentions and various priorities
  const noteContents = [
    "This case requires urgent attention - please review ASAP!",
    "Found discrepancies in the municipal records. @test-user Can you verify these details with the client?",
    "HOA board meeting minutes from last quarter are missing. We need these before proceeding.",
    "@test-user Please coordinate with the client about the outstanding balance of $3,450.",
    "All lien searches completed successfully. No liens found on the property.",
    "Client requested expedited processing. Moving to high priority.",
    "Document upload failed - need to troubleshoot the technical issue.",
    "Financial review shows unusual assessment pattern. Flagging for manual verification.",
    "Client callback scheduled for tomorrow at 2 PM to discuss findings.",
    "Final review completed. Ready for delivery to client.",
    "Need clarification on special assessment dates from HOA management company.",
    "@test-user This workflow is taking longer than expected. Can you check the bottleneck?"
  ];
  
  // Create notes for about 30% of workflows (15 workflows)
  const workflowsWithNotes = workflows.slice(0, 15);
  
  for (let i = 0; i < workflowsWithNotes.length; i++) {
    const workflow = workflowsWithNotes[i];
    const noteCount = Math.floor(Math.random() * 4) + 1; // 1-4 notes per workflow
    
    for (let j = 0; j < noteCount; j++) {
      const noteId = randomUUID();
      const content = noteContents[Math.floor(Math.random() * noteContents.length)];
      const priority = priorities[Math.floor(Math.random() * priorities.length)];
      const isResolved = Math.random() < 0.3; // 30% chance of being resolved
      const hasMention = content.includes('@test-user');
      
      const createdAt = new Date(Date.now() - ((15 - i) * 24 * 60 * 60 * 1000) + (j * 4 * 60 * 60 * 1000)).toISOString();
      
      hilNotes.push({
        id: noteId,
        workflow_id: workflow.id,
        author_id: testUserId,
        content,
        priority,
        is_resolved: isResolved,
        parent_note_id: null,
        mentions: hasMention ? [testUserId] : [],
        created_at: createdAt,
        updated_at: createdAt
      });
      
      // Add a reply to some notes (30% chance)
      if (Math.random() < 0.3) {
        const replyContent = [
          "Thanks for the update! I'll handle this right away.",
          "Confirmed - I've contacted the client about this.",
          "Good catch! I've updated the records accordingly.",
          "This has been resolved. Moving to the next step.",
          "I'll follow up with the HOA management company tomorrow.",
          "Updated the client on the timeline. They're okay with the delay."
        ][Math.floor(Math.random() * 6)];
        
        hilNotes.push({
          id: randomUUID(),
          workflow_id: workflow.id,
          author_id: testUserId,
          content: replyContent,
          priority: 'NORMAL',
          is_resolved: false,
          parent_note_id: noteId,
          mentions: [],
          created_at: new Date(new Date(createdAt).getTime() + 2 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(new Date(createdAt).getTime() + 2 * 60 * 60 * 1000).toISOString()
        });
      }
    }
  }

  // Add some high-value collaborative notes with specific scenarios
  const collaborativeNotes = [
    {
      workflow_id: workflows[0].id,
      content: "@test-user This municipal lien search revealed an unpaid water bill from 2019. Should we flag this as a critical finding?",
      priority: 'HIGH',
      mentions: [testUserId]
    },
    {
      workflow_id: workflows[1].id,
      content: "HOA president mentioned during our call that there's a pending special assessment for roof repairs. This wasn't in the original documents.",
      priority: 'URGENT',
      mentions: []
    },
    {
      workflow_id: workflows[2].id,
      content: "@test-user Client is asking for rush processing due to closing date moved up. Can we prioritize this payoff request?",
      priority: 'URGENT',
      mentions: [testUserId]
    }
  ];

  for (const note of collaborativeNotes) {
    const noteId = randomUUID();
    const createdAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString();
    
    hilNotes.push({
      id: noteId,
      workflow_id: note.workflow_id,
      author_id: testUserId,
      content: note.content,
      priority: note.priority,
      is_resolved: false,
      parent_note_id: null,
      mentions: note.mentions,
      created_at: createdAt,
      updated_at: createdAt
    });
    
    // Add realistic replies to these important notes
    const replies = [
      "Yes, definitely flag this. I'll contact the client immediately to discuss resolution options.",
      "Good point! I'll reach out to the HOA management for the complete assessment schedule.",
      "Absolutely - moving this to priority queue. I'll coordinate with the lender today."
    ];
    
    hilNotes.push({
      id: randomUUID(),
      workflow_id: note.workflow_id,
      author_id: testUserId,
      content: replies[collaborativeNotes.indexOf(note)],
      priority: 'NORMAL',
      is_resolved: false,
      parent_note_id: noteId,
      mentions: [],
      created_at: new Date(new Date(createdAt).getTime() + 30 * 60 * 1000).toISOString(), // 30 min later
      updated_at: new Date(new Date(createdAt).getTime() + 30 * 60 * 1000).toISOString()
    });
  }

  // Insert HIL notes
  if (hilNotes.length > 0) {
    const { data: hilNotesData, error: hilNotesError } = await supabase.from('hil_notes').upsert(hilNotes).select();
    if (hilNotesError) {
      console.error('❌ Failed to create HIL notes:', hilNotesError);
      throw hilNotesError;
    }
    console.log(`✅ Created ${hilNotesData?.length || 0} HIL notes (including threaded conversations)`);
    
    // Create HIL_MENTION notifications for notes with mentions
    const mentionNotifications = [];
    for (const note of hilNotes) {
      if (note.mentions && note.mentions.length > 0 && !note.parent_note_id) { // Only for top-level notes with mentions
        for (const mentionedUserId of note.mentions) {
          mentionNotifications.push({
            id: randomUUID(),
            user_id: mentionedUserId,
            type: 'HIL_MENTION',
            priority: note.priority,
            title: 'You were mentioned in a note',
            message: `Someone mentioned you in a ${note.priority} priority note: "${note.content.substring(0, 100)}..."`,
            action_url: `/workflow/${note.workflow_id}`,
            metadata: {
              note_id: note.id,
              workflow_id: note.workflow_id,
              author_id: note.author_id
            },
            read: Math.random() < 0.4, // 40% chance of being read
            read_at: Math.random() < 0.4 ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString() : null,
            created_at: note.created_at
          });
        }
      }
    }
    
    if (mentionNotifications.length > 0) {
      const { data: mentionData, error: mentionError } = await supabase.from('hil_notifications').upsert(mentionNotifications).select();
      if (mentionError) {
        console.error('❌ Failed to create mention notifications:', mentionError);
      } else {
        console.log(`✅ Created ${mentionData?.length || 0} HIL mention notifications`);
      }
    }
  }

  // Create audit events for workflows and tasks
  console.log('📋 Creating audit events...');
  const auditEvents = [];
  
  // Create audit events for each workflow
  workflows.forEach((workflow, index) => {
    const baseTime = new Date(Date.now() - (index * 24 * 60 * 60 * 1000));
    
    // Workflow created event
    auditEvents.push({
      id: randomUUID(),
      actor_type: 'human',
      actor_id: testUserId,
      actor_name: 'Admin User',
      event_type: 'workflow_created',
      action: 'create',
      resource_type: 'workflow',
      resource_id: workflow.id,
      workflow_id: workflow.id,
      client_id: workflow.client_id,
      event_data: {
        workflow_type: workflow.workflow_type,
        title: workflow.title,
        priority: workflow.priority
      },
      created_at: new Date(baseTime.getTime()).toISOString()
    });

    // Workflow status changes
    if (workflow.status !== 'NOT_STARTED') {
      auditEvents.push({
        id: randomUUID(),
        actor_type: 'system',
        actor_id: 'system',
        actor_name: 'System',
        event_type: 'workflow_updated',
        action: 'update',
        resource_type: 'workflow',
        resource_id: workflow.id,
        workflow_id: workflow.id,
        client_id: workflow.client_id,
        event_data: {
          field: 'status',
          old_value: 'NOT_STARTED',
          new_value: workflow.status,
          title: workflow.title
        },
        created_at: new Date(baseTime.getTime() + 30 * 60 * 1000).toISOString()
      });
    }
  });

  // Create audit events for task executions
  taskExecutions.forEach((task, index) => {
    const taskTime = new Date(task.started_at);
    const workflow = workflows.find(w => w.id === task.workflow_id);
    
    // Task started event
    auditEvents.push({
      id: randomUUID(),
      actor_type: 'agent',
      actor_id: task.agent_id,
      actor_name: 'Agent',
      event_type: 'task_started',
      action: 'execute',
      resource_type: 'task_execution',
      resource_id: task.id,
      workflow_id: task.workflow_id,
      client_id: workflow?.client_id,
      event_data: {
        task_title: task.title,
        task_type: task.task_type,
        sequence_order: task.sequence_order
      },
      created_at: taskTime.toISOString()
    });

    // Task completion or interrupt events
    if (task.status === 'COMPLETED' && task.completed_at) {
      auditEvents.push({
        id: randomUUID(),
        actor_type: 'agent',
        actor_id: task.agent_id,
        actor_name: 'Agent',
        event_type: 'task_completed',
        action: 'execute',
        resource_type: 'task_execution',
        resource_id: task.id,
        workflow_id: task.workflow_id,
        client_id: workflow?.client_id,
        event_data: {
          task_title: task.title,
          execution_time_ms: task.execution_time_ms,
          output_data: task.output_data
        },
        created_at: task.completed_at
      });
    } else if (task.status === 'INTERRUPT') {
      auditEvents.push({
        id: randomUUID(),
        actor_type: 'system',
        actor_id: 'system',
        actor_name: 'System',
        event_type: 'task_interrupted',
        action: 'update',
        resource_type: 'task_execution',
        resource_id: task.id,
        workflow_id: task.workflow_id,
        client_id: workflow?.client_id,
        event_data: {
          task_title: task.title,
          interrupt_type: task.interrupt_type,
          error_message: task.error_message
        },
        created_at: new Date(taskTime.getTime() + 15 * 60 * 1000).toISOString()
      });
    } else if (task.status === 'FAILED') {
      auditEvents.push({
        id: randomUUID(),
        actor_type: 'agent',
        actor_id: task.agent_id,
        actor_name: 'Agent',
        event_type: 'task_failed',
        action: 'execute',
        resource_type: 'task_execution',
        resource_id: task.id,
        workflow_id: task.workflow_id,
        client_id: workflow?.client_id,
        event_data: {
          task_title: task.title,
          error_message: task.error_message,
          retry_count: task.retry_count
        },
        created_at: new Date(taskTime.getTime() + 10 * 60 * 1000).toISOString()
      });
    }
  });

  // Add some communication audit events
  communications.forEach((comm, index) => {
    const workflow = workflows.find(w => w.id === comm.workflow_id);
    auditEvents.push({
      id: randomUUID(),
      actor_type: 'agent',
      actor_id: '77777777-7777-7777-7777-777777777777', // Mia agent
      actor_name: 'Mia',
      event_type: 'communication_sent',
      action: 'create',
      resource_type: 'communication',
      resource_id: comm.id,
      workflow_id: comm.workflow_id,
      client_id: workflow?.client_id,
      event_data: {
        communication_type: comm.type,
        subject: comm.subject,
        to_email: comm.to_email
      },
      created_at: comm.sent_at || comm.created_at
    });
  });

  // Insert audit events in batches
  if (auditEvents.length > 0) {
    const batchSize = 100;
    for (let i = 0; i < auditEvents.length; i += batchSize) {
      const batch = auditEvents.slice(i, i + batchSize);
      const { error: auditError } = await supabase
        .from('audit_events')
        .insert(batch);
      
      if (auditError) {
        console.error(`❌ Failed to create audit events batch ${Math.floor(i / batchSize) + 1}:`, auditError);
      }
    }
    console.log(`✅ Created ${auditEvents.length} audit events`);
  }

  // Add sample documents
  const { data: docData, error: docError } = await supabase.from('documents').upsert([
    {
      id: randomUUID(),
      workflow_id: workflows.find(w => w.status === 'COMPLETED')?.id || workflows[0].id,
      filename: 'municipal_lien_report_completed.pdf',
      url: 'https://storage.supabase.co/object/public/documents/municipal_lien_report_completed.pdf',
      file_size_bytes: 234567,
      mime_type: 'application/pdf',
      document_type: 'DELIVERABLE',
      tags: ['municipal', 'lien_search', 'final'],
      status: 'DELIVERED',
      metadata: { pages: 3, liens_found: 0, generated_by: 'system' },
      created_by: testUserId
    }
  ]).select();
  
  if (docError) {
    console.error('⚠️ Failed to create documents:', docError);
  } else {
    console.log(`✅ Created ${docData?.length || 0} documents`);
  }
}

async function verifyData() {
  console.log('🔍 Verifying seeded data...');
  
  const { data: workflows, error: workflowError } = await supabase
    .from('workflows')
    .select('id, title, workflow_type, status')
    .order('created_at');

  if (workflowError) {
    console.error('❌ Failed to fetch workflows:', workflowError);
    return;
  }

  const { data: agents } = await supabase
    .from('agents')
    .select('name, type, is_active')
    .eq('is_active', true);

  const { data: clients } = await supabase
    .from('clients')
    .select('name');

  const { data: tasks } = await supabase
    .from('task_executions')
    .select('title, status');

  const { data: comms } = await supabase
    .from('communications')
    .select('subject, direction');

  const { data: docs } = await supabase
    .from('documents')
    .select('filename, status');

  const { data: notifications } = await supabase
    .from('hil_notifications')
    .select('type, priority, read');

  console.log('\n📊 Comprehensive Seeding Summary:');
  console.log(`📋 Workflows: ${workflows?.length || 0}`);
  
  // Group workflows by type
  const workflowsByType = workflows?.reduce((acc, w) => {
    acc[w.workflow_type] = (acc[w.workflow_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};
  
  Object.entries(workflowsByType).forEach(([type, count]) => {
    console.log(`   ${type}: ${count} workflows`);
  });
  
  console.log(`🤖 Active agents: ${agents?.length || 0}`);
  console.log(`🏢 Clients: ${clients?.length || 0}`);
  console.log(`📝 Task executions: ${tasks?.length || 0}`);
  
  // Count interrupts
  const interruptTasks = tasks?.filter(t => t.status === 'INTERRUPT') || [];
  const failedTasks = tasks?.filter(t => t.status === 'FAILED') || [];
  console.log(`⚠️ Tasks with interrupts: ${interruptTasks.length} (INTERRUPT)`);
  console.log(`❌ Failed tasks: ${failedTasks.length}`);
  
  console.log(`📧 Communications: ${comms?.length || 0}`);
  console.log(`📄 Documents: ${docs?.length || 0}`);
  console.log(`🔔 HIL Notifications: ${notifications?.length || 0} (${notifications?.filter(n => !n.read).length || 0} unread)`);

  // Show sample workflows
  console.log('\n📋 Sample Workflows:');
  workflows?.slice(0, 10).forEach(w => console.log(`  ${w.title} (${w.status})`));
  if (workflows && workflows.length > 10) {
    console.log(`  ... and ${workflows.length - 10} more workflows`);
  }
}

async function main() {
  try {
    console.log('🚀 Starting comprehensive database reset and seeding...\n');
    
    // Skip connection test and go straight to seeding
    console.log('⚡ Skipping connection test, attempting direct seeding...\n');
    
    await resetDatabase();
    console.log('');
    
    await seedDatabase();
    console.log('');
    
    await verifyData();
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('✅ Ready for testing with comprehensive data (50 workflows, 100+ tasks)');
    console.log('🔗 Test dashboard: http://localhost:3000');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}