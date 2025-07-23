/**
 * Task Executions API Client
 * 
 * Provides CRUD operations for task execution management
 */

import type { TaskExecution } from '@/types/workflow';
import type { TaskExecutionApiResponse } from '@/types/api';
import { apiRequest, getAuthToken, getApiBaseUrl } from '@/lib/api/core/request';
import { ApiError } from '@/lib/api/core/api-error';

export interface TaskExecutionsResponse {
  success: boolean;
  data: TaskExecution[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TaskExecutionResponse {
  success: boolean;
  data: TaskExecution;
}

export interface CreateTaskExecutionRequest {
  workflow_id: string;
  agent_id?: string;
  title: string;
  description?: string;
  sequence_order: number;
  task_type: string;
  executor_type: 'AI' | 'HIL';
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  input_data?: Record<string, any>;
  sla_hours?: number;
}

export interface UpdateTaskExecutionRequest {
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'INTERRUPT' | 'COMPLETED' | 'FAILED';
  output_data?: Record<string, any>;
  completed_at?: string;
  started_at?: string;
  error_message?: string;
  execution_time_ms?: number;
  retry_count?: number;
  interrupt_type?: 'MISSING_DOCUMENT' | 'PAYMENT_REQUIRED' | 'CLIENT_CLARIFICATION' | 'MANUAL_VERIFICATION';
}

export interface TaskExecutionFilters {
  workflow_id?: string;
  agent_id?: string;
  status?: string;
  executor_type?: string;
  page?: number;
  limit?: number;
  include?: string[];
}

/**
 * Task Executions API client following Rexera 2.0 consistency guidelines
 */
export const taskExecutionsApi = {
  /**
   * List task executions with filtering and pagination
   */
  async list(filters?: TaskExecutionFilters): Promise<TaskExecutionsResponse> {
    const params = new URLSearchParams();
    
    if (filters?.workflow_id) params.append('workflow_id', filters.workflow_id);
    if (filters?.agent_id) params.append('agent_id', filters.agent_id);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.executor_type) params.append('executor_type', filters.executor_type);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.include) params.append('include', filters.include.join(','));
    
    // Handle manually to get full response with pagination
    const authToken = await getAuthToken();
    const headers: Record<string, string> = {};
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await fetch(`${getApiBaseUrl()}/taskExecutions?${params}`, {
      headers
    });
    
    const data = await response.json();
    
    if (!response.ok || !data.success) {
      throw new ApiError(
        data.error || `HTTP ${response.status}`,
        response.status,
        data.details
      );
    }
    
    return data;
  },

  /**
   * Get task execution by ID
   */
  async byId(id: string, include?: string[]): Promise<TaskExecution> {
    const params = new URLSearchParams();
    if (include) params.append('include', include.join(','));
    
    const url = `/taskExecutions/${id}${params.toString() ? `?${params.toString()}` : ''}`;
    return apiRequest<TaskExecution>(url);
  },

  /**
   * Create new task execution
   */
  async create(data: CreateTaskExecutionRequest): Promise<TaskExecution> {
    return apiRequest<TaskExecution>('/taskExecutions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  /**
   * Create multiple task executions in bulk
   */
  async createBulk(taskExecutions: CreateTaskExecutionRequest[]): Promise<TaskExecution[]> {
    return apiRequest<TaskExecution[]>('/taskExecutions/bulk', {
      method: 'POST',
      body: JSON.stringify({ task_executions: taskExecutions })
    });
  },

  /**
   * Update task execution by ID
   */
  async update(id: string, data: UpdateTaskExecutionRequest): Promise<TaskExecution> {
    return apiRequest<TaskExecution>(`/taskExecutions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  /**
   * Update task execution by workflow ID and task type
   */
  async updateByWorkflowAndType(
    workflowId: string, 
    taskType: string, 
    data: UpdateTaskExecutionRequest
  ): Promise<TaskExecution> {
    return apiRequest<TaskExecution>('/taskExecutions/by-workflow-and-type', {
      method: 'PATCH',
      body: JSON.stringify({
        workflow_id: workflowId,
        task_type: taskType,
        ...data
      })
    });
  },

  /**
   * Delete task execution (if deletion is supported in the future)
   */
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    return apiRequest<{ success: boolean; message: string }>(`/taskExecutions/${id}`, {
      method: 'DELETE'
    });
  }
};