/**
 * System API endpoints for Rexera 2.0 frontend.
 * Handles health checks, users, agents, activities, audit events, and system operations.
 */

import type {
  User,
  UserFilters,
  AuditEvent,
  CreateAuditEvent
} from '@rexera/shared';
import type { AgentListResponse } from '@/types/api';
import { apiRequest, getAuthToken, getApiBaseUrl } from '../core/request';
import { ApiError } from '../core/api-error';
import type { ApiResponse, ApiErrorResponse } from '../core/types';

// Health API
export const healthApi = {
  /**
   * Check API health status
   */
  async check() {
    return apiRequest('/health');
  },
};

// Activities API functions
export const activitiesApi = {
  /**
   * List activities with filtering
   */
  async list(filters: {
    workflow_id?: string;
    activity_type?: string;
    user_id?: string;
    created_by?: string;
    page?: number;
    limit?: number;
    include?: string[];
  } = {}) {
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

    return apiRequest(`/activities?${params}`);
  },
};

// Agents API functions
export const agentsApi = {
  /**
   * List agents with filtering
   */
  async list(filters: {
    is_active?: boolean;
    type?: string;
    status?: string;
    page?: number;
    limit?: number;
    include?: string[];
  } = {}): Promise<AgentListResponse> {
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

    return apiRequest<AgentListResponse>(`/agents?${params}`);
  },
};

// Interrupts API functions
export const interruptsApi = {
  /**
   * List interrupts with filtering
   */
  async list(filters: {
    workflow_id?: string;
    status?: string;
    priority?: string;
    assigned_to?: string;
    interrupt_type?: string;
    page?: number;
    limit?: number;
    include?: string[];
  } = {}) {
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

    return apiRequest(`/interrupts?${params}`);
  },

  /**
   * Create a new interrupt
   */
  async create(data: {
    workflow_id: string;
    interrupt_type: string;
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    description: string;
    assigned_to?: string;
    metadata?: Record<string, any>;
  }) {
    return apiRequest('/interrupts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update interrupt status
   */
  async update(id: string, data: {
    status?: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';
    assigned_to?: string;
    resolution_notes?: string;
    resolved_at?: string;
  }) {
    return apiRequest(`/interrupts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

// Incoming email API
export const incomingEmailApi = {
  /**
   * Process incoming email
   */
  async process(data: {
    from: string;
    to: string;
    subject: string;
    body: string;
    messageId: string;
    receivedAt: string;
    workflowId?: string;
  }) {
    return apiRequest('/incoming-email', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Users API functions
export const usersApi = {
  /**
   * List users with filtering
   */
  async list(filters?: UserFilters): Promise<User[]> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }

    const authToken = await getAuthToken();
    const headers: Record<string, string> = {};
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await fetch(`${getApiBaseUrl()}/users?${params}`, {
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

    return data.data as User[];
  },

  /**
   * Get user by ID
   */
  async byId(id: string): Promise<User> {
    return apiRequest<User>(`/users/${id}`);
  },
};

// Audit Events API functions
export const auditEventsApi = {
  /**
   * List audit events with filtering
   */
  async list(filters: {
    workflow_id?: string;
    actor_type?: string;
    resource_type?: string;
    action?: string;
    page?: number;
    per_page?: number;
    limit?: number;
  } = {}): Promise<{
    data: AuditEvent[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value));
      }
    });

    return apiRequest<{
      data: AuditEvent[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/audit-events?${params}`);
  },

  /**
   * Create a new audit event
   */
  async create(data: CreateAuditEvent): Promise<AuditEvent> {
    return apiRequest<AuditEvent>('/audit-events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Clients API functions
export const clientsApi = {
  /**
   * List all clients
   */
  async list(): Promise<{ id: string; name: string; domain?: string }[]> {
    return apiRequest('/clients');
  },

  /**
   * Get client by ID
   */
  async byId(id: string): Promise<{ id: string; name: string; domain?: string }> {
    return apiRequest(`/clients/${id}`);
  },
};