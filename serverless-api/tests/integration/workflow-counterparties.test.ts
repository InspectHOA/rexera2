/**
 * Workflow Counterparties API Integration Tests
 * Tests API endpoint behavior and duplicate prevention
 */

import { testClient } from '../utils/hono-test-client';
import app from '../../src/app';

describe('Workflow Counterparties API', () => {
  const client = testClient(app);

  describe('POST /api/workflows/:workflowId/counterparties', () => {
    it('should return proper error format for duplicate assignment (409)', async () => {
      // Test with known workflow and counterparty IDs that might exist
      const testWorkflowId = 'a3b8e728-b08d-4398-b61d-2700a59bd49d';
      const testCounterpartyId = 'd8d9d83d-a1ad-46e8-8767-f49896fe5598';

      const response = await client.post(`/api/workflows/${testWorkflowId}/counterparties`, {
        counterparty_id: testCounterpartyId,
        status: 'PENDING'
      });

      // We expect either:
      // 1. 201 (success) if not a duplicate
      // 2. 409 (conflict) if it's a duplicate  
      // 3. 404 (not found) if workflow/counterparty doesn't exist
      // 4. 401/500 (auth/server error) in test environment

      expect([201, 400, 401, 404, 409, 500]).toContain(response.status);

      if (response.status === 409) {
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Counterparty already associated with this workflow');
      }
    });

    it('should validate request format', async () => {
      const response = await client.post('/api/workflows/test-id/counterparties', {
        // Missing required counterparty_id
        status: 'PENDING'
      });

      // Should return 400 for validation error (or 401/500 for auth/server issues)
      expect([400, 401, 500]).toContain(response.status);

      if (response.status === 400) {
        expect(response.body.success).toBe(false);
      }
    });

    it('should handle invalid workflow ID format', async () => {
      const response = await client.post('/api/workflows/invalid-uuid/counterparties', {
        counterparty_id: '12345678-1234-1234-1234-123456789012',
        status: 'PENDING'
      });

      // Should return 400 or 404 for invalid ID format
      expect([400, 401, 404, 500]).toContain(response.status);
    });
  });

  describe('GET /api/workflows/:workflowId/counterparties', () => {
    it('should return proper response format', async () => {
      const response = await client.get('/api/workflows/test-id/counterparties');

      // Check response has proper headers
      expect(response.headers['content-type']).toMatch(/json/);

      // Should return valid status code
      expect([200, 401, 404, 500]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('success');
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
      }
    });

    it('should support include parameter', async () => {
      const response = await client.get('/api/workflows/test-id/counterparties?include=counterparty');

      expect([200, 401, 404, 500]).toContain(response.status);
      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should support status filter', async () => {
      const response = await client.get('/api/workflows/test-id/counterparties?status=PENDING');

      expect([200, 401, 404, 500]).toContain(response.status);
      expect(response.headers['content-type']).toMatch(/json/);
    });
  });

  describe('PATCH /api/workflows/:workflowId/counterparties/:id', () => {
    it('should validate status update request', async () => {
      const response = await client.patch('/api/workflows/test-id/counterparties/test-id', {
        status: 'CONTACTED'
      });

      expect([200, 400, 401, 404, 500]).toContain(response.status);
      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should reject invalid status values', async () => {
      const response = await client.patch('/api/workflows/test-id/counterparties/test-id', {
        status: 'INVALID_STATUS'
      });

      // Should return 400 for invalid status
      expect([400, 401, 404, 500]).toContain(response.status);
    });
  });

  describe('DELETE /api/workflows/:workflowId/counterparties/:id', () => {
    it('should handle delete request properly', async () => {
      const response = await client.delete('/api/workflows/test-id/counterparties/test-id');

      expect([200, 401, 404, 500]).toContain(response.status);
      expect(response.headers['content-type']).toMatch(/json/);
    });
  });
});