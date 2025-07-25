/**
 * Workflow Counterparties API Client
 * 
 * Provides operations for managing counterparty assignments to workflows
 */

import type {
  WorkflowCounterparty,
  CreateWorkflowCounterpartyRequest,
  UpdateWorkflowCounterpartyRequest,
  WorkflowCounterpartyFilters
} from '@rexera/shared';
import { apiRequest } from '@/lib/api/core/request';

export interface WorkflowCounterpartiesResponse {
  success: boolean;
  data: WorkflowCounterparty[];
}

/**
 * Workflow counterparties API client following Rexera 2.0 consistency guidelines
 */
export const workflowCounterpartiesApi = {
  /**
   * Get counterparties assigned to a specific workflow
   */
  async list(workflowId: string, filters?: WorkflowCounterpartyFilters): Promise<WorkflowCounterparty[]> {
    const params = new URLSearchParams();
    
    if (filters?.status) params.append('status', filters.status);
    if (filters?.include) params.append('include', filters.include);
    
    const url = `/workflows/${workflowId}/counterparties${params.toString() ? `?${params.toString()}` : ''}`;
    return apiRequest<WorkflowCounterparty[]>(url);
  },

  /**
   * Add counterparty to workflow
   */
  async add(workflowId: string, data: CreateWorkflowCounterpartyRequest): Promise<{ success: boolean; data: WorkflowCounterparty }> {
    return apiRequest<{ success: boolean; data: WorkflowCounterparty }>(`/workflows/${workflowId}/counterparties`, { 
      method: 'POST', 
      body: JSON.stringify(data) 
    });
  },

  /**
   * Update workflow counterparty status
   */
  async updateStatus(
    workflowId: string, 
    relationshipId: string, 
    data: UpdateWorkflowCounterpartyRequest
  ): Promise<{ success: boolean; data: WorkflowCounterparty }> {
    return apiRequest<{ success: boolean; data: WorkflowCounterparty }>(`/workflows/${workflowId}/counterparties/${relationshipId}`, { 
      method: 'PATCH', 
      body: JSON.stringify(data) 
    });
  },

  /**
   * Remove counterparty from workflow
   */
  async remove(workflowId: string, relationshipId: string): Promise<{ success: boolean; message: string }> {
    return apiRequest<{ success: boolean; message: string }>(`/workflows/${workflowId}/counterparties/${relationshipId}`, { 
      method: 'DELETE' 
    });
  }
};