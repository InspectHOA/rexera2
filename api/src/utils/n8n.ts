// =====================================================
// n8n API Client and Utilities
// Core functions for n8n integration
// =====================================================

import { config } from '../config';
import {
  N8nApiConfig,
  N8nExecutionResponse,
  N8nExecutionStatus,
  TriggerN8nWorkflowParams,
  N8nApiError,
  N8nError
} from '../types/n8n';

// n8n Configuration
const n8nConfig: N8nApiConfig = {
  baseUrl: config.n8n.baseUrl,
  apiKey: config.n8n.apiKey,
  webhookUrl: config.n8n.webhookUrl
};

// Validate n8n configuration
export function validateN8nConfig(): boolean {
  if (!n8nConfig.apiKey) {
    console.warn('N8N_API_KEY not configured - n8n integration disabled');
    return false;
  }
  if (!n8nConfig.baseUrl) {
    console.warn('N8N_BASE_URL not configured - n8n integration disabled');
    return false;
  }
  return true;
}

// Check if n8n integration is enabled and configured
export function isN8nEnabled(): boolean {
  return validateN8nConfig();
}

// HTTP client for n8n API
async function n8nApiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (!validateN8nConfig()) {
    throw new N8nError('n8n is not properly configured', 'N8N_NOT_CONFIGURED');
  }

  const url = `${n8nConfig.baseUrl}/api/v1${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'X-N8N-API-KEY': n8nConfig.apiKey,
  };

  try {
    console.log(`n8n API Request: ${options.method || 'GET'} ${url}`);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      
      throw new N8nApiError(
        `n8n API error: ${errorData.message || response.statusText}`,
        response.status,
        errorData
      );
    }

    const data = await response.json();
    console.log(`n8n API Response: ${response.status}`, data);
    return data;
  } catch (error) {
    if (error instanceof N8nApiError) {
      throw error;
    }
    
    console.error('n8n API request failed:', error);
    throw new N8nError(
      `Failed to communicate with n8n: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'N8N_CONNECTION_ERROR'
    );
  }
}

/**
 * Trigger n8n payoff workflow
 * @param params - Workflow trigger parameters
 * @returns n8n execution response
 */
export async function triggerN8nPayoffWorkflow(
  params: TriggerN8nWorkflowParams
): Promise<N8nExecutionResponse> {
  if (!isN8nEnabled()) {
    throw new N8nError('n8n integration is not enabled', 'N8N_DISABLED');
  }

  try {
    console.log('Triggering n8n payoff workflow:', params);

    // For now, we'll use a generic workflow trigger endpoint
    // In production, this would be the specific payoff workflow ID
    const workflowId = config.n8n.payoffWorkflowId || 'payoff-workflow';
    
    const triggerData = {
      rexeraWorkflowId: params.rexeraWorkflowId,
      workflowType: params.workflowType,
      clientId: params.clientId,
      metadata: params.metadata,
      webhookUrl: n8nConfig.webhookUrl,
      timestamp: new Date().toISOString()
    };

    const execution = await n8nApiRequest<N8nExecutionResponse>(
      `/workflows/${workflowId}/execute`,
      {
        method: 'POST',
        body: JSON.stringify(triggerData),
      }
    );

    console.log('n8n workflow triggered successfully:', execution.id);
    return execution;
  } catch (error) {
    console.error('Failed to trigger n8n payoff workflow:', error);
    throw error;
  }
}

/**
 * Get n8n execution status
 * @param executionId - n8n execution ID
 * @returns Execution status information
 */
export async function getN8nExecution(executionId: string): Promise<N8nExecutionStatus> {
  if (!isN8nEnabled()) {
    throw new N8nError('n8n integration is not enabled', 'N8N_DISABLED');
  }

  try {
    console.log('Getting n8n execution status:', executionId);

    const execution = await n8nApiRequest<N8nExecutionResponse>(
      `/executions/${executionId}`
    );

    const status: N8nExecutionStatus = {
      id: execution.id,
      status: execution.status,
      finished: execution.finished,
      startedAt: execution.startedAt,
      stoppedAt: execution.stoppedAt,
      error: execution.data?.resultData?.error
    };

    console.log('n8n execution status retrieved:', status);
    return status;
  } catch (error) {
    console.error('Failed to get n8n execution status:', error);
    throw error;
  }
}

/**
 * Cancel n8n execution
 * @param executionId - n8n execution ID
 * @returns Success status
 */
export async function cancelN8nExecution(executionId: string): Promise<boolean> {
  if (!isN8nEnabled()) {
    throw new N8nError('n8n integration is not enabled', 'N8N_DISABLED');
  }

  try {
    console.log('Canceling n8n execution:', executionId);

    await n8nApiRequest(`/executions/${executionId}/stop`, {
      method: 'POST',
    });

    console.log('n8n execution canceled successfully:', executionId);
    return true;
  } catch (error) {
    console.error('Failed to cancel n8n execution:', error);
    throw error;
  }
}

/**
 * Get n8n workflow information
 * @param workflowId - n8n workflow ID
 * @returns Workflow information
 */
export async function getN8nWorkflow(workflowId: string) {
  if (!isN8nEnabled()) {
    throw new N8nError('n8n integration is not enabled', 'N8N_DISABLED');
  }

  try {
    console.log('Getting n8n workflow:', workflowId);

    const workflow = await n8nApiRequest(`/workflows/${workflowId}`);

    console.log('n8n workflow retrieved:', workflow);
    return workflow;
  } catch (error) {
    console.error('Failed to get n8n workflow:', error);
    throw error;
  }
}

/**
 * Test n8n connection
 * @returns Connection status
 */
export async function testN8nConnection(): Promise<boolean> {
  if (!validateN8nConfig()) {
    return false;
  }

  try {
    console.log('Testing n8n connection...');
    
    // Test with a simple health check or workflow list
    await n8nApiRequest('/workflows?limit=1');
    
    console.log('n8n connection test successful');
    return true;
  } catch (error) {
    console.error('n8n connection test failed:', error);
    return false;
  }
}

/**
 * Get n8n configuration status
 * @returns Configuration status object
 */
export function getN8nConfigStatus() {
  return {
    enabled: isN8nEnabled(),
    baseUrl: n8nConfig.baseUrl,
    hasApiKey: !!n8nConfig.apiKey,
    hasWebhookUrl: !!n8nConfig.webhookUrl,
    payoffWorkflowId: config.n8n.payoffWorkflowId || null
  };
}

// Export configuration for testing
export { n8nConfig };