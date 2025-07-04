/**
 * Test utilities for API testing
 */

import { NextRequest } from 'next/server';

/**
 * Creates a mock NextRequest for testing
 */
export function createMockRequest(options: {
  method?: string;
  url?: string;
  body?: any;
  headers?: Record<string, string>;
  user?: any;
}): NextRequest {
  const {
    method = 'GET',
    url = 'https://localhost:3000/api/test',
    body,
    headers = {},
    user
  } = options;

  const mockHeaders = new Headers(headers);
  
  const mockRequest = {
    method,
    url,
    headers: mockHeaders,
    json: jest.fn().mockResolvedValue(body || {}),
    text: jest.fn().mockResolvedValue(JSON.stringify(body || {})),
    formData: jest.fn().mockResolvedValue(new FormData()),
    clone: jest.fn().mockReturnThis(),
    nextUrl: new URL(url),
    user, // For authenticated requests
  } as unknown as NextRequest;

  return mockRequest;
}

/**
 * Creates mock user for authenticated requests
 */
export function createMockUser(overrides: Partial<any> = {}) {
  return {
    id: 'test-user-123',
    email: 'test@example.com',
    role: 'admin',
    user_type: 'hil_user',
    company_id: 'test-company-123',
    ...overrides,
  };
}

/**
 * Creates mock workflow data
 */
export function createMockWorkflow(overrides: Partial<any> = {}) {
  return {
    id: 'WF-TEST-001',
    workflow_type: 'MUNI_LIEN_SEARCH',
    title: 'Test Workflow',
    description: 'Test workflow description',
    status: 'PENDING',
    priority: 'NORMAL',
    client_id: 'client-123',
    created_by: 'user-123',
    assigned_to: 'user-456',
    due_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: {},
    ...overrides,
  };
}

/**
 * Creates mock task data
 */
export function createMockTask(overrides: Partial<any> = {}) {
  return {
    id: 'TASK-TEST-001',
    workflow_id: 'WF-TEST-001',
    title: 'Test Task',
    description: 'Test task description',
    status: 'PENDING',
    executor_type: 'AI',
    priority: 'NORMAL',
    assigned_to: null,
    due_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: {},
    ...overrides,
  };
}

/**
 * Mock successful Supabase response
 */
export function mockSupabaseSuccess(data: any, count?: number) {
  return {
    data,
    error: null,
    count: count || (Array.isArray(data) ? data.length : 1),
    status: 200,
    statusText: 'OK',
  };
}

/**
 * Mock Supabase error response
 */
export function mockSupabaseError(message: string, code?: string) {
  return {
    data: null,
    error: {
      message,
      code: code || 'GENERIC_ERROR',
      details: null,
      hint: null,
    },
    count: null,
    status: 400,
    statusText: 'Bad Request',
  };
}

/**
 * Extracts response data from NextResponse mock
 */
export async function extractResponseData(response: any) {
  if (response.json) {
    return await response.json();
  }
  return response;
}

/**
 * Assert response structure matches API standard
 */
export function assertApiResponse(response: any, expectedData?: any) {
  expect(response).toHaveProperty('success');
  if (response.success) {
    expect(response).toHaveProperty('data');
    if (expectedData) {
      expect(response.data).toEqual(expectedData);
    }
  } else {
    expect(response).toHaveProperty('error');
    expect(response.error).toHaveProperty('type');
    expect(response.error).toHaveProperty('message');
  }
}

/**
 * Assert error response structure
 */
export function assertErrorResponse(response: any, expectedType?: string, expectedStatus?: number) {
  expect(response.success).toBe(false);
  expect(response).toHaveProperty('error');
  expect(response.error).toHaveProperty('type');
  expect(response.error).toHaveProperty('message');
  
  if (expectedType) {
    expect(response.error.type).toBe(expectedType);
  }
}

/**
 * Mock context for parameterized routes
 */
export function createMockContext(params: Record<string, string>) {
  return { params };
}