/**
 * Task Executions API Integration Tests
 * Comprehensive testing for task execution endpoints
 */

import request from 'supertest';
import { testHelper, TestDataSet } from '../utils/test-helpers';

describe('Task Executions API', () => {
  let baseURL: string;
  let testData: TestDataSet;

  beforeAll(async () => {
    baseURL = await testHelper.startTestServer(3003);
    testData = await testHelper.createTestDataSet();
  });

  afterAll(async () => {
    await testHelper.cleanupTestData();
    await testHelper.stopTestServer();
  });

  describe('GET /api/taskExecutions', () => {
    it('should return list of task executions', async () => {
      const response = await request(baseURL)
        .get('/api/taskExecutions')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toMatchApiResponseFormat();
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);

      // Validate task execution structure
      const task = response.body.data.find((t: any) => t.id === testData.taskExecutions[0].id);
      expect(task).toBeDefined();
      expect(task.id).toBeValidUUID();
      expect(task.workflow_id).toBeValidUUID();
      expect(task.status).toMatch(/^(PENDING|AWAITING_REVIEW|COMPLETED|FAILED)$/);
      expect(task.executor_type).toMatch(/^(AI|HIL)$/);
      expect(task.created_at).toBeValidTimestamp();
    });

    it('should support filtering by workflow_id', async () => {
      const workflowId = testData.workflows[0].id;
      const response = await request(baseURL)
        .get(`/api/taskExecutions?workflow_id=${workflowId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((task: any) => {
        expect(task.workflow_id).toBe(workflowId);
      });
    });

    it('should support filtering by status', async () => {
      const response = await request(baseURL)
        .get('/api/taskExecutions?status=COMPLETED')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((task: any) => {
        expect(task.status).toBe('COMPLETED');
      });
    });

    it('should support filtering by executor_type', async () => {
      const response = await request(baseURL)
        .get('/api/taskExecutions?executor_type=AI')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((task: any) => {
        expect(task.executor_type).toBe('AI');
      });
    });

    it('should support pagination', async () => {
      const response = await request(baseURL)
        .get('/api/taskExecutions?limit=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/taskExecutions/:id', () => {
    it('should return specific task execution by ID', async () => {
      const taskId = testData.taskExecutions[0].id;
      const response = await request(baseURL)
        .get(`/api/taskExecutions/${taskId}`)
        .expect(200);

      expect(response.body).toMatchApiResponseFormat();
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(taskId);
      expect(response.body.data.title).toBe(testData.taskExecutions[0].title);
    });

    it('should return 404 for non-existent task execution', async () => {
      const nonExistentId = '12345678-1234-1234-1234-123456789012';
      const response = await request(baseURL)
        .get(`/api/taskExecutions/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/not found/i);
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(baseURL)
        .get('/api/taskExecutions/invalid-uuid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/Invalid.*ID/);
    });
  });

  describe('POST /api/taskExecutions', () => {
    it('should create new task execution', async () => {
      const newTask = {
        workflow_id: testData.workflows[0].id,
        agent_id: testData.agents[0].id,
        title: 'Test New Task Execution',
        description: 'Test task created by API tests',
        sequence_order: 99,
        task_type: 'TEST_TASK',
        executor_type: 'AI',
        priority: 'NORMAL',
        input_data: { test: true }
      };

      const response = await request(baseURL)
        .post('/api/taskExecutions')
        .send(newTask)
        .expect(201);

      expect(response.body).toMatchApiResponseFormat();
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeValidUUID();
      expect(response.body.data.title).toBe(newTask.title);
      expect(response.body.data.status).toBe('PENDING'); // Default status
    });

    it('should create task execution without agent_id (HIL task)', async () => {
      const newTask = {
        workflow_id: testData.workflows[0].id,
        title: 'Test HIL Task',
        description: 'Task for human execution',
        sequence_order: 100,
        task_type: 'MANUAL_REVIEW',
        executor_type: 'HIL',
        priority: 'HIGH',
        input_data: { requires_human: true }
      };

      const response = await request(baseURL)
        .post('/api/taskExecutions')
        .send(newTask)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.executor_type).toBe('HIL');
      expect(response.body.data.agent_id).toBeNull();
    });

    it('should return 400 for missing required fields', async () => {
      const invalidTask = {
        title: 'Missing required fields'
      };

      const response = await request(baseURL)
        .post('/api/taskExecutions')
        .send(invalidTask)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for invalid workflow_id', async () => {
      const invalidTask = {
        workflow_id: '12345678-1234-1234-1234-123456789012',
        title: 'Test Invalid Workflow',
        sequence_order: 1,
        task_type: 'TEST',
        executor_type: 'AI'
      };

      const response = await request(baseURL)
        .post('/api/taskExecutions')
        .send(invalidTask)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/taskExecutions/bulk', () => {
    it('should create multiple task executions in one request', async () => {
      const bulkTasks = [
        {
          workflow_id: testData.workflows[0].id,
          title: 'Bulk Task 1',
          sequence_order: 101,
          task_type: 'BULK_TEST_1',
          executor_type: 'AI',
          input_data: { bulk: true, order: 1 }
        },
        {
          workflow_id: testData.workflows[0].id,
          title: 'Bulk Task 2',
          sequence_order: 102,
          task_type: 'BULK_TEST_2',
          executor_type: 'HIL',
          input_data: { bulk: true, order: 2 }
        }
      ];

      const response = await request(baseURL)
        .post('/api/taskExecutions/bulk')
        .send({ tasks: bulkTasks })
        .expect(201);

      expect(response.body).toMatchApiResponseFormat();
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(2);
      
      // Verify both tasks were created
      response.body.data.forEach((task: any, index: number) => {
        expect(task.id).toBeValidUUID();
        expect(task.title).toBe(bulkTasks[index].title);
        expect(task.sequence_order).toBe(bulkTasks[index].sequence_order);
      });
    });

    it('should return 400 for empty bulk request', async () => {
      const response = await request(baseURL)
        .post('/api/taskExecutions/bulk')
        .send({ tasks: [] })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/empty/i);
    });

    it('should handle partial failures in bulk operations', async () => {
      const mixedTasks = [
        {
          workflow_id: testData.workflows[0].id,
          title: 'Valid Bulk Task',
          sequence_order: 103,
          task_type: 'VALID_BULK',
          executor_type: 'AI'
        },
        {
          workflow_id: '12345678-1234-1234-1234-123456789012', // Invalid workflow
          title: 'Invalid Bulk Task',
          sequence_order: 104,
          task_type: 'INVALID_BULK',
          executor_type: 'AI'
        }
      ];

      const response = await request(baseURL)
        .post('/api/taskExecutions/bulk')
        .send({ tasks: mixedTasks })
        .expect(400);

      expect(response.body.success).toBe(false);
      // Should fail entire operation on any invalid task
    });
  });

  describe('PATCH /api/taskExecutions/:id', () => {
    it('should update task execution status and results', async () => {
      const taskId = testData.taskExecutions[1].id; // Use pending task
      const updateData = {
        status: 'COMPLETED',
        output_data: {
          result: 'success',
          confidence: 0.98,
          details: 'Task completed successfully by test'
        },
        completed_at: new Date().toISOString(),
        execution_time_ms: 5000
      };

      const response = await request(baseURL)
        .patch(`/api/taskExecutions/${taskId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchApiResponseFormat();
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(updateData.status);
      expect(response.body.data.output_data).toEqual(updateData.output_data);
      expect(response.body.data.completed_at).toBe(updateData.completed_at);
    });

    it('should update task to failed status with error message', async () => {
      const taskId = testData.taskExecutions[0].id;
      const updateData = {
        status: 'FAILED',
        error_message: 'Task failed due to test conditions',
        completed_at: new Date().toISOString()
      };

      const response = await request(baseURL)
        .patch(`/api/taskExecutions/${taskId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('FAILED');
      expect(response.body.data.error_message).toBe(updateData.error_message);
    });

    it('should return 404 for non-existent task', async () => {
      const nonExistentId = '12345678-1234-1234-1234-123456789012';
      const updateData = { status: 'COMPLETED' };

      const response = await request(baseURL)
        .patch(`/api/taskExecutions/${nonExistentId}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid status transition', async () => {
      const taskId = testData.taskExecutions[0].id;
      const invalidData = {
        status: 'INVALID_STATUS'
      };

      const response = await request(baseURL)
        .patch(`/api/taskExecutions/${taskId}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Performance Tests', () => {
    it('should handle bulk task creation efficiently', async () => {
      const startTime = Date.now();
      
      const bulkTasks = Array.from({ length: 10 }, (_, i) => ({
        workflow_id: testData.workflows[0].id,
        title: `Performance Test Task ${i}`,
        sequence_order: 200 + i,
        task_type: 'PERFORMANCE_TEST',
        executor_type: 'AI',
        input_data: { performance_test: true, index: i }
      }));

      await request(baseURL)
        .post('/api/taskExecutions/bulk')
        .send({ tasks: bulkTasks })
        .expect(201);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should respond to task list queries quickly', async () => {
      const startTime = Date.now();
      
      await request(baseURL)
        .get('/api/taskExecutions?limit=50')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(2000);
    });
  });
});