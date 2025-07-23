/**
 * Communications API endpoints for Rexera 2.0 frontend.
 * Handles email, phone, SMS, and HIL notes communications.
 */

import type {
  HilNote,
  CreateHilNote,
  UpdateHilNote,
  HilNoteFilters,
  ReplyHilNote,
  Communication,
  CreateCommunication,
  UpdateCommunication,
  CommunicationFilters,
  ReplyCommunication,
  ForwardCommunication,
  EmailThread
} from '@rexera/shared';
import { apiRequest, getAuthToken, getApiBaseUrl } from '../core/request';
import { ApiError } from '../core/api-error';
import type { ApiResponse, ApiErrorResponse } from '../core/types';

// Communications API functions
export const communicationsApi = {
  /**
   * List communications with filtering and pagination
   */
  async list(filters: Partial<CommunicationFilters> = {}) {
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

    const authToken = await getAuthToken();
    const headers: Record<string, string> = {};
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await fetch(`${getApiBaseUrl()}/communications?${params}`, {
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
      data: data.data || [],
      pagination: data.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      }
    };
  },

  /**
   * Get communication by ID with optional relations
   */
  async byId(id: string, include: string[] = []): Promise<Communication> {
    const params = new URLSearchParams();
    if (include.length > 0) {
      params.append('include', include.join(','));
    }
    
    const url = `/communications/${id}?${params}`;
    return apiRequest<Communication>(url);
  },

  /**
   * Get email threads for a workflow
   */
  async getThreads(workflowId: string): Promise<EmailThread[]> {
    const params = new URLSearchParams({ workflow_id: workflowId });
    const url = `/communications/threads?${params}`;
    return apiRequest<EmailThread[]>(url);
  },

  /**
   * Create a new communication record
   */
  async create(data: CreateCommunication): Promise<Communication> {
    return apiRequest<Communication>('/communications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update a communication record
   */
  async update(id: string, data: UpdateCommunication): Promise<Communication> {
    return apiRequest<Communication>(`/communications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Reply to a communication
   */
  async reply(id: string, data: ReplyCommunication): Promise<Communication> {
    return apiRequest<Communication>(`/communications/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Forward a communication
   */
  async forward(id: string, data: ForwardCommunication): Promise<Communication> {
    return apiRequest<Communication>(`/communications/${id}/forward`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete a communication
   */
  async delete(id: string): Promise<{ message: string }> {
    return apiRequest(`/communications/${id}`, {
      method: 'DELETE',
    });
  },
};

// HIL Notes API functions
export const hilNotesApi = {
  /**
   * Get HIL note by ID with optional relations
   */
  async byId(id: string, include: string[] = []): Promise<HilNote> {
    const params = new URLSearchParams();
    if (include.length > 0) {
      params.append('include', include.join(','));
    }
    
    const url = `/hil-notes/${id}?${params}`;
    return apiRequest<HilNote>(url);
  },

  /**
   * List HIL notes with filtering
   */
  async list(filters: HilNoteFilters) {
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

    const authToken = await getAuthToken();
    const headers: Record<string, string> = {};
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await fetch(`${getApiBaseUrl()}/hil-notes?${params}`, {
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

    return data.data as HilNote[];
  },

  /**
   * Create a new HIL note
   */
  async create(data: CreateHilNote): Promise<HilNote> {
    return apiRequest<HilNote>('/hil-notes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update a HIL note
   */
  async update(id: string, data: UpdateHilNote): Promise<HilNote> {
    return apiRequest<HilNote>(`/hil-notes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete a HIL note
   */
  async delete(id: string): Promise<{ message: string }> {
    return apiRequest(`/hil-notes/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Reply to a HIL note
   */
  async reply(parentId: string, data: ReplyHilNote): Promise<HilNote> {
    return apiRequest<HilNote>(`/hil-notes/${parentId}/reply`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};