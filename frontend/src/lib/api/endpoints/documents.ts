/**
 * Documents API endpoints for Rexera 2.0 frontend.
 * Handles document management, file uploads, and content operations.
 */

import type { 
  Document,
  CreateDocument,
  UpdateDocument,
  DocumentFilters,
  CreateDocumentVersion,
  DocumentWithRelations
} from '@rexera/shared';
import { apiRequest, getAuthToken, getApiBaseUrl } from '../core/request';
import { ApiError } from '../core/api-error';
import type { ApiResponse, ApiErrorResponse } from '../core/types';

// Documents API functions
export const documentsApi = {
  /**
   * List documents with filtering and pagination
   */
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
    
    const response = await fetch(`${getApiBaseUrl()}/documents?${params}`, {
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
   * Get document by ID with optional relations
   */
  async byId(id: string, include: string[] = []): Promise<DocumentWithRelations> {
    const params = new URLSearchParams();
    if (include.length > 0) {
      params.append('include', include.join(','));
    }
    
    const url = `/documents/${id}?${params}`;
    return apiRequest<DocumentWithRelations>(url);
  },

  /**
   * Get documents by workflow ID with filtering
   */
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
    
    const response = await fetch(`${getApiBaseUrl()}/documents/by-workflow/${workflowId}?${params}`, {
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
      workflow: (data as any).workflow
    };
  },

  /**
   * Create a new document
   */
  async create(data: CreateDocument): Promise<Document> {
    return apiRequest<Document>('/documents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update document metadata
   */
  async update(id: string, data: UpdateDocument): Promise<Document> {
    return apiRequest<Document>(`/documents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete a document
   */
  async delete(id: string): Promise<{ message: string }> {
    return apiRequest(`/documents/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Create a new version of a document
   */
  async createVersion(id: string, data: CreateDocumentVersion): Promise<Document> {
    return apiRequest<Document>(`/documents/${id}/versions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Create a new version of a document with file upload
   */
  async createVersionWithFile(id: string, file: File, changeSummary: string, metadata?: object): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('change_summary', changeSummary);
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    const authToken = await getAuthToken();
    const headers: Record<string, string> = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${getApiBaseUrl()}/documents/${id}/versions`, {
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
        errorData.error?.details ? { details: errorData.error.details } : {}
      );
    }

    return data.data as Document;
  },

  /**
   * Upload a file and create document record
   */
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

    const response = await fetch(`${getApiBaseUrl()}/documents/upload`, {
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
        errorData.error?.details ? { details: errorData.error.details } : {}
      );
    }

    return data.data as { document: Document; uploadUrl: string };
  },
};

// Tags API functions
export const tagsApi = {
  /**
   * List all available tags
   */
  async list(): Promise<string[]> {
    return apiRequest<string[]>('/tags');
  },

  /**
   * Search tags by query
   */
  async search(query: string): Promise<string[]> {
    const params = new URLSearchParams({ q: query });
    const result = await apiRequest<string[]>(`/tags/search?${params}`);
    return result;
  },
};