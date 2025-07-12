/**
 * REST API client for Rexera 2.0 frontend.
 * Provides type-safe HTTP REST calls to the backend API.
 */

import type { WorkflowType, PriorityLevel } from '@rexera/shared';
import { supabase } from '@/lib/supabase/client';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api`;

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get current session and JWT token
  const { data: { session } } = await supabase.auth.getSession();
  
  // Build headers with authentication
  const headers: Record<string, string> = { 
    ...(options.headers as Record<string, string> || {}) 
  };
  
  // Add Authorization header if we have a session
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  
  // Only set Content-Type for requests with body (POST, PUT, PATCH)
  if (options.body && !headers['Content-Type'] && !headers['content-type']) {
    headers['Content-Type'] = 'application/json';
  }
  
  const response = await fetch(url, {
    headers,
    ...options,
  });

  const data: ApiResponse<T> = await response.json();

  if (!response.ok || !data.success) {
    throw new ApiError(
      data.error || `HTTP ${response.status}`,
      response.status,
      data.details
    );
  }

  return data.data as T;
}

// Workflow API functions
export const workflowsApi = {
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

    // Get current session and JWT token
    const { data: { session } } = await supabase.auth.getSession();
    
    const headers: Record<string, string> = {};
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const response = await fetch(`${API_BASE_URL}/workflows?${params}`, {
      headers
    });
    const data: ApiResponse = await response.json();

    if (!response.ok || !data.success) {
      throw new ApiError(
        data.error || `HTTP ${response.status}`,
        response.status,
        data.details
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

  async byId(id: string, include: string[] = []) {
    const params = new URLSearchParams();
    if (include.length > 0) {
      params.append('include', include.join(','));
    }
    
    return apiRequest(`/workflows/${id}?${params}`);
  },

  async byHumanId(humanId: string, include: string[] = []) {
    // Use the optimized API endpoint that handles human-readable IDs directly
    return this.byId(humanId, include);
  },

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

  async getN8nStatus(id: string) {
    return apiRequest(`/workflows/${id}/n8n-status`);
  },

  async cancelN8nExecution(id: string) {
    return apiRequest(`/workflows/${id}/cancel-n8n`, {
      method: 'POST',
    });
  },
};

// Task Executions API functions (using the actual endpoint)
export const tasksApi = {
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
  } = {}) {
    // Use workflowId if provided, otherwise fall back to workflow_id
    const workflowId = filters.workflowId || filters.workflow_id;
    
    if (workflowId) {
      const params = new URLSearchParams();
      params.append('workflowId', workflowId);
      
      // Add include parameter if provided
      if (filters.include && filters.include.length > 0) {
        params.append('include', filters.include.join(','));
      }
      
      // Get current session and JWT token
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch(`${API_BASE_URL}/task-executions?${params}`, {
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
    return apiRequest('/task-executions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: {
    status?: 'PENDING' | 'AWAITING_REVIEW' | 'COMPLETED' | 'FAILED';
    output_data?: Record<string, any>;
    completed_at?: string;
    started_at?: string;
    error_message?: string;
    execution_time_ms?: number;
    retry_count?: number;
  }) {
    return apiRequest(`/task-executions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

// Health API
export const healthApi = {
  async check() {
    return apiRequest('/health');
  },
};

// Activities API functions
export const activitiesApi = {
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

    // Get current session and JWT token
    const { data: { session } } = await supabase.auth.getSession();
    
    const headers: Record<string, string> = {};
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const response = await fetch(`${API_BASE_URL}/activities?${params}`, {
      headers
    });
    const data: ApiResponse = await response.json();

    if (!response.ok || !data.success) {
      throw new ApiError(
        data.error || `HTTP ${response.status}`,
        response.status,
        data.details
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

  async create(data: {
    workflow_id?: string;
    activity_type: string;
    title: string;
    description?: string;
    metadata?: Record<string, any>;
    user_id?: string;
    created_by: string;
  }) {
    return apiRequest('/activities', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Agents API functions
export const agentsApi = {
  async list(filters: {
    is_active?: boolean;
    type?: string;
    status?: string;
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

    // Get current session and JWT token
    const { data: { session } } = await supabase.auth.getSession();
    
    const headers: Record<string, string> = {};
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const response = await fetch(`${API_BASE_URL}/agents?${params}`, {
      headers
    });
    const data: ApiResponse = await response.json();

    if (!response.ok || !data.success) {
      throw new ApiError(
        data.error || `HTTP ${response.status}`,
        response.status,
        data.details
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

  async updateStatus(id: string, data: {
    status?: 'ONLINE' | 'BUSY' | 'OFFLINE' | 'ERROR';
    is_active?: boolean;
    metadata?: Record<string, any>;
    last_heartbeat?: string;
  }) {
    return apiRequest(`/agents?id=${id}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Interrupts API functions
export const interruptsApi = {
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

    // Get current session and JWT token
    const { data: { session } } = await supabase.auth.getSession();
    
    const headers: Record<string, string> = {};
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const response = await fetch(`${API_BASE_URL}/interrupts?${params}`, {
      headers
    });
    const data: ApiResponse = await response.json();

    if (!response.ok || !data.success) {
      throw new ApiError(
        data.error || `HTTP ${response.status}`,
        response.status,
        data.details
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

  async byId(id: string) {
    return apiRequest(`/interrupts/${id}`);
  },

  async create(data: {
    workflow_id?: string;
    task_id?: string;
    interrupt_type: string;
    title: string;
    description: string;
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    metadata?: Record<string, any>;
    created_by: string;
  }) {
    return apiRequest('/interrupts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: {
    status?: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED';
    assigned_to?: string;
    resolution?: string;
    metadata?: Record<string, any>;
  }) {
    return apiRequest(`/interrupts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// Incoming email API
export const incomingEmailApi = {
  async process(data: {
    workflow_id?: string;
    from: string;
    to: string;
    subject: string;
    body: string;
    html_body?: string;
    attachments?: Array<{
      filename: string;
      content_type: string;
      size: number;
      content?: string;
    }>;
    headers?: Record<string, string>;
    metadata?: Record<string, any>;
  }) {
    return apiRequest('/incoming-email', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Communications API functions
export const communicationsApi = {
  async list(filters: {
    workflow_id?: string;
    type?: 'email' | 'phone' | 'sms' | 'internal_note';
    direction?: 'INBOUND' | 'OUTBOUND';
    limit?: number;
  } = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value));
      }
    });

    // Get current session and JWT token
    const { data: { session } } = await supabase.auth.getSession();
    
    const headers: Record<string, string> = {};
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const response = await fetch(`${API_BASE_URL}/communications?${params}`, {
      headers
    });
    const data: ApiResponse = await response.json();

    if (!response.ok || !data.success) {
      throw new ApiError(
        data.error || `HTTP ${response.status}`,
        response.status,
        data.details
      );
    }

    return {
      data: data.data || [],
      pagination: {
        page: 1,
        limit: parseInt(String(filters.limit || 50)),
        total: Array.isArray(data.data) ? data.data.length : 0,
        totalPages: 1
      }
    };
  },

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

// Export main API object
export const api = {
  workflows: workflowsApi,
  tasks: tasksApi,
  activities: activitiesApi,
  agents: agentsApi,
  interrupts: interruptsApi,
  incomingEmail: incomingEmailApi,
  communications: communicationsApi,
  health: healthApi,
};

export { ApiError };