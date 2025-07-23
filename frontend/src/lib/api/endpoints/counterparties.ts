/**
 * Counterparties API Client
 * 
 * Provides CRUD operations and search functionality for counterparty management
 */

import type {
  Counterparty,
  CounterpartyFilters,
  CounterpartySearchFilters,
  CreateCounterpartyRequest,
  UpdateCounterpartyRequest,
  CounterpartyType
} from '@rexera/shared';
import { apiRequest } from '@/lib/api/core/request';

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

export interface CounterpartySearchResponse {
  success: boolean;
  data: Counterparty[];
  meta: {
    query: string;
    type: CounterpartyType | null;
    total: number;
    limit: number;
  };
}

export interface CounterpartyTypesResponse {
  success: boolean;
  data: Array<{
    value: CounterpartyType;
    label: string;
  }>;
}

/**
 * Counterparties API client following Rexera 2.0 consistency guidelines
 */
export const counterpartiesApi = {
  /**
   * List counterparties with filtering and pagination
   */
  async list(filters?: Partial<CounterpartyFilters>): Promise<CounterpartiesResponse> {
    const params = new URLSearchParams();
    
    if (filters?.type) params.append('type', filters.type);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.sort) params.append('sort', filters.sort);
    if (filters?.order) params.append('order', filters.order);
    if (filters?.include) params.append('include', filters.include);
    
    const url = `/counterparties${params.toString() ? `?${params.toString()}` : ''}`;
    
    // Use standardized apiRequest but handle response format for backward compatibility
    // The API returns full response structure with pagination, so we return it directly
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(await (async () => {
          const authToken = await (await import('@/lib/api/core/request')).getAuthToken();
          return authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
        })())
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return response.json();
  },

  /**
   * Get counterparty by ID
   */
  async byId(id: string, include?: 'workflows'): Promise<Counterparty> {
    const params = new URLSearchParams();
    if (include) params.append('include', include);
    
    const url = `/counterparties/${id}${params.toString() ? `?${params.toString()}` : ''}`;
    return apiRequest<Counterparty>(url);
  },

  /**
   * Create new counterparty
   */
  async create(data: CreateCounterpartyRequest): Promise<Counterparty> {
    return apiRequest<Counterparty>('/counterparties', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  /**
   * Update counterparty
   */
  async update(id: string, data: UpdateCounterpartyRequest): Promise<Counterparty> {
    return apiRequest<Counterparty>(`/counterparties/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  /**
   * Delete counterparty
   */
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    return apiRequest<{ success: boolean; message: string }>(`/counterparties/${id}`, {
      method: 'DELETE'
    });
  },

  /**
   * Search counterparties by query string and type
   */
  async search(filters: CounterpartySearchFilters): Promise<CounterpartySearchResponse> {
    const params = new URLSearchParams();
    params.append('q', filters.q);
    if (filters.type) params.append('type', filters.type);
    if (filters.limit) params.append('limit', filters.limit.toString());
    
    const url = `/counterparties/search?${params.toString()}`;
    return apiRequest<CounterpartySearchResponse>(url);
  },

  /**
   * Get available counterparty types
   */
  async getTypes(): Promise<Array<{ value: CounterpartyType; label: string }>> {
    return apiRequest<Array<{ value: CounterpartyType; label: string }>>('/counterparties/types');
  }
};