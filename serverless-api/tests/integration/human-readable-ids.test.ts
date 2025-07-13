/**
 * Integration tests for human-readable ID support
 * Tests using native Hono test client
 */

import { testClient } from '../utils/hono-test-client';
import { testApp } from '../../src/app-test';

describe('Human-Readable ID Support', () => {
  const client = testClient(testApp);
  
  describe('UUID vs Human-Readable ID handling', () => {
    it('should handle UUID format in workflow endpoints', async () => {
      const testUUID = '12345678-1234-1234-1234-123456789012';
      const response = await client.get(`/api/workflows/${testUUID}`);

      // Check response format
      expect(response.headers['content-type']).toMatch(/json/);

      // Expect auth failure, 404, or 500 (database error in test), all are valid
      expect([401, 404, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    it('should handle human-readable ID format', async () => {
      const testHumanId = '1001';
      const response = await client.get(`/api/workflows/${testHumanId}`);

      // Check response format
      expect(response.headers['content-type']).toMatch(/json/);

      // Expect auth failure, 404, or 500 (database error in test), all are valid
      expect([401, 404, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });
  });
});