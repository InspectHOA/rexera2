/**
 * REST API client for Rexera 2.0 frontend.
 * Provides type-safe HTTP REST calls to the backend API.
 */

import type { 
  WorkflowType, 
  PriorityLevel,
  ApiResponse,
  ApiSuccessResponse,
  ApiErrorResponse,
  PaginationMeta,
  Document,
  CreateDocument,
  UpdateDocument,
  DocumentFilters,
  CreateDocumentVersion,
  DocumentWithRelations
} from '@rexera/shared';
import { 
  ApiError as SharedApiError,
  API_ERROR_CODES
} from '@rexera/shared';
import { supabase } from '@/lib/supabase/client';
import { SKIP_AUTH } from '@/lib/auth/config';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api`;

console.log('🔍 API_BASE_URL configured as:', API_BASE_URL);

// Use shared ApiError class
class ApiError extends SharedApiError {
  constructor(
    message: string,
    status: number,
    details?: any
  ) {
    super(message, status, API_ERROR_CODES.INTERNAL_ERROR, details);
    this.name = 'ApiError';
  }
}

// Simplified auth token getter
async function getAuthToken(): Promise<string | null> {
  if (SKIP_AUTH) {
    return 'skip-auth-token'; // Special token for skip_auth mode
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    console.warn('Failed to get auth token:', error);
    return null;
  }
}

async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get auth token from centralized function
  const authToken = await getAuthToken();
  
  // Build headers with authentication
  const headers: Record<string, string> = { 
    ...(options.headers as Record<string, string> || {}) 
  };
  
  // Add Authorization header if token available
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
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
    const errorData = data as ApiErrorResponse;
    throw new ApiError(
      errorData.error?.message || `HTTP ${response.status}`,
      response.status,
      errorData.error?.details
    );
  }

  const successData = data as ApiSuccessResponse<T>;
  return successData.data;
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

    // We need the full response including pagination, so we'll handle the request manually
    const authToken = await getAuthToken();
    const headers: Record<string, string> = {};
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/workflows?${params}`, {
      headers
    });
    
    const data: ApiResponse = await response.json();
    
    if (!response.ok || !data.success) {
      const errorData = data as ApiErrorResponse;
      throw new ApiError(
        errorData.error?.message || `HTTP ${response.status}`,
        response.status,
        errorData.error?.details
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
    
    const url = `/workflows/${id}?${params}`;
    return apiRequest(url);
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
      
      const response = await fetch(`${API_BASE_URL}/taskExecutions?${params}`, {
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
    return apiRequest('/taskExecutions', {
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
    return apiRequest(`/taskExecutions/${id}`, {
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

    return apiRequest(`/activities?${params}`);
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

    return apiRequest(`/agents?${params}`);
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

    return apiRequest(`/interrupts?${params}`);
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
    
    const response = await fetch(`${API_BASE_URL}/communications?${params}`, {
      headers
    });
    
    const data: ApiResponse = await response.json();
    
    if (!response.ok || !data.success) {
      const errorData = data as ApiErrorResponse;
      throw new ApiError(
        errorData.error?.message || `HTTP ${response.status}`,
        response.status,
        errorData.error?.details
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

// Documents API functions
export const documentsApi = {
  async list(filters: Partial<DocumentFilters> = {}) {
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
    
    const response = await fetch(`${API_BASE_URL}/documents?${params}`, {
      headers
    });
    
    const data: ApiResponse = await response.json();
    
    if (!response.ok || !data.success) {
      const errorData = data as ApiErrorResponse;
      throw new ApiError(
        errorData.error?.message || `HTTP ${response.status}`,
        response.status,
        errorData.error?.details
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

  async byId(id: string, include: string[] = []): Promise<DocumentWithRelations> {
    const params = new URLSearchParams();
    if (include.length > 0) {
      params.append('include', include.join(','));
    }
    
    const url = `/documents/${id}?${params}`;
    return apiRequest<DocumentWithRelations>(url);
  },

  async byWorkflow(workflowId: string, filters: {
    document_type?: 'WORKING' | 'DELIVERABLE';
    tags?: string;
    status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
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

    const authToken = await getAuthToken();
    const headers: Record<string, string> = {};
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/documents/by-workflow/${workflowId}?${params}`, {
      headers
    });
    
    const data: ApiResponse = await response.json();
    
    if (!response.ok || !data.success) {
      const errorData = data as ApiErrorResponse;
      throw new ApiError(
        errorData.error?.message || `HTTP ${response.status}`,
        response.status,
        errorData.error?.details
      );
    }

    return {
      data: data.data || [],
      workflow: (data as any).workflow
    };
  },

  async create(data: CreateDocument): Promise<Document> {
    return apiRequest<Document>('/documents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: UpdateDocument): Promise<Document> {
    return apiRequest<Document>(`/documents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<{ message: string }> {
    return apiRequest(`/documents/${id}`, {
      method: 'DELETE',
    });
  },

  async createVersion(id: string, data: CreateDocumentVersion): Promise<Document> {
    return apiRequest<Document>(`/documents/${id}/versions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async upload(file: File, workflowId: string, documentType: 'WORKING' | 'DELIVERABLE' = 'WORKING'): Promise<{
    document: Document;
    uploadUrl: string;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('workflow_id', workflowId);
    formData.append('document_type', documentType);

    const authToken = await getAuthToken();
    const headers: Record<string, string> = {};
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_BASE_URL}/documents/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data: ApiResponse = await response.json();
    
    if (!response.ok || !data.success) {
      const errorData = data as ApiErrorResponse;
      throw new ApiError(
        errorData.error?.message || `HTTP ${response.status}`,
        response.status,
        errorData.error?.details
      );
    }

    return data.data as { document: Document; uploadUrl: string };
  },
};

// Tags API functions
export const tagsApi = {
  async list(): Promise<string[]> {
    return apiRequest<string[]>('/tags');
  },

  async search(query: string): Promise<string[]> {
    const params = new URLSearchParams({ q: query });
    const result = await apiRequest<string[]>(`/tags/search?${params}`);
    return result;
  },
};

// Clients API functions
export const clientsApi = {
  async list(): Promise<{ id: string; name: string; domain?: string }[]> {
    return apiRequest('/clients');
  },

  async byId(id: string): Promise<{ id: string; name: string; domain?: string }> {
    return apiRequest(`/clients/${id}`);
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
  documents: documentsApi,
  tags: tagsApi,
  clients: clientsApi,
  health: healthApi,
};

export { ApiError };