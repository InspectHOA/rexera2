/**
 * Municipal Lien Search Workflow
 * Automated county record searches with portal navigation and document processing
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

export const municipalLienSearchWorkflow: N8nWorkflow = {
  id: 'municipal_lien_search_v1',
  name: 'Municipal Lien Search',
  active: true,
  tags: ['real-estate', 'municipal', 'lien-search', 'automated'],
  settings: {
    executionOrder: 'v1',
    saveManualExecutions: true,
    callerPolicy: 'workflowsFromSameOwner',
    timezone: 'America/New_York',
  },
  staticData: {
    workflow_type: 'municipal_lien_search',
    version: '1.0.0',
    description: 'Automated municipal lien search with portal navigation',
  },
  triggerCount: 0,
  updatedAt: new Date().toISOString(),
  versionId: '1',
  
  nodes: [
    // Trigger: Webhook for workflow initiation
    createWebhookTriggerNode('trigger', 'municipal-lien-search'),

    // Initialize: Set up workflow data and create database record
    createSetNode('initialize', {
      workflow_id: '={{$workflow.id}}',
      execution_id: '={{$execution.id}}',
      workflow_type: 'municipal_lien_search',
      status: 'running',
      property_address: '={{$json.property_address}}',
      county: '={{$json.county}}',
      state: '={{$json.state}}',
      client_id: '={{$json.client_id}}',
      initiated_by: '={{$json.initiated_by || "system"}}',
      priority: '={{$json.priority || "normal"}}',
      started_at: '={{new Date().toISOString()}}',
    }, [200, 200]),

    // Database: Create workflow record
    createDatabaseNode('create_workflow', 'insert', 'workflows', [400, 200]),

    // Nina: Research property and county information
    createAgentNode('nina_research', 'nina', 'property_research', [600, 200]),

    // Database: Update workflow with research results
    createDatabaseNode('update_research', 'update', 'workflows', [800, 200]),

    // Rex: Login to county portal
    createAgentNode('rex_portal_login', 'rex', 'portal_login', [1000, 200]),

    // Conditional: Check if portal login successful
    createIfNode('check_portal_login', '={{$json.result_data.status === "success"}}', [1200, 200]),

    // Rex: Execute lien search if login successful
    createAgentNode('rex_lien_search', 'rex', 'search_execution', [1400, 100]),

    // HIL: Manual intervention if portal login failed
    createHILInterventionNode('hil_portal_failed', 'Portal login failed, manual intervention required', [1400, 300]),

    // Rex: Download documents from search results
    createAgentNode('rex_download_docs', 'rex', 'document_download', [1600, 100]),

    // Iris: Process downloaded documents with OCR
    createAgentNode('iris_ocr', 'iris', 'ocr_processing', [1800, 100]),

    // Iris: Extract structured data from documents
    createAgentNode('iris_extraction', 'iris', 'data_extraction', [2000, 100]),

    // Max: Call county office if no results found online
    createAgentNode('max_county_call', 'max', 'ivr_navigation', [1600, 300]),

    // Florian: Speak with county representative if needed
    createAgentNode('florian_county_call', 'florian', 'phone_calling', [1800, 300]),

    // Conditional: Check if sufficient data collected
    createIfNode('check_data_completeness', '={{$json.result_data.confidence_score >= 0.8}}', [2200, 200]),

    // Cassy: Quality check on collected data
    createQualityCheckNode('cassy_quality_check', [2400, 100]),

    // HIL: Manual review if data incomplete
    createHILInterventionNode('hil_data_review', 'Data completeness below threshold, manual review required', [2400, 300]),

    // Nina: Validate findings against multiple sources
    createAgentNode('nina_validation', 'nina', 'data_validation', [2600, 100]),

    // Ria: Generate client report
    createAgentNode('ria_report', 'ria', 'report_generation', [2800, 200]),

    // Kosha: Calculate costs and update billing
    createAgentNode('kosha_billing', 'kosha', 'cost_tracking', [3000, 200]),

    // Database: Update workflow completion
    createDatabaseNode('complete_workflow', 'update', 'workflows', [3200, 200]),

    // Response: Return results to client
    createResponseNode('response', {
      workflow_id: '={{$json.workflow_id}}',
      status: 'completed',
      results: '={{$json.final_results}}',
      cost: '={{$json.total_cost}}',
      execution_time: '={{$json.execution_time}}',
    }, [3400, 200]),
  ],

  connections: Object.fromEntries([
    // Linear flow: Trigger -> Initialize -> Create workflow
    createConnection('trigger', 'initialize'),
    createConnection('initialize', 'create_workflow'),
    createConnection('create_workflow', 'nina_research'),
    createConnection('nina_research', 'update_research'),
    createConnection('update_research', 'rex_portal_login'),

    // Conditional: Portal login success/failure
    createConditionalConnection('check_portal_login', 'rex_lien_search', 'hil_portal_failed'),
    createConnection('rex_portal_login', 'check_portal_login'),

    // Success path: Search -> Download -> Process
    createConnection('rex_lien_search', 'rex_download_docs'),
    createConnection('rex_download_docs', 'iris_ocr'),
    createConnection('iris_ocr', 'iris_extraction'),

    // Alternative path: Phone calls if portal fails
    createConnection('hil_portal_failed', 'max_county_call'),
    createConnection('max_county_call', 'florian_county_call'),

    // Convergence: Both paths lead to data completeness check
    createConnection('iris_extraction', 'check_data_completeness'),
    createConnection('florian_county_call', 'check_data_completeness'),

    // Conditional: Data completeness check
    createConditionalConnection('check_data_completeness', 'cassy_quality_check', 'hil_data_review'),

    // Quality path: Validation -> Report -> Billing
    createConnection('cassy_quality_check', 'nina_validation'),
    createConnection('nina_validation', 'ria_report'),
    createConnection('ria_report', 'kosha_billing'),

    // Manual review path rejoins main flow
    createConnection('hil_data_review', 'nina_validation'),

    // Final steps: Complete workflow and respond
    createConnection('kosha_billing', 'complete_workflow'),
    createConnection('complete_workflow', 'response'),
  ]),
};

/**
 * Export workflow configuration for n8n import
 */
export const exportMunicipalLienSearchWorkflow = () => ({
  name: municipalLienSearchWorkflow.name,
  nodes: municipalLienSearchWorkflow.nodes,
  connections: municipalLienSearchWorkflow.connections,
  active: municipalLienSearchWorkflow.active,
  settings: municipalLienSearchWorkflow.settings,
  staticData: municipalLienSearchWorkflow.staticData,
  tags: municipalLienSearchWorkflow.tags,
  triggerCount: municipalLienSearchWorkflow.triggerCount,
  versionId: municipalLienSearchWorkflow.versionId,
});

/**
 * Workflow execution context and utilities
 */
export interface MunicipalLienSearchContext {
  property_address: string;
  county: string;
  state: string;
  client_id: string;
  parcel_number?: string;
  owner_name?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  initiated_by: string;
  custom_instructions?: string;
}

export interface MunicipalLienSearchResult {
  workflow_id: string;
  status: 'completed' | 'failed' | 'requires_intervention';
  property_details: {
    address: string;
    parcel_number: string;
    legal_description?: string;
    property_type: string;
  };
  ownership_info: {
    current_owner: string;
    owner_address?: string;
    acquisition_date?: string;
    purchase_price?: number;
  };
  lien_records: Array<{
    type: string;
    amount: number;
    record_date: string;
    description: string;
    document_url?: string;
  }>;
  search_coverage: {
    sources_checked: string[];
    time_period: string;
    completeness_score: number;
  };
  execution_metrics: {
    total_time_minutes: number;
    total_cost_cents: number;
    agents_used: string[];
    quality_score: number;
  };
  documents: Array<{
    type: string;
    filename: string;
    url: string;
    processed: boolean;
  }>;
  requires_follow_up: boolean;
  recommendations: string[];
}