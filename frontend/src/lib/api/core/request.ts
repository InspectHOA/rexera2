/**
 * Core API request utilities for Rexera 2.0 frontend.
 * Provides centralized request handling, auth, and error management.
 */

import type { 
  ApiResponse,
  ApiSuccessResponse,
  ApiErrorResponse
} from '@rexera/shared';
import type { ApiRequestOptions } from '@/types/api';
import { supabase } from '@/lib/supabase/client';
import { SKIP_AUTH } from '@/lib/auth/config';
import { ApiError } from './api-error';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api`;

/**
 * Get authentication token for API requests
 * @returns Promise<string | null> - Auth token or null if not available
 */
export async function getAuthToken(): Promise<string | null> {
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

/**
 * Core API request function with auth, error handling, and type safety
 * @param endpoint - API endpoint path (e.g., '/workflows')
 * @param options - Request options (method, body, headers, etc.)
 * @returns Promise<T> - Typed response data
 */
export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
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
      errorData.error?.details ? { details: errorData.error.details } : undefined
    );
  }

  const successData = data as ApiSuccessResponse<T>;
  return successData.data;
}

/**
 * Get the API base URL
 * @returns string - Base URL for all API requests
 */
export function getApiBaseUrl(): string {
  return API_BASE_URL;
}