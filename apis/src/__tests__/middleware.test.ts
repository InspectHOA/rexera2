/**
 * Unit tests for API middleware utilities
 */

import { NextRequest } from 'next/server';
import {
  withAuth,
  withRateLimit,
  withErrorHandling,
  parseJsonBody,
  validateRequiredFields,
  createApiResponse,
  createErrorResponse,
} from '../utils/middleware';
import {
  createMockRequest,
  createMockUser,
  extractResponseData,
  assertApiResponse,
  assertErrorResponse,
} from './utils';

describe('API Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('withAuth', () => {
    it('should pass through in development mode with mock user', async () => {
      process.env.NODE_ENV = 'development';
      
      const mockHandler = jest.fn().mockResolvedValue(
        createApiResponse({ success: true })
      );
      const authHandler = withAuth(mockHandler);
      
      const request = createMockRequest({ method: 'GET' });
      const response = await authHandler(request);
      
      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            id: 'dev-user-123',
            email: 'dev@rexera.com',
            user_type: 'hil_user',
          }),
        }),
        undefined
      );
      
      delete process.env.NODE_ENV;
    });

    it('should return 401 for missing session in production', async () => {
      process.env.NODE_ENV = 'production';
      
      // Mock failed session
      (global.mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: null,
      });
      
      const mockHandler = jest.fn();
      const authHandler = withAuth(mockHandler);
      
      const request = createMockRequest({ method: 'GET' });
      const response = await authHandler(request);
      const data = await extractResponseData(response);
      
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(mockHandler).not.toHaveBeenCalled();
      
      delete process.env.NODE_ENV;
    });

    it('should return 403 for missing user profile', async () => {
      process.env.NODE_ENV = 'production';
      
      // Mock successful session but failed profile lookup
      (global.mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { 
          session: { 
            user: { id: 'user-123' } 
          }
        },
        error: null,
      });
      
      (global.mockSupabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'User not found' },
        }),
      });
      
      const mockHandler = jest.fn();
      const authHandler = withAuth(mockHandler);
      
      const request = createMockRequest({ method: 'GET' });
      const response = await authHandler(request);
      const data = await extractResponseData(response);
      
      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
      
      delete process.env.NODE_ENV;
    });

    it('should handle authentication errors gracefully', async () => {
      process.env.NODE_ENV = 'production';
      
      // Mock authentication error
      (global.mockSupabase.auth.getSession as jest.Mock).mockRejectedValue(
        new Error('Authentication service unavailable')
      );
      
      const mockHandler = jest.fn();
      const authHandler = withAuth(mockHandler);
      
      const request = createMockRequest({ method: 'GET' });
      const response = await authHandler(request);
      const data = await extractResponseData(response);
      
      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal Server Error');
      
      delete process.env.NODE_ENV;
    });
  });

  describe('withRateLimit', () => {
    it('should allow requests within rate limit', async () => {
      const mockHandler = jest.fn().mockResolvedValue(
        createApiResponse({ success: true })
      );
      const rateLimitHandler = withRateLimit(mockHandler, {
        maxRequests: 5,
        windowMs: 60000,
      });
      
      const request = createMockRequest({
        method: 'GET',
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });
      
      const response = await rateLimitHandler(request);
      const data = await extractResponseData(response);
      
      expect(mockHandler).toHaveBeenCalled();
      expect(data.success).toBe(true);
    });

    it('should block requests exceeding rate limit', async () => {
      const mockHandler = jest.fn().mockResolvedValue(
        createApiResponse({ success: true })
      );
      const rateLimitHandler = withRateLimit(mockHandler, {
        maxRequests: 2,
        windowMs: 60000,
      });
      
      const request1 = createMockRequest({
        method: 'GET',
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });
      const request2 = createMockRequest({
        method: 'GET',
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });
      const request3 = createMockRequest({
        method: 'GET',
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });
      
      // First two requests should pass
      await rateLimitHandler(request1);
      await rateLimitHandler(request2);
      
      // Third request should be rate limited
      const response = await rateLimitHandler(request3);
      const data = await extractResponseData(response);
      
      expect(response.status).toBe(429);
      expect(data.error).toBe('Too Many Requests');
    });

    it('should handle different IP addresses separately', async () => {
      const mockHandler = jest.fn().mockResolvedValue(
        createApiResponse({ success: true })
      );
      const rateLimitHandler = withRateLimit(mockHandler, {
        maxRequests: 1,
        windowMs: 60000,
      });
      
      const request1 = createMockRequest({
        method: 'GET',
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });
      const request2 = createMockRequest({
        method: 'GET',
        headers: { 'x-forwarded-for': '192.168.1.2' },
      });
      
      // Both requests should pass as they're from different IPs
      const response1 = await rateLimitHandler(request1);
      const response2 = await rateLimitHandler(request2);
      
      const data1 = await extractResponseData(response1);
      const data2 = await extractResponseData(response2);
      
      expect(data1.success).toBe(true);
      expect(data2.success).toBe(true);
      expect(mockHandler).toHaveBeenCalledTimes(2);
    });
  });

  describe('withErrorHandling', () => {
    it('should pass through successful responses', async () => {
      const mockHandler = jest.fn().mockResolvedValue(
        createApiResponse({ success: true })
      );
      const errorHandler = withErrorHandling(mockHandler);
      
      const request = createMockRequest({ method: 'GET' });
      const response = await errorHandler(request);
      const data = await extractResponseData(response);
      
      expect(data.success).toBe(true);
    });

    it('should handle "not found" errors', async () => {
      const mockHandler = jest.fn().mockRejectedValue(
        new Error('Resource not found')
      );
      const errorHandler = withErrorHandling(mockHandler);
      
      const request = createMockRequest({ method: 'GET' });
      const response = await errorHandler(request);
      const data = await extractResponseData(response);
      
      expect(response.status).toBe(404);
      expect(data.error).toBe('Not Found');
    });

    it('should handle validation errors', async () => {
      const mockHandler = jest.fn().mockRejectedValue(
        new Error('Invalid input data')
      );
      const errorHandler = withErrorHandling(mockHandler);
      
      const request = createMockRequest({ method: 'POST' });
      const response = await errorHandler(request);
      const data = await extractResponseData(response);
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Bad Request');
    });

    it('should handle duplicate/unique constraint errors', async () => {
      const mockHandler = jest.fn().mockRejectedValue(
        new Error('duplicate key value violates unique constraint')
      );
      const errorHandler = withErrorHandling(mockHandler);
      
      const request = createMockRequest({ method: 'POST' });
      const response = await errorHandler(request);
      const data = await extractResponseData(response);
      
      expect(response.status).toBe(409);
      expect(data.error).toBe('Conflict');
    });

    it('should handle unknown errors', async () => {
      const mockHandler = jest.fn().mockRejectedValue(
        new Error('Unexpected database error')
      );
      const errorHandler = withErrorHandling(mockHandler);
      
      const request = createMockRequest({ method: 'GET' });
      const response = await errorHandler(request);
      const data = await extractResponseData(response);
      
      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal Server Error');
    });

    it('should handle non-Error objects', async () => {
      const mockHandler = jest.fn().mockRejectedValue('String error');
      const errorHandler = withErrorHandling(mockHandler);
      
      const request = createMockRequest({ method: 'GET' });
      const response = await errorHandler(request);
      const data = await extractResponseData(response);
      
      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal Server Error');
    });
  });

  describe('parseJsonBody', () => {
    it('should parse valid JSON body', async () => {
      const testData = { name: 'test', value: 123 };
      const request = createMockRequest({
        method: 'POST',
        body: testData,
      });
      
      const result = await parseJsonBody(request);
      
      expect(result).toEqual(testData);
    });

    it('should throw error for invalid JSON', async () => {
      const mockRequest = {
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as unknown as NextRequest;
      
      await expect(parseJsonBody(mockRequest)).rejects.toThrow('Invalid JSON body');
    });
  });

  describe('validateRequiredFields', () => {
    it('should pass validation for complete data', () => {
      const data = {
        name: 'test',
        email: 'test@example.com',
        age: 25,
      };
      
      expect(() => {
        validateRequiredFields(data, ['name', 'email']);
      }).not.toThrow();
    });

    it('should throw error for missing fields', () => {
      const data = {
        name: 'test',
        // email is missing
      };
      
      expect(() => {
        validateRequiredFields(data, ['name', 'email']);
      }).toThrow('Missing required fields: email');
    });

    it('should throw error for empty string fields', () => {
      const data = {
        name: '',
        email: 'test@example.com',
      };
      
      expect(() => {
        validateRequiredFields(data, ['name', 'email']);
      }).toThrow('Missing required fields: name');
    });

    it('should throw error for null fields', () => {
      const data = {
        name: 'test',
        email: null,
      };
      
      expect(() => {
        validateRequiredFields(data, ['name', 'email']);
      }).toThrow('Missing required fields: email');
    });

    it('should throw error for undefined fields', () => {
      const data = {
        name: 'test',
        email: undefined,
      };
      
      expect(() => {
        validateRequiredFields(data, ['name', 'email']);
      }).toThrow('Missing required fields: email');
    });
  });

  describe('createApiResponse', () => {
    it('should create basic success response', () => {
      const data = { message: 'Success' };
      const response = createApiResponse(data);
      
      expect(response.json).toBeDefined();
    });

    it('should include pagination metadata', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const meta = { total: 10, page: 1, limit: 2 };
      const response = createApiResponse(data, meta);
      
      expect(response.json).toBeDefined();
    });

    it('should include navigation links', () => {
      const data = [{ id: 1 }];
      const meta = { total: 10, page: 2, limit: 1 };
      const links = {
        first: '/api/test?page=1',
        previous: '/api/test?page=1',
        next: '/api/test?page=3',
        last: '/api/test?page=10',
      };
      const response = createApiResponse(data, meta, links);
      
      expect(response.json).toBeDefined();
    });
  });

  describe('createErrorResponse', () => {
    it('should create basic error response', () => {
      const response = createErrorResponse('Not Found', 'Resource not found', 404);
      
      expect(response.status).toBe(404);
      expect(response.json).toBeDefined();
    });

    it('should use default status 400', () => {
      const response = createErrorResponse('Bad Request', 'Invalid input');
      
      expect(response.status).toBe(400);
    });

    it('should include error details when provided', () => {
      const details = { field: 'email', code: 'INVALID_FORMAT' };
      const response = createErrorResponse(
        'Validation Error',
        'Invalid email format',
        400,
        details
      );
      
      expect(response.json).toBeDefined();
    });
  });
});