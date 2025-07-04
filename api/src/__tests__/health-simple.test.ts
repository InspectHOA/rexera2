/**
 * Simple unit test for Health API endpoint
 */

import { GET } from '../health/route';
import { createMockRequest } from './utils';

// Mock @supabase/supabase-js
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue({
      data: [{ id: 'test-id' }],
      error: null,
    }),
  })),
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

describe('/api/health - Simple Test', () => {
  beforeEach(() => {
    // Set up environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-supabase-url.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Clean up environment variables
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  it('should return healthy status when everything is working', async () => {
    const request = createMockRequest({ method: 'GET' });
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.json).toBeDefined();
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.status).toBe('healthy');
    expect(data.timestamp).toBeDefined();
    expect(data.data.environment.hasSupabaseUrl).toBe(true);
    expect(data.data.environment.hasServiceKey).toBe(true);
  });

  it('should return error when environment variables are missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const request = createMockRequest({ method: 'GET' });
    const response = await GET(request);

    expect(response.status).toBe(500);
    
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.status).toBe('error');
    expect(data.message).toBe('Missing environment variables');
  });

  it('should handle database connection failures', async () => {
    // Mock database error
    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Connection failed' },
      }),
    });

    const request = createMockRequest({ method: 'GET' });
    const response = await GET(request);

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.database.workflows.accessible).toBe(false);
    expect(data.data.database.workflows.error).toBe('Connection failed');
  });
});