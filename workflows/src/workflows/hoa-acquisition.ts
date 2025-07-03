/**
 * HOA Acquisition Workflow
 * Document-heavy workflow with specialized HOA analysis and processing
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

export const hoaAcquisitionWorkflow: N8nWorkflow = {
  id: 'hoa_acquisition_v1',
  name: 'HOA Acquisition',
  active: true,
  tags: ['real-estate', 'hoa', 'acquisition', 'due-diligence'],
  settings: {
    executionOrder: 'v1',
    saveManualExecutions: true,
    callerPolicy: 'workflowsFromSameOwner',
    timezone: 'America/New_York',
  },
  staticData: {
    workflow_type: 'hoa_acquisition',
    version: '1.0.0',
    description: 'Comprehensive HOA acquisition due diligence workflow',
  },
  triggerCount: 0,
  updatedAt: new Date().toISOString(),
  versionId: '1',
  
  nodes: [
    // Trigger: Webhook for workflow initiation
    createWebhookTriggerNode('trigger', 'hoa-acquisition'),

    // Initialize: Set up workflow data
    createSetNode('initialize', {
      workflow_id: '={{$workflow.id}}',
      execution_id: '={{$execution.id}}',
      workflow_type: 'hoa_acquisition',
      status: 'running',
      hoa_name: '={{$json.hoa_name}}',
      property_address: '={{$json.property_address}}',
      state: '={{$json.state}}',
      acquisition_type: '={{$json.acquisition_type || "purchase"}}',
      client_id: '={{$json.client_id}}',
      priority: '={{$json.priority || "normal"}}',
      due_diligence_scope: '={{$json.due_diligence_scope || "standard"}}',
      started_at: '={{new Date().toISOString()}}',
    }, [200, 200]),

    // Database: Create workflow record
    createDatabaseNode('create_workflow', 'insert', 'workflows', [400, 200]),

    // Nina: Research HOA and management company information
    createAgentNode('nina_hoa_research', 'nina', 'company_research', [600, 200]),

    // Parallel execution: Contact HOA management and gather documents
    createAgentNode('mia_initial_contact', 'mia', 'email_composition', [800, 100]),
    createAgentNode('florian_mgmt_contact', 'florian', 'phone_calling', [800, 300]),

    // Mia: Send document request emails
    createAgentNode('mia_doc_request', 'mia', 'email_sending', [1000, 100]),

    // Wait for document responses (simplified - would use webhook in real implementation)
    createSetNode('await_documents', {
      documents_requested: true,
      follow_up_scheduled: true,
      estimated_response_time: '3-5 business days',
    }, [1200, 200]),

    // Document processing phase starts here
    createIfNode('check_docs_received', '={{$json.documents_received === true}}', [1400, 200]),

    // Iris: Process received HOA documents with OCR
    createAgentNode('iris_doc_processing', 'iris', 'ocr_processing', [1600, 100]),

    // Iris: Extract structured data from documents  
    createAgentNode('iris_data_extraction', 'iris', 'data_extraction', [1800, 100]),

    // Corey: Specialized HOA document analysis
    createAgentNode('corey_hoa_analysis', 'corey', 'hoa_document_analysis', [2000, 100]),

    // Corey: Financial statement review
    createAgentNode('corey_financial_review', 'corey', 'financial_statement_review', [2200, 100]),

    // Corey: Bylaws interpretation
    createAgentNode('corey_bylaws_review', 'corey', 'bylaws_interpretation', [2400, 100]),

    // Corey: Compliance assessment
    createAgentNode('corey_compliance_check', 'corey', 'compliance_assessment', [2600, 100]),

    // Alternative path: Follow up if documents not received
    createAgentNode('mia_follow_up', 'mia', 'follow_up_scheduling', [1600, 300]),
    createAgentNode('florian_follow_up_call', 'florian', 'phone_calling', [1800, 300]),

    // HIL intervention for persistent non-response
    createHILInterventionNode('hil_no_response', 'HOA not responding to document requests', [2000, 300]),

    // Convergence point: Check analysis completeness
    createIfNode('check_analysis_complete', '={{$json.analysis_completeness >= 0.85}}', [2800, 200]),

    // Cassy: Quality assurance on all collected data
    createQualityCheckNode('cassy_qa_review', [3000, 100]),

    // Nina: Cross-reference findings with public records
    createAgentNode('nina_cross_reference', 'nina', 'data_validation', [3200, 100]),

    // Risk assessment and red flags identification
    createAgentNode('corey_risk_assessment', 'corey', 'hoa_document_analysis', [3400, 100]),

    // HIL: Manual review for complex issues or red flags
    createIfNode('check_red_flags', '={{$json.risk_level === "high" || $json.risk_level === "critical"}}', [3600, 200]),
    createHILInterventionNode('hil_red_flags', 'High risk factors identified, manual review required', [3800, 300]),

    // Ria: Generate comprehensive acquisition report
    createAgentNode('ria_acquisition_report', 'ria', 'report_generation', [3800, 100]),

    // Ria: Client communication with findings
    createAgentNode('ria_client_communication', 'ria', 'client_updates', [4000, 100]),

    // Kosha: Financial analysis and cost tracking
    createAgentNode('kosha_financial_analysis', 'kosha', 'expense_analysis', [4200, 100]),

    // Database: Update workflow with final results
    createDatabaseNode('complete_workflow', 'update', 'workflows', [4400, 200]),

    // Response: Return comprehensive results
    createResponseNode('response', {
      workflow_id: '={{$json.workflow_id}}',
      status: 'completed',
      hoa_analysis: '={{$json.hoa_analysis}}',
      financial_health: '={{$json.financial_health}}',
      compliance_status: '={{$json.compliance_status}}',
      risk_assessment: '={{$json.risk_assessment}}',
      recommendations: '={{$json.recommendations}}',
      cost: '={{$json.total_cost}}',
    }, [4600, 200]),
  ],

  connections: Object.fromEntries([
    // Initial flow
    createConnection('trigger', 'initialize'),
    createConnection('initialize', 'create_workflow'),
    createConnection('create_workflow', 'nina_hoa_research'),

    // Parallel contact initiation
    createConnection('nina_hoa_research', 'mia_initial_contact'),
    createConnection('nina_hoa_research', 'florian_mgmt_contact'),

    // Email sequence
    createConnection('mia_initial_contact', 'mia_doc_request'),
    createConnection('mia_doc_request', 'await_documents'),
    createConnection('florian_mgmt_contact', 'await_documents'),

    // Document receipt check
    createConnection('await_documents', 'check_docs_received'),

    // Document processing path (when documents received)
    createConditionalConnection('check_docs_received', 'iris_doc_processing', 'mia_follow_up'),
    createConnection('iris_doc_processing', 'iris_data_extraction'),
    createConnection('iris_data_extraction', 'corey_hoa_analysis'),

    // Sequential HOA analysis
    createConnection('corey_hoa_analysis', 'corey_financial_review'),
    createConnection('corey_financial_review', 'corey_bylaws_review'),
    createConnection('corey_bylaws_review', 'corey_compliance_check'),

    // Follow-up path (when documents not received)
    createConnection('mia_follow_up', 'florian_follow_up_call'),
    createConnection('florian_follow_up_call', 'hil_no_response'),

    // Both paths converge at analysis completeness check
    createConnection('corey_compliance_check', 'check_analysis_complete'),
    createConnection('hil_no_response', 'check_analysis_complete'),

    // Quality assurance and validation
    createConditionalConnection('check_analysis_complete', 'cassy_qa_review', 'hil_no_response'),
    createConnection('cassy_qa_review', 'nina_cross_reference'),
    createConnection('nina_cross_reference', 'corey_risk_assessment'),

    // Risk assessment branch
    createConnection('corey_risk_assessment', 'check_red_flags'),
    createConditionalConnection('check_red_flags', 'hil_red_flags', 'ria_acquisition_report'),
    createConnection('hil_red_flags', 'ria_acquisition_report'),

    // Final reporting and completion
    createConnection('ria_acquisition_report', 'ria_client_communication'),
    createConnection('ria_client_communication', 'kosha_financial_analysis'),
    createConnection('kosha_financial_analysis', 'complete_workflow'),
    createConnection('complete_workflow', 'response'),
  ]),
};

/**
 * Export workflow configuration
 */
export const exportHOAAcquisitionWorkflow = () => ({
  name: hoaAcquisitionWorkflow.name,
  nodes: hoaAcquisitionWorkflow.nodes,
  connections: hoaAcquisitionWorkflow.connections,
  active: hoaAcquisitionWorkflow.active,
  settings: hoaAcquisitionWorkflow.settings,
  staticData: hoaAcquisitionWorkflow.staticData,
  tags: hoaAcquisitionWorkflow.tags,
  triggerCount: hoaAcquisitionWorkflow.triggerCount,
  versionId: hoaAcquisitionWorkflow.versionId,
});

/**
 * Workflow context and result interfaces
 */
export interface HOAAcquisitionContext {
  hoa_name: string;
  property_address: string;
  state: string;
  acquisition_type: 'purchase' | 'refinance' | 'investment_analysis';
  client_id: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  due_diligence_scope: 'basic' | 'standard' | 'comprehensive';
  timeline_requirements?: string;
  specific_concerns?: string[];
  initiated_by: string;
}

export interface HOAAcquisitionResult {
  workflow_id: string;
  status: 'completed' | 'failed' | 'requires_intervention';
  hoa_profile: {
    name: string;
    management_company: string;
    board_composition: Array<{
      position: string;
      name?: string;
      contact?: string;
    }>;
    total_units: number;
    establishment_date?: string;
    legal_status: string;
  };
  financial_analysis: {
    overall_health_score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    key_metrics: {
      total_revenue: number;
      total_expenses: number;
      reserve_balance: number;
      delinquency_rate: number;
    };
    budget_analysis: {
      current_assessment: number;
      special_assessments: Array<{
        purpose: string;
        amount: number;
        timeline: string;
      }>;
    };
  };
  governance_analysis: {
    bylaws_compliance: number;
    meeting_frequency: string;
    voting_procedures: string;
    amendment_history: Array<{
      date: string;
      description: string;
      impact: string;
    }>;
  };
  compliance_status: {
    overall_score: number;
    state_compliance: boolean;
    federal_compliance: boolean;
    insurance_compliance: boolean;
    issues: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
    }>;
  };
  risk_assessment: {
    overall_risk: 'low' | 'medium' | 'high' | 'critical';
    risk_factors: Array<{
      category: string;
      description: string;
      impact: string;
      likelihood: number;
    }>;
    mitigation_strategies: string[];
  };
  documents_analyzed: Array<{
    type: string;
    filename: string;
    analysis_confidence: number;
    key_findings: string[];
  }>;
  recommendations: Array<{
    category: string;
    recommendation: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    rationale: string;
  }>;
  execution_metrics: {
    total_time_hours: number;
    total_cost_cents: number;
    agents_utilized: string[];
    quality_score: number;
    document_coverage: number;
  };
}