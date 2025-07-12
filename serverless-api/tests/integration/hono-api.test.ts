/**
 * Integration tests for the new Hono API implementation
 * Tests the endpoints that were migrated to Hono: health, workflows, task-executions
 */

import request from 'supertest';
// Mock test config since we're testing Hono directly
const baseURL = 'http://localhost:3001';

// Use the Hono implementation running on a different port or via Vercel dev
const honoBaseURL = process.env.TEST_HONO_URL || 'http://localhost:3002';

describe('Hono API Implementation', () => {
  
  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(honoBaseURL)
        .get('/api/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: true,
        version: '2.0.0',
        environment: expect.any(String),
        timestamp: expect.any(String),
        uptime: expect.any(Number),
      });
    });
  });

  describe('OpenAPI Documentation', () => {
    it('should serve OpenAPI specification', async () => {
      const response = await request(honoBaseURL)
        .get('/api/openapi.json')
        .expect(200);

      expect(response.body).toMatchObject({
        openapi: '3.0.0',
        info: {
          title: 'Rexera API',
          version: '2.0.0',
        },
        paths: expect.objectContaining({
          '/api/health': expect.any(Object),
          '/api/workflows': expect.any(Object),
          '/api/task-executions': expect.any(Object),
        }),
      });
    });

    it('should serve Swagger UI', async () => {
      const response = await request(honoBaseURL)
        .get('/api/docs')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/text\/html/);
      expect(response.text).toContain('Swagger UI');
    });
  });

  describe('Root Endpoint', () => {
    it('should return API information', async () => {
      const response = await request(honoBaseURL)
        .get('/')
        .expect(200);

      expect(response.body).toMatchObject({
        message: expect.stringContaining('Rexera API v2.0'),
        description: expect.stringContaining('Dual-layer architecture'),
        docs: '/api/docs',
        openapi: '/api/openapi.json',
        version: '2.0.0',
      });
    });
  });

  describe('CORS and Middleware', () => {
    it('should include CORS headers', async () => {
      const response = await request(honoBaseURL)
        .get('/api/health')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should handle OPTIONS requests', async () => {
      const response = await request(honoBaseURL)
        .options('/api/health')
        .expect(200);

      expect(response.headers['access-control-allow-methods']).toContain('GET');
    });
  });

  // Note: Workflows and task-executions tests would require database setup
  // For now, we're just testing that the server starts and serves basic endpoints
  
  describe('Error Handling', () => {
    it('should return 404 for non-existent endpoints', async () => {
      const response = await request(honoBaseURL)
        .get('/api/non-existent-endpoint')
        .expect(404);
    });
  });
});

// Only run if we have a Hono server available
if (process.env.TEST_HONO_URL) {
  describe('Hono vs Express Compatibility', () => {
    it('should have same response format as Express API for health', async () => {
      // Get response from Express (original)
      const expressResponse = await request(baseURL)
        .get('/api/health')
        .expect(200);

      // Get response from Hono (new)
      const honoResponse = await request(honoBaseURL)
        .get('/api/health')
        .expect(200);

      // Should have similar structure (though values may differ)
      expect(typeof honoResponse.body.status).toBe(typeof expressResponse.body.status);
      expect(typeof honoResponse.body.version).toBe(typeof expressResponse.body.version);
    });
  });
} else {
  console.log('Skipping Hono compatibility tests - TEST_HONO_URL not set');
}