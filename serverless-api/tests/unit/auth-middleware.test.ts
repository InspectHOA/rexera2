/**
 * Unit tests for simplified auth middleware
 */

import { Context } from 'hono';
import { authMiddleware } from '../../src/middleware/auth';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn()
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    }))
  }))
}));

describe('Auth Middleware', () => {
  let mockContext: Partial<Context>;
  let mockNext: jest.Mock;
  const originalSkipAuth = process.env.SKIP_AUTH;

  beforeEach(() => {
    mockNext = jest.fn();
    mockContext = {
      req: {
        method: 'GET',
        header: jest.fn()
      } as any,
      set: jest.fn(),
      json: jest.fn()
    } as any;
  });

  afterEach(() => {
    // Restore original environment
    if (originalSkipAuth !== undefined) {
      process.env.SKIP_AUTH = originalSkipAuth;
    } else {
      delete process.env.SKIP_AUTH;
    }
    jest.clearAllMocks();
  });

  describe('SKIP_AUTH Mode', () => {
    beforeEach(() => {
      process.env.SKIP_AUTH = 'true';
    });

    it('should set hardcoded user and call next', async () => {
      await authMiddleware(mockContext as Context, mockNext);

      expect(mockContext.set).toHaveBeenCalledWith('user', {
        id: '284219ff-3a1f-4e86-9ea4-3536f940451f',
        email: 'admin@rexera.com',
        user_type: 'hil_user',
        role: 'HIL_ADMIN',
        company_id: undefined
      });

      expect(mockNext).toHaveBeenCalled();
      expect(mockContext.json).not.toHaveBeenCalled();
    });

    it('should ignore Authorization header in SKIP_AUTH mode', async () => {
      (mockContext.req!.header as jest.Mock).mockReturnValue('Bearer some-token');

      await authMiddleware(mockContext as Context, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockContext.json).not.toHaveBeenCalled();
    });
  });

  describe('SSO Mode', () => {
    beforeEach(() => {
      delete process.env.SKIP_AUTH;
    });

    it('should return 401 when no Authorization header', async () => {
      (mockContext.req!.header as jest.Mock).mockReturnValue(null);

      await authMiddleware(mockContext as Context, mockNext);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Missing or invalid Authorization header'
          })
        }),
        401
      );

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when Authorization header format is invalid', async () => {
      (mockContext.req!.header as jest.Mock).mockReturnValue('Invalid format');

      await authMiddleware(mockContext as Context, mockNext);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Missing or invalid Authorization header'
          })
        }),
        401
      );

      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('OPTIONS Request Handling', () => {
    it('should allow OPTIONS requests without auth in SKIP_AUTH mode', async () => {
      process.env.SKIP_AUTH = 'true';
      (mockContext as any).req.method = 'OPTIONS';

      await authMiddleware(mockContext as Context, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockContext.set).not.toHaveBeenCalled(); // Should not set user for OPTIONS
    });

    it('should allow OPTIONS requests without auth in SSO mode', async () => {
      delete process.env.SKIP_AUTH;
      (mockContext as any).req.method = 'OPTIONS';

      await authMiddleware(mockContext as Context, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockContext.json).not.toHaveBeenCalled();
    });
  });

  describe('Environment Variable Handling', () => {
    it('should use SSO mode when SKIP_AUTH is undefined', async () => {
      delete process.env.SKIP_AUTH;
      (mockContext.req!.header as jest.Mock).mockReturnValue(null);

      await authMiddleware(mockContext as Context, mockNext);

      // Should require auth (return 401)
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false }),
        401
      );
    });

    it('should use SSO mode when SKIP_AUTH is false', async () => {
      process.env.SKIP_AUTH = 'false';
      (mockContext.req!.header as jest.Mock).mockReturnValue(null);

      await authMiddleware(mockContext as Context, mockNext);

      // Should require auth (return 401)
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false }),
        401
      );
    });

    it('should only enable skip auth when explicitly set to true', async () => {
      process.env.SKIP_AUTH = 'yes'; // Not 'true'
      (mockContext.req!.header as jest.Mock).mockReturnValue(null);

      await authMiddleware(mockContext as Context, mockNext);

      // Should require auth (return 401)
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false }),
        401
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      delete process.env.SKIP_AUTH;
      (mockContext.req!.header as jest.Mock).mockImplementation(() => {
        throw new Error('Mock error');
      });

      await authMiddleware(mockContext as Context, mockNext);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Internal authentication error'
          })
        }),
        500
      );
    });
  });
});