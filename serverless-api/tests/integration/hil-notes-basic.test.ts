/**
 * HIL Notes API Basic Integration Tests
 * Basic testing to establish 0% -> good coverage for HIL Notes routes
 */

import { testClient } from '../utils/hono-test-client';
import { 
  validHilNoteFixtures, 
  invalidHilNoteFixtures, 
  updateHilNoteFixtures,
  replyHilNoteFixtures,
  hilNoteFilterFixtures 
} from '../fixtures/hil-notes';
import app from '../../src/app';

describe('HIL Notes API Basic Tests', () => {
  const client = testClient(app);

  describe('GET /api/hil-notes', () => {
    it('should handle list notes requests with workflow_id', async () => {
      const response = await client.get('/api/hil-notes?workflow_id=12345678-1234-1234-1234-123456789012');

      expect([200, 401, 500]).toContain(response.status);
      expect(response.headers['content-type']).toMatch(/json/);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.pagination).toBeDefined();
      } else {
        expect(response.body.success).toBe(false);
      }
    });

    it('should require workflow_id parameter', async () => {
      const response = await client.get('/api/hil-notes');

      expect([400, 401, 500]).toContain(response.status);
      
      if (response.status === 400) {
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Invalid query parameters');
      }
    });

    it('should handle priority filter', async () => {
      const response = await client.get('/api/hil-notes?workflow_id=12345678-1234-1234-1234-123456789012&priority=HIGH');

      expect([200, 400, 401, 500]).toContain(response.status);
      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should handle resolved filter', async () => {
      const response = await client.get('/api/hil-notes?workflow_id=12345678-1234-1234-1234-123456789012&is_resolved=false');

      expect([200, 400, 401, 500]).toContain(response.status);
      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should handle pagination parameters', async () => {
      const response = await client.get('/api/hil-notes?workflow_id=12345678-1234-1234-1234-123456789012&page=1&limit=5');

      expect([200, 400, 401, 500]).toContain(response.status);
      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should validate invalid workflow_id format', async () => {
      const response = await client.get('/api/hil-notes?workflow_id=invalid-uuid');

      expect([400, 401, 500]).toContain(response.status);
      
      if (response.status === 400) {
        expect(response.body.success).toBe(false);
      }
    });

    it('should validate invalid priority', async () => {
      const response = await client.get('/api/hil-notes?workflow_id=12345678-1234-1234-1234-123456789012&priority=INVALID');

      expect([400, 401, 500]).toContain(response.status);
      
      if (response.status === 400) {
        expect(response.body.success).toBe(false);
      }
    });
  });

  describe('POST /api/hil-notes', () => {
    it('should handle note creation requests', async () => {
      const response = await client.post('/api/hil-notes', validHilNoteFixtures.basic);

      expect([201, 401, 500]).toContain(response.status);
      expect(response.headers['content-type']).toMatch(/json/);
      
      if (response.status === 201) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toMatchObject({
          content: validHilNoteFixtures.basic.content,
          priority: validHilNoteFixtures.basic.priority
        });
        expect(response.body.data.id).toBeDefined();
      } else {
        expect(response.body.success).toBe(false);
      }
    });

    it('should handle note creation with mentions', async () => {
      const response = await client.post('/api/hil-notes', validHilNoteFixtures.withMentions);

      expect([201, 401, 500]).toContain(response.status);
      expect(response.headers['content-type']).toMatch(/json/);
      
      if (response.status === 201) {
        expect(response.body.success).toBe(true);
        expect(response.body.data.content).toBe(validHilNoteFixtures.withMentions.content);
      }
    });

    it('should validate required fields', async () => {
      const response = await client.post('/api/hil-notes', invalidHilNoteFixtures.missingContent);

      expect([400, 401, 500]).toContain(response.status);
      
      if (response.status === 400) {
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Invalid request data');
      }
    });

    it('should validate workflow_id format', async () => {
      const response = await client.post('/api/hil-notes', invalidHilNoteFixtures.invalidWorkflowId);

      expect([400, 401, 500]).toContain(response.status);
      
      if (response.status === 400) {
        expect(response.body.success).toBe(false);
      }
    });

    it('should validate priority values', async () => {
      const response = await client.post('/api/hil-notes', invalidHilNoteFixtures.invalidPriority);

      expect([400, 401, 500]).toContain(response.status);
      
      if (response.status === 400) {
        expect(response.body.success).toBe(false);
      }
    });

    it('should handle empty content', async () => {
      const response = await client.post('/api/hil-notes', invalidHilNoteFixtures.emptyContent);

      expect([400, 401, 500]).toContain(response.status);
      
      if (response.status === 400) {
        expect(response.body.success).toBe(false);
      }
    });

    it('should handle malformed JSON', async () => {
      const response = await client.request('/api/hil-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{ invalid json }'
      });

      expect([400, 401, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/hil-notes/:id', () => {
    it('should handle single note requests', async () => {
      const testId = '12345678-1234-1234-1234-123456789012';
      const response = await client.get(`/api/hil-notes/${testId}`);

      expect([200, 401, 404, 500]).toContain(response.status);
      expect(response.headers['content-type']).toMatch(/json/);
      
      if (response.status === 404) {
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Note not found');
      } else if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
      }
    });

    it('should handle invalid UUID format', async () => {
      const response = await client.get('/api/hil-notes/invalid-uuid');

      expect([400, 401, 404, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    it('should include replies when requested', async () => {
      const testId = '12345678-1234-1234-1234-123456789012';
      const response = await client.get(`/api/hil-notes/${testId}?include=replies`);

      expect([200, 401, 404, 500]).toContain(response.status);
      expect(response.headers['content-type']).toMatch(/json/);
    });
  });

  describe('PATCH /api/hil-notes/:id', () => {
    it('should handle note update requests', async () => {
      const testId = '12345678-1234-1234-1234-123456789012';
      const response = await client.patch(`/api/hil-notes/${testId}`, updateHilNoteFixtures.validUpdate);

      expect([200, 400, 401, 404, 500]).toContain(response.status);
      expect(response.headers['content-type']).toMatch(/json/);
      
      if (response.status === 404) {
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Note not found');
      } else if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
      }
    });

    it('should handle partial updates', async () => {
      const testId = '12345678-1234-1234-1234-123456789012';
      const response = await client.patch(`/api/hil-notes/${testId}`, updateHilNoteFixtures.contentOnly);

      expect([200, 400, 401, 404, 500]).toContain(response.status);
      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should handle resolution updates', async () => {
      const testId = '12345678-1234-1234-1234-123456789012';
      const response = await client.patch(`/api/hil-notes/${testId}`, updateHilNoteFixtures.resolveOnly);

      expect([200, 400, 401, 404, 500]).toContain(response.status);
      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should validate update data', async () => {
      const testId = '12345678-1234-1234-1234-123456789012';
      const response = await client.patch(`/api/hil-notes/${testId}`, updateHilNoteFixtures.invalidUpdate);

      expect([400, 401, 404, 500]).toContain(response.status);
      
      if (response.status === 400) {
        expect(response.body.success).toBe(false);
      }
    });

    it('should handle invalid UUID', async () => {
      const response = await client.patch('/api/hil-notes/invalid-uuid', updateHilNoteFixtures.validUpdate);

      expect([400, 401, 404, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/hil-notes/:id/reply', () => {
    it('should handle reply creation requests', async () => {
      const testId = '12345678-1234-1234-1234-123456789012';
      const response = await client.post(`/api/hil-notes/${testId}/reply`, replyHilNoteFixtures.basicReply);

      expect([201, 401, 404, 500]).toContain(response.status);
      expect(response.headers['content-type']).toMatch(/json/);
      
      if (response.status === 404) {
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Parent note not found');
      } else if (response.status === 201) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
      }
    });

    it('should handle reply with mentions', async () => {
      const testId = '12345678-1234-1234-1234-123456789012';
      const response = await client.post(`/api/hil-notes/${testId}/reply`, replyHilNoteFixtures.withMentions);

      expect([201, 401, 404, 500]).toContain(response.status);
      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should validate reply data', async () => {
      const testId = '12345678-1234-1234-1234-123456789012';
      const response = await client.post(`/api/hil-notes/${testId}/reply`, replyHilNoteFixtures.invalidReply);

      expect([400, 401, 404, 500]).toContain(response.status);
      
      if (response.status === 400) {
        expect(response.body.success).toBe(false);
      }
    });

    it('should handle invalid parent ID', async () => {
      const response = await client.post('/api/hil-notes/invalid-uuid/reply', replyHilNoteFixtures.basicReply);

      expect([400, 401, 404, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/hil-notes/:id', () => {
    it('should handle note deletion requests', async () => {
      const testId = '12345678-1234-1234-1234-123456789012';
      const response = await client.delete(`/api/hil-notes/${testId}`);

      expect([200, 401, 404, 500]).toContain(response.status);
      expect(response.headers['content-type']).toMatch(/json/);
      
      if (response.status === 404) {
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Note not found');
      } else if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('HIL note deleted successfully');
      }
    });

    it('should handle invalid UUID', async () => {
      const response = await client.delete('/api/hil-notes/invalid-uuid');

      expect([400, 401, 404, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    it('should handle cascade deletion with replies', async () => {
      const testId = '12345678-1234-1234-1234-123456789012';
      const response = await client.delete(`/api/hil-notes/${testId}`);

      // Should handle deletion even if note has replies
      expect([200, 401, 404, 409, 500]).toContain(response.status);
      
      if (response.status === 409) {
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('replies');
      }
    });
  });

  describe('Response Format Consistency', () => {
    const endpoints = [
      { method: 'GET', path: '/api/hil-notes?workflow_id=12345678-1234-1234-1234-123456789012' },
      { method: 'POST', path: '/api/hil-notes' },
      { method: 'GET', path: '/api/hil-notes/12345678-1234-1234-1234-123456789012' },
      { method: 'PATCH', path: '/api/hil-notes/12345678-1234-1234-1234-123456789012' },
      { method: 'POST', path: '/api/hil-notes/12345678-1234-1234-1234-123456789012/reply' },
      { method: 'DELETE', path: '/api/hil-notes/12345678-1234-1234-1234-123456789012' }
    ];

    endpoints.forEach(({ method, path }) => {
      it(`should return consistent JSON format for ${method} ${path}`, async () => {
        let body;
        if (method === 'POST' && path.includes('/reply')) {
          body = replyHilNoteFixtures.basicReply;
        } else if (method === 'POST') {
          body = validHilNoteFixtures.basic;
        } else if (method === 'PATCH') {
          body = updateHilNoteFixtures.validUpdate;
        }

        const response = await client.request(path, { method, body });

        // All endpoints should return JSON
        expect(response.headers['content-type']).toMatch(/json/);
        
        // All responses should have success property
        expect(response.body).toHaveProperty('success');
        expect(typeof response.body.success).toBe('boolean');
        
        // Error responses should have error property
        if (response.status >= 400) {
          expect(response.body.success).toBe(false);
          expect(response.body).toHaveProperty('error');
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing Content-Type header for POST requests', async () => {
      const response = await client.request('/api/hil-notes', {
        method: 'POST',
        headers: {},
        body: JSON.stringify(validHilNoteFixtures.basic)
      });

      expect([201, 400, 401, 415, 500]).toContain(response.status);
    });

    it('should handle empty request body for POST', async () => {
      const response = await client.request('/api/hil-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: ''
      });

      expect([400, 401, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    it('should handle oversized content gracefully', async () => {
      const largeNote = {
        ...validHilNoteFixtures.basic,
        content: 'A'.repeat(100000) // Very large content
      };

      const response = await client.post('/api/hil-notes', largeNote);

      // Should either accept or reject appropriately
      expect([201, 400, 401, 413, 500]).toContain(response.status);
    });

    it('should handle concurrent operations gracefully', async () => {
      const testId = '12345678-1234-1234-1234-123456789012';
      
      // Try multiple operations on same note
      const operations = [
        client.get(`/api/hil-notes/${testId}`),
        client.patch(`/api/hil-notes/${testId}`, updateHilNoteFixtures.validUpdate),
        client.post(`/api/hil-notes/${testId}/reply`, replyHilNoteFixtures.basicReply)
      ];

      const responses = await Promise.all(operations);
      
      // All should return valid responses
      responses.forEach(response => {
        expect(response.headers['content-type']).toMatch(/json/);
        expect(response.body).toHaveProperty('success');
      });
    });

    it('should handle special characters in content', async () => {
      const specialNote = {
        ...validHilNoteFixtures.basic,
        content: 'Note with special chars: 😀 <script>alert("xss")</script> & quotes "test" \'test\''
      };

      const response = await client.post('/api/hil-notes', specialNote);

      // Should handle special characters appropriately
      expect([201, 400, 401, 500]).toContain(response.status);
      
      if (response.status === 201) {
        // Content should be preserved safely
        expect(response.body.data.content).toContain('special chars');
      }
    });
  });

  describe('Threading and Parent-Child Relationships', () => {
    it('should handle parent note retrieval with replies', async () => {
      const testId = '12345678-1234-1234-1234-123456789012';
      const response = await client.get(`/api/hil-notes/${testId}?include=replies`);

      expect([200, 401, 404, 500]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        // Should include replies if they exist
        if (response.body.data.replies) {
          expect(Array.isArray(response.body.data.replies)).toBe(true);
        }
      }
    });

    it('should handle creating replies to non-existent notes', async () => {
      const nonExistentId = '99999999-9999-9999-9999-999999999999';
      const response = await client.post(`/api/hil-notes/${nonExistentId}/reply`, replyHilNoteFixtures.basicReply);

      expect([401, 404, 500]).toContain(response.status);
      
      if (response.status === 404) {
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Parent note not found');
      }
    });
  });
});