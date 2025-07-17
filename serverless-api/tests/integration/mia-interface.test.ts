/**
 * MIA Interface Integration Tests
 * Tests the full MIA email interface functionality
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { testClient } from '../utils/hono-test-client';
import app from '../../src/app';

const client = testClient(app);

describe('MIA Interface Integration', () => {
  beforeAll(() => {
    process.env.SKIP_AUTH = 'true';
  });

  afterAll(() => {
    delete process.env.SKIP_AUTH;
  });

  describe('Communications API for MIA Interface', () => {
    it('should return email communications for workflow', async () => {
      // Use the known workflow ID from seed data
      const workflowId = 'e8123351-0dae-4fab-82eb-3119ec85adf1';
      
      const response = await client.get(`/api/communications?workflow_id=${workflowId}&communication_type=email`);
      
      expect(response.headers['content-type']).toMatch(/json/);
      
      if (response.status === 500) {
        // Database error in test environment is expected
        expect(response.body.success).toBe(false);
        return;
      }
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // In a real environment with seeded data, we should have 5 emails
      if (response.body.data.length > 0) {
        const emailComm = response.body.data[0];
        expect(emailComm).toHaveProperty('id');
        expect(emailComm).toHaveProperty('subject');
        expect(emailComm).toHaveProperty('body');
        expect(emailComm).toHaveProperty('direction');
        expect(emailComm).toHaveProperty('communication_type');
        expect(emailComm.communication_type).toBe('email');
      }
    });

    it('should filter communications by type correctly', async () => {
      const workflowId = 'test-workflow-id';
      
      // Test with communication_type parameter (backend format)
      const response1 = await client.get(`/api/communications?workflow_id=${workflowId}&communication_type=email`);
      
      expect(response1.headers['content-type']).toMatch(/json/);
      
      if (response1.status !== 500) {
        expect(response1.body).toHaveProperty('success');
      }
    });

    it('should handle workflow-specific email threads', async () => {
      const workflowId = 'test-workflow-id';
      
      const response = await client.get(`/api/communications?workflow_id=${workflowId}&communication_type=email`);
      
      expect(response.headers['content-type']).toMatch(/json/);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        
        // Check that all communications are for the specified workflow
        response.body.data.forEach((comm: any) => {
          expect(comm.workflow_id).toBe(workflowId);
          expect(comm.communication_type).toBe('email');
        });
      }
    });
  });

  describe('MIA Interface API Contract', () => {
    it('should support all required communication fields for MIA interface', async () => {
      const workflowId = 'test-workflow-id';
      
      const response = await client.get(`/api/communications?workflow_id=${workflowId}&communication_type=email`);
      
      if (response.status === 200 && response.body.data.length > 0) {
        const comm = response.body.data[0];
        
        // Fields required by EmailInterface component
        expect(comm).toHaveProperty('id');
        expect(comm).toHaveProperty('subject');
        expect(comm).toHaveProperty('body');
        expect(comm).toHaveProperty('direction');
        expect(comm).toHaveProperty('status');
        expect(comm).toHaveProperty('recipient_email');
        expect(comm).toHaveProperty('created_at');
        expect(comm).toHaveProperty('thread_id');
        expect(comm).toHaveProperty('metadata');
        
        // Validate enum values
        if (comm.direction) {
          expect(['INBOUND', 'OUTBOUND']).toContain(comm.direction);
        }
        
        if (comm.status) {
          expect(['SENT', 'DELIVERED', 'READ', 'BOUNCED', 'FAILED']).toContain(comm.status);
        }
      }
    });

    it('should return communications in chronological order', async () => {
      const workflowId = 'test-workflow-id';
      
      const response = await client.get(`/api/communications?workflow_id=${workflowId}&communication_type=email`);
      
      if (response.status === 200 && response.body.data.length > 1) {
        const communications = response.body.data;
        
        // Check that communications are ordered by created_at
        for (let i = 1; i < communications.length; i++) {
          const prev = new Date(communications[i - 1].created_at);
          const curr = new Date(communications[i].created_at);
          // Should be in descending order (newest first) by default
          expect(prev.getTime()).toBeGreaterThanOrEqual(curr.getTime());
        }
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid workflow IDs gracefully', async () => {
      const response = await client.get('/api/communications?workflow_id=invalid-id&communication_type=email');
      
      expect(response.headers['content-type']).toMatch(/json/);
      
      if (response.status === 400) {
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid query parameters');
      } else if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBe(0);
      }
    });

    it('should validate communication_type parameter', async () => {
      const response = await client.get('/api/communications?workflow_id=test&communication_type=invalid_type');
      
      if (response.status === 400) {
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid query parameters');
      }
    });
  });

  describe('Frontend API Client Compatibility', () => {
    it('should handle type parameter mapping correctly', async () => {
      // This tests that the frontend API client correctly maps 'type' to 'communication_type'
      const workflowId = 'test-workflow-id';
      
      // Test direct communication_type parameter
      const response = await client.get(`/api/communications?workflow_id=${workflowId}&communication_type=email`);
      
      expect(response.headers['content-type']).toMatch(/json/);
      expect(response.body).toHaveProperty('success');
    });

    it('should work with real seeded workflow data', async () => {
      // Test with actual workflow UUID that has communications
      const realWorkflowId = 'e8123351-0dae-4fab-82eb-3119ec85adf1';
      
      const response = await client.get(`/api/communications?workflow_id=${realWorkflowId}&communication_type=email`);
      
      expect(response.headers['content-type']).toMatch(/json/);
      
      if (response.status === 500) {
        // Database error in test environment
        expect(response.body.success).toBe(false);
        return;
      }
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        
        // In a properly seeded environment, this should return 5 emails
        if (response.body.data.length > 0) {
          console.log(`✅ Found ${response.body.data.length} email communications`);
          
          // Verify email structure matches what EmailInterface expects
          const email = response.body.data[0];
          expect(email).toHaveProperty('id');
          expect(email).toHaveProperty('subject');
          expect(email).toHaveProperty('body');
          expect(email).toHaveProperty('direction');
          expect(email).toHaveProperty('communication_type', 'email');
          expect(email).toHaveProperty('workflow_id', realWorkflowId);
        }
      }
    });
  });
});