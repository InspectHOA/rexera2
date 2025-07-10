/**
 * Workflows API Integration Tests
 * Comprehensive testing for workflow endpoints
 */

import request from 'supertest';
import { testHelper, TestDataSet } from '../utils/test-helpers';

describe('Workflows API', () => {
  let baseURL: string;
  let testData: TestDataSet;

  beforeAll(async () => {
    // Start test server
    baseURL = await testHelper.startTestServer(3002);
    
    // Create test data
    testData = await testHelper.createTestDataSet();
  });

  afterAll(async () => {
    // Cleanup test data
    await testHelper.cleanupTestData();
    
    // Stop test server
    await testHelper.stopTestServer();
  });

  describe('GET /api/workflows', () => {
    it('should return list of workflows with valid format', async () => {
      const response = await request(baseURL)
        .get('/api/workflows')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toMatchApiResponseFormat();
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // Check at least our test workflows exist
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
      
      // Validate workflow structure
      const workflow = response.body.data.find((w: any) => w.id === testData.workflows[0].id);
      expect(workflow).toBeDefined();
      expect(workflow.id).toBeValidUUID();
      expect(workflow.workflow_type).toMatch(/^(HOA_ACQUISITION|MUNI_LIEN_SEARCH)$/);
      expect(workflow.status).toMatch(/^(PENDING|IN_PROGRESS|AWAITING_REVIEW|COMPLETED|BLOCKED)$/);
      expect(workflow.created_at).toBeValidTimestamp();
    });

    it('should support filtering by status', async () => {
      const response = await request(baseURL)
        .get('/api/workflows?status=IN_PROGRESS')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((workflow: any) => {
        expect(workflow.status).toBe('IN_PROGRESS');
      });
    });

    it('should support filtering by client_id', async () => {
      const clientId = testData.clients[0].id;
      const response = await request(baseURL)
        .get(`/api/workflows?client_id=${clientId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((workflow: any) => {
        expect(workflow.client_id).toBe(clientId);
      });
    });

    it('should support pagination with limit and offset', async () => {
      const response1 = await request(baseURL)
        .get('/api/workflows?limit=1&offset=0')
        .expect(200);

      const response2 = await request(baseURL)
        .get('/api/workflows?limit=1&offset=1')
        .expect(200);

      expect(response1.body.data).toHaveLength(1);
      expect(response2.body.data).toHaveLength(1);
      expect(response1.body.data[0].id).not.toBe(response2.body.data[0].id);
    });

    it('should include client data when requested', async () => {
      const response = await request(baseURL)
        .get('/api/workflows?include=client')
        .expect(200);

      const workflowWithClient = response.body.data.find((w: any) => w.clients);
      expect(workflowWithClient).toBeDefined();
      expect(workflowWithClient.clients).toBeDefined();
      expect(workflowWithClient.clients.name).toBeDefined();
    });

    it('should handle empty results gracefully', async () => {
      const response = await request(baseURL)
        .get('/api/workflows?status=NONEXISTENT_STATUS')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('GET /api/workflows/:id', () => {
    it('should return specific workflow by UUID', async () => {
      const workflowId = testData.workflows[0].id;
      const response = await request(baseURL)
        .get(`/api/workflows/${workflowId}`)
        .expect(200);

      expect(response.body).toMatchApiResponseFormat();
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(workflowId);
      expect(response.body.data.title).toBe(testData.workflows[0].title);
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(baseURL)
        .get('/api/workflows/invalid-uuid-format')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/Invalid workflow ID/);
    });

    it('should return 404 for non-existent workflow', async () => {
      const nonExistentId = '12345678-1234-1234-1234-123456789012';
      const response = await request(baseURL)
        .get(`/api/workflows/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/not found/i);
    });

    it('should include related tasks when requested', async () => {
      const workflowId = testData.workflows[0].id;
      const response = await request(baseURL)
        .get(`/api/workflows/${workflowId}?include=tasks`)
        .expect(200);

      expect(response.body.data.tasks).toBeDefined();
      expect(Array.isArray(response.body.data.tasks)).toBe(true);
    });

    it('should include client data when requested', async () => {
      const workflowId = testData.workflows[0].id;
      const response = await request(baseURL)
        .get(`/api/workflows/${workflowId}?include=client`)
        .expect(200);

      expect(response.body.data.client).toBeDefined();
      expect(response.body.data.client.name).toBeDefined();
    });
  });

  describe('POST /api/workflows', () => {
    it('should create new workflow with valid data', async () => {
      const newWorkflow = {
        workflow_type: 'MUNI_LIEN_SEARCH',
        client_id: testData.clients[0].id,
        title: 'Test New Workflow',
        description: 'Test workflow created by API tests',
        priority: 'NORMAL',
        metadata: { test: true }
      };

      const response = await request(baseURL)
        .post('/api/workflows')
        .send(newWorkflow)
        .expect(201);

      expect(response.body).toMatchApiResponseFormat();
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeValidUUID();
      expect(response.body.data.title).toBe(newWorkflow.title);
      expect(response.body.data.workflow_type).toBe(newWorkflow.workflow_type);
      expect(response.body.data.status).toBe('PENDING'); // Default status
    });

    it('should return 400 for missing required fields', async () => {
      const invalidWorkflow = {
        title: 'Missing required fields'
      };

      const response = await request(baseURL)
        .post('/api/workflows')
        .send(invalidWorkflow)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for invalid workflow_type', async () => {
      const invalidWorkflow = {
        workflow_type: 'INVALID_TYPE',
        client_id: testData.clients[0].id,
        title: 'Test Invalid Type'
      };

      const response = await request(baseURL)
        .post('/api/workflows')
        .send(invalidWorkflow)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for non-existent client_id', async () => {
      const invalidWorkflow = {
        workflow_type: 'MUNI_LIEN_SEARCH',
        client_id: '12345678-1234-1234-1234-123456789012',
        title: 'Test Non-existent Client'
      };

      const response = await request(baseURL)
        .post('/api/workflows')
        .send(invalidWorkflow)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/workflows/:id', () => {
    it('should update existing workflow', async () => {
      const workflowId = testData.workflows[0].id;
      const updateData = {
        title: 'Updated Test Workflow',
        status: 'COMPLETED',
        metadata: { updated: true, test: true }
      };

      const response = await request(baseURL)
        .put(`/api/workflows/${workflowId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchApiResponseFormat();
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.status).toBe(updateData.status);
    });

    it('should return 404 for non-existent workflow', async () => {
      const nonExistentId = '12345678-1234-1234-1234-123456789012';
      const updateData = { title: 'Updated Title' };

      const response = await request(baseURL)
        .put(`/api/workflows/${nonExistentId}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid update data', async () => {
      const workflowId = testData.workflows[0].id;
      const invalidData = {
        workflow_type: 'INVALID_TYPE'
      };

      const response = await request(baseURL)
        .put(`/api/workflows/${workflowId}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Performance Tests', () => {
    it('should respond to workflow list within acceptable time', async () => {
      const startTime = Date.now();
      
      await request(baseURL)
        .get('/api/workflows')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(3000); // Should respond within 3 seconds
    });

    it('should respond to workflow detail within acceptable time', async () => {
      const workflowId = testData.workflows[0].id;
      const startTime = Date.now();
      
      await request(baseURL)
        .get(`/api/workflows/${workflowId}`)
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // This test would require mocking the database connection
      // For now, we'll test that errors are returned in correct format
      const response = await request(baseURL)
        .get('/api/workflows/12345678-1234-1234-1234-123456789012')
        .expect(404);

      expect(response.body).toMatchApiResponseFormat();
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should handle malformed JSON in POST requests', async () => {
      const response = await request(baseURL)
        .post('/api/workflows')
        .send('{ invalid json }')
        .set('Content-Type', 'application/json')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});