#!/usr/bin/env tsx
/**
 * Script Name: Add Tasks to Workflow
 * Purpose: Bulk add tasks to existing workflow for testing
 * Usage: tsx scripts/db/add-tasks-script.ts
 * Requirements: Local API server running on port 3001
 */

interface TaskData {
  workflow_id: string;
  agent_id: string;
  title: string;
  description: string;
  sequence_order: number;
  task_type: string;
  status: string;
  executor_type: string;
  priority: string;
  input_data: Record<string, any>;
  output_data?: Record<string, any>;
  retry_count: number;
}

interface ApiResponse {
  success: boolean;
  data?: TaskData[];
  error?: string;
  details?: any;
}

const WORKFLOW_ID = 'b5bdf081-8e92-4fca-9ffc-eb812a7450ad'; // PAY-250706-001

// Correct agent IDs from the database
const AGENTS = {
  nina: '498a6bcc-98c0-43f1-825e-a7d9cd97574f',
  mia: '82d53f3d-a658-4aa2-abec-6652809b4ef6',
  florian: '6f4fa0ef-db52-4214-8916-4ee625e368eb',
  rex: 'a0a02e40-03d7-4028-bf4a-644300cc8b85',
  iris: '860f279c-5d26-4d87-880f-23cff2634993',
  ria: '10790b92-1af6-4e36-8d9e-9c2147f55c3f',
  kosha: '79a85a75-014b-424e-8de1-b13b63c28abd',
  cassy: 'e7dd57f3-eaea-4ff3-b72c-b10ccdae430c',
  max: 'e968bfe0-8df4-45a5-92ef-c944ede12331',
  corey: '7ca9e6b5-8f61-4eb9-a7fe-e1b5c77e55ce'
};

const additionalTasks: TaskData[] = [
  {
    workflow_id: WORKFLOW_ID,
    agent_id: AGENTS.iris,
    title: 'Document Analysis',
    description: 'Analyze loan documents for payoff requirements',
    sequence_order: 4,
    task_type: 'document_analysis',
    status: 'COMPLETED',
    executor_type: 'AI',
    priority: 'NORMAL',
    input_data: { document_type: 'loan_agreement' },
    output_data: { payoff_terms: 'standard', confidence: 0.92 },
    retry_count: 0
  },
  {
    workflow_id: WORKFLOW_ID,
    agent_id: AGENTS.rex,
    title: 'Lender Portal Access',
    description: 'Access lender portal for payoff information',
    sequence_order: 5,
    task_type: 'portal_access',
    status: 'COMPLETED',
    executor_type: 'AI',
    priority: 'HIGH',
    input_data: { portal_url: 'wellsfargo.com/payoffs' },
    output_data: { access_successful: true, data_retrieved: true },
    retry_count: 0
  },
  {
    workflow_id: WORKFLOW_ID,
    agent_id: AGENTS.kosha,
    title: 'Calculate Fees',
    description: 'Calculate total payoff amount including fees',
    sequence_order: 6,
    task_type: 'fee_calculation',
    status: 'COMPLETED',
    executor_type: 'AI',
    priority: 'HIGH',
    input_data: { principal: 250000, interest_rate: 3.5 },
    output_data: { total_payoff: 251247.83, fees: 1247.83 },
    retry_count: 0
  },
  {
    workflow_id: WORKFLOW_ID,
    agent_id: AGENTS.florian,
    title: 'Phone Verification',
    description: 'Call lender to verify payoff details',
    sequence_order: 7,
    task_type: 'phone_verification',
    status: 'AWAITING_REVIEW',
    executor_type: 'AI',
    priority: 'HIGH',
    input_data: { phone_number: '1-800-869-3557' },
    output_data: { call_completed: true, verification_pending: true },
    retry_count: 1
  },
  {
    workflow_id: WORKFLOW_ID,
    agent_id: AGENTS.max,
    title: 'IVR Navigation',
    description: 'Navigate phone system for payoff department',
    sequence_order: 8,
    task_type: 'ivr_navigation',
    status: 'COMPLETED',
    executor_type: 'AI',
    priority: 'NORMAL',
    input_data: { department: 'payoffs', extension: '4' },
    output_data: { connected: true, department_reached: 'payoffs' },
    retry_count: 0
  },
  {
    workflow_id: WORKFLOW_ID,
    agent_id: AGENTS.cassy,
    title: 'Quality Check',
    description: 'Verify all payoff information accuracy',
    sequence_order: 9,
    task_type: 'quality_verification',
    status: 'AWAITING_REVIEW',
    executor_type: 'AI',
    priority: 'HIGH',
    input_data: { data_points: 15 },
    retry_count: 0
  },
  {
    workflow_id: WORKFLOW_ID,
    agent_id: AGENTS.nina,
    title: 'Lien Research',
    description: 'Research any additional liens on property',
    sequence_order: 10,
    task_type: 'lien_research',
    status: 'PENDING',
    executor_type: 'AI',
    priority: 'NORMAL',
    input_data: { property_address: '123 Main St' },
    retry_count: 0
  },
  {
    workflow_id: WORKFLOW_ID,
    agent_id: AGENTS.iris,
    title: 'Document Preparation',
    description: 'Prepare payoff statement documents',
    sequence_order: 11,
    task_type: 'document_preparation',
    status: 'PENDING',
    executor_type: 'AI',
    priority: 'NORMAL',
    input_data: { template: 'payoff_statement' },
    retry_count: 0
  },
  {
    workflow_id: WORKFLOW_ID,
    agent_id: AGENTS.mia,
    title: 'Client Notification',
    description: 'Notify client of payoff amount',
    sequence_order: 12,
    task_type: 'client_notification',
    status: 'PENDING',
    executor_type: 'AI',
    priority: 'HIGH',
    input_data: { client_email: 'john.doe@email.com' },
    retry_count: 0
  },
  {
    workflow_id: WORKFLOW_ID,
    agent_id: AGENTS.ria,
    title: 'Closing Coordination',
    description: 'Coordinate with closing agent',
    sequence_order: 13,
    task_type: 'closing_coordination',
    status: 'PENDING',
    executor_type: 'AI',
    priority: 'NORMAL',
    input_data: { closing_date: '2025-07-15' },
    retry_count: 0
  },
  {
    workflow_id: WORKFLOW_ID,
    agent_id: AGENTS.kosha,
    title: 'Final Cost Review',
    description: 'Review all costs and fees',
    sequence_order: 14,
    task_type: 'cost_review',
    status: 'PENDING',
    executor_type: 'AI',
    priority: 'NORMAL',
    input_data: { estimated_costs: 1500 },
    retry_count: 0
  },
  {
    workflow_id: WORKFLOW_ID,
    agent_id: AGENTS.cassy,
    title: 'Final Quality Check',
    description: 'Final verification before delivery',
    sequence_order: 15,
    task_type: 'final_quality_check',
    status: 'PENDING',
    executor_type: 'AI',
    priority: 'HIGH',
    input_data: { checklist_items: 20 },
    retry_count: 0
  },
  {
    workflow_id: WORKFLOW_ID,
    agent_id: AGENTS.mia,
    title: 'Payoff Delivery',
    description: 'Deliver final payoff statement',
    sequence_order: 16,
    task_type: 'payoff_delivery',
    status: 'PENDING',
    executor_type: 'AI',
    priority: 'HIGH',
    input_data: { delivery_method: 'secure_email' },
    retry_count: 0
  },
  {
    workflow_id: WORKFLOW_ID,
    agent_id: AGENTS.ria,
    title: 'Follow-up Confirmation',
    description: 'Confirm receipt and satisfaction',
    sequence_order: 17,
    task_type: 'follow_up',
    status: 'PENDING',
    executor_type: 'AI',
    priority: 'LOW',
    input_data: { follow_up_date: '2025-07-16' },
    retry_count: 0
  },
  {
    workflow_id: WORKFLOW_ID,
    agent_id: AGENTS.kosha,
    title: 'Invoice Generation',
    description: 'Generate invoice for services',
    sequence_order: 18,
    task_type: 'invoice_generation',
    status: 'PENDING',
    executor_type: 'AI',
    priority: 'NORMAL',
    input_data: { service_fees: 75 },
    retry_count: 0
  }
];

async function addTasks(): Promise<void> {
  try {
    console.log('Adding tasks to PAY-250706-001...');
    
    const response = await fetch('http://localhost:3001/api/task-executions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(additionalTasks)
    });

    const result = await response.json() as ApiResponse;
    
    if (result.success && result.data) {
      console.log(`✅ Successfully added ${result.data.length} tasks!`);
      console.log('Tasks added:', result.data.map(t => `${t.sequence_order}: ${t.title}`));
    } else {
      console.error('❌ Failed to add tasks:', result.error);
      if (result.details) {
        console.error('Details:', result.details);
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error:', errorMessage);
  }
}

// Run script if called directly
if (require.main === module) {
  addTasks();
}