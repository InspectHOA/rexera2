/**
 * Unit tests for request validation middleware
 */

import { Context } from 'hono';
import { requestValidationMiddleware } from '../../src/middleware/security';

describe('Request Validation Middleware', () => {
  let mockNext: jest.Mock;
  const originalEnv = process.env;

  const createMockContext = (method: string, contentLength?: string) => {
    return {
      req: {
        method,
        header: jest.fn().mockImplementation((name: string) => {
          if (name === 'content-length') return contentLength;
          return undefined;
        })
      }
    } as any;
  };

  beforeEach(() => {
    mockNext = jest.fn();
  });

  afterEach(() => {
    // Restore original environment
    process.env = { ...originalEnv };
    jest.clearAllMocks();
  });

  describe('Serverless Environment', () => {
    it('should skip validation in Vercel environment', async () => {
      process.env.VERCEL = '1';
      const context = createMockContext('POST', '1024');
      const middleware = requestValidationMiddleware;
      
      await middleware(context as Context, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should skip validation in AWS Lambda environment', async () => {
      process.env.AWS_LAMBDA_FUNCTION_NAME = 'test-function';
      const context = createMockContext('POST', '1024');
      const middleware = requestValidationMiddleware;
      
      await middleware(context as Context, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should skip validation in Netlify environment', async () => {
      process.env.NETLIFY = 'true';
      const context = createMockContext('POST', '1024');
      const middleware = requestValidationMiddleware;
      
      await middleware(context as Context, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should skip validation in Cloudflare Workers environment', async () => {
      process.env.CLOUDFLARE_WORKERS = 'true';
      const context = createMockContext('POST', '1024');
      const middleware = requestValidationMiddleware;
      
      await middleware(context as Context, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Development Environment', () => {
    beforeEach(() => {
      // Clear serverless environment variables
      delete process.env.VERCEL;
      delete process.env.AWS_LAMBDA_FUNCTION_NAME;
      delete process.env.NETLIFY;
      delete process.env.CLOUDFLARE_WORKERS;
    });

    it('should allow GET requests without validation', async () => {
      const context = createMockContext('GET');
      const middleware = requestValidationMiddleware;
      
      await middleware(context as Context, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow POST requests with acceptable content length', async () => {
      const context = createMockContext('POST', '1024'); // 1KB
      const middleware = requestValidationMiddleware;
      
      await middleware(context as Context, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject POST requests with content length exceeding 10MB', async () => {
      // Test exactly 10MB (should pass)
      const context10MB = createMockContext('POST', '10485760');
      const middleware = requestValidationMiddleware;
      
      await middleware(context10MB as Context, mockNext);
      expect(mockNext).toHaveBeenCalled();
      
      mockNext.mockClear();
      
      // Test just over the limit (should fail)
      const contextOverLimit = createMockContext('POST', '10485761'); // 10MB + 1 byte
      
      await expect(middleware(contextOverLimit as Context, mockNext)).rejects.toThrow('Request entity too large');
    });

    it('should allow POST requests without content-length header', async () => {
      const context = createMockContext('POST'); // No content-length
      const middleware = requestValidationMiddleware;
      
      await middleware(context as Context, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should validate PUT and PATCH requests similarly to POST', async () => {
      const middleware = requestValidationMiddleware;
      
      // Test PUT
      const putContext = createMockContext('PUT', '1024');
      await middleware(putContext as Context, mockNext);
      expect(mockNext).toHaveBeenCalled();
      
      mockNext.mockClear();
      
      // Test PATCH
      const patchContext = createMockContext('PATCH', '1024');
      await middleware(patchContext as Context, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });
});