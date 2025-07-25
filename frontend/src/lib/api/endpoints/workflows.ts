/**
 * Workflows API endpoints for Rexera 2.0 frontend.
 * Handles workflow management operations.
 */

import type { WorkflowType, PriorityLevel, WorkflowData } from '@rexera/shared';
import type { WorkflowApiResponse } from '@/types/api';
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
  async byId(id: string, include: string[] = []): Promise<WorkflowData> {
    const params = new URLSearchParams();
    if (include.length > 0) {
      params.append('include', include.join(','));
    }
    
    const url = `/workflows/${id}?${params}`;
    return apiRequest<WorkflowData>(url);
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
   * Trigger n8n workflow execution via backend
   */
  async triggerN8nWorkflow(id: string, workflowType: string = 'basic-test') {
    // Call the backend endpoint to trigger n8n (avoids CORS issues)
    return apiRequest(`/workflows/${id}/trigger-n8n`, {
      method: 'POST',
    });
  },

  /**
   * Update workflow
   */
  async update(id: string, data: {
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

  /**
   * Update workflow (legacy method name for backward compatibility)
   */
  async updateWorkflow(id: string, data: {
    status?: string;
    n8n_execution_id?: string;
    n8n_started_at?: string;
    n8n_status?: string;
    metadata?: Record<string, any>;
  }) {
    return this.update(id, data);
  },

  /**
   * Delete workflow (if deletion is supported in the future)
   */
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    return apiRequest<{ success: boolean; message: string }>(`/workflows/${id}`, {
      method: 'DELETE'
    });
  },
};

