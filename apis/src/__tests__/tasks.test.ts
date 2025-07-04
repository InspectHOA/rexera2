/**
 * Unit tests for Tasks API endpoints
 */

import { GET, POST } from '../tasks/route';
import {
  createMockRequest,
  createMockUser,
  createMockTask,
  createMockWorkflow,
  extractResponseData,
  mockSupabaseSuccess,
  mockSupabaseError,
  assertApiResponse,
  assertErrorResponse,
} from './utils';

describe('/api/tasks', () => {
  let mockUser: any;
  let mockTask: any;
  let mockWorkflow: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = createMockUser();
    mockTask = createMockTask();
    mockWorkflow = createMockWorkflow();
  });

  describe('GET /api/tasks', () => {
    it('should return paginated tasks list with default parameters', async () => {
      const tasks = [mockTask, createMockTask({ id: 'TASK-TEST-002' })];
      
      (global.mockSupabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockResolvedValue(mockSupabaseSuccess([], 10)),
      });

      (global.mockSupabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue(mockSupabaseSuccess(tasks)),
      });

      const request = createMockRequest({
        method: 'GET',
        url: 'https://localhost:3000/api/tasks',
        user: mockUser,
      });

      const response = await GET(request);
      const data = await extractResponseData(response);

      expect(response.status).toBe(200);
      assertApiResponse(data);
      expect(data.data).toHaveLength(2);
      expect(data.pagination).toEqual({
        total: 10,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('should filter tasks by workflow_id', async () => {
      const filteredTasks = [createMockTask({ workflow_id: 'WF-SPECIFIC' })];
      
      (global.mockSupabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockResolvedValue(mockSupabaseSuccess([], 1)),
      });

      (global.mockSupabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue(mockSupabaseSuccess(filteredTasks)),
      });

      const request = createMockRequest({
        method: 'GET',
        url: 'https://localhost:3000/api/tasks?workflow_id=WF-SPECIFIC',
        user: mockUser,
      });

      const response = await GET(request);
      const data = await extractResponseData(response);

      expect(response.status).toBe(200);
      expect(data.data[0].workflow_id).toBe('WF-SPECIFIC');
    });

    it('should filter tasks by status', async () => {
      const completedTasks = [createMockTask({ status: 'COMPLETED' })];
      
      (global.mockSupabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockResolvedValue(mockSupabaseSuccess([], 1)),
      });

      (global.mockSupabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue(mockSupabaseSuccess(completedTasks)),
      });

      const request = createMockRequest({
        method: 'GET',
        url: 'https://localhost:3000/api/tasks?status=COMPLETED',
        user: mockUser,
      });

      const response = await GET(request);
      const data = await extractResponseData(response);

      expect(response.status).toBe(200);
      expect(data.data[0].status).toBe('COMPLETED');
    });

    it('should handle pagination correctly', async () => {
      const tasks = [mockTask];
      
      (global.mockSupabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockResolvedValue(mockSupabaseSuccess([], 50)),
      });

      (global.mockSupabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue(mockSupabaseSuccess(tasks)),
      });

      const request = createMockRequest({
        method: 'GET',
        url: 'https://localhost:3000/api/tasks?page=2&limit=10',
        user: mockUser,
      });

      const response = await GET(request);
      const data = await extractResponseData(response);

      expect(response.status).toBe(200);
      expect(data.pagination).toEqual({
        total: 50,
        page: 2,
        limit: 10,
        totalPages: 5,
      });
      expect(data.links).toHaveProperty('previous');
      expect(data.links).toHaveProperty('next');
    });

    it('should restrict client users to their company tasks', async () => {
      const clientUser = createMockUser({ 
        user_type: 'client_user', 
        company_id: 'client-company' 
      });
      
      const tasksWithWorkflow = [
        { ...mockTask, workflow: { client_id: 'client-company' } }
      ];

      (global.mockSupabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockResolvedValue(mockSupabaseSuccess([], 1)),
      });

      (global.mockSupabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue(mockSupabaseSuccess(tasksWithWorkflow)),
      });

      const request = createMockRequest({
        method: 'GET',
        user: clientUser,
      });

      const response = await GET(request);
      const data = await extractResponseData(response);

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].workflow.client_id).toBe('client-company');
    });

    it('should handle database errors gracefully', async () => {
      (global.mockSupabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockSupabaseError('Database connection failed')),
      });

      const request = createMockRequest({
        method: 'GET',
        user: mockUser,
      });

      const response = await GET(request);
      const data = await extractResponseData(response);

      expect(response.status).toBe(500);
      assertErrorResponse(data, 'Database Error');
    });
  });

  describe('POST /api/tasks', () => {
    it('should create a new AI task with valid data', async () => {
      const newTaskData = {
        workflow_id: 'WF-TEST-001',
        title: 'New AI Task',
        description: 'Test AI task description',
        executor_type: 'AI',
        priority: 'HIGH',
        metadata: { agent_type: 'Nina' },
      };

      // Mock workflow verification
      (global.mockSupabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockSupabaseSuccess(mockWorkflow)),
      });

      // Mock task creation
      (global.mockSupabase.from as jest.Mock).mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue(mockSupabaseSuccess([{
          ...mockTask,
          ...newTaskData,
        }])),
      });

      const request = createMockRequest({
        method: 'POST',
        body: newTaskData,
        user: mockUser,
      });

      const response = await POST(request);
      const data = await extractResponseData(response);

      expect(response.status).toBe(200);
      assertApiResponse(data);
      expect(data.data.title).toBe('New AI Task');
      expect(data.data.executor_type).toBe('AI');
    });

    it('should create a new HIL task with assigned user', async () => {
      const hilUser = createMockUser({ user_type: 'hil_user' });
      const newTaskData = {
        workflow_id: 'WF-TEST-001',
        title: 'New HIL Task',
        executor_type: 'HIL',
        assigned_to: hilUser.id,
      };

      // Mock workflow verification
      (global.mockSupabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockSupabaseSuccess(mockWorkflow)),
      });

      // Mock user verification
      (global.mockSupabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockSupabaseSuccess(hilUser)),
      });

      // Mock task creation
      (global.mockSupabase.from as jest.Mock).mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue(mockSupabaseSuccess([{
          ...mockTask,
          ...newTaskData,
        }])),
      });

      const request = createMockRequest({
        method: 'POST',
        body: newTaskData,
        user: mockUser,
      });

      const response = await POST(request);
      const data = await extractResponseData(response);

      expect(response.status).toBe(200);
      expect(data.data.executor_type).toBe('HIL');
      expect(data.data.assigned_to).toBe(hilUser.id);
    });

    it('should reject task creation with missing required fields', async () => {
      const invalidData = {
        // Missing workflow_id, title, and executor_type
        description: 'Incomplete task',
      };

      const request = createMockRequest({
        method: 'POST',
        body: invalidData,
        user: mockUser,
      });

      const response = await POST(request);
      const data = await extractResponseData(response);

      expect(response.status).toBe(400);
      assertErrorResponse(data, 'Bad Request');
      expect(data.error.message).toContain('Missing required fields');
    });

    it('should reject invalid executor types', async () => {
      const invalidData = {
        workflow_id: 'WF-TEST-001',
        title: 'Invalid Task',
        executor_type: 'INVALID_EXECUTOR',
      };

      const request = createMockRequest({
        method: 'POST',
        body: invalidData,
        user: mockUser,
      });

      const response = await POST(request);
      const data = await extractResponseData(response);

      expect(response.status).toBe(400);
      assertErrorResponse(data, 'Validation Error');
      expect(data.error.message).toBe('Invalid executor type');
    });

    it('should reject HIL tasks without assigned user', async () => {
      const invalidData = {
        workflow_id: 'WF-TEST-001',
        title: 'HIL Task Without Assignment',
        executor_type: 'HIL',
        // Missing assigned_to
      };

      // Mock workflow verification
      (global.mockSupabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockSupabaseSuccess(mockWorkflow)),
      });

      const request = createMockRequest({
        method: 'POST',
        body: invalidData,
        user: mockUser,
      });

      const response = await POST(request);
      const data = await extractResponseData(response);

      expect(response.status).toBe(400);
      assertErrorResponse(data, 'Validation Error');
      expect(data.error.message).toBe('HIL tasks must have an assigned user');
    });

    it('should reject HIL tasks assigned to non-HIL users', async () => {
      const clientUser = createMockUser({ user_type: 'client_user' });
      const invalidData = {
        workflow_id: 'WF-TEST-001',
        title: 'HIL Task Assigned to Client',
        executor_type: 'HIL',
        assigned_to: clientUser.id,
      };

      // Mock workflow verification
      (global.mockSupabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockSupabaseSuccess(mockWorkflow)),
      });

      // Mock user verification
      (global.mockSupabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockSupabaseSuccess(clientUser)),
      });

      const request = createMockRequest({
        method: 'POST',
        body: invalidData,
        user: mockUser,
      });

      const response = await POST(request);
      const data = await extractResponseData(response);

      expect(response.status).toBe(400);
      assertErrorResponse(data, 'Validation Error');
      expect(data.error.message).toBe('HIL tasks can only be assigned to HIL users');
    });

    it('should reject tasks for non-existent workflows', async () => {
      const invalidData = {
        workflow_id: 'NON-EXISTENT-WF',
        title: 'Task for Missing Workflow',
        executor_type: 'AI',
      };

      // Mock workflow verification to return null
      (global.mockSupabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockSupabaseSuccess(null)),
      });

      const request = createMockRequest({
        method: 'POST',
        body: invalidData,
        user: mockUser,
      });

      const response = await POST(request);
      const data = await extractResponseData(response);

      expect(response.status).toBe(400);
      assertErrorResponse(data, 'Validation Error');
      expect(data.error.message).toBe('Invalid workflow ID');
    });

    it('should deny client users access to other company workflows', async () => {
      const clientUser = createMockUser({ 
        user_type: 'client_user', 
        company_id: 'client-company' 
      });
      
      const otherCompanyWorkflow = createMockWorkflow({ 
        client_id: 'other-company' 
      });

      const taskData = {
        workflow_id: otherCompanyWorkflow.id,
        title: 'Unauthorized Task',
        executor_type: 'AI',
      };

      // Mock workflow verification
      (global.mockSupabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockSupabaseSuccess(otherCompanyWorkflow)),
      });

      const request = createMockRequest({
        method: 'POST',
        body: taskData,
        user: clientUser,
      });

      const response = await POST(request);
      const data = await extractResponseData(response);

      expect(response.status).toBe(403);
      assertErrorResponse(data, 'Forbidden');
    });

    it('should create task dependencies when specified', async () => {
      const taskData = {
        workflow_id: 'WF-TEST-001',
        title: 'Task with Dependencies',
        executor_type: 'AI',
        dependencies: ['TASK-DEP-001', 'TASK-DEP-002'],
      };

      // Mock workflow verification
      (global.mockSupabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockSupabaseSuccess(mockWorkflow)),
      });

      // Mock task creation
      (global.mockSupabase.from as jest.Mock).mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue(mockSupabaseSuccess([{
          ...mockTask,
          ...taskData,
        }])),
      });

      // Mock dependency creation
      (global.mockSupabase.from as jest.Mock).mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue(mockSupabaseSuccess(null)),
      });

      const request = createMockRequest({
        method: 'POST',
        body: taskData,
        user: mockUser,
      });

      const response = await POST(request);
      const data = await extractResponseData(response);

      expect(response.status).toBe(200);
      assertApiResponse(data);
    });

    it('should handle database insertion errors', async () => {
      const validData = {
        workflow_id: 'WF-TEST-001',
        title: 'Test Task',
        executor_type: 'AI',
      };

      // Mock workflow verification
      (global.mockSupabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockSupabaseSuccess(mockWorkflow)),
      });

      // Mock task creation failure
      (global.mockSupabase.from as jest.Mock).mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue(mockSupabaseError('Insertion failed')),
      });

      const request = createMockRequest({
        method: 'POST',
        body: validData,
        user: mockUser,
      });

      const response = await POST(request);
      const data = await extractResponseData(response);

      expect(response.status).toBe(500);
      assertErrorResponse(data, 'Database Error');
    });
  });
});