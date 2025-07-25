/**
 * Workflow-Counterparties Relationship API Integration Tests
 * Comprehensive testing of workflow counterparty management
 */

import { randomUUID } from 'crypto';
import { testClient } from '../utils/hono-test-client';
import { testDataManager, setupTest, cleanupTest, checkDatabaseConnection } from '../utils/database-setup';
import { validCounterpartyFixtures } from '../fixtures/counterparties';
import app from '../../src/app';

describe('Workflow-Counterparties Relationship API', () => {
  const client = testClient(app);
  let testWorkflow: any;
  let testCounterparties: any[] = [];

  beforeAll(async () => {
    const connected = await checkDatabaseConnection();
    if (!connected) {
      throw new Error('Cannot connect to test database. Check Supabase configuration.');
    }
  });

  beforeEach(async () => {
    await setupTest();
    
    // Create test workflow
    testWorkflow = await testDataManager.createTestWorkflow({
      workflow_type: 'hoa_lien_resolution'
    });

    // Create test counterparties
    for (const [key, fixture] of Object.entries(validCounterpartyFixtures)) {
      const counterparty = await testDataManager.createTestCounterparty(fixture);
      testCounterparties.push(counterparty);
    }
  });

  afterEach(async () => {
    testCounterparties = [];
    await cleanupTest();
  });

  describe('POST /api/workflows/:workflowId/counterparties', () => {
    it('should assign counterparty to workflow successfully', async () => {
      const hoaCounterparty = testCounterparties.find(cp => cp.type === 'hoa');
      const assignmentData = {
        counterparty_id: hoaCounterparty.id,
        status: 'PENDING'
      };

      const response = await client.post(
        `/api/workflows/${testWorkflow.id}/counterparties`,
        assignmentData
      );

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        workflow_id: testWorkflow.id,
        counterparty_id: hoaCounterparty.id,
        status: 'PENDING'
      });
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.created_at).toBeDefined();
    });

    it('should enforce workflow-counterparty type restrictions', async () => {
      // HOA workflow should not accept utility counterparty
      const utilityCounterparty = testCounterparties.find(cp => cp.type === 'utility');
      const assignmentData = {
        counterparty_id: utilityCounterparty.id,
        status: 'PENDING'
      };

      const response = await client.post(
        `/api/workflows/${testWorkflow.id}/counterparties`,
        assignmentData
      );

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not allowed');
    });

    it('should handle duplicate assignments idempotently', async () => {
      const hoaCounterparty = testCounterparties.find(cp => cp.type === 'hoa');
      const assignmentData = {
        counterparty_id: hoaCounterparty.id,
        status: 'PENDING'
      };

      // First assignment
      const firstResponse = await client.post(
        `/api/workflows/${testWorkflow.id}/counterparties`,
        assignmentData
      );
      expect(firstResponse.status).toBe(201);
      expect(firstResponse.body.success).toBe(true);

      // Second assignment (duplicate) - should return existing relationship
      const secondResponse = await client.post(
        `/api/workflows/${testWorkflow.id}/counterparties`,
        assignmentData
      );
      expect(secondResponse.status).toBe(200);
      expect(secondResponse.body.success).toBe(true);
      expect(secondResponse.body.data.id).toBe(firstResponse.body.data.id);
    });

    it('should validate assignment data', async () => {
      const invalidData = {
        counterparty_id: 'invalid-uuid',
        status: 'INVALID_STATUS'
      };

      const response = await client.post(
        `/api/workflows/${testWorkflow.id}/counterparties`,
        invalidData
      );

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent workflow', async () => {
      const nonExistentWorkflowId = randomUUID();
      const hoaCounterparty = testCounterparties.find(cp => cp.type === 'hoa');

      const response = await client.post(
        `/api/workflows/${nonExistentWorkflowId}/counterparties`,
        {
          counterparty_id: hoaCounterparty.id,
          status: 'PENDING'
        }
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent counterparty', async () => {
      const nonExistentCounterpartyId = randomUUID();

      const response = await client.post(
        `/api/workflows/${testWorkflow.id}/counterparties`,
        {
          counterparty_id: nonExistentCounterpartyId,
          status: 'PENDING'
        }
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should allow multiple counterparties of same type if workflow permits', async () => {
      // Create property research workflow that allows multiple counterparty types
      const propertyWorkflow = await testDataManager.createTestWorkflow({
        workflow_type: 'property_research'
      });

      const hoaCounterparty1 = testCounterparties.find(cp => cp.type === 'hoa');
      const lenderCounterparty = testCounterparties.find(cp => cp.type === 'lender');

      const response1 = await client.post(
        `/api/workflows/${propertyWorkflow.id}/counterparties`,
        { counterparty_id: hoaCounterparty1.id, status: 'PENDING' }
      );

      const response2 = await client.post(
        `/api/workflows/${propertyWorkflow.id}/counterparties`,
        { counterparty_id: lenderCounterparty.id, status: 'PENDING' }
      );

      expect(response1.status).toBe(201);
      expect(response2.status).toBe(201);
    });
  });

  describe('GET /api/workflows/:workflowId/counterparties', () => {
    beforeEach(async () => {
      // Create some assignments
      const hoaCounterparty = testCounterparties.find(cp => cp.type === 'hoa');
      const lenderCounterparty = testCounterparties.find(cp => cp.type === 'lender');

      await testDataManager.createWorkflowCounterpartyRelationship(
        testWorkflow.id,
        hoaCounterparty.id,
        'PENDING'
      );

      await testDataManager.createWorkflowCounterpartyRelationship(
        testWorkflow.id,
        lenderCounterparty.id,
        'CONTACTED'
      );
    });

    it('should list workflow counterparty assignments', async () => {
      const response = await client.get(`/api/workflows/${testWorkflow.id}/counterparties`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);

      // Check that assignments have required fields
      response.body.data.forEach((assignment: any) => {
        expect(assignment).toHaveProperty('id');
        expect(assignment).toHaveProperty('workflow_id', testWorkflow.id);
        expect(assignment).toHaveProperty('counterparty_id');
        expect(assignment).toHaveProperty('status');
        expect(assignment).toHaveProperty('created_at');
      });
    });

    it('should include counterparty details when requested', async () => {
      const response = await client.get(
        `/api/workflows/${testWorkflow.id}/counterparties?include=counterparty`
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      response.body.data.forEach((assignment: any) => {
        expect(assignment.counterparty).toBeDefined();
        expect(assignment.counterparty).toHaveProperty('name');
        expect(assignment.counterparty).toHaveProperty('type');
        expect(assignment.counterparty).toHaveProperty('email');
      });
    });

    it('should filter by status', async () => {
      const response = await client.get(
        `/api/workflows/${testWorkflow.id}/counterparties?status=PENDING`
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      response.body.data.forEach((assignment: any) => {
        expect(assignment.status).toBe('PENDING');
      });
    });

    it('should return empty array for workflow with no assignments', async () => {
      const emptyWorkflow = await testDataManager.createTestWorkflow();

      const response = await client.get(`/api/workflows/${emptyWorkflow.id}/counterparties`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });

    it('should return 404 for non-existent workflow', async () => {
      const nonExistentId = randomUUID();
      const response = await client.get(`/api/workflows/${nonExistentId}/counterparties`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/workflows/:workflowId/counterparties/:id', () => {
    let testAssignment: any;

    beforeEach(async () => {
      const hoaCounterparty = testCounterparties.find(cp => cp.type === 'hoa');
      testAssignment = await testDataManager.createWorkflowCounterpartyRelationship(
        testWorkflow.id,
        hoaCounterparty.id,
        'PENDING'
      );
    });

    it('should update assignment status', async () => {
      const updateData = { status: 'CONTACTED' };

      const response = await client.patch(
        `/api/workflows/${testWorkflow.id}/counterparties/${testAssignment.id}`,
        updateData
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('CONTACTED');
      expect(response.body.data.updated_at).toBeDefined();
    });

    it('should validate status values', async () => {
      const invalidUpdate = { status: 'INVALID_STATUS' };

      const response = await client.patch(
        `/api/workflows/${testWorkflow.id}/counterparties/${testAssignment.id}`,
        invalidUpdate
      );

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent assignment', async () => {
      const nonExistentId = randomUUID();

      const response = await client.patch(
        `/api/workflows/${testWorkflow.id}/counterparties/${nonExistentId}`,
        { status: 'CONTACTED' }
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should validate workflow-assignment relationship', async () => {
      const otherWorkflow = await testDataManager.createTestWorkflow();

      const response = await client.patch(
        `/api/workflows/${otherWorkflow.id}/counterparties/${testAssignment.id}`,
        { status: 'CONTACTED' }
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should track assignment history through status updates', async () => {
      const statuses = ['CONTACTED', 'RESPONDED', 'COMPLETED'];

      for (const status of statuses) {
        const response = await client.patch(
          `/api/workflows/${testWorkflow.id}/counterparties/${testAssignment.id}`,
          { status }
        );

        expect(response.status).toBe(200);
        expect(response.body.data.status).toBe(status);
      }
    });
  });

  describe('DELETE /api/workflows/:workflowId/counterparties/:id', () => {
    let testAssignment: any;

    beforeEach(async () => {
      const hoaCounterparty = testCounterparties.find(cp => cp.type === 'hoa');
      testAssignment = await testDataManager.createWorkflowCounterpartyRelationship(
        testWorkflow.id,
        hoaCounterparty.id,
        'PENDING'
      );
    });

    it('should remove counterparty assignment', async () => {
      const response = await client.delete(
        `/api/workflows/${testWorkflow.id}/counterparties/${testAssignment.id}`
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Counterparty assignment removed successfully');

      // Verify assignment is removed
      const listResponse = await client.get(`/api/workflows/${testWorkflow.id}/counterparties`);
      const assignment = listResponse.body.data.find((a: any) => a.id === testAssignment.id);
      expect(assignment).toBeUndefined();
    });

    it('should return 404 for non-existent assignment', async () => {
      const nonExistentId = randomUUID();

      const response = await client.delete(
        `/api/workflows/${testWorkflow.id}/counterparties/${nonExistentId}`
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should validate workflow-assignment relationship', async () => {
      const otherWorkflow = await testDataManager.createTestWorkflow();

      const response = await client.delete(
        `/api/workflows/${otherWorkflow.id}/counterparties/${testAssignment.id}`
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should handle concurrent deletion attempts', async () => {
      const firstDelete = await client.delete(
        `/api/workflows/${testWorkflow.id}/counterparties/${testAssignment.id}`
      );
      expect(firstDelete.status).toBe(200);

      const secondDelete = await client.delete(
        `/api/workflows/${testWorkflow.id}/counterparties/${testAssignment.id}`
      );
      expect(secondDelete.status).toBe(404);
    });
  });

  describe('Workflow Type Restrictions', () => {
    const workflowTypeTests = [
      {
        workflowType: 'hoa_lien_resolution',
        allowedTypes: ['hoa', 'lender'],
        forbiddenTypes: ['municipality', 'utility', 'tax_authority']
      },
      {
        workflowType: 'municipal_lien_resolution',
        allowedTypes: ['municipality', 'tax_authority'],
        forbiddenTypes: ['hoa', 'lender', 'utility']
      },
      {
        workflowType: 'utility_lien_resolution',
        allowedTypes: ['utility'],
        forbiddenTypes: ['hoa', 'lender', 'municipality', 'tax_authority']
      },
      {
        workflowType: 'property_research',
        allowedTypes: ['hoa', 'lender', 'municipality', 'utility', 'tax_authority'],
        forbiddenTypes: []
      }
    ];

    workflowTypeTests.forEach(({ workflowType, allowedTypes, forbiddenTypes }) => {
      describe(`${workflowType} workflow restrictions`, () => {
        let restrictedWorkflow: any;

        beforeEach(async () => {
          restrictedWorkflow = await testDataManager.createTestWorkflow({
            workflow_type: workflowType
          });
        });

        allowedTypes.forEach(type => {
          it(`should allow ${type} counterparty assignment`, async () => {
            const counterparty = testCounterparties.find(cp => cp.type === type);
            
            const response = await client.post(
              `/api/workflows/${restrictedWorkflow.id}/counterparties`,
              {
                counterparty_id: counterparty.id,
                status: 'PENDING'
              }
            );

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
          });
        });

        forbiddenTypes.forEach(type => {
          it(`should reject ${type} counterparty assignment`, async () => {
            const counterparty = testCounterparties.find(cp => cp.type === type);
            
            const response = await client.post(
              `/api/workflows/${restrictedWorkflow.id}/counterparties`,
              {
                counterparty_id: counterparty.id,
                status: 'PENDING'
              }
            );

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('not allowed');
          });
        });
      });
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple concurrent assignments', async () => {
      const propertyWorkflow = await testDataManager.createTestWorkflow({
        workflow_type: 'property_research'
      });

      const assignments = testCounterparties.map(cp => 
        client.post(
          `/api/workflows/${propertyWorkflow.id}/counterparties`,
          {
            counterparty_id: cp.id,
            status: 'PENDING'
          }
        )
      );

      const responses = await Promise.all(assignments);
      
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });
    });

    it('should efficiently retrieve assignments with counterparty details', async () => {
      // Create multiple assignments
      const propertyWorkflow = await testDataManager.createTestWorkflow({
        workflow_type: 'property_research'
      });

      for (const cp of testCounterparties) {
        await testDataManager.createWorkflowCounterpartyRelationship(
          propertyWorkflow.id,
          cp.id,
          'PENDING'
        );
      }

      const startTime = Date.now();
      const response = await client.get(
        `/api/workflows/${propertyWorkflow.id}/counterparties?include=counterparty`
      );
      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(testCounterparties.length);
      
      // Should complete reasonably quickly (less than 1 second for test data)
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });
});