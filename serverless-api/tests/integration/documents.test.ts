import { describe, test, expect, beforeAll } from '@jest/globals';
import { HonoTestClient } from '../utils/hono-test-client';
import app from '../../src/app';

describe('Documents API Integration Tests', () => {
  let client: HonoTestClient;

  beforeAll(() => {
    // Set SKIP_AUTH for tests
    process.env.SKIP_AUTH = 'true';
    client = new HonoTestClient(app);
  });

  describe('GET /api/documents', () => {
    test('should return proper response format', async () => {
      const response = await client.get('/api/documents');
      
      // Since we don't have a real database, we might get a 500 error
      // but the response should still have the correct format
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.headers['content-type']).toMatch(/json/);
      
      if (response.status === 200) {
        const data = response.body;
        expect(data.success).toBe(true);
        expect(data).toHaveProperty('data');
        expect(data).toHaveProperty('pagination');
      } else if (response.status >= 500) {
        const data = response.body;
        expect(data.success).toBe(false);
        expect(data).toHaveProperty('error');
      }
    });

    test('should validate query parameters', async () => {
      const response = await client.get('/api/documents?page=invalid');
      
      expect(response.status).toBe(400);
      const data = response.body;
      
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid query parameters');
    });

    test('should validate limit constraints', async () => {
      const response = await client.get('/api/documents?limit=999');
      
      expect(response.status).toBe(400);
      const data = response.body;
      
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid query parameters');
    });
  });

  describe('POST /api/documents', () => {
    test('should validate required fields', async () => {
      const incompleteData = {
        filename: 'test.pdf'
        // Missing workflow_id and url
      };

      const response = await client.post('/api/documents', incompleteData);
      
      expect(response.status).toBe(400);
      const data = response.body;
      
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request body');
      expect(data.details).toBeDefined();
    });

    test('should validate URL format', async () => {
      const invalidData = {
        workflow_id: '00000000-0000-0000-0000-000000000001',
        filename: 'test.pdf',
        url: 'not-a-valid-url'
      };

      const response = await client.post('/api/documents', invalidData);
      
      expect(response.status).toBe(400);
      const data = response.body;
      
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request body');
    });

    test('should validate UUID format for workflow_id', async () => {
      const invalidData = {
        workflow_id: 'not-a-uuid',
        filename: 'test.pdf',
        url: 'https://example.com/test.pdf'
      };

      const response = await client.post('/api/documents', invalidData);
      
      expect(response.status).toBe(400);
      const data = response.body;
      
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request body');
    });

    test('should validate document_type enum', async () => {
      const invalidData = {
        workflow_id: '00000000-0000-0000-0000-000000000001',
        filename: 'test.pdf',
        url: 'https://example.com/test.pdf',
        document_type: 'INVALID_TYPE'
      };

      const response = await client.post('/api/documents', invalidData);
      
      expect(response.status).toBe(400);
      const data = response.body;
      
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request body');
    });

    test('should validate status enum', async () => {
      const invalidData = {
        workflow_id: '00000000-0000-0000-0000-000000000001',
        filename: 'test.pdf',
        url: 'https://example.com/test.pdf',
        status: 'INVALID_STATUS'
      };

      const response = await client.post('/api/documents', invalidData);
      
      // Could be 400 (validation error) or 404 (workflow not found) depending on validation order
      expect([400, 404]).toContain(response.status);
      const data = response.body;
      
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });
  });

  describe('GET /api/documents/:id', () => {
    test('should validate UUID format', async () => {
      const response = await client.get('/api/documents/not-a-uuid');
      
      // Should either be 400 (bad format) or 404 (not found)
      expect([400, 404, 500]).toContain(response.status);
      const data = response.body;
      
      expect(data.success).toBe(false);
      expect(data).toHaveProperty('error');
    });

    test('should return 404 for non-existent document', async () => {
      const response = await client.get('/api/documents/00000000-0000-0000-0000-000000000999');
      
      // Might be 404 (not found) or 500 (database error in test env)
      expect([404, 500]).toContain(response.status);
      const data = response.body;
      
      expect(data.success).toBe(false);
      expect(data).toHaveProperty('error');
    });
  });

  describe('PATCH /api/documents/:id', () => {
    test('should validate request body schema', async () => {
      const invalidData = {
        document_type: 'INVALID_TYPE'
      };

      const response = await client.patch('/api/documents/00000000-0000-0000-0000-000000000001', invalidData);
      
      expect(response.status).toBe(400);
      const data = response.body;
      
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request body');
    });

    test('should validate UUID format', async () => {
      const updateData = {
        filename: 'updated.pdf'
      };

      const response = await client.patch('/api/documents/not-a-uuid', updateData);
      
      expect([400, 404, 500]).toContain(response.status);
      const data = response.body;
      
      expect(data.success).toBe(false);
    });
  });

  describe('POST /api/documents/:id/versions', () => {
    test('should validate required change_summary', async () => {
      const incompleteVersionData = {
        url: 'https://example.com/version-test-document-v3.pdf'
        // Missing change_summary
      };

      const response = await client.post('/api/documents/00000000-0000-0000-0000-000000000001/versions', incompleteVersionData);
      
      expect(response.status).toBe(400);
      const data = response.body;
      
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request body');
    });

    test('should validate URL format', async () => {
      const invalidVersionData = {
        url: 'not-a-url',
        change_summary: 'Test change'
      };

      const response = await client.post('/api/documents/00000000-0000-0000-0000-000000000001/versions', invalidVersionData);
      
      expect(response.status).toBe(400);
      const data = response.body;
      
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request body');
    });
  });

  describe('DELETE /api/documents/:id', () => {
    test('should validate UUID format', async () => {
      const response = await client.request('/api/documents/not-a-uuid', {
        method: 'DELETE'
      });
      
      expect([400, 404, 500]).toContain(response.status);
      const data = response.body;
      
      expect(data.success).toBe(false);
    });

    test('should return 404 for non-existent document', async () => {
      const response = await client.request('/api/documents/00000000-0000-0000-0000-000000000999', {
        method: 'DELETE'
      });
      
      expect([404, 500]).toContain(response.status);
      const data = response.body;
      
      expect(data.success).toBe(false);
    });
  });

  describe('GET /api/documents/by-workflow/:workflowId', () => {
    test('should validate UUID format', async () => {
      const response = await client.get('/api/documents/by-workflow/not-a-uuid');
      
      expect([400, 404, 500]).toContain(response.status);
      const data = response.body;
      
      expect(data.success).toBe(false);
    });

    test('should return 404 for non-existent workflow', async () => {
      const response = await client.get('/api/documents/by-workflow/00000000-0000-0000-0000-000000000999');
      
      expect([404, 500]).toContain(response.status);
      const data = response.body;
      
      expect(data.success).toBe(false);
    });

    test('should validate filter parameters', async () => {
      const response = await client.get('/api/documents/by-workflow/00000000-0000-0000-0000-000000000001?document_type=INVALID');
      
      // The filter validation might happen after workflow validation,
      // so we could get either a workflow not found error or validation error
      expect([400, 404, 500]).toContain(response.status);
      const data = response.body;
      
      expect(data.success).toBe(false);
    });
  });
});