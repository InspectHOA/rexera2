/**
 * Workflows and Tasks API endpoints for Rexera 2.0 frontend.
 * Handles workflow management and task execution operations.
 */

import type { WorkflowType, PriorityLevel } from '@rexera/shared';
import type { 
  WorkflowApiResponse,
  TaskExecutionApiResponse
} from '@/types/api';
import type { WorkflowData, TaskExecution } from '@/types/workflow';
import { apiRequest, getAuthToken, getApiBaseUrl } from '../core/request';
import { ApiError } from '../core/api-error';
import type { ApiResponse, ApiErrorResponse } from '../core/types';

// Workflow API functions
export const workflowsApi = {
  /**
   * List workflows with filtering and pagination
   */
  async list(filters: {
    workflow_type?: string;
    status?: string;
    client_id?: string;
    assigned_to?: string;
    priority?: string;
    page?: number;
    limit?: number;
    include?: string[];
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  } = {}): Promise<WorkflowApiResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          params.append(key, value.join(','));
        } else {
          params.append(key, String(value));
        }
      }
    });

    // We need the full response including pagination, so we'll handle the request manually
    const authToken = await getAuthToken();
    const headers: Record<string, string> = {};
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await fetch(`${getApiBaseUrl()}/workflows?${params}`, {
      headers
    });
    
    const data: ApiResponse = await response.json();
    
    if (!response.ok || !data.success) {
      const errorData = data as ApiErrorResponse;
      throw new ApiError(
        errorData.error?.message || `HTTP ${response.status}`,
        response.status,
        errorData.error?.details ? { details: errorData.error.details } : {}
      );
    }

    return {
      data: (data.data as WorkflowData[]) || [],
      pagination: data.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      }
    };
  },

  /**
   * Get workflow by ID
   */
  async byId(id: string, include: string[] = []) {
    const params = new URLSearchParams();
    if (include.length > 0) {
      params.append('include', include.join(','));
    }
    
    const url = `/workflows/${id}?${params}`;
    return apiRequest(url);
  },

  /**
   * Get workflow by human-readable ID
   */
  async byHumanId(humanId: string, include: string[] = []) {
    // Use the optimized API endpoint that handles human-readable IDs directly
    return this.byId(humanId, include);
  },

  /**
   * Create a new workflow
   */
  async create(data: {
    workflow_type: WorkflowType;
    client_id: string;
    title: string;
    description?: string;
    priority?: PriorityLevel;
    metadata?: Record<string, any>;
    due_date?: string;
    created_by: string;
  }) {
    return apiRequest('/workflows', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get n8n workflow status
   */
  async getN8nStatus(id: string) {
    return apiRequest(`/workflows/${id}/n8n-status`);
  },

  /**
   * Cancel n8n workflow execution
   */
  async cancelN8nExecution(id: string) {
    return apiRequest(`/workflows/${id}/cancel-n8n`, {
      method: 'POST',
    });
  },

  /**
   * Trigger n8n workflow execution
   */
  async triggerN8nWorkflow(id: string, workflowType: string = 'basic-test') {
    // For development/testing, we'll use a mock n8n endpoint
    // In production, this would be the actual n8n webhook URL
    const n8nBaseUrl = process.env.NEXT_PUBLIC_N8N_BASE_URL || 'http://localhost:5678';
    const webhookPath = workflowType === 'PAYOFF' ? '/webhook/payoff-test' : '/webhook/basic-test';
    
    const response = await fetch(`${n8nBaseUrl}${webhookPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workflow_id: id,
        metadata: {
          triggered_from: 'frontend',
          triggered_at: new Date().toISOString()
        }
      }),
    });

    if (!response.ok) {
      throw new ApiError(
        `Failed to trigger n8n workflow: ${response.statusText}`,
        response.status
      );
    }

    return response.json();
  },

  /**
   * Update workflow
   */
  async updateWorkflow(id: string, data: {
    status?: string;
    n8n_execution_id?: string;
    n8n_started_at?: string;
    n8n_status?: string;
    metadata?: Record<string, any>;
  }) {
    return apiRequest(`/workflows/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

// Task Executions API functions
export const tasksApi = {
  /**
   * List task executions with filtering
   */
  async list(filters: {
    workflowId?: string;
    workflow_id?: string;
    status?: string;
    executor_type?: string;
    assigned_to?: string;
    priority?: string;
    page?: number;
    limit?: number;
    include?: string[];
  } = {}): Promise<TaskExecutionApiResponse> {
    // Use workflowId if provided, otherwise fall back to workflow_id
    const workflowId = filters.workflowId || filters.workflow_id;
    
    if (workflowId) {
      const params = new URLSearchParams();
      params.append('workflow_id', workflowId); // Backend expects workflow_id, not workflowId
      
      // Add include parameter if provided
      if (filters.include && filters.include.length > 0) {
        params.append('include', filters.include.join(','));
      }
      
      // We need the full response including pagination for consistency
      const authToken = await getAuthToken();
      const headers: Record<string, string> = {};
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const response = await fetch(`${getApiBaseUrl()}/taskExecutions?${params}`, {
        headers
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new ApiError(
          data.error || `HTTP ${response.status}`,
          response.status,
          data.details
        );
      }

      return {
        data: data.success ? data.data : data, // Handle both formats
        pagination: {
          page: 1,
          limit: 20,
          total: Array.isArray(data.success ? data.data : data) ? (data.success ? data.data : data).length : 0,
          totalPages: 1
        }
      };
    }

    // If no workflow ID, return empty
    return {
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      }
    };
  },

  /**
   * Create a new task execution
   */
  async create(data: {
    workflow_id: string;
    agent_id?: string;
    title: string;
    description?: string;
    sequence_order: number;
    task_type: string;
    executor_type: 'AI' | 'HIL';
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    input_data?: Record<string, any>;
  }) {
    return apiRequest('/taskExecutions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update task execution
   */
  async update(id: string, data: {
    status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'INTERRUPT' | 'COMPLETED' | 'FAILED';
    output_data?: Record<string, any>;
    completed_at?: string;
    started_at?: string;
    error_message?: string;
    execution_time_ms?: number;
    retry_count?: number;
  }) {
    return apiRequest(`/taskExecutions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};