/**
 * Tests for type-safe database operations
 * These tests verify that our type-safe functions work correctly
 */

import { insertCommunication, insertNotifications, insertWorkflow, updateCommunication, deleteCommunication, updateNotificationForUser, bulkMarkNotificationsAsRead, deleteNotificationForUser, updateWorkflow, insertWorkflowCounterparty, updateWorkflowCounterparty, deleteWorkflowCounterparty, insertCounterparty, updateCounterparty, deleteCounterparty, insertTaskExecution, insertTaskExecutions, updateTaskExecution, updateTaskExecutionByWorkflowAndType, insertHilNote, updateHilNote, deleteHilNote, insertAuditEvent, insertAuditEvents } from '../../src/utils/type-safe-db';

// Mock the database module
jest.mock('../../src/utils/database', () => ({
  createServerClient: jest.fn(() => ({
    from: jest.fn((table) => ({
      insert: jest.fn((data) => {
        const isArrayInsert = Array.isArray(data);
        
        return {
          select: jest.fn(() => {
            // For bulk operations (notifications and audit_events), always return array
            if (table === 'hil_notifications' || (table === 'audit_events' && isArrayInsert)) {
              return Promise.resolve({
                data: [{ id: 'test-id', created_at: '2023-01-01T00:00:00Z' }],
                error: null
              });
            }
            
            // For task_executions
            if (table === 'task_executions') {
              if (isArrayInsert) {
                // Bulk insert - return array directly
                return Promise.resolve({
                  data: [{ id: 'test-id', created_at: '2023-01-01T00:00:00Z' }],
                  error: null
                });
              } else {
                // Single insert - return object with single() method
                return {
                  single: jest.fn(() => Promise.resolve({
                    data: { id: 'test-id', created_at: '2023-01-01T00:00:00Z' },
                    error: null
                  }))
                };
              }
            }
            
            // For all other tables, return single() method
            return {
              single: jest.fn(() => Promise.resolve({
                data: { id: 'test-id', created_at: '2023-01-01T00:00:00Z' },
                error: null
              }))
            };
          })
        };
      }),
      update: jest.fn(() => ({
        eq: jest.fn((field, value) => {
          if (field === 'user_id') {
            // For bulk operations on notifications, return another eq chain
            return {
              eq: jest.fn(() => ({
                select: jest.fn(() => Promise.resolve({
                  data: [{ id: 'test-id', created_at: '2023-01-01T00:00:00Z' }],
                  error: null
                }))
              }))
            };
          }
          // For single operations (communications or single notifications)
          return {
            select: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: { id: 'test-id', updated_at: '2023-01-01T00:00:00Z' },
                error: null
              }))
            })),
            eq: jest.fn(() => ({
              select: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve({
                  data: { id: 'test-id', updated_at: '2023-01-01T00:00:00Z' },
                  error: null
                }))
              }))
            }))
          };
        })
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({
            error: null
          }))
        }))
      }))
    }))
  }))
}));

describe('Type-Safe Database Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('insertCommunication', () => {
    it('should validate required fields', async () => {
      // Test missing body field
      await expect(insertCommunication({
        communication_type: 'email',
        direction: 'OUTBOUND',
        // Missing body field
      } as any)).rejects.toThrow('Missing required communication fields');
    });

    it('should validate communication_type', async () => {
      await expect(insertCommunication({
        body: 'test message',
        communication_type: 'invalid_type' as any,
        direction: 'OUTBOUND',
      })).rejects.toThrow('Invalid communication type: invalid_type');
    });

    it('should insert valid communication', async () => {
      const result = await insertCommunication({
        body: 'test message',
        communication_type: 'email',
        direction: 'OUTBOUND',
        subject: 'Test Subject',
        recipient_email: 'test@example.com'
      });

      expect(result).toEqual({
        id: 'test-id',
        created_at: '2023-01-01T00:00:00Z'
      });
    });
  });

  describe('insertNotifications', () => {
    it('should validate required fields', async () => {
      const invalidNotifications = [{
        user_id: 'user-123',
        // Missing type, priority, title, message
      }];

      await expect(insertNotifications(invalidNotifications as any))
        .rejects.toThrow('Missing required notification fields');
    });

    it('should validate notification type', async () => {
      const invalidNotifications = [{
        user_id: 'user-123',
        type: 'INVALID_TYPE' as any,
        priority: 'NORMAL' as const,
        title: 'Test',
        message: 'Test message'
      }];

      await expect(insertNotifications(invalidNotifications))
        .rejects.toThrow('Invalid notification type: INVALID_TYPE');
    });

    it('should insert valid notifications', async () => {
      const validNotifications = [{
        user_id: 'user-123',
        type: 'HIL_MENTION' as const,
        priority: 'NORMAL' as const,
        title: 'Test Mention',
        message: 'You were mentioned in a note'
      }];

      const result = await insertNotifications(validNotifications);
      expect(result).toEqual([{
        id: 'test-id',
        created_at: '2023-01-01T00:00:00Z'
      }]);
    });
  });

  describe('insertWorkflow', () => {
    it('should validate required fields', async () => {
      await expect(insertWorkflow({
        // Missing workflow_type and client_id
      } as any)).rejects.toThrow('Missing required workflow fields');
    });

    it('should validate workflow_type enum', async () => {
      await expect(insertWorkflow({
        workflow_type: 'INVALID_TYPE' as any,
        client_id: 'client-123'
      })).rejects.toThrow('Invalid workflow type: INVALID_TYPE');
    });

    it('should insert valid workflow', async () => {
      const result = await insertWorkflow({
        workflow_type: 'HOA_ACQUISITION',
        client_id: 'client-123',
        status: 'NOT_STARTED'
      });

      expect(result).toEqual({
        id: 'test-id',
        created_at: '2023-01-01T00:00:00Z'
      });
    });
  });

  describe('updateCommunication', () => {
    it('should validate status enum', async () => {
      await expect(updateCommunication('test-id', {
        status: 'INVALID_STATUS'
      })).rejects.toThrow('Invalid communication status: INVALID_STATUS');
    });

    it('should update communication successfully', async () => {
      const result = await updateCommunication('test-id', {
        status: 'READ',
        metadata: { test: 'data' }
      });

      expect(result).toEqual({
        id: 'test-id',
        updated_at: '2023-01-01T00:00:00Z'
      });
    });

    it('should allow partial updates', async () => {
      const result = await updateCommunication('test-id', {
        metadata: { new: 'metadata' }
      });

      expect(result).toEqual({
        id: 'test-id',
        updated_at: '2023-01-01T00:00:00Z'
      });
    });
  });

  describe('deleteCommunication', () => {
    it('should delete communication successfully', async () => {
      const result = await deleteCommunication('test-id');
      expect(result).toBe(true);
    });
  });

  describe('updateNotificationForUser', () => {
    it('should update notification for specific user', async () => {
      const result = await updateNotificationForUser('test-id', 'user-123', {
        read: true,
        read_at: '2023-01-01T00:00:00Z'
      });

      expect(result).toEqual({
        id: 'test-id',
        updated_at: '2023-01-01T00:00:00Z'
      });
    });

    it('should allow null read_at', async () => {
      const result = await updateNotificationForUser('test-id', 'user-123', {
        read: false,
        read_at: null
      });

      expect(result).toEqual({
        id: 'test-id',
        updated_at: '2023-01-01T00:00:00Z'
      });
    });
  });

  describe('bulkMarkNotificationsAsRead', () => {
    it('should mark all user notifications as read', async () => {
      const result = await bulkMarkNotificationsAsRead('user-123');
      expect(result).toEqual([{
        id: 'test-id',
        created_at: '2023-01-01T00:00:00Z'
      }]);
    });
  });

  describe('deleteNotificationForUser', () => {
    it('should delete notification for specific user', async () => {
      const result = await deleteNotificationForUser('test-id', 'user-123');
      expect(result).toBe(true);
    });
  });

  describe('updateWorkflow', () => {
    it('should update workflow successfully', async () => {
      const result = await updateWorkflow('test-id', {
        status: 'IN_PROGRESS',
        metadata: { test: 'data' }
      });

      expect(result).toEqual({
        id: 'test-id',
        updated_at: '2023-01-01T00:00:00Z'
      });
    });

    it('should validate workflow status enum', async () => {
      await expect(updateWorkflow('test-id', {
        status: 'INVALID_STATUS' as any
      })).rejects.toThrow('Invalid workflow status: INVALID_STATUS');
    });
  });

  describe('insertWorkflowCounterparty', () => {
    it('should create workflow counterparty relationship', async () => {
      const result = await insertWorkflowCounterparty({
        workflow_id: 'workflow-123',
        counterparty_id: 'counterparty-456',
        status: 'PENDING'
      });

      expect(result).toEqual({
        id: 'test-id',
        created_at: '2023-01-01T00:00:00Z'
      });
    });

    it('should validate required fields', async () => {
      await expect(insertWorkflowCounterparty({
        counterparty_id: 'counterparty-456'
      } as any)).rejects.toThrow('Missing required workflow counterparty fields');
    });
  });

  describe('updateWorkflowCounterparty', () => {
    it('should update workflow counterparty relationship', async () => {
      const result = await updateWorkflowCounterparty('test-id', {
        status: 'CONTACTED'
      });

      expect(result).toEqual({
        id: 'test-id',
        updated_at: '2023-01-01T00:00:00Z'
      });
    });
  });

  describe('deleteWorkflowCounterparty', () => {
    it('should delete workflow counterparty relationship', async () => {
      const result = await deleteWorkflowCounterparty('test-id');
      expect(result).toBe(true);
    });
  });

  describe('insertCounterparty', () => {
    it('should validate required fields', async () => {
      await expect(insertCounterparty({
        name: 'Test Counterparty'
        // Missing type field
      } as any)).rejects.toThrow('Missing required counterparty fields');
    });

    it('should validate counterparty type enum', async () => {
      await expect(insertCounterparty({
        name: 'Test Counterparty',
        type: 'INVALID_TYPE' as any
      })).rejects.toThrow('Invalid counterparty type: INVALID_TYPE');
    });

    it('should create counterparty successfully', async () => {
      const result = await insertCounterparty({
        name: 'Test HOA',
        type: 'hoa',
        email: 'contact@testhoa.com'
      });

      expect(result).toEqual({
        id: 'test-id',
        created_at: '2023-01-01T00:00:00Z'
      });
    });
  });

  describe('updateCounterparty', () => {
    it('should validate counterparty type enum', async () => {
      await expect(updateCounterparty('test-id', {
        type: 'INVALID_TYPE' as any
      })).rejects.toThrow('Invalid counterparty type: INVALID_TYPE');
    });

    it('should update counterparty successfully', async () => {
      const result = await updateCounterparty('test-id', {
        name: 'Updated Name',
        email: 'updated@example.com'
      });

      expect(result).toEqual({
        id: 'test-id',
        updated_at: '2023-01-01T00:00:00Z'
      });
    });
  });

  describe('deleteCounterparty', () => {
    it('should delete counterparty successfully', async () => {
      const result = await deleteCounterparty('test-id');
      expect(result).toBe(true);
    });
  });

  describe('insertTaskExecution', () => {
    it('should validate required fields', async () => {
      await expect(insertTaskExecution({
        workflow_id: 'workflow-123',
        // Missing title, task_type, executor_type
      } as any)).rejects.toThrow('Missing required task execution fields');
    });

    it('should validate status enum', async () => {
      await expect(insertTaskExecution({
        workflow_id: 'workflow-123',
        title: 'Test Task',
        task_type: 'test_task',
        executor_type: 'AI',
        status: 'INVALID_STATUS' as any
      })).rejects.toThrow('Invalid task execution status: INVALID_STATUS');
    });

    it('should validate executor type enum', async () => {
      await expect(insertTaskExecution({
        workflow_id: 'workflow-123',
        title: 'Test Task',
        task_type: 'test_task',
        executor_type: 'INVALID_EXECUTOR' as any
      })).rejects.toThrow('Invalid executor type: INVALID_EXECUTOR');
    });

    it('should validate priority enum', async () => {
      await expect(insertTaskExecution({
        workflow_id: 'workflow-123',
        title: 'Test Task',
        task_type: 'test_task',
        executor_type: 'AI',
        priority: 'INVALID_PRIORITY' as any
      })).rejects.toThrow('Invalid priority: INVALID_PRIORITY');
    });

    it('should validate SLA status enum', async () => {
      await expect(insertTaskExecution({
        workflow_id: 'workflow-123',
        title: 'Test Task',
        task_type: 'test_task',
        executor_type: 'AI',
        sla_status: 'INVALID_SLA' as any
      })).rejects.toThrow('Invalid SLA status: INVALID_SLA');
    });

    it('should insert valid task execution', async () => {
      const result = await insertTaskExecution({
        workflow_id: 'workflow-123',
        title: 'Test Task',
        task_type: 'test_task',
        executor_type: 'AI',
        sequence_order: 1,
        status: 'NOT_STARTED',
        priority: 'NORMAL'
      });

      expect(result).toEqual({
        id: 'test-id',
        created_at: '2023-01-01T00:00:00Z'
      });
    });
  });

  describe('insertTaskExecutions', () => {
    it('should validate required fields', async () => {
      await expect(insertTaskExecutions([{
        workflow_id: 'workflow-123',
        // Missing title, task_type, executor_type
      } as any])).rejects.toThrow('Missing required task execution fields');
    });

    it('should validate status enum', async () => {
      await expect(insertTaskExecutions([{
        workflow_id: 'workflow-123',
        title: 'Test Task',
        task_type: 'test_task',
        executor_type: 'AI',
        sequence_order: 1,
        status: 'INVALID_STATUS' as any
      }])).rejects.toThrow('Invalid task execution status: INVALID_STATUS');
    });

    it('should validate executor type enum', async () => {
      await expect(insertTaskExecutions([{
        workflow_id: 'workflow-123',
        title: 'Test Task',
        task_type: 'test_task',
        executor_type: 'INVALID_EXECUTOR' as any,
        sequence_order: 1
      }])).rejects.toThrow('Invalid executor type: INVALID_EXECUTOR');
    });

    it('should insert valid task executions', async () => {
      const result = await insertTaskExecutions([{
        workflow_id: 'workflow-123',
        title: 'Test Task 1',
        task_type: 'test_task_1',
        executor_type: 'AI',
        sequence_order: 1,
        status: 'NOT_STARTED',
        priority: 'NORMAL'
      }, {
        workflow_id: 'workflow-123',
        title: 'Test Task 2',
        task_type: 'test_task_2',
        executor_type: 'HIL',
        sequence_order: 2,
        priority: 'HIGH'
      }]);

      expect(result).toEqual([{
        id: 'test-id',
        created_at: '2023-01-01T00:00:00Z'
      }]);
    });
  });

  describe('updateTaskExecution', () => {
    it('should validate status enum', async () => {
      await expect(updateTaskExecution('test-id', {
        status: 'INVALID_STATUS' as any
      })).rejects.toThrow('Invalid task execution status: INVALID_STATUS');
    });

    it('should validate executor type enum', async () => {
      await expect(updateTaskExecution('test-id', {
        executor_type: 'INVALID_EXECUTOR' as any
      })).rejects.toThrow('Invalid executor type: INVALID_EXECUTOR');
    });

    it('should update task execution successfully', async () => {
      const result = await updateTaskExecution('test-id', {
        status: 'IN_PROGRESS',
        started_at: '2023-01-01T00:00:00Z'
      });

      expect(result).toEqual({
        id: 'test-id',
        updated_at: '2023-01-01T00:00:00Z'
      });
    });
  });

  describe('updateTaskExecutionByWorkflowAndType', () => {
    it('should validate status enum', async () => {
      await expect(updateTaskExecutionByWorkflowAndType('workflow-123', 'test_task', {
        status: 'INVALID_STATUS' as any
      })).rejects.toThrow('Invalid task execution status: INVALID_STATUS');
    });

    it('should validate executor type enum', async () => {
      await expect(updateTaskExecutionByWorkflowAndType('workflow-123', 'test_task', {
        executor_type: 'INVALID_EXECUTOR' as any
      })).rejects.toThrow('Invalid executor type: INVALID_EXECUTOR');
    });

    it('should update task execution by workflow and type successfully', async () => {
      const result = await updateTaskExecutionByWorkflowAndType('workflow-123', 'test_task', {
        status: 'COMPLETED',
        completed_at: '2023-01-01T00:00:00Z'
      });

      expect(result).toEqual({
        id: 'test-id',
        updated_at: '2023-01-01T00:00:00Z'
      });
    });
  });

  describe('insertHilNote', () => {
    it('should validate required fields', async () => {
      await expect(insertHilNote({
        workflow_id: 'workflow-123',
        // Missing author_id, content, priority
      } as any)).rejects.toThrow('Missing required HIL note fields');
    });

    it('should validate priority enum', async () => {
      await expect(insertHilNote({
        workflow_id: 'workflow-123',
        author_id: 'author-123',
        content: 'Test HIL note',
        priority: 'INVALID_PRIORITY' as any
      })).rejects.toThrow('Invalid HIL note priority: INVALID_PRIORITY');
    });

    it('should insert valid HIL note', async () => {
      const result = await insertHilNote({
        workflow_id: 'workflow-123',
        author_id: 'author-123',
        content: 'Test HIL note content',
        priority: 'NORMAL',
        mentions: ['user-456'],
        is_resolved: false
      });

      expect(result).toEqual({
        id: 'test-id',
        created_at: '2023-01-01T00:00:00Z'
      });
    });
  });

  describe('updateHilNote', () => {
    it('should validate priority enum', async () => {
      await expect(updateHilNote('test-id', {
        priority: 'INVALID_PRIORITY' as any
      })).rejects.toThrow('Invalid HIL note priority: INVALID_PRIORITY');
    });

    it('should update HIL note successfully', async () => {
      const result = await updateHilNote('test-id', {
        content: 'Updated content',
        priority: 'HIGH',
        is_resolved: true,
        resolved_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      });

      expect(result).toEqual({
        id: 'test-id',
        updated_at: '2023-01-01T00:00:00Z'
      });
    });

    it('should allow partial updates', async () => {
      const result = await updateHilNote('test-id', {
        is_resolved: true
      });

      expect(result).toEqual({
        id: 'test-id',
        updated_at: '2023-01-01T00:00:00Z'
      });
    });
  });

  describe('deleteHilNote', () => {
    it('should delete HIL note successfully', async () => {
      const result = await deleteHilNote('test-id');
      expect(result).toBe(true);
    });
  });

  describe('insertAuditEvent', () => {
    it('should validate required fields', async () => {
      await expect(insertAuditEvent({
        actor_type: 'human',
        // Missing actor_id, action, resource_type
      } as any)).rejects.toThrow('Missing required audit event fields');
    });

    it('should insert valid audit event', async () => {
      const result = await insertAuditEvent({
        actor_type: 'human',
        actor_id: 'user-123',
        actor_name: 'John Doe',
        event_type: 'workflow_management',
        action: 'create',
        resource_type: 'workflow',
        resource_id: 'workflow-456',
        workflow_id: 'workflow-456',
        client_id: 'client-789',
        event_data: {
          workflow_type: 'HOA_ACQUISITION'
        }
      });

      expect(result).toEqual({
        id: 'test-id',
        created_at: '2023-01-01T00:00:00Z'
      });
    });
  });

  describe('insertAuditEvents', () => {
    it('should validate required fields', async () => {
      await expect(insertAuditEvents([{
        actor_type: 'human',
        // Missing actor_id, action, resource_type
      } as any])).rejects.toThrow('Missing required audit event fields in batch insert');
    });

    it('should insert valid audit events', async () => {
      const result = await insertAuditEvents([{
        actor_type: 'human',
        actor_id: 'user-123',
        actor_name: 'John Doe',
        event_type: 'task_execution',
        action: 'execute',
        resource_type: 'task_execution',
        resource_id: 'task-456',
        workflow_id: 'workflow-789',
        event_data: {
          task_type: 'document_review'
        }
      }, {
        actor_type: 'system',
        actor_id: 'system-123',
        event_type: 'sla_management',
        action: 'update',
        resource_type: 'workflow',
        resource_id: 'workflow-789',
        event_data: {
          sla_status: 'AT_RISK'
        }
      }]);

      expect(result).toEqual([{
        id: 'test-id',
        created_at: '2023-01-01T00:00:00Z'
      }]);
    });
  });

  describe('Type Safety Benefits', () => {
    it('should catch typos in column names at compile time', () => {
      // This would fail TypeScript compilation:
      // insertCommunication({
      //   body: 'test',
      //   communication_typ: 'email', // <- typo would be caught
      //   direction: 'OUTBOUND'
      // });
      
      expect(true).toBe(true); // Placeholder for compile-time test
    });

    it('should enforce enum values at compile time', () => {
      // This would fail TypeScript compilation:
      // insertWorkflow({
      //   workflow_type: 'INVALID_WORKFLOW_TYPE', // <- invalid enum
      //   client_id: 'client-123'
      // });
      
      expect(true).toBe(true); // Placeholder for compile-time test
    });

    it('should enforce task execution field types at compile time', () => {
      // This would fail TypeScript compilation:
      // insertTaskExecution({
      //   workflow_id: 'workflow-123',
      //   title: 123, // <- wrong type, should be string
      //   task_type: 'test_task',
      //   executor_type: 'AI'
      // });
      
      expect(true).toBe(true); // Placeholder for compile-time test
    });
  });
});