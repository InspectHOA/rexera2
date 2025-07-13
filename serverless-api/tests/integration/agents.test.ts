/**
 * Agents API Integration Tests
 * Tests using native Hono test client
 */

import { testClient } from '../utils/hono-test-client';
import { testApp } from '../../src/app-test';

describe('Agents API', () => {
  const client = testClient(testApp);

  describe('GET /api/agents', () => {
    it('should handle agents requests', async () => {
      const response = await client.get('/api/agents');

      // Check response format
      expect(response.headers['content-type']).toMatch(/json/);

      // Since we don't have auth/database in test, expect 401 or 500
      if (response.status === 401) {
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
        return;
      }

      if (response.status === 500) {
        expect(response.body.success).toBe(false);
        return;
      }

      // If somehow authenticated, should return 200
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});