/**
 * Unit tests for serverless-appropriate rate limiting middleware
 */

import { Context } from 'hono';
import { rateLimitMiddleware } from '../../src/middleware/security';

describe('Rate Limit Middleware', () => {
  let mockContext: Partial<Context>;
  let mockNext: jest.Mock;
  const originalEnv = process.env;

  beforeEach(() => {
    mockNext = jest.fn();
    mockContext = {
      req: {
        header: jest.fn()
      } as any,
      header: jest.fn()
    } as any;
  });

  afterEach(() => {
    // Restore original environment
    process.env = { ...originalEnv };
    jest.clearAllMocks();
  });

  describe('Serverless Environment Detection', () => {
    it('should detect Vercel environment and skip rate limiting', async () => {
      process.env.VERCEL = '1';
      const middleware = rateLimitMiddleware();
      
      await middleware(mockContext as Context, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockContext.header).toHaveBeenCalledWith('X-RateLimit-Policy', 'serverless-mode');
      expect(mockContext.header).toHaveBeenCalledWith('X-RateLimit-Limit', '100');
      expect(mockContext.header).toHaveBeenCalledWith('X-RateLimit-Remaining', '100');
    });

    it('should detect AWS Lambda environment and skip rate limiting', async () => {
      process.env.AWS_LAMBDA_FUNCTION_NAME = 'test-function';
      const middleware = rateLimitMiddleware();
      
      await middleware(mockContext as Context, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockContext.header).toHaveBeenCalledWith('X-RateLimit-Policy', 'serverless-mode');
    });

    it('should detect Netlify environment and skip rate limiting', async () => {
      process.env.NETLIFY = 'true';
      const middleware = rateLimitMiddleware();
      
      await middleware(mockContext as Context, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockContext.header).toHaveBeenCalledWith('X-RateLimit-Policy', 'serverless-mode');
    });

    it('should detect Cloudflare Workers environment and skip rate limiting', async () => {
      process.env.CLOUDFLARE_WORKERS = 'true';
      const middleware = rateLimitMiddleware();
      
      await middleware(mockContext as Context, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockContext.header).toHaveBeenCalledWith('X-RateLimit-Policy', 'serverless-mode');
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

    it('should use development mode when not in serverless environment', async () => {
      (mockContext.req!.header as jest.Mock).mockReturnValue('Mozilla/5.0');
      const middleware = rateLimitMiddleware();
      
      await middleware(mockContext as Context, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockContext.header).toHaveBeenCalledWith('X-RateLimit-Policy', 'development-mode');
      expect(mockContext.header).toHaveBeenCalledWith('X-RateLimit-Limit', '100');
    });

    it('should block suspicious bot requests', async () => {
      (mockContext.req!.header as jest.Mock).mockReturnValue('Googlebot/2.1');
      const middleware = rateLimitMiddleware();
      
      await expect(middleware(mockContext as Context, mockNext)).rejects.toThrow('Automated requests not allowed');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow Swagger bot requests', async () => {
      (mockContext.req!.header as jest.Mock).mockReturnValue('swagger-ui-bot/1.0');
      const middleware = rateLimitMiddleware();
      
      await middleware(mockContext as Context, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockContext.header).toHaveBeenCalledWith('X-RateLimit-Policy', 'development-mode');
    });

    it('should handle missing user-agent header', async () => {
      (mockContext.req!.header as jest.Mock).mockReturnValue(undefined);
      const middleware = rateLimitMiddleware();
      
      await middleware(mockContext as Context, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockContext.header).toHaveBeenCalledWith('X-RateLimit-Policy', 'development-mode');
    });
  });

  describe('Custom Configuration', () => {
    it('should use custom rate limit configuration', async () => {
      process.env.VERCEL = '1';
      const customConfig = {
        windowMs: 60000,
        maxRequests: 50
      };
      const middleware = rateLimitMiddleware(customConfig);
      
      await middleware(mockContext as Context, mockNext);

      expect(mockContext.header).toHaveBeenCalledWith('X-RateLimit-Limit', '50');
      expect(mockContext.header).toHaveBeenCalledWith('X-RateLimit-Remaining', '50');
    });
  });
});