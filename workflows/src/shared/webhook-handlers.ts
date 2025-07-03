/**
 * Webhook Handlers for n8n Integration
 * Manages webhook endpoints and data transformation between n8n and Rexera APIs
 */

import type { 
  MunicipalLienSearchContext, 
  MunicipalLienSearchResult 
} from '../workflows/municipal-lien-search';
import type { 
  HOAAcquisitionContext, 
  HOAAcquisitionResult 
} from '../workflows/hoa-acquisition';
import type { 
  PayoffRequestContext, 
  PayoffRequestResult 
} from '../workflows/payoff-request';

export interface WebhookRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  headers: Record<string, string>;
  body: any;
  query: Record<string, string>;
}

export interface WebhookResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
}

export interface WorkflowWebhookHandler {
  path: string;
  method: 'GET' | 'POST';
  handler: (request: WebhookRequest) => Promise<WebhookResponse>;
  validation?: (body: any) => { valid: boolean; errors?: string[] };
}

/**
 * Webhook validation utilities
 */
export const validateMunicipalLienSearchRequest = (body: any): { valid: boolean; errors?: string[] } => {
  const errors: string[] = [];
  
  if (!body.property_address) errors.push('property_address is required');
  if (!body.county) errors.push('county is required');
  if (!body.state) errors.push('state is required');
  if (!body.client_id) errors.push('client_id is required');
  
  if (body.priority && !['low', 'normal', 'high', 'urgent'].includes(body.priority)) {
    errors.push('priority must be one of: low, normal, high, urgent');
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
};

export const validateHOAAcquisitionRequest = (body: any): { valid: boolean; errors?: string[] } => {
  const errors: string[] = [];
  
  if (!body.hoa_name) errors.push('hoa_name is required');
  if (!body.property_address) errors.push('property_address is required');
  if (!body.state) errors.push('state is required');
  if (!body.client_id) errors.push('client_id is required');
  
  if (body.acquisition_type && !['purchase', 'refinance', 'investment_analysis'].includes(body.acquisition_type)) {
    errors.push('acquisition_type must be one of: purchase, refinance, investment_analysis');
  }
  
  if (body.due_diligence_scope && !['basic', 'standard', 'comprehensive'].includes(body.due_diligence_scope)) {
    errors.push('due_diligence_scope must be one of: basic, standard, comprehensive');
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
};

export const validatePayoffRequestRequest = (body: any): { valid: boolean; errors?: string[] } => {
  const errors: string[] = [];
  
  if (!body.property_address) errors.push('property_address is required');
  if (!body.loan_number) errors.push('loan_number is required');
  if (!body.borrower_name) errors.push('borrower_name is required');
  if (!body.lender_name) errors.push('lender_name is required');
  if (!body.closing_date) errors.push('closing_date is required');
  if (!body.client_id) errors.push('client_id is required');
  
  if (body.payoff_type && !['full_payoff', 'partial_payoff', 'refinance'].includes(body.payoff_type)) {
    errors.push('payoff_type must be one of: full_payoff, partial_payoff, refinance');
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
};

/**
 * Municipal Lien Search Webhook Handler
 */
export const municipalLienSearchWebhook: WorkflowWebhookHandler = {
  path: 'municipal-lien-search',
  method: 'POST',
  validation: validateMunicipalLienSearchRequest,
  handler: async (request: WebhookRequest): Promise<WebhookResponse> => {
    try {
      // Validate request
      const validation = validateMunicipalLienSearchRequest(request.body);
      if (!validation.valid) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: {
            error: 'Validation failed',
            details: validation.errors,
            workflow_type: 'municipal_lien_search',
          },
        };
      }

      // Transform request data for n8n workflow
      const workflowContext: MunicipalLienSearchContext = {
        property_address: request.body.property_address,
        county: request.body.county,
        state: request.body.state,
        client_id: request.body.client_id,
        parcel_number: request.body.parcel_number,
        owner_name: request.body.owner_name,
        priority: request.body.priority || 'normal',
        initiated_by: request.body.initiated_by || 'api',
        custom_instructions: request.body.custom_instructions,
      };

      // Add workflow metadata
      const enrichedContext = {
        ...workflowContext,
        webhook_id: crypto.randomUUID(),
        received_at: new Date().toISOString(),
        source_ip: request.headers['x-forwarded-for'] || 'unknown',
        user_agent: request.headers['user-agent'] || 'unknown',
      };

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          workflow_id: enrichedContext.webhook_id,
          status: 'initiated',
          message: 'Municipal lien search workflow started',
          context: enrichedContext,
          estimated_completion: calculateEstimatedCompletion('municipal_lien_search', workflowContext.priority),
        },
      };
    } catch (error) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: {
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
          workflow_type: 'municipal_lien_search',
        },
      };
    }
  },
};

/**
 * HOA Acquisition Webhook Handler
 */
export const hoaAcquisitionWebhook: WorkflowWebhookHandler = {
  path: 'hoa-acquisition',
  method: 'POST',
  validation: validateHOAAcquisitionRequest,
  handler: async (request: WebhookRequest): Promise<WebhookResponse> => {
    try {
      const validation = validateHOAAcquisitionRequest(request.body);
      if (!validation.valid) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: {
            error: 'Validation failed',
            details: validation.errors,
            workflow_type: 'hoa_acquisition',
          },
        };
      }

      const workflowContext: HOAAcquisitionContext = {
        hoa_name: request.body.hoa_name,
        property_address: request.body.property_address,
        state: request.body.state,
        acquisition_type: request.body.acquisition_type || 'purchase',
        client_id: request.body.client_id,
        priority: request.body.priority || 'normal',
        due_diligence_scope: request.body.due_diligence_scope || 'standard',
        timeline_requirements: request.body.timeline_requirements,
        specific_concerns: request.body.specific_concerns,
        initiated_by: request.body.initiated_by || 'api',
      };

      const enrichedContext = {
        ...workflowContext,
        webhook_id: crypto.randomUUID(),
        received_at: new Date().toISOString(),
        source_ip: request.headers['x-forwarded-for'] || 'unknown',
        user_agent: request.headers['user-agent'] || 'unknown',
      };

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          workflow_id: enrichedContext.webhook_id,
          status: 'initiated',
          message: 'HOA acquisition workflow started',
          context: enrichedContext,
          estimated_completion: calculateEstimatedCompletion('hoa_acquisition', workflowContext.priority),
        },
      };
    } catch (error) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: {
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
          workflow_type: 'hoa_acquisition',
        },
      };
    }
  },
};

/**
 * Payoff Request Webhook Handler
 */
export const payoffRequestWebhook: WorkflowWebhookHandler = {
  path: 'payoff-request',
  method: 'POST',
  validation: validatePayoffRequestRequest,
  handler: async (request: WebhookRequest): Promise<WebhookResponse> => {
    try {
      const validation = validatePayoffRequestRequest(request.body);
      if (!validation.valid) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: {
            error: 'Validation failed',
            details: validation.errors,
            workflow_type: 'payoff_request',
          },
        };
      }

      const workflowContext: PayoffRequestContext = {
        property_address: request.body.property_address,
        loan_number: request.body.loan_number,
        borrower_name: request.body.borrower_name,
        lender_name: request.body.lender_name,
        closing_date: request.body.closing_date,
        client_id: request.body.client_id,
        urgency: request.body.urgency || 'normal',
        payoff_type: request.body.payoff_type || 'full_payoff',
        special_instructions: request.body.special_instructions,
        contact_preferences: request.body.contact_preferences,
        initiated_by: request.body.initiated_by || 'api',
      };

      const enrichedContext = {
        ...workflowContext,
        webhook_id: crypto.randomUUID(),
        received_at: new Date().toISOString(),
        source_ip: request.headers['x-forwarded-for'] || 'unknown',
        user_agent: request.headers['user-agent'] || 'unknown',
      };

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          workflow_id: enrichedContext.webhook_id,
          status: 'initiated',
          message: 'Payoff request workflow started',
          context: enrichedContext,
          estimated_completion: calculateEstimatedCompletion('payoff_request', workflowContext.urgency),
        },
      };
    } catch (error) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: {
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
          workflow_type: 'payoff_request',
        },
      };
    }
  },
};

/**
 * Webhook registry for all workflow types
 */
export const workflowWebhooks: WorkflowWebhookHandler[] = [
  municipalLienSearchWebhook,
  hoaAcquisitionWebhook,
  payoffRequestWebhook,
];

/**
 * Utility functions
 */
function calculateEstimatedCompletion(
  workflowType: string, 
  priority: 'low' | 'normal' | 'high' | 'urgent'
): string {
  const baseCompletionTimes = {
    municipal_lien_search: { base: 4, unit: 'hours' },
    hoa_acquisition: { base: 3, unit: 'days' },
    payoff_request: { base: 2, unit: 'hours' },
  };

  const priorityMultipliers = {
    urgent: 0.5,
    high: 0.75,
    normal: 1.0,
    low: 1.5,
  };

  const baseTime = baseCompletionTimes[workflowType as keyof typeof baseCompletionTimes];
  if (!baseTime) return 'Unknown';

  const adjustedTime = baseTime.base * priorityMultipliers[priority];
  const completionDate = new Date();
  
  if (baseTime.unit === 'hours') {
    completionDate.setHours(completionDate.getHours() + adjustedTime);
  } else if (baseTime.unit === 'days') {
    completionDate.setDate(completionDate.getDate() + adjustedTime);
  }

  return completionDate.toISOString();
}

/**
 * HIL Intervention webhook for manual interventions
 */
export const hilInterventionWebhook: WorkflowWebhookHandler = {
  path: 'hil-intervention',
  method: 'POST',
  handler: async (request: WebhookRequest): Promise<WebhookResponse> => {
    try {
      const { workflow_id, execution_id, action, resolution_data } = request.body;

      if (!workflow_id || !execution_id || !action) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: {
            error: 'Missing required fields',
            required: ['workflow_id', 'execution_id', 'action'],
          },
        };
      }

      // Process HIL intervention
      const interventionResult = {
        intervention_id: crypto.randomUUID(),
        workflow_id,
        execution_id,
        action,
        resolution_data,
        processed_at: new Date().toISOString(),
        status: 'processed',
      };

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: interventionResult,
      };
    } catch (error) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: {
          error: 'Failed to process HIL intervention',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  },
};

/**
 * Workflow status webhook for retrieving workflow status
 */
export const workflowStatusWebhook: WorkflowWebhookHandler = {
  path: 'workflow-status/:workflowId',
  method: 'GET',
  handler: async (request: WebhookRequest): Promise<WebhookResponse> => {
    try {
      const workflowId = request.path.split('/').pop();
      
      if (!workflowId) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: { error: 'Workflow ID is required' },
        };
      }

      // This would integrate with the database to get actual status
      const status = {
        workflow_id: workflowId,
        status: 'running', // Would be fetched from database
        progress: 65,
        current_step: 'Document Processing',
        estimated_completion: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        last_updated: new Date().toISOString(),
      };

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: status,
      };
    } catch (error) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: {
          error: 'Failed to retrieve workflow status',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  },
};

// Add additional webhooks to the registry
workflowWebhooks.push(hilInterventionWebhook, workflowStatusWebhook);