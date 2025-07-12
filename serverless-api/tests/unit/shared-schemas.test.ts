/**
 * Unit tests for the new shared schemas
 * Tests the schemas added for the Hono implementation
 */

import { 
  WorkflowSchema,
  CreateWorkflowSchema,
  WorkflowFiltersSchema,
  WorkflowWithRelationsSchema
} from '@rexera/shared';

describe('Shared Workflow Schemas', () => {
  
  describe('WorkflowSchema', () => {
    const validWorkflow = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      workflow_type: 'PAYOFF_REQUEST',
      client_id: '550e8400-e29b-41d4-a716-446655440001',
      title: 'Test Payoff Request',
      description: 'Test description',
      status: 'PENDING',
      priority: 'NORMAL',
      metadata: { test: true },
      created_by: '550e8400-e29b-41d4-a716-446655440002',
      assigned_to: '550e8400-e29b-41d4-a716-446655440003',
      created_at: '2025-07-11T10:00:00.000Z',
      updated_at: '2025-07-11T10:00:00.000Z',
      completed_at: null,
      due_date: '2025-07-14T10:00:00.000Z',
      n8n_execution_id: 'exec_123',
      human_readable_id: 'PAYOFF-1001',
    };

    it('should validate correct workflow data', () => {
      const result = WorkflowSchema.safeParse(validWorkflow);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(validWorkflow.id);
        expect(result.data.workflow_type).toBe('PAYOFF_REQUEST');
        expect(result.data.priority).toBe('NORMAL');
      }
    });

    it('should reject invalid workflow_type', () => {
      const invalidWorkflow = { ...validWorkflow, workflow_type: 'INVALID_TYPE' };
      const result = WorkflowSchema.safeParse(invalidWorkflow);
      expect(result.success).toBe(false);
    });

    it('should reject invalid UUID format', () => {
      const invalidWorkflow = { ...validWorkflow, id: 'not-a-uuid' };
      const result = WorkflowSchema.safeParse(invalidWorkflow);
      expect(result.success).toBe(false);
    });

    it('should reject invalid status', () => {
      const invalidWorkflow = { ...validWorkflow, status: 'INVALID_STATUS' };
      const result = WorkflowSchema.safeParse(invalidWorkflow);
      expect(result.success).toBe(false);
    });

    it('should reject invalid priority', () => {
      const invalidWorkflow = { ...validWorkflow, priority: 'INVALID_PRIORITY' };
      const result = WorkflowSchema.safeParse(invalidWorkflow);
      expect(result.success).toBe(false);
    });
  });

  describe('CreateWorkflowSchema', () => {
    const validCreateData = {
      workflow_type: 'HOA_ACQUISITION',
      client_id: '550e8400-e29b-41d4-a716-446655440001',
      title: 'Test HOA Request',
      description: 'Test description',
      priority: 'HIGH',
      metadata: { property: 'Test Property' },
      due_date: '2025-07-14T10:00:00.000Z',
      created_by: '550e8400-e29b-41d4-a716-446655440002',
    };

    it('should validate correct create workflow data', () => {
      const result = CreateWorkflowSchema.safeParse(validCreateData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.workflow_type).toBe('HOA_ACQUISITION');
        expect(result.data.priority).toBe('HIGH');
      }
    });

    it('should apply default priority', () => {
      const dataWithoutPriority: any = { ...validCreateData };
      delete dataWithoutPriority.priority;
      
      const result = CreateWorkflowSchema.safeParse(dataWithoutPriority);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priority).toBe('NORMAL');
      }
    });

    it('should apply default metadata', () => {
      const dataWithoutMetadata: any = { ...validCreateData };
      delete dataWithoutMetadata.metadata;
      
      const result = CreateWorkflowSchema.safeParse(dataWithoutMetadata);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.metadata).toEqual({});
      }
    });

    it('should reject missing required fields', () => {
      const dataWithoutTitle: any = { ...validCreateData };
      delete dataWithoutTitle.title;
      
      const result = CreateWorkflowSchema.safeParse(dataWithoutTitle);
      expect(result.success).toBe(false);
    });

    it('should validate title length constraints', () => {
      const dataWithLongTitle = { 
        ...validCreateData, 
        title: 'x'.repeat(201) // Exceeds max length of 200
      };
      
      const result = CreateWorkflowSchema.safeParse(dataWithLongTitle);
      expect(result.success).toBe(false);
    });

    it('should validate description length constraints', () => {
      const dataWithLongDescription = { 
        ...validCreateData, 
        description: 'x'.repeat(1001) // Exceeds max length of 1000
      };
      
      const result = CreateWorkflowSchema.safeParse(dataWithLongDescription);
      expect(result.success).toBe(false);
    });
  });

  describe('WorkflowFiltersSchema', () => {
    it('should validate correct filter data', () => {
      const filters = {
        workflow_type: 'MUNI_LIEN_SEARCH',
        status: 'IN_PROGRESS',
        client_id: '550e8400-e29b-41d4-a716-446655440001',
        assigned_to: '550e8400-e29b-41d4-a716-446655440002',
        priority: 'URGENT',
        page: '2',
        limit: '50',
        include: 'client,tasks',
      };

      const result = WorkflowFiltersSchema.safeParse(filters);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2); // Should be coerced to number
        expect(result.data.limit).toBe(50); // Should be coerced to number
        expect(result.data.workflow_type).toBe('MUNI_LIEN_SEARCH');
      }
    });

    it('should apply default pagination values', () => {
      const result = WorkflowFiltersSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it('should enforce limit constraints', () => {
      const filtersWithHighLimit = { limit: '101' }; // Exceeds max of 100
      const result = WorkflowFiltersSchema.safeParse(filtersWithHighLimit);
      expect(result.success).toBe(false);
    });

    it('should enforce page constraints', () => {
      const filtersWithZeroPage = { page: '0' }; // Below min of 1
      const result = WorkflowFiltersSchema.safeParse(filtersWithZeroPage);
      expect(result.success).toBe(false);
    });

    it('should validate sorting parameters', () => {
      const filtersWithSorting = { 
        sortBy: 'created_at',
        sortDirection: 'desc'
      };
      const result = WorkflowFiltersSchema.safeParse(filtersWithSorting);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sortBy).toBe('created_at');
        expect(result.data.sortDirection).toBe('desc');
      }
    });

    it('should reject invalid sortBy values', () => {
      const filtersWithInvalidSort = { sortBy: 'invalid_field' };
      const result = WorkflowFiltersSchema.safeParse(filtersWithInvalidSort);
      expect(result.success).toBe(false);
    });

    it('should reject invalid sortDirection values', () => {
      const filtersWithInvalidDirection = { sortDirection: 'invalid_direction' };
      const result = WorkflowFiltersSchema.safeParse(filtersWithInvalidDirection);
      expect(result.success).toBe(false);
    });

    it('should validate interrupt_count sorting', () => {
      const filtersWithInterruptSort = { 
        sortBy: 'interrupt_count',
        sortDirection: 'desc'
      };
      const result = WorkflowFiltersSchema.safeParse(filtersWithInterruptSort);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sortBy).toBe('interrupt_count');
        expect(result.data.sortDirection).toBe('desc');
      }
    });
  });

  describe('WorkflowWithRelationsSchema', () => {
    const validWorkflowWithRelations = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      workflow_type: 'PAYOFF_REQUEST',
      client_id: '550e8400-e29b-41d4-a716-446655440001',
      title: 'Test Payoff Request',
      description: 'Test description',
      status: 'PENDING',
      priority: 'NORMAL',
      metadata: { test: true },
      created_by: '550e8400-e29b-41d4-a716-446655440002',
      assigned_to: '550e8400-e29b-41d4-a716-446655440003',
      created_at: '2025-07-11T10:00:00.000Z',
      updated_at: '2025-07-11T10:00:00.000Z',
      completed_at: null,
      due_date: '2025-07-14T10:00:00.000Z',
      n8n_execution_id: 'exec_123',
      human_readable_id: 'PAYOFF-1001',
      clients: {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Test Client',
        domain: 'testclient.com',
      },
      assigned_user: {
        id: '550e8400-e29b-41d4-a716-446655440003',
        full_name: 'John Doe',
        email: 'john.doe@example.com',
      },
      task_executions: [],
      tasks: [],
    };

    it('should validate workflow with relations', () => {
      const result = WorkflowWithRelationsSchema.safeParse(validWorkflowWithRelations);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.clients?.name).toBe('Test Client');
        expect(result.data.assigned_user?.full_name).toBe('John Doe');
      }
    });

    it('should allow optional relations', () => {
      const workflowWithoutRelations: any = { ...validWorkflowWithRelations };
      delete workflowWithoutRelations.clients;
      delete workflowWithoutRelations.assigned_user;
      delete workflowWithoutRelations.task_executions;
      delete workflowWithoutRelations.tasks;

      const result = WorkflowWithRelationsSchema.safeParse(workflowWithoutRelations);
      expect(result.success).toBe(true);
    });
  });

  describe('Schema Integration', () => {
    it('should work together for API request/response flow', () => {
      // Simulate API flow: Create request → Database insert → API response
      
      // 1. Validate create request
      const createRequest = {
        workflow_type: 'PAYOFF_REQUEST',
        client_id: '550e8400-e29b-41d4-a716-446655440001',
        title: 'Integration Test Workflow',
      };
      
      const createResult = CreateWorkflowSchema.safeParse(createRequest);
      expect(createResult.success).toBe(true);
      
      // 2. Simulate database record (would be created with additional fields)
      if (createResult.success) {
        const dbRecord = {
          ...createResult.data,
          id: '550e8400-e29b-41d4-a716-446655440000',
          status: 'PENDING',
          created_at: '2025-07-11T10:00:00.000Z',
          updated_at: '2025-07-11T10:00:00.000Z',
          human_readable_id: 'PAYOFF-1001',
        };
        
        // 3. Validate full workflow
        const workflowResult = WorkflowSchema.safeParse(dbRecord);
        expect(workflowResult.success).toBe(true);
      }
    });
  });
});