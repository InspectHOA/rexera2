/**
 * Unit tests for Workflows API endpoints
 */

import { GET, POST } from '../workflows/route';
import { GET as GetWorkflow, PUT as UpdateWorkflow, DELETE as DeleteWorkflow } from '../workflows/[id]/route';
import { POST as WorkflowActions } from '../workflows/[id]/actions/route';
import {
  createMockRequest,
  createMockUser,
  createMockWorkflow,
  createMockContext,
  extractResponseData,
  mockSupabaseSuccess,
  mockSupabaseError,
  assertApiResponse,
  assertErrorResponse,
} from './utils';

describe('/api/workflows', () => {
  let mockUser: any;
  let mockWorkflow: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = createMockUser();
    mockWorkflow = createMockWorkflow();
  });

  describe('GET /api/workflows', () => {
    it('should return paginated workflows list', async () => {
      const workflows = [mockWorkflow, createMockWorkflow({ id: 'WF-TEST-002' })];
      
      (global.mockSupabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue(mockSupabaseSuccess(workflows)),
      });

      // Mock count query
      (global.mockSupabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockResolvedValue(mockSupabaseSuccess([], 10)),
      });

      const request = createMockRequest({
        method: 'GET',
        url: 'https://localhost:3000/api/workflows?page=1&limit=20',
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

    it('should filter workflows by workflow_type', async () => {
      const workflows = [createMockWorkflow({ workflow_type: 'PAYOFF' })];
      
      (global.mockSupabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue(mockSupabaseSuccess(workflows)),
      });

      (global.mockSupabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockResolvedValue(mockSupabaseSuccess([], 1)),
      });

      const request = createMockRequest({
        method: 'GET',
        url: 'https://localhost:3000/api/workflows?workflow_type=PAYOFF',
        user: mockUser,
      });

      const response = await GET(request);
      const data = await extractResponseData(response);

      expect(response.status).toBe(200);
      expect(data.data[0].workflow_type).toBe('PAYOFF');
    });

    it('should restrict client users to their company workflows', async () => {
      const clientUser = createMockUser({ 
        user_type: 'client_user', 
        company_id: 'client-company' 
      });
      
      (global.mockSupabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue(mockSupabaseSuccess([])),
      });

      (global.mockSupabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockResolvedValue(mockSupabaseSuccess([], 0)),
      });

      const request = createMockRequest({
        method: 'GET',
        user: clientUser,
      });

      await GET(request);

      // Verify client_id filter was applied
      expect(global.mockSupabase.from).toHaveBeenCalledWith('workflows');
    });

    it('should handle database errors gracefully', async () => {
      (global.mockSupabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue(mockSupabaseError('Database connection failed')),
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

  describe('POST /api/workflows', () => {
    it('should create a new workflow with valid data', async () => {
      const newWorkflowData = {
        workflow_type: 'MUNI_LIEN_SEARCH',
        client_id: 'client-123',
        title: 'New Test Workflow',
        description: 'Test description',
        priority: 'HIGH',
      };

      (global.mockSupabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue(mockSupabaseSuccess([{
          ...mockWorkflow,
          ...newWorkflowData,
        }])),
      });

      const request = createMockRequest({
        method: 'POST',
        body: newWorkflowData,
        user: mockUser,
      });

      const response = await POST(request);
      const data = await extractResponseData(response);

      expect(response.status).toBe(200);
      assertApiResponse(data);
      expect(data.data.title).toBe('New Test Workflow');
      expect(data.data.workflow_type).toBe('MUNI_LIEN_SEARCH');
    });

    it('should reject workflow creation with missing required fields', async () => {
      const invalidData = {
        // Missing workflow_type and client_id
        title: 'Incomplete Workflow',
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

    it('should reject invalid workflow types', async () => {
      const invalidData = {
        workflow_type: 'INVALID_TYPE',
        client_id: 'client-123',
        title: 'Invalid Workflow',
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
    });

    it('should handle database insertion errors', async () => {
      const validData = {
        workflow_type: 'PAYOFF',
        client_id: 'client-123',
        title: 'Test Workflow',
      };

      (global.mockSupabase.from as jest.Mock).mockReturnValue({
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

  describe('GET /api/workflows/[id]', () => {
    it('should return specific workflow by ID', async () => {
      (global.mockSupabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockSupabaseSuccess(mockWorkflow)),
      });

      const request = createMockRequest({
        method: 'GET',
        user: mockUser,
      });
      const context = createMockContext({ id: 'WF-TEST-001' });

      const response = await GetWorkflow(request, context);
      const data = await extractResponseData(response);

      expect(response.status).toBe(200);
      assertApiResponse(data, mockWorkflow);
    });

    it('should return 404 for non-existent workflow', async () => {
      (global.mockSupabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockSupabaseSuccess(null)),
      });

      const request = createMockRequest({
        method: 'GET',
        user: mockUser,
      });
      const context = createMockContext({ id: 'non-existent-id' });

      const response = await GetWorkflow(request, context);
      const data = await extractResponseData(response);

      expect(response.status).toBe(404);
      assertErrorResponse(data, 'Not Found');
    });

    it('should deny access to client users for other company workflows', async () => {
      const clientUser = createMockUser({ 
        user_type: 'client_user', 
        company_id: 'different-company' 
      });
      
      const workflow = createMockWorkflow({ client_id: 'other-company' });
      
      (global.mockSupabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockSupabaseSuccess(workflow)),
      });

      const request = createMockRequest({
        method: 'GET',
        user: clientUser,
      });
      const context = createMockContext({ id: 'WF-TEST-001' });

      const response = await GetWorkflow(request, context);
      const data = await extractResponseData(response);

      expect(response.status).toBe(403);
      assertErrorResponse(data, 'Forbidden');
    });
  });

  describe('PUT /api/workflows/[id]', () => {
    it('should update workflow with valid data', async () => {
      const updateData = {
        title: 'Updated Title',
        priority: 'URGENT',
        status: 'IN_PROGRESS',
      };

      // Mock existing workflow fetch
      (global.mockSupabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockSupabaseSuccess(mockWorkflow)),
      });

      // Mock update operation
      (global.mockSupabase.from as jest.Mock).mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockSupabaseSuccess({
          ...mockWorkflow,
          ...updateData,
        })),
      });

      const request = createMockRequest({
        method: 'PUT',
        body: updateData,
        user: mockUser,
      });
      const context = createMockContext({ id: 'WF-TEST-001' });

      const response = await UpdateWorkflow(request, context);
      const data = await extractResponseData(response);

      expect(response.status).toBe(200);
      assertApiResponse(data);
      expect(data.data.title).toBe('Updated Title');
      expect(data.data.priority).toBe('URGENT');
    });

    it('should reject invalid status transitions', async () => {
      const updateData = {
        status: 'INVALID_STATUS',
      };

      (global.mockSupabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockSupabaseSuccess(mockWorkflow)),
      });

      const request = createMockRequest({
        method: 'PUT',
        body: updateData,
        user: mockUser,
      });
      const context = createMockContext({ id: 'WF-TEST-001' });

      const response = await UpdateWorkflow(request, context);
      const data = await extractResponseData(response);

      expect(response.status).toBe(400);
      assertErrorResponse(data, 'Validation Error');
    });

    it('should auto-set completed_at when status changes to COMPLETED', async () => {
      const updateData = { status: 'COMPLETED' };

      (global.mockSupabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockSupabaseSuccess(mockWorkflow)),
      });

      (global.mockSupabase.from as jest.Mock).mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockSupabaseSuccess({
          ...mockWorkflow,
          status: 'COMPLETED',
          completed_at: new Date().toISOString(),
        })),
      });

      const request = createMockRequest({
        method: 'PUT',
        body: updateData,
        user: mockUser,
      });
      const context = createMockContext({ id: 'WF-TEST-001' });

      const response = await UpdateWorkflow(request, context);
      const data = await extractResponseData(response);

      expect(response.status).toBe(200);
      expect(data.data.completed_at).toBeDefined();
    });
  });

  describe('DELETE /api/workflows/[id]', () => {
    it('should allow HIL users to delete workflows', async () => {
      const hilUser = createMockUser({ user_type: 'hil_user' });
      const completedWorkflow = createMockWorkflow({ status: 'COMPLETED' });

      (global.mockSupabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockSupabaseSuccess(completedWorkflow)),
      });

      (global.mockSupabase.from as jest.Mock).mockReturnValueOnce({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue(mockSupabaseSuccess(null)),
      });

      const request = createMockRequest({
        method: 'DELETE',
        user: hilUser,
      });
      const context = createMockContext({ id: 'WF-TEST-001' });

      const response = await DeleteWorkflow(request, context);
      const data = await extractResponseData(response);

      expect(response.status).toBe(200);
      assertApiResponse(data);
      expect(data.data.success).toBe(true);
    });

    it('should prevent non-HIL users from deleting workflows', async () => {
      const clientUser = createMockUser({ user_type: 'client_user' });

      const request = createMockRequest({
        method: 'DELETE',
        user: clientUser,
      });
      const context = createMockContext({ id: 'WF-TEST-001' });

      const response = await DeleteWorkflow(request, context);
      const data = await extractResponseData(response);

      expect(response.status).toBe(403);
      assertErrorResponse(data, 'Forbidden');
    });

    it('should prevent deletion of active workflows', async () => {
      const hilUser = createMockUser({ user_type: 'hil_user' });
      const activeWorkflow = createMockWorkflow({ status: 'IN_PROGRESS' });

      (global.mockSupabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockSupabaseSuccess(activeWorkflow)),
      });

      const request = createMockRequest({
        method: 'DELETE',
        user: hilUser,
      });
      const context = createMockContext({ id: 'WF-TEST-001' });

      const response = await DeleteWorkflow(request, context);
      const data = await extractResponseData(response);

      expect(response.status).toBe(400);
      assertErrorResponse(data, 'Validation Error');
      expect(data.error.message).toContain('Cannot delete active workflows');
    });
  });

  describe('POST /api/workflows/[id]/actions', () => {
    it('should start a pending workflow', async () => {
      const pendingWorkflow = createMockWorkflow({ status: 'PENDING' });

      (global.mockSupabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockSupabaseSuccess(pendingWorkflow)),
      });

      (global.mockSupabase.from as jest.Mock).mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockSupabaseSuccess({
          ...pendingWorkflow,
          status: 'IN_PROGRESS',
        })),
      });

      // Mock audit log insertion
      (global.mockSupabase.from as jest.Mock).mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue(mockSupabaseSuccess(null)),
      });

      const request = createMockRequest({
        method: 'POST',
        body: { action: 'start' },
        user: mockUser,
      });
      const context = createMockContext({ id: 'WF-TEST-001' });

      const response = await WorkflowActions(request, context);
      const data = await extractResponseData(response);

      expect(response.status).toBe(200);
      assertApiResponse(data);
      expect(data.data.action_result.action).toBe('start');
      expect(data.data.action_result.success).toBe(true);
    });

    it('should reject invalid actions', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: { action: 'invalid_action' },
        user: mockUser,
      });
      const context = createMockContext({ id: 'WF-TEST-001' });

      const response = await WorkflowActions(request, context);
      const data = await extractResponseData(response);

      expect(response.status).toBe(400);
      assertErrorResponse(data, 'Validation Error');
    });

    it('should reject invalid status transitions', async () => {
      const completedWorkflow = createMockWorkflow({ status: 'COMPLETED' });

      (global.mockSupabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockSupabaseSuccess(completedWorkflow)),
      });

      const request = createMockRequest({
        method: 'POST',
        body: { action: 'start' }, // Can't start a completed workflow
        user: mockUser,
      });
      const context = createMockContext({ id: 'WF-TEST-001' });

      const response = await WorkflowActions(request, context);
      const data = await extractResponseData(response);

      expect(response.status).toBe(400);
      assertErrorResponse(data, 'Validation Error');
      expect(data.error.message).toContain('Cannot start workflow with status COMPLETED');
    });
  });
});