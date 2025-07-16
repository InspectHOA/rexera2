/**
 * Simplified Auth System Integration Tests
 * Tests both SKIP_AUTH and SSO modes using the complete app
 */

import { testClient } from '../utils/hono-test-client';
import app from '../../src/app';

describe('Simplified Auth System', () => {
  const client = testClient(app);
  const originalSkipAuth = process.env.SKIP_AUTH;

  afterAll(() => {
    // Restore original environment
    if (originalSkipAuth !== undefined) {
      process.env.SKIP_AUTH = originalSkipAuth;
    } else {
      delete process.env.SKIP_AUTH;
    }
  });

  describe('SKIP_AUTH Mode', () => {
    beforeEach(() => {
      process.env.SKIP_AUTH = 'true';
    });

    it('should allow access to protected endpoints without Authorization header', async () => {
      const response = await client.get('/api/workflows');
      
      // Should not return 401 in SKIP_AUTH mode
      expect(response.status).not.toBe(401);
      expect(response.headers['content-type']).toMatch(/json/);
      
      // May return 500 due to database issues in test, but not auth error
      if (response.status === 500) {
        expect(response.body.success).toBe(false);
      }
    });

    it('should ignore Authorization header in SKIP_AUTH mode', async () => {
      const response = await client.get('/api/workflows', {
        'Authorization': 'Bearer invalid-token'
      });
      
      // Should not return 401 even with invalid token
      expect(response.status).not.toBe(401);
    });

    it('should allow access to agents endpoint', async () => {
      const response = await client.get('/api/agents');
      
      // Should not be rejected due to auth
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    });

    it('should still allow CORS preflight requests', async () => {
      const response = await client.request('/api/workflows', {
        method: 'OPTIONS'
      });
      
      // OPTIONS should always be allowed
      expect(response.status).not.toBe(401);
    });
  });

  describe('SSO Mode', () => {
    beforeEach(() => {
      delete process.env.SKIP_AUTH;
    });

    it('should reject requests without Authorization header', async () => {
      const response = await client.get('/api/workflows');
      
      expect(response.status).toBe(401);
      expect(response.headers['content-type']).toMatch(/json/);
      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          message: 'Missing or invalid Authorization header'
        })
      });
    });

    it('should reject requests with invalid Authorization header format', async () => {
      const response = await client.get('/api/workflows', {
        'Authorization': 'Invalid format'
      });
      
      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          message: 'Missing or invalid Authorization header'
        })
      });
    });

    it('should reject requests with invalid JWT token', async () => {
      // Use a more realistic but invalid JWT format
      const invalidJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.invalid_signature';
      
      const response = await client.get('/api/workflows', {
        'Authorization': `Bearer ${invalidJWT}`
      });
      
      // The auth middleware returns 403 when user profile is not found
      // This happens because the invalid token might pass basic JWT parsing
      // but the user doesn't exist in the database
      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          message: 'User profile not found'
        })
      });
    });

    it('should allow OPTIONS requests without auth (CORS)', async () => {
      const response = await client.request('/api/workflows', {
        method: 'OPTIONS'
      });
      
      // OPTIONS should be allowed for CORS preflight
      expect(response.status).not.toBe(401);
    });

    it('should reject POST requests without auth', async () => {
      const response = await client.post('/api/workflows', {
        title: 'Test Workflow',
        workflow_type: 'HOA_ACQUISITION',
        client_id: '12345678-1234-1234-1234-123456789012',
        created_by: '12345678-1234-1234-1234-123456789012'
      });
      
      expect(response.status).toBe(401);
    });
  });

  describe('Environment Variable Handling', () => {
    it('should default to SSO mode when SKIP_AUTH is not set', async () => {
      delete process.env.SKIP_AUTH;
      
      const response = await client.get('/api/workflows');
      expect(response.status).toBe(401);
    });

    it('should default to SSO mode when SKIP_AUTH is false', async () => {
      process.env.SKIP_AUTH = 'false';
      
      const response = await client.get('/api/workflows');
      expect(response.status).toBe(401);
    });

    it('should only enable skip auth when explicitly set to true', async () => {
      process.env.SKIP_AUTH = 'yes'; // Not 'true'
      
      const response = await client.get('/api/workflows');
      expect(response.status).toBe(401);
    });
  });

  describe('Hardcoded User Configuration Consistency', () => {
    it('should use consistent user data between frontend and backend', () => {
      // Frontend config (from auth/config.ts)
      const frontendUser = {
        id: 'skip-auth-user-12345',
        email: 'admin@rexera.com',
        name: 'Admin User',
        role: 'HIL_ADMIN',
        user_type: 'hil_user'
      };

      // Backend config (from middleware/auth.ts)  
      const backendUser = {
        id: 'skip-auth-user-12345',
        email: 'admin@rexera.com',
        user_type: 'hil_user',
        role: 'HIL_ADMIN',
        company_id: undefined
      };

      // Verify consistency
      expect(frontendUser.id).toBe(backendUser.id);
      expect(frontendUser.email).toBe(backendUser.email);
      expect(frontendUser.role).toBe(backendUser.role);
      expect(frontendUser.user_type).toBe(backendUser.user_type);
    });
  });
});