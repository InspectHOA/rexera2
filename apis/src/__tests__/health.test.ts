/**
 * Unit tests for Health API endpoint
 */

import { GET } from '../health/route';
import { createMockRequest, extractResponseData, mockSupabaseSuccess, mockSupabaseError } from './utils';

// Mock @supabase/supabase-js
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
  })),
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

describe('/api/health', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-supabase-url.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  describe('GET /api/health', () => {
    it('should return healthy status when everything is working', async () => {
      // Mock successful database queries
      mockSupabaseClient.from.mockImplementation((table: string) => {
        const query = {
          select: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue(mockSupabaseSuccess([{ id: 'test-id' }])),
        };
        return query;
      });

      const request = createMockRequest({ method: 'GET' });
      const response = await GET(request);
      const data = await extractResponseData(response);

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        status: 'healthy',
        timestamp: expect.any(String),
        data: {
          environment: {
            hasSupabaseUrl: true,
            hasServiceKey: true,
          },
          database: {
            workflows: {
              accessible: true,
              count: 1,
              error: null,
            },
            clients: {
              accessible: true,
              count: 1,
              error: null,
            },
          },
        },
      });
    });

    it('should return error when Supabase URL is missing', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      const request = createMockRequest({ method: 'GET' });
      const response = await GET(request);
      const data = await extractResponseData(response);

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        status: 'error',
        message: 'Missing environment variables',
        details: {
          hasUrl: false,
          hasKey: true,
        },
      });
    });

    it('should return error when service key is missing', async () => {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      const request = createMockRequest({ method: 'GET' });
      const response = await GET(request);
      const data = await extractResponseData(response);

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        status: 'error',
        message: 'Missing environment variables',
        details: {
          hasUrl: true,
          hasKey: false,
        },
      });
    });

    it('should handle database connection errors gracefully', async () => {
      // Mock database error for workflows table
      let callCount = 0;
      mockSupabaseClient.from.mockImplementation((table: string) => {
        callCount++;
        const query = {
          select: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue(
            callCount === 1 
              ? mockSupabaseError('Connection failed', 'CONNECTION_ERROR')
              : mockSupabaseSuccess([{ id: 'test-id' }])
          ),
        };
        return query;
      });

      const request = createMockRequest({ method: 'GET' });
      const response = await GET(request);
      const data = await extractResponseData(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.database.workflows).toEqual({
        accessible: false,
        count: 0,
        error: 'Connection failed',
      });
      expect(data.data.database.clients).toEqual({
        accessible: true,
        count: 1,
        error: null,
      });
    });

    it('should handle complete database failure', async () => {
      // Mock both tables to fail
      mockSupabaseClient.from.mockImplementation(() => {
        const query = {
          select: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue(mockSupabaseError('Database unreachable')),
        };
        return query;
      });

      const request = createMockRequest({ method: 'GET' });
      const response = await GET(request);
      const data = await extractResponseData(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.database.workflows.accessible).toBe(false);
      expect(data.data.database.clients.accessible).toBe(false);
    });

    it('should handle unexpected exceptions', async () => {
      // Mock to throw an exception
      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const request = createMockRequest({ method: 'GET' });
      const response = await GET(request);
      const data = await extractResponseData(response);

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        status: 'error',
        message: 'Health check failed',
        error: 'Unexpected error',
      });
    });

    it('should include valid timestamp in response', async () => {
      mockSupabaseClient.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockSupabaseSuccess([])),
      }));

      const request = createMockRequest({ method: 'GET' });
      const response = await GET(request);
      const data = await extractResponseData(response);

      expect(data.timestamp).toBeDefined();
      expect(new Date(data.timestamp).getTime()).not.toBeNaN();
    });
  });
});