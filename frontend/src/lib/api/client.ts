/**
 * REST API client for Rexera 2.0 frontend.
 * Replaces tRPC with standard HTTP REST calls.
 */

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
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
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

    const response = await fetch(`${API_BASE_URL}/workflows?${params}`);
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

  async create(data: {
    workflow_type: 'MUNI_LIEN_SEARCH' | 'HOA_ACQUISITION' | 'PAYOFF';
    client_id: string;
    title: string;
    description?: string;
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
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

// Tasks API functions
export const tasksApi = {
  async list(filters: {
    workflow_id?: string;
    status?: string;
    executor_type?: string;
    assigned_to?: string;
    priority?: string;
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

    const response = await fetch(`${API_BASE_URL}/tasks?${params}`);
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
    workflow_id: string;
    title: string;
    description?: string;
    executor_type: 'AI' | 'HIL';
    assigned_to?: string;
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    metadata?: Record<string, any>;
    due_date?: string;
  }) {
    return apiRequest('/tasks', {
      method: 'POST',
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

    const response = await fetch(`${API_BASE_URL}/activities?${params}`);
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

    const response = await fetch(`${API_BASE_URL}/agents?${params}`);
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

    const response = await fetch(`${API_BASE_URL}/interrupts?${params}`);
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

// Export main API object
export const api = {
  workflows: workflowsApi,
  tasks: tasksApi,
  activities: activitiesApi,
  agents: agentsApi,
  interrupts: interruptsApi,
  incomingEmail: incomingEmailApi,
  health: healthApi,
};

export { ApiError };