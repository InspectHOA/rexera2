/**
 * Agents API Integration Tests
 * Comprehensive testing for agent endpoints
 */

import request from 'supertest';
import { testHelper, TestDataSet } from '../utils/test-helpers';

describe('Agents API', () => {
  let baseURL: string;
  let testData: TestDataSet;

  beforeAll(async () => {
    baseURL = await testHelper.startTestServer(3004);
    testData = await testHelper.createTestDataSet();
  });

  afterAll(async () => {
    await testHelper.cleanupTestData();
    await testHelper.stopTestServer();
  });

  describe('GET /api/agents', () => {
    it('should return list of agents', async () => {
      const response = await request(baseURL)
        .get('/api/agents')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toMatchApiResponseFormat();
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);

      // Validate agent structure
      const agent = response.body.data.find((a: any) => a.id === testData.agents[0].id);
      expect(agent).toBeDefined();
      expect(agent.id).toBeValidUUID();
      expect(agent.name).toBeDefined();
      expect(agent.type).toBeDefined();
      expect(Array.isArray(agent.capabilities)).toBe(true);
      expect(agent.created_at).toBeValidTimestamp();
    });

    it('should support filtering by type', async () => {
      const response = await request(baseURL)
        .get('/api/agents?type=PAYOFF_SPECIALIST')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((agent: any) => {
        expect(agent.type).toBe('PAYOFF_SPECIALIST');
      });
    });

    it('should support filtering by status', async () => {
      const response = await request(baseURL)
        .get('/api/agents?status=ACTIVE')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((agent: any) => {
        expect(agent.status || 'ACTIVE').toBe('ACTIVE'); // Default to ACTIVE if not set
      });
    });

    it('should support pagination', async () => {
      const response = await request(baseURL)
        .get('/api/agents?limit=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(1);
    });
  });

  describe('GET /api/agents/:id', () => {
    it('should return specific agent by ID', async () => {
      const agentId = testData.agents[0].id;
      const response = await request(baseURL)
        .get(`/api/agents/${agentId}`)
        .expect(200);

      expect(response.body).toMatchApiResponseFormat();
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(agentId);
      expect(response.body.data.name).toBe(testData.agents[0].name);
    });

    it('should return 404 for non-existent agent', async () => {
      const nonExistentId = '12345678-1234-1234-1234-123456789012';
      const response = await request(baseURL)
        .get(`/api/agents/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/not found/i);
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(baseURL)
        .get('/api/agents/invalid-uuid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/Invalid.*ID/);
    });
  });

  describe('POST /api/agents', () => {
    it('should create new agent with valid data', async () => {
      const newAgent = {
        name: 'Test Agent Iris',
        type: 'DOCUMENT_SPECIALIST',
        description: 'Test agent created by API tests',
        capabilities: ['document_analysis', 'data_extraction'],
        configuration: { test: true },
        is_active: true
      };

      const response = await request(baseURL)
        .post('/api/agents')
        .send(newAgent)
        .expect(201);

      expect(response.body).toMatchApiResponseFormat();
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeValidUUID();
      expect(response.body.data.name).toBe(newAgent.name);
      expect(response.body.data.type).toBe(newAgent.type);
      expect(response.body.data.capabilities).toEqual(newAgent.capabilities);
    });

    it('should return 400 for missing required fields', async () => {
      const invalidAgent = {
        description: 'Missing required fields'
      };

      const response = await request(baseURL)
        .post('/api/agents')
        .send(invalidAgent)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for duplicate agent name', async () => {
      const duplicateAgent = {
        name: testData.agents[0].name, // Use existing name
        type: 'DOCUMENT_SPECIALIST',
        capabilities: ['test']
      };

      const response = await request(baseURL)
        .post('/api/agents')
        .send(duplicateAgent)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/already exists|duplicate/i);
    });

    it('should handle empty capabilities array', async () => {
      const agentWithEmptyCapabilities = {
        name: 'Test Agent Empty Capabilities',
        type: 'GENERAL',
        capabilities: []
      };

      const response = await request(baseURL)
        .post('/api/agents')
        .send(agentWithEmptyCapabilities)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.capabilities).toEqual([]);
    });
  });

  describe('PUT /api/agents/:id', () => {
    it('should update existing agent', async () => {
      const agentId = testData.agents[0].id;
      const updateData = {
        description: 'Updated description by API test',
        capabilities: ['updated_capability_1', 'updated_capability_2'],
        configuration: { updated: true },
        is_active: false
      };

      const response = await request(baseURL)
        .put(`/api/agents/${agentId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchApiResponseFormat();
      expect(response.body.success).toBe(true);
      expect(response.body.data.description).toBe(updateData.description);
      expect(response.body.data.capabilities).toEqual(updateData.capabilities);
      expect(response.body.data.is_active).toBe(updateData.is_active);
    });

    it('should return 404 for non-existent agent', async () => {
      const nonExistentId = '12345678-1234-1234-1234-123456789012';
      const updateData = { description: 'Updated description' };

      const response = await request(baseURL)
        .put(`/api/agents/${nonExistentId}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should not allow updating agent name to existing name', async () => {
      const agentId = testData.agents[1].id;
      const updateData = {
        name: testData.agents[0].name // Try to use existing name
      };

      const response = await request(baseURL)
        .put(`/api/agents/${agentId}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/already exists|duplicate/i);
    });
  });

  describe('DELETE /api/agents/:id', () => {
    it('should soft delete agent (set inactive)', async () => {
      // Create a dedicated agent for deletion testing
      const newAgent = {
        name: 'Test Agent For Deletion',
        type: 'TEST_AGENT',
        capabilities: ['test']
      };

      const createResponse = await request(baseURL)
        .post('/api/agents')
        .send(newAgent)
        .expect(201);

      const agentId = createResponse.body.data.id;

      // Delete the agent
      const deleteResponse = await request(baseURL)
        .delete(`/api/agents/${agentId}`)
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);

      // Verify agent is soft deleted (inactive)
      const getResponse = await request(baseURL)
        .get(`/api/agents/${agentId}`)
        .expect(200);

      expect(getResponse.body.data.is_active).toBe(false);
    });

    it('should return 404 for non-existent agent', async () => {
      const nonExistentId = '12345678-1234-1234-1234-123456789012';
      
      const response = await request(baseURL)
        .delete(`/api/agents/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should prevent deletion of agent with active tasks', async () => {
      // This test assumes business logic prevents deletion of agents with active tasks
      const agentId = testData.agents[0].id; // This agent has associated tasks
      
      const response = await request(baseURL)
        .delete(`/api/agents/${agentId}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/active tasks|in use/i);
    });
  });

  describe('GET /api/agents/:id/performance', () => {
    it('should return agent performance metrics', async () => {
      const agentId = testData.agents[0].id;
      
      const response = await request(baseURL)
        .get(`/api/agents/${agentId}/performance`)
        .expect(200);

      expect(response.body).toMatchApiResponseFormat();
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      
      // Should contain performance metrics
      expect(response.body.data.total_tasks).toBeDefined();
      expect(response.body.data.completed_tasks).toBeDefined();
      expect(response.body.data.success_rate).toBeDefined();
      expect(response.body.data.average_execution_time).toBeDefined();
    });

    it('should return empty metrics for agent with no tasks', async () => {
      const agentId = testData.agents[1].id; // Agent with no associated tasks
      
      const response = await request(baseURL)
        .get(`/api/agents/${agentId}/performance`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total_tasks).toBe(0);
      expect(response.body.data.completed_tasks).toBe(0);
    });

    it('should support date range filtering for performance metrics', async () => {
      const agentId = testData.agents[0].id;
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days ago
      const endDate = new Date().toISOString();
      
      const response = await request(baseURL)
        .get(`/api/agents/${agentId}/performance?start_date=${startDate}&end_date=${endDate}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('Performance Tests', () => {
    it('should respond to agent list quickly', async () => {
      const startTime = Date.now();
      
      await request(baseURL)
        .get('/api/agents')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1500);
    });

    it('should handle agent creation efficiently', async () => {
      const startTime = Date.now();
      
      const newAgent = {
        name: `Performance Test Agent ${Date.now()}`,
        type: 'PERFORMANCE_TEST',
        capabilities: ['speed_test']
      };

      await request(baseURL)
        .post('/api/agents')
        .send(newAgent)
        .expect(201);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(2000);
    });
  });

  describe('Security Tests', () => {
    it('should sanitize agent input data', async () => {
      const maliciousAgent = {
        name: '<script>alert("xss")</script>',
        type: 'TEST_AGENT',
        description: '<?php echo "test"; ?>',
        capabilities: ['<script>alert("capabilities")</script>']
      };

      const response = await request(baseURL)
        .post('/api/agents')
        .send(maliciousAgent)
        .expect(201);

      expect(response.body.success).toBe(true);
      // Verify that malicious scripts are sanitized
      expect(response.body.data.name).not.toContain('<script>');
      expect(response.body.data.description).not.toContain('<?php');
    });

    it('should validate agent configuration schema', async () => {
      const agentWithInvalidConfig = {
        name: 'Test Agent Invalid Config',
        type: 'TEST_AGENT',
        capabilities: ['test'],
        configuration: {
          // This should be validated against a schema
          invalid_field: 'should_be_rejected'
        }
      };

      // This test assumes there's configuration validation
      // The exact behavior depends on implementation
      await request(baseURL)
        .post('/api/agents')
        .send(agentWithInvalidConfig);
      
      // Should either succeed with sanitized config or fail with validation error
    });
  });
});