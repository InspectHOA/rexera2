/**
 * Counterparties API Integration Tests
 * Comprehensive testing with real Supabase database
 */

import { randomUUID } from 'crypto';
import { testClient } from '../utils/hono-test-client';
import { testDataManager, setupTest, cleanupTest, checkDatabaseConnection } from '../utils/database-setup';
import { 
  validCounterpartyFixtures, 
  invalidCounterpartyFixtures, 
  updateCounterpartyFixtures,
  searchFixtures,
  filterFixtures 
} from '../fixtures/counterparties';
import app from '../../src/app';

describe('Counterparties API Integration Tests', () => {
  const client = testClient(app);
  
  beforeAll(async () => {
    // Check database connection before running tests
    const connected = await checkDatabaseConnection();
    if (!connected) {
      throw new Error('Cannot connect to test database. Check Supabase configuration.');
    }
  });

  beforeEach(async () => {
    await setupTest();
  });

  afterEach(async () => {
    await cleanupTest();
  });

  describe('GET /api/counterparties/types', () => {
    it('should return available counterparty types', async () => {
      const response = await client.get('/api/counterparties/types');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(5);
      
      const types = response.body.data.map((t: any) => t.value);
      expect(types).toContain('hoa');
      expect(types).toContain('lender');
      expect(types).toContain('municipality');
      expect(types).toContain('utility');
      expect(types).toContain('tax_authority');
    });
  });

  describe('POST /api/counterparties', () => {
    it('should create a new HOA counterparty successfully', async () => {
      const response = await client.post('/api/counterparties', validCounterpartyFixtures.hoa);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: validCounterpartyFixtures.hoa.name,
        type: validCounterpartyFixtures.hoa.type,
        email: validCounterpartyFixtures.hoa.email
      });
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.created_at).toBeDefined();
      
      // Track for cleanup
      testDataManager.trackCounterparty(response.body.data.id);
    });

    it('should create counterparties of all valid types', async () => {
      const types = Object.keys(validCounterpartyFixtures);
      
      for (const typeKey of types) {
        const fixture = validCounterpartyFixtures[typeKey as keyof typeof validCounterpartyFixtures];
        const response = await client.post('/api/counterparties', fixture);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.type).toBe(fixture.type);
        
        testDataManager.trackCounterparty(response.body.data.id);
      }
    });

    it('should validate required fields', async () => {
      const response = await client.post('/api/counterparties', invalidCounterpartyFixtures.missingName);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid request data');
    });

    it('should validate counterparty type', async () => {
      const response = await client.post('/api/counterparties', invalidCounterpartyFixtures.invalidType);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate email format', async () => {
      const response = await client.post('/api/counterparties', invalidCounterpartyFixtures.invalidEmail);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle name length validation', async () => {
      const response = await client.post('/api/counterparties', invalidCounterpartyFixtures.tooLongName);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should allow duplicate names but different types', async () => {
      const baseName = 'Duplicate Name Test';
      
      const hoa = await client.post('/api/counterparties', {
        ...validCounterpartyFixtures.hoa,
        name: baseName
      });
      
      const lender = await client.post('/api/counterparties', {
        ...validCounterpartyFixtures.lender,
        name: baseName
      });

      expect(hoa.status).toBe(201);
      expect(lender.status).toBe(201);
      
      testDataManager.trackCounterparty(hoa.body.data.id);
      testDataManager.trackCounterparty(lender.body.data.id);
    });
  });

  describe('GET /api/counterparties', () => {
    let testCounterparties: any[] = [];

    beforeEach(async () => {
      // Create test data
      for (const [key, fixture] of Object.entries(validCounterpartyFixtures)) {
        const response = await client.post('/api/counterparties', fixture);
        testCounterparties.push(response.body.data);
        testDataManager.trackCounterparty(response.body.data.id);
      }
    });

    it('should return paginated list of counterparties', async () => {
      const response = await client.get('/api/counterparties?page=1&limit=10');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: expect.any(Number),
        totalPages: expect.any(Number)
      });
    });

    it('should filter by counterparty type', async () => {
      const response = await client.get('/api/counterparties?type=hoa');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // All returned counterparties should be HOA type
      response.body.data.forEach((cp: any) => {
        expect(cp.type).toBe('hoa');
      });
    });

    it('should search by name and email', async () => {
      const response = await client.get('/api/counterparties?search=Test');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should sort by name ascending', async () => {
      const response = await client.get('/api/counterparties?sort=name&order=asc');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      const names = response.body.data.map((cp: any) => cp.name);
      const sortedNames = [...names].sort();
      expect(names).toEqual(sortedNames);
    });

    it('should include workflow relationships when requested', async () => {
      // Create a workflow and relationship
      const workflow = await testDataManager.createTestWorkflow();
      const counterparty = testCounterparties[0];
      
      await testDataManager.createWorkflowCounterpartyRelationship(
        workflow.id, 
        counterparty.id, 
        'PENDING'
      );

      const response = await client.get('/api/counterparties?include=workflows');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      const cpWithWorkflows = response.body.data.find((cp: any) => cp.id === counterparty.id);
      expect(cpWithWorkflows.workflows).toBeDefined();
      expect(Array.isArray(cpWithWorkflows.workflows)).toBe(true);
    });

    it('should handle invalid filter parameters', async () => {
      const response = await client.get('/api/counterparties?type=invalid_type');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle pagination edge cases', async () => {
      // Test page beyond available data
      const response = await client.get('/api/counterparties?page=999&limit=10');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.pagination.page).toBe(999);
    });
  });

  describe('GET /api/counterparties/search', () => {
    beforeEach(async () => {
      // Create diverse test data for search
      const searchFixtures = [
        { name: 'ABC HOA Management', type: 'hoa', email: 'contact@abchoa.com' },
        { name: 'XYZ Bank Corporation', type: 'lender', email: 'loans@xyzbank.com' },
        { name: 'City Municipal Office', type: 'municipality', email: 'admin@city.gov' },
        { name: 'Power Electric Company', type: 'utility', email: 'service@power.com' }
      ];

      for (const fixture of searchFixtures) {
        const response = await client.post('/api/counterparties', fixture);
        testDataManager.trackCounterparty(response.body.data.id);
      }
    });

    it('should search counterparties by name', async () => {
      const response = await client.get('/api/counterparties/search?q=ABC');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].name).toContain('ABC');
    });

    it('should search with type filter', async () => {
      const response = await client.get('/api/counterparties/search?q=Bank&type=lender');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      response.body.data.forEach((cp: any) => {
        expect(cp.type).toBe('lender');
        expect(cp.name.toLowerCase()).toContain('bank');
      });
    });

    it('should limit search results', async () => {
      const response = await client.get('/api/counterparties/search?q=Test&limit=2');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.meta.limit).toBe(2);
    });

    it('should handle empty search results', async () => {
      const response = await client.get('/api/counterparties/search?q=NonexistentCompany');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });

    it('should validate search parameters', async () => {
      const response = await client.get('/api/counterparties/search?q=&type=hoa');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/counterparties/:id', () => {
    let testCounterparty: any;

    beforeEach(async () => {
      const response = await client.post('/api/counterparties', validCounterpartyFixtures.hoa);
      testCounterparty = response.body.data;
      testDataManager.trackCounterparty(testCounterparty.id);
    });

    it('should get counterparty by ID', async () => {
      const response = await client.get(`/api/counterparties/${testCounterparty.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: testCounterparty.id,
        name: testCounterparty.name,
        type: testCounterparty.type
      });
    });

    it('should include workflows when requested', async () => {
      const workflow = await testDataManager.createTestWorkflow();
      await testDataManager.createWorkflowCounterpartyRelationship(
        workflow.id, 
        testCounterparty.id
      );

      const response = await client.get(`/api/counterparties/${testCounterparty.id}?include=workflows`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.workflows).toBeDefined();
      expect(Array.isArray(response.body.data.workflows)).toBe(true);
      expect(response.body.data.workflows.length).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent counterparty', async () => {
      const nonExistentId = randomUUID();
      const response = await client.get(`/api/counterparties/${nonExistentId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Counterparty not found');
    });

    it('should validate UUID format', async () => {
      const response = await client.get('/api/counterparties/invalid-uuid');

      expect([400, 404]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/counterparties/:id', () => {
    let testCounterparty: any;

    beforeEach(async () => {
      const response = await client.post('/api/counterparties', validCounterpartyFixtures.hoa);
      testCounterparty = response.body.data;
      testDataManager.trackCounterparty(testCounterparty.id);
    });

    it('should update counterparty successfully', async () => {
      const updateData = updateCounterpartyFixtures.validUpdate;
      const response = await client.patch(`/api/counterparties/${testCounterparty.id}`, updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject(updateData);
      expect(response.body.data.updated_at).toBeDefined();
    });

    it('should validate update data', async () => {
      const response = await client.patch(
        `/api/counterparties/${testCounterparty.id}`, 
        invalidCounterpartyFixtures.invalidEmail
      );

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent counterparty', async () => {
      const nonExistentId = randomUUID();
      const response = await client.patch(
        `/api/counterparties/${nonExistentId}`, 
        updateCounterpartyFixtures.validUpdate
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should preserve unchanged fields', async () => {
      const partialUpdate = { name: 'Updated Name Only' };
      const response = await client.patch(`/api/counterparties/${testCounterparty.id}`, partialUpdate);

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('Updated Name Only');
      expect(response.body.data.type).toBe(testCounterparty.type);
      expect(response.body.data.email).toBe(testCounterparty.email);
    });
  });

  describe('DELETE /api/counterparties/:id', () => {
    let testCounterparty: any;

    beforeEach(async () => {
      const response = await client.post('/api/counterparties', validCounterpartyFixtures.lender);
      testCounterparty = response.body.data;
      testDataManager.trackCounterparty(testCounterparty.id);
    });

    it('should delete counterparty successfully', async () => {
      const response = await client.delete(`/api/counterparties/${testCounterparty.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Counterparty deleted successfully');

      // Verify it's deleted
      const getResponse = await client.get(`/api/counterparties/${testCounterparty.id}`);
      expect(getResponse.status).toBe(404);
    });

    it('should prevent deletion when workflow relationships exist', async () => {
      const workflow = await testDataManager.createTestWorkflow();
      await testDataManager.createWorkflowCounterpartyRelationship(
        workflow.id, 
        testCounterparty.id
      );

      const response = await client.delete(`/api/counterparties/${testCounterparty.id}`);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Cannot delete counterparty with active workflow relationships');
    });

    it('should return 404 for non-existent counterparty', async () => {
      const nonExistentId = randomUUID();
      const response = await client.delete(`/api/counterparties/${nonExistentId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should handle concurrent deletion attempts', async () => {
      // Delete the counterparty
      const firstDelete = await client.delete(`/api/counterparties/${testCounterparty.id}`);
      expect(firstDelete.status).toBe(200);

      // Try to delete again
      const secondDelete = await client.delete(`/api/counterparties/${testCounterparty.id}`);
      expect(secondDelete.status).toBe(404);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed JSON in POST requests', async () => {
      const response = await client.request('/api/counterparties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{ invalid json }'
      });

      expect([400, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    it('should handle missing Content-Type header', async () => {
      const response = await client.request('/api/counterparties', {
        method: 'POST',
        headers: {},
        body: JSON.stringify(validCounterpartyFixtures.hoa)
      });

      // Should still work or return appropriate error
      expect([201, 400, 415]).toContain(response.status);
    });

    it('should handle large request payloads', async () => {
      const largeNotes = 'A'.repeat(10000);
      const largePayload = {
        ...validCounterpartyFixtures.hoa,
        notes: largeNotes
      };

      const response = await client.post('/api/counterparties', largePayload);

      // Should either accept or reject with appropriate error
      expect([201, 400, 413]).toContain(response.status);
    });

    it('should return consistent error format for all endpoints', async () => {
      const endpoints = [
        { method: 'GET', path: '/api/counterparties/invalid-uuid' },
        { method: 'PATCH', path: '/api/counterparties/invalid-uuid' },
        { method: 'DELETE', path: '/api/counterparties/invalid-uuid' }
      ];

      for (const endpoint of endpoints) {
        const response = await client.request(endpoint.path, { method: endpoint.method });
        
        if (response.status >= 400) {
          expect(response.body).toHaveProperty('success', false);
          expect(response.body).toHaveProperty('error');
        }
      }
    });
  });
});