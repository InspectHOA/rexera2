/**
 * Communications API endpoints for Rexera 2.0 frontend.
 * Handles email, phone, SMS, and HIL notes communications.
 */

import type {
  HilNote,
  CreateHilNote,
  UpdateHilNote,
  HilNoteFilters,
  ReplyHilNote
} from '@rexera/shared';
import { apiRequest, getAuthToken, getApiBaseUrl } from '../core/request';
import { ApiError } from '../core/api-error';
import type { ApiResponse, ApiErrorResponse } from '../core/types';

// Communications API functions
export const communicationsApi = {
  /**
   * List communications with filtering
   */
  async list(filters: {
    workflow_id?: string;
    type?: 'email' | 'phone' | 'sms' | 'internal_note';
    communication_type?: 'email' | 'phone' | 'sms' | 'internal_note';
    direction?: 'INBOUND' | 'OUTBOUND';
    limit?: number;
  } = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        // Map 'type' to 'communication_type' for backend compatibility
        if (key === 'type') {
          params.append('communication_type', String(value));
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
   * Create a new communication record
   */
  async create(data: {
    workflow_id: string;
    recipient_email: string;
    subject: string;
    body: string;
    communication_type: 'email' | 'phone' | 'sms' | 'internal_note';
    direction: 'INBOUND' | 'OUTBOUND';
    thread_id?: string;
  }) {
    return apiRequest('/communications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// HIL Notes API functions
export const hilNotesApi = {
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