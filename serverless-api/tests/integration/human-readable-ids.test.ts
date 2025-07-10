/**
 * Integration tests for human-readable ID support
 * Tests that all API endpoints correctly handle both UUIDs and human-readable IDs
 */

import request from 'supertest';
import { createServerClient } from '../../src/utils/database';

const API_BASE = 'http://localhost:3001/api';
const TEST_HUMAN_ID = '1001';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe('Human-Readable ID Support', () => {
  let testWorkflowUUID: string;
  
  beforeAll(async () => {
    // Get a real workflow UUID from the database for testing
    const supabase = createServerClient();
    const { data: workflow } = await supabase
      .from('workflows')
      .select('id')
      .eq('human_readable_id', TEST_HUMAN_ID)
      .single();
    
    if (workflow) {
      testWorkflowUUID = workflow.id;
    }
  });

  describe('Workflows API', () => {
    test('should fetch workflow by human-readable ID', async () => {
      const response = await request(API_BASE)
        .get(`/workflows/${TEST_HUMAN_ID}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.human_readable_id).toBe(TEST_HUMAN_ID);
      expect(UUID_PATTERN.test(response.body.data.id)).toBe(true);
    });

    test('should still fetch workflow by UUID', async () => {
      if (!testWorkflowUUID) {
        pending('No test workflow UUID available');
        return;
      }

      const response = await request(API_BASE)
        .get(`/workflows/${testWorkflowUUID}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(testWorkflowUUID);
    });

    test('should return 404 for non-existent human-readable ID', async () => {
      const response = await request(API_BASE)
        .get('/workflows/9999')
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error || response.body.message).toContain('Workflow not found');
    });
  });

  describe('Task Executions API', () => {
    test('should list tasks by human-readable workflow ID', async () => {
      const response = await request(API_BASE)
        .get(`/task-executions?workflowId=${TEST_HUMAN_ID}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should list tasks by UUID', async () => {
      if (!testWorkflowUUID) {
        pending('No test workflow UUID available');
        return;
      }

      const response = await request(API_BASE)
        .get(`/task-executions?workflowId=${testWorkflowUUID}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should return 404 for non-existent workflow ID in tasks', async () => {
      const response = await request(API_BASE)
        .get('/task-executions?workflowId=9999')
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error || response.body.message).toContain('Workflow not found');
    });
  });

  describe('Communications API', () => {
    test('should list communications by human-readable workflow ID', async () => {
      const response = await request(API_BASE)
        .get(`/communications?workflow_id=${TEST_HUMAN_ID}&type=email`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should list communications by UUID', async () => {
      if (!testWorkflowUUID) {
        pending('No test workflow UUID available');
        return;
      }

      const response = await request(API_BASE)
        .get(`/communications?workflow_id=${testWorkflowUUID}&type=email`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should return 404 for non-existent workflow ID in communications', async () => {
      const response = await request(API_BASE)
        .get('/communications?workflow_id=9999&type=email')
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error || response.body.message).toContain('Workflow not found');
    });
  });

  describe('ID Format Validation', () => {
    test('should distinguish between UUIDs and human-readable IDs', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      const humanId = '1001';
      
      expect(UUID_PATTERN.test(uuid)).toBe(true);
      expect(UUID_PATTERN.test(humanId)).toBe(false);
      expect(/^\d+$/.test(humanId)).toBe(true);
      expect(/^\d+$/.test(uuid)).toBe(false);
    });

    test('should handle edge cases in ID format', () => {
      const edgeCases = [
        '0000',           // Four zeros
        '999999',         // Large number
        'abc123',         // Mixed alphanumeric (should fail)
        '',               // Empty string
        '12-34-56',       // Dashes (should fail)
      ];

      edgeCases.forEach(id => {
        const isNumeric = /^\d+$/.test(id);
        const isUUID = UUID_PATTERN.test(id);
        
        // Check expected behavior for each case
        if (id === '' || id === 'abc123' || id === '12-34-56') {
          // These should be neither numeric nor UUID
          expect(isNumeric).toBe(false);
          expect(isUUID).toBe(false);
        } else if (id === '0000' || id === '999999') {
          // These should be numeric only
          expect(isNumeric).toBe(true);
          expect(isUUID).toBe(false);
        }
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed requests gracefully', async () => {
      const malformedRequests = [
        '/workflows/',           // Empty ID
        '/workflows/null',       // Literal null
        '/workflows/undefined',  // Literal undefined
      ];

      for (const path of malformedRequests) {
        const response = await request(API_BASE).get(path);
        expect([400, 404, 500]).toContain(response.status);
        expect(response.body.success).toBe(false);
      }
    });

    test('should maintain backwards compatibility', async () => {
      // This test ensures that existing UUID-based workflows still work
      if (!testWorkflowUUID) {
        pending('No test workflow UUID available');
        return;
      }

      const response = await request(API_BASE)
        .get(`/workflows/${testWorkflowUUID}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testWorkflowUUID);
      
      // Should have human_readable_id populated
      expect(response.body.data.human_readable_id).toBeDefined();
      expect(typeof response.body.data.human_readable_id).toBe('string');
    });
  });
});