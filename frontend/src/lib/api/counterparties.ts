import { 
  Counterparty, 
  CreateCounterpartyRequest, 
  UpdateCounterpartyRequest,
  CounterpartyFilters,
  WorkflowCounterparty,
  CreateWorkflowCounterpartyRequest,
  UpdateWorkflowCounterpartyRequest,
  WorkflowCounterpartyFilters,
  CounterpartyType,
  WorkflowCounterpartyStatus 
} from '@rexera/shared';
import { apiRequest, getAuthToken, getApiBaseUrl } from './core/request';
import type { ApiResponse, ApiErrorResponse } from './core/types';
import { ApiError } from './core/api-error';

export interface CounterpartiesResponse {
  success: boolean;
  data: Counterparty[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CounterpartyResponse {
  success: boolean;
  data: Counterparty;
}

export interface WorkflowCounterpartiesResponse {
  success: boolean;
  data: WorkflowCounterparty[];
}

export interface CounterpartyTypesResponse {
  success: boolean;
  data: Array<{ value: CounterpartyType; label: string }>;
}

export const counterpartiesApi = {
  // Get all counterparties with filtering and pagination
  async list(filters?: CounterpartyFilters): Promise<CounterpartiesResponse> {
    const params = new URLSearchParams();
    
    if (filters?.type) params.append('type', filters.type);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.sort) params.append('sort', filters.sort);
    if (filters?.order) params.append('order', filters.order);
    if (filters?.include) params.append('include', filters.include);
    
    // We need the full response including pagination, so we'll handle the request manually
    const authToken = await getAuthToken();
    const headers: Record<string, string> = {};
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await fetch(`${getApiBaseUrl()}/counterparties?${params}`, {
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
      success: true,
      data: (data.data as Counterparty[]) || [],
      pagination: data.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      }
    };
  },

  // Get single counterparty by ID
  async get(id: string, include?: 'workflows'): Promise<CounterpartyResponse> {
    const params = new URLSearchParams();
    if (include) params.append('include', include);
    
    const url = `/counterparties/${id}${params.toString() ? `?${params.toString()}` : ''}`;
    return apiRequest<CounterpartyResponse>(url);
  },

  // Create new counterparty
  async create(data: CreateCounterpartyRequest): Promise<CounterpartyResponse> {
    return apiRequest<CounterpartyResponse>('/counterparties', { method: 'POST', body: JSON.stringify(data) });
  },

  // Update counterparty
  async update(id: string, data: UpdateCounterpartyRequest): Promise<CounterpartyResponse> {
    return apiRequest<CounterpartyResponse>(`/counterparties/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  },

  // Delete counterparty
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    return apiRequest<{ success: boolean; message: string }>(`/counterparties/${id}`, { method: 'DELETE' });
  },

  // Get available counterparty types
  async getTypes(): Promise<CounterpartyTypesResponse> {
    return apiRequest<CounterpartyTypesResponse>('/counterparties/types');
  },
};

export const workflowCounterpartiesApi = {
  // Get counterparties for a specific workflow
  async list(workflowId: string, filters?: WorkflowCounterpartyFilters): Promise<WorkflowCounterparty[]> {
    const params = new URLSearchParams();
    
    if (filters?.status) params.append('status', filters.status);
    if (filters?.include) params.append('include', filters.include);
    
    const url = `/workflows/${workflowId}/counterparties${params.toString() ? `?${params.toString()}` : ''}`;
    return apiRequest<WorkflowCounterparty[]>(url);
  },

  // Add counterparty to workflow
  async add(workflowId: string, data: CreateWorkflowCounterpartyRequest): Promise<{ success: boolean; data: WorkflowCounterparty }> {
    return apiRequest<{ success: boolean; data: WorkflowCounterparty }>(`/workflows/${workflowId}/counterparties`, { method: 'POST', body: JSON.stringify(data) });
  },

  // Update workflow counterparty status
  async updateStatus(
    workflowId: string, 
    relationshipId: string, 
    data: UpdateWorkflowCounterpartyRequest
  ): Promise<{ success: boolean; data: WorkflowCounterparty }> {
    return apiRequest<{ success: boolean; data: WorkflowCounterparty }>(`/workflows/${workflowId}/counterparties/${relationshipId}`, { method: 'PATCH', body: JSON.stringify(data) });
  },

  // Remove counterparty from workflow
  async remove(workflowId: string, relationshipId: string): Promise<{ success: boolean; message: string }> {
    return apiRequest<{ success: boolean; message: string }>(`/workflows/${workflowId}/counterparties/${relationshipId}`, { method: 'DELETE' });
  },
};