/**
 * Payoff Request Workflow
 * Complex mortgage payoff coordination with conditional lender communication
 */

import type { N8nWorkflow } from '../shared/workflow-nodes';
import {
  createWebhookTriggerNode,
  createDatabaseNode,
  createAgentNode,
  createIfNode,
  createHILInterventionNode,
  createQualityCheckNode,
  createResponseNode,
  createSetNode,
  createConnection,
  createConditionalConnection,
} from '../shared/workflow-nodes';

export const payoffRequestWorkflow: N8nWorkflow = {
  id: 'payoff_request_v1',
  name: 'Payoff Request',
  active: true,
  tags: ['mortgage', 'payoff', 'lender-communication', 'financial'],
  settings: {
    executionOrder: 'v1',
    saveManualExecutions: true,
    callerPolicy: 'workflowsFromSameOwner',
    timezone: 'America/New_York',
  },
  staticData: {
    workflow_type: 'payoff_request',
    version: '1.0.0',
    description: 'Automated mortgage payoff request processing',
  },
  triggerCount: 0,
  updatedAt: new Date().toISOString(),
  versionId: '1',
  
  nodes: [
    // Trigger: Webhook for workflow initiation
    createWebhookTriggerNode('trigger', 'payoff-request'),

    // Initialize: Set up workflow data
    createSetNode('initialize', {
      workflow_id: '={{$workflow.id}}',
      execution_id: '={{$execution.id}}',
      workflow_type: 'payoff_request',
      status: 'running',
      property_address: '={{$json.property_address}}',
      loan_number: '={{$json.loan_number}}',
      borrower_name: '={{$json.borrower_name}}',
      lender_name: '={{$json.lender_name}}',
      closing_date: '={{$json.closing_date}}',
      client_id: '={{$json.client_id}}',
      urgency: '={{$json.urgency || "normal"}}',
      payoff_type: '={{$json.payoff_type || "full_payoff"}}',
      started_at: '={{new Date().toISOString()}}',
    }, [200, 200]),

    // Database: Create workflow record
    createDatabaseNode('create_workflow', 'insert', 'workflows', [400, 200]),

    // Nina: Research lender information and contact details
    createAgentNode('nina_lender_research', 'nina', 'company_research', [600, 200]),

    // Conditional: Determine communication method based on lender
    createIfNode('check_lender_type', '={{$json.result_data.has_online_portal === true}}', [800, 200]),

    // Path A: Online portal access (Rex + Iris)
    createAgentNode('rex_portal_access', 'rex', 'portal_login', [1000, 100]),
    createAgentNode('rex_payoff_form', 'rex', 'form_completion', [1200, 100]),
    createAgentNode('iris_confirm_submission', 'iris', 'document_processing', [1400, 100]),

    // Path B: Phone-based payoff request (Max + Florian)
    createAgentNode('max_lender_ivr', 'max', 'ivr_navigation', [1000, 300]),
    createAgentNode('florian_payoff_call', 'florian', 'phone_calling', [1200, 300]),

    // Path C: Email-based request (Mia)
    createAgentNode('mia_payoff_email', 'mia', 'email_composition', [1000, 500]),
    createAgentNode('mia_send_request', 'mia', 'email_sending', [1200, 500]),

    // Convergence: Check initial response
    createIfNode('check_initial_response', '={{$json.payoff_quote_received === true}}', [1600, 300]),

    // Follow-up sequence for non-responsive lenders
    createAgentNode('mia_follow_up_email', 'mia', 'follow_up_scheduling', [1800, 400]),
    createAgentNode('florian_follow_up_call', 'florian', 'phone_calling', [2000, 400]),

    // HIL intervention for persistent issues
    createHILInterventionNode('hil_lender_issue', 'Lender not responding or requires manual intervention', [2200, 400]),

    // Process received payoff quote
    createAgentNode('iris_quote_processing', 'iris', 'data_extraction', [1800, 200]),

    // Validate payoff information
    createAgentNode('nina_quote_validation', 'nina', 'data_validation', [2000, 200]),

    // Conditional: Check if quote needs clarification
    createIfNode('check_quote_clarity', '={{$json.result_data.requires_clarification === true}}', [2200, 200]),

    // Clarification sequence
    createAgentNode('mia_clarification_email', 'mia', 'email_composition', [2400, 100]),
    createAgentNode('florian_clarification_call', 'florian', 'phone_calling', [2400, 300]),

    // Final quote processing
    createAgentNode('iris_final_processing', 'iris', 'content_analysis', [2600, 200]),

    // Quality assurance
    createQualityCheckNode('cassy_payoff_qa', [2800, 200]),

    // Financial tracking
    createAgentNode('kosha_cost_calculation', 'kosha', 'cost_tracking', [3000, 200]),

    // Client communication
    createAgentNode('ria_client_notification', 'ria', 'client_updates', [3200, 200]),

    // Database: Update workflow completion
    createDatabaseNode('complete_workflow', 'update', 'workflows', [3400, 200]),

    // Response: Return payoff information
    createResponseNode('response', {
      workflow_id: '={{$json.workflow_id}}',
      status: 'completed',
      payoff_quote: '={{$json.payoff_quote}}',
      good_through_date: '={{$json.good_through_date}}',
      per_diem: '={{$json.per_diem}}',
      wire_instructions: '={{$json.wire_instructions}}',
      processing_time: '={{$json.processing_time}}',
      cost: '={{$json.total_cost}}',
    }, [3600, 200]),
  ],

  connections: Object.fromEntries([
    // Initial flow
    createConnection('trigger', 'initialize'),
    createConnection('initialize', 'create_workflow'),
    createConnection('create_workflow', 'nina_lender_research'),

    // Lender type branching
    createConnection('nina_lender_research', 'check_lender_type'),

    // Path A: Online portal (true branch)
    createConditionalConnection('check_lender_type', 'rex_portal_access', 'max_lender_ivr'),
    createConnection('rex_portal_access', 'rex_payoff_form'),
    createConnection('rex_payoff_form', 'iris_confirm_submission'),

    // Path B: Phone system (false branch from lender type)
    createConnection('max_lender_ivr', 'florian_payoff_call'),

    // Path C: Email fallback (from phone path if needed)
    createConnection('florian_payoff_call', 'mia_payoff_email'),
    createConnection('mia_payoff_email', 'mia_send_request'),

    // All paths converge at response check
    createConnection('iris_confirm_submission', 'check_initial_response'),
    createConnection('florian_payoff_call', 'check_initial_response'),
    createConnection('mia_send_request', 'check_initial_response'),

    // Response handling
    createConditionalConnection('check_initial_response', 'iris_quote_processing', 'mia_follow_up_email'),

    // Follow-up sequence
    createConnection('mia_follow_up_email', 'florian_follow_up_call'),
    createConnection('florian_follow_up_call', 'hil_lender_issue'),
    createConnection('hil_lender_issue', 'iris_quote_processing'),

    // Quote processing flow
    createConnection('iris_quote_processing', 'nina_quote_validation'),
    createConnection('nina_quote_validation', 'check_quote_clarity'),

    // Clarification if needed
    createConditionalConnection('check_quote_clarity', 'mia_clarification_email', 'iris_final_processing'),
    createConnection('mia_clarification_email', 'florian_clarification_call'),
    createConnection('florian_clarification_call', 'iris_final_processing'),

    // Final processing steps
    createConnection('iris_final_processing', 'cassy_payoff_qa'),
    createConnection('cassy_payoff_qa', 'kosha_cost_calculation'),
    createConnection('kosha_cost_calculation', 'ria_client_notification'),
    createConnection('ria_client_notification', 'complete_workflow'),
    createConnection('complete_workflow', 'response'),
  ]),
};

/**
 * Export workflow configuration
 */
export const exportPayoffRequestWorkflow = () => ({
  name: payoffRequestWorkflow.name,
  nodes: payoffRequestWorkflow.nodes,
  connections: payoffRequestWorkflow.connections,
  active: payoffRequestWorkflow.active,
  settings: payoffRequestWorkflow.settings,
  staticData: payoffRequestWorkflow.staticData,
  tags: payoffRequestWorkflow.tags,
  triggerCount: payoffRequestWorkflow.triggerCount,
  versionId: payoffRequestWorkflow.versionId,
});

/**
 * Workflow context and result interfaces
 */
export interface PayoffRequestContext {
  property_address: string;
  loan_number: string;
  borrower_name: string;
  lender_name: string;
  closing_date: string;
  client_id: string;
  urgency: 'low' | 'normal' | 'high' | 'urgent';
  payoff_type: 'full_payoff' | 'partial_payoff' | 'refinance';
  special_instructions?: string;
  contact_preferences?: Array<'email' | 'phone' | 'portal'>;
  initiated_by: string;
}

export interface PayoffRequestResult {
  workflow_id: string;
  status: 'completed' | 'failed' | 'requires_intervention';
  lender_information: {
    name: string;
    servicing_company?: string;
    contact_methods: Array<{
      type: 'phone' | 'email' | 'portal' | 'fax';
      value: string;
      preferred: boolean;
    }>;
    response_time: string;
    communication_notes: string[];
  };
  payoff_quote: {
    principal_balance: number;
    accrued_interest: number;
    fees_and_charges: number;
    total_payoff_amount: number;
    per_diem_interest: number;
    good_through_date: string;
    quote_date: string;
    quote_number?: string;
  };
  wire_instructions: {
    bank_name: string;
    routing_number: string;
    account_number: string;
    beneficiary_name: string;
    reference_information: string;
    special_instructions?: string;
  };
  communication_log: Array<{
    timestamp: string;
    method: 'phone' | 'email' | 'portal';
    direction: 'outbound' | 'inbound';
    agent: string;
    summary: string;
    outcome: string;
    documents?: string[];
  }>;
  processing_timeline: {
    request_submitted: string;
    initial_response: string;
    quote_received: string;
    quote_validated: string;
    total_processing_time_hours: number;
  };
  quality_metrics: {
    accuracy_score: number;
    completeness_score: number;
    efficiency_score: number;
    client_satisfaction_predicted: number;
  };
  execution_metrics: {
    total_cost_cents: number;
    agents_utilized: string[];
    communication_attempts: number;
    successful_contacts: number;
  };
  next_steps: Array<{
    action: string;
    timeline: string;
    responsible_party: string;
    notes?: string;
  }>;
  alerts: Array<{
    type: 'deadline' | 'discrepancy' | 'follow_up';
    message: string;
    severity: 'low' | 'medium' | 'high';
    due_date?: string;
  }>;
}