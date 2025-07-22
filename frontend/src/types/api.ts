/**
 * Enhanced API types for better type safety
 */

// Base API types
export interface ApiRequestOptions extends RequestInit {
  timeout?: number;
}

export interface PaginatedFilters {
  page?: number;
  limit?: number;
  per_page?: number;
  include?: string[];
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface SearchFilters extends PaginatedFilters {
  q?: string;
  search?: string;
}

// Error handling types
export interface ApiErrorDetails {
  message: string;
  status?: number;
  code?: string;
  details?: Record<string, unknown>;
  field?: string;
}

export interface StandardApiError {
  error: ApiErrorDetails;
  success: false;
}

// Request configuration types
export interface ApiConfiguration {
  baseUrl: string;
  timeout: number;
  retries: number;
  retryDelay: number;
}

// Authentication types
export interface AuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

// Common request types
export interface BulkOperationRequest<T> {
  items: T[];
  options?: {
    continueOnError?: boolean;
    batchSize?: number;
  };
}

export interface BulkOperationResponse<T> {
  successful: T[];
  failed: Array<{
    item: T;
    error: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

// Agent specific types
export interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'ONLINE' | 'BUSY' | 'OFFLINE' | 'ERROR';
  is_active: boolean;
  metadata?: Record<string, unknown>;
  last_heartbeat?: string;
  created_at: string;
  updated_at: string;
  // Dashboard display properties
  current_tasks?: number;
  max_tasks?: number;
  last_activity?: string;
}

export interface AgentListResponse {
  data: Agent[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Workflow specific types for API responses
export interface WorkflowApiResponse {
  data: WorkflowData[] | [];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Task execution types
export interface TaskExecutionApiResponse {
  data: TaskExecution[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Import WorkflowData and TaskExecution from existing types
import type { WorkflowData, TaskExecution } from '@/types/workflow';