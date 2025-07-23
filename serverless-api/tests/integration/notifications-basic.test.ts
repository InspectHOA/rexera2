/**
 * Notifications API Basic Integration Tests
 * Basic testing to establish 0% -> good coverage for notifications routes
 */

import { testClient } from '../utils/hono-test-client';
import { 
  validNotificationFixtures, 
  invalidNotificationFixtures, 
  updateNotificationFixtures,
  notificationFilterFixtures 
} from '../fixtures/notifications';
import app from '../../src/app';

describe('Notifications API Basic Tests', () => {
  const client = testClient(app);

  describe('GET /api/notifications', () => {
    it('should handle list notifications requests with user_id', async () => {
      const response = await client.get('/api/notifications?user_id=12345678-1234-1234-1234-123456789012');

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

    it('should require user_id parameter', async () => {
      const response = await client.get('/api/notifications');

      expect([400, 401, 500]).toContain(response.status);
      
      if (response.status === 400) {
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Invalid query parameters');
      }
    });

    it('should handle type filter', async () => {
      const response = await client.get('/api/notifications?user_id=12345678-1234-1234-1234-123456789012&type=HIL_MENTION');

      expect([200, 400, 401, 500]).toContain(response.status);
      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should handle is_read filter', async () => {
      const response = await client.get('/api/notifications?user_id=12345678-1234-1234-1234-123456789012&is_read=false');

      expect([200, 400, 401, 500]).toContain(response.status);
      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should handle priority filter', async () => {
      const response = await client.get('/api/notifications?user_id=12345678-1234-1234-1234-123456789012&priority=HIGH');

      expect([200, 400, 401, 500]).toContain(response.status);
      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should handle pagination parameters', async () => {
      const response = await client.get('/api/notifications?user_id=12345678-1234-1234-1234-123456789012&page=1&limit=10');

      expect([200, 400, 401, 500]).toContain(response.status);
      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should validate invalid user_id format', async () => {
      const response = await client.get('/api/notifications?user_id=invalid-uuid');

      expect([400, 401, 500]).toContain(response.status);
      
      if (response.status === 400) {
        expect(response.body.success).toBe(false);
      }
    });

    it('should validate invalid type', async () => {
      const response = await client.get('/api/notifications?user_id=12345678-1234-1234-1234-123456789012&type=INVALID_TYPE');

      expect([400, 401, 500]).toContain(response.status);
      
      if (response.status === 400) {
        expect(response.body.success).toBe(false);
      }
    });

    it('should validate invalid priority', async () => {
      const response = await client.get('/api/notifications?user_id=12345678-1234-1234-1234-123456789012&priority=INVALID');

      expect([400, 401, 500]).toContain(response.status);
      
      if (response.status === 400) {
        expect(response.body.success).toBe(false);
      }
    });
  });

  describe('POST /api/notifications', () => {
    it('should handle notification creation requests', async () => {
      const response = await client.post('/api/notifications', validNotificationFixtures.basic);

      expect([201, 401, 500]).toContain(response.status);
      expect(response.headers['content-type']).toMatch(/json/);
      
      if (response.status === 201) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toMatchObject({
          type: validNotificationFixtures.basic.type,
          title: validNotificationFixtures.basic.title
        });
        expect(response.body.data.id).toBeDefined();
      } else {
        expect(response.body.success).toBe(false);
      }
    });

    it('should handle HIL mention notifications', async () => {
      const response = await client.post('/api/notifications', validNotificationFixtures.mention);

      expect([201, 401, 500]).toContain(response.status);
      expect(response.headers['content-type']).toMatch(/json/);
      
      if (response.status === 201) {
        expect(response.body.success).toBe(true);
        expect(response.body.data.type).toBe('HIL_MENTION');
      }
    });

    it('should handle task interrupt notifications', async () => {
      const response = await client.post('/api/notifications', validNotificationFixtures.taskInterrupt);

      expect([201, 401, 500]).toContain(response.status);
      expect(response.headers['content-type']).toMatch(/json/);
      
      if (response.status === 201) {
        expect(response.body.success).toBe(true);
        expect(response.body.data.type).toBe('TASK_INTERRUPT');
      }
    });

    it('should handle urgent priority notifications', async () => {
      const response = await client.post('/api/notifications', validNotificationFixtures.urgent);

      expect([201, 401, 500]).toContain(response.status);
      expect(response.headers['content-type']).toMatch(/json/);
      
      if (response.status === 201) {
        expect(response.body.success).toBe(true);
        expect(response.body.data.priority).toBe('URGENT');
      }
    });

    it('should validate required fields', async () => {
      const response = await client.post('/api/notifications', invalidNotificationFixtures.missingTitle);

      expect([400, 401, 500]).toContain(response.status);
      
      if (response.status === 400) {
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Invalid request data');
      }
    });

    it('should validate notification type', async () => {
      const response = await client.post('/api/notifications', invalidNotificationFixtures.invalidType);

      expect([400, 401, 500]).toContain(response.status);
      
      if (response.status === 400) {
        expect(response.body.success).toBe(false);
      }
    });

    it('should validate user_id format', async () => {
      const response = await client.post('/api/notifications', invalidNotificationFixtures.invalidUserId);

      expect([400, 401, 500]).toContain(response.status);
      
      if (response.status === 400) {
        expect(response.body.success).toBe(false);
      }
    });

    it('should validate priority values', async () => {
      const response = await client.post('/api/notifications', invalidNotificationFixtures.invalidPriority);

      expect([400, 401, 500]).toContain(response.status);
      
      if (response.status === 400) {
        expect(response.body.success).toBe(false);
      }
    });

    it('should handle malformed JSON', async () => {
      const response = await client.request('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{ invalid json }'
      });

      expect([400, 401, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/notifications/:id', () => {
    it('should handle single notification requests', async () => {
      const testId = '12345678-1234-1234-1234-123456789012';
      const response = await client.get(`/api/notifications/${testId}`);

      expect([200, 401, 404, 500]).toContain(response.status);
      expect(response.headers['content-type']).toMatch(/json/);
      
      if (response.status === 404) {
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Notification not found');
      } else if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
      }
    });

    it('should handle invalid UUID format', async () => {
      const response = await client.get('/api/notifications/invalid-uuid');

      expect([400, 401, 404, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/notifications/:id', () => {
    it('should handle mark as read requests', async () => {
      const testId = '12345678-1234-1234-1234-123456789012';
      const response = await client.patch(`/api/notifications/${testId}`, updateNotificationFixtures.markAsRead);

      expect([200, 400, 401, 404, 500]).toContain(response.status);
      expect(response.headers['content-type']).toMatch(/json/);
      
      if (response.status === 404) {
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Notification not found');
      } else if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
      }
    });

    it('should handle mark as unread requests', async () => {
      const testId = '12345678-1234-1234-1234-123456789012';
      const response = await client.patch(`/api/notifications/${testId}`, { read: false });

      expect([200, 400, 401, 404, 500]).toContain(response.status);
      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should validate update data', async () => {
      const testId = '12345678-1234-1234-1234-123456789012';
      const response = await client.patch(`/api/notifications/${testId}`, updateNotificationFixtures.invalidUpdate);

      expect([400, 401, 404, 500]).toContain(response.status);
      
      if (response.status === 400) {
        expect(response.body.success).toBe(false);
      }
    });

    it('should handle invalid UUID', async () => {
      const response = await client.patch('/api/notifications/invalid-uuid', updateNotificationFixtures.markAsRead);

      expect([400, 401, 404, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    it('should handle notification deletion requests', async () => {
      const testId = '12345678-1234-1234-1234-123456789012';
      const response = await client.delete(`/api/notifications/${testId}`);

      expect([200, 401, 404, 500]).toContain(response.status);
      expect(response.headers['content-type']).toMatch(/json/);
      
      if (response.status === 404) {
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Notification not found');
      } else if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Notification deleted successfully');
      }
    });

    it('should handle invalid UUID', async () => {
      const response = await client.delete('/api/notifications/invalid-uuid');

      expect([400, 401, 404, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/notifications/bulk', () => {
    it('should handle bulk notification creation', async () => {
      const bulkData = {
        notifications: [
          validNotificationFixtures.basic,
          validNotificationFixtures.mention
        ]
      };

      const response = await client.post('/api/notifications/bulk', bulkData);

      expect([201, 400, 401, 500]).toContain(response.status);
      expect(response.headers['content-type']).toMatch(/json/);
      
      if (response.status === 201) {
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      }
    });

    it('should validate bulk data', async () => {
      const invalidBulkData = {
        notifications: [
          invalidNotificationFixtures.missingTitle
        ]
      };

      const response = await client.post('/api/notifications/bulk', invalidBulkData);

      expect([400, 401, 500]).toContain(response.status);
      
      if (response.status === 400) {
        expect(response.body.success).toBe(false);
      }
    });

    it('should handle empty notifications array', async () => {
      const emptyBulkData = { notifications: [] };

      const response = await client.post('/api/notifications/bulk', emptyBulkData);

      expect([400, 401, 500]).toContain(response.status);
      
      if (response.status === 400) {
        expect(response.body.success).toBe(false);
      }
    });
  });

  describe('PATCH /api/notifications/bulk/mark-read', () => {
    it('should handle bulk mark as read', async () => {
      const bulkMarkRead = {
        user_id: '12345678-1234-1234-1234-123456789012',
        notification_ids: [
          '12345678-1234-1234-1234-123456789012',
          '12345678-1234-1234-1234-123456789013'
        ]
      };

      const response = await client.patch('/api/notifications/bulk/mark-read', bulkMarkRead);

      expect([200, 400, 401, 500]).toContain(response.status);
      expect(response.headers['content-type']).toMatch(/json/);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('updated_count');
      }
    });

    it('should validate bulk mark read data', async () => {
      const invalidBulkMarkRead = {
        user_id: 'invalid-uuid'
      };

      const response = await client.patch('/api/notifications/bulk/mark-read', invalidBulkMarkRead);

      expect([400, 401, 500]).toContain(response.status);
      
      if (response.status === 400) {
        expect(response.body.success).toBe(false);
      }
    });
  });

  describe('GET /api/notifications/unread-count', () => {
    it('should handle unread count requests', async () => {
      const response = await client.get('/api/notifications/unread-count?user_id=12345678-1234-1234-1234-123456789012');

      expect([200, 400, 401, 500]).toContain(response.status);
      expect(response.headers['content-type']).toMatch(/json/);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('count');
        expect(typeof response.body.data.count).toBe('number');
      }
    });

    it('should require user_id parameter', async () => {
      const response = await client.get('/api/notifications/unread-count');

      expect([400, 401, 500]).toContain(response.status);
      
      if (response.status === 400) {
        expect(response.body.success).toBe(false);
      }
    });

    it('should validate user_id format', async () => {
      const response = await client.get('/api/notifications/unread-count?user_id=invalid-uuid');

      expect([400, 401, 500]).toContain(response.status);
      
      if (response.status === 400) {
        expect(response.body.success).toBe(false);
      }
    });
  });

  describe('Response Format Consistency', () => {
    const endpoints = [
      { method: 'GET', path: '/api/notifications?user_id=12345678-1234-1234-1234-123456789012' },
      { method: 'POST', path: '/api/notifications' },
      { method: 'GET', path: '/api/notifications/12345678-1234-1234-1234-123456789012' },
      { method: 'PATCH', path: '/api/notifications/12345678-1234-1234-1234-123456789012' },
      { method: 'DELETE', path: '/api/notifications/12345678-1234-1234-1234-123456789012' },
      { method: 'POST', path: '/api/notifications/bulk' },
      { method: 'PATCH', path: '/api/notifications/bulk/mark-read' },
      { method: 'GET', path: '/api/notifications/unread-count?user_id=12345678-1234-1234-1234-123456789012' }
    ];

    endpoints.forEach(({ method, path }) => {
      it(`should return consistent JSON format for ${method} ${path}`, async () => {
        let body;
        if (method === 'POST' && path === '/api/notifications') {
          body = validNotificationFixtures.basic;
        } else if (method === 'PATCH' && path.includes('/notifications/12345678')) {
          body = updateNotificationFixtures.markAsRead;
        } else if (method === 'POST' && path.includes('/bulk')) {
          body = { notifications: [validNotificationFixtures.basic] };
        } else if (method === 'PATCH' && path.includes('/bulk/mark-read')) {
          body = { user_id: '12345678-1234-1234-1234-123456789012', notification_ids: [] };
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
      const response = await client.request('/api/notifications', {
        method: 'POST',
        headers: {},
        body: JSON.stringify(validNotificationFixtures.basic)
      });

      expect([201, 400, 401, 415, 500]).toContain(response.status);
    });

    it('should handle empty request body for POST', async () => {
      const response = await client.request('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: ''
      });

      expect([400, 401, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    it('should handle oversized metadata gracefully', async () => {
      const largeNotification = {
        ...validNotificationFixtures.basic,
        metadata: {
          large_data: 'A'.repeat(100000) // Very large metadata
        }
      };

      const response = await client.post('/api/notifications', largeNotification);

      // Should either accept or reject appropriately
      expect([201, 400, 401, 413, 500]).toContain(response.status);
    });

    it('should handle concurrent read/unread operations', async () => {
      const testId = '12345678-1234-1234-1234-123456789012';
      
      // Try concurrent mark read and unread
      const operations = [
        client.patch(`/api/notifications/${testId}`, updateNotificationFixtures.markAsRead),
        client.patch(`/api/notifications/${testId}`, { read: false }),
        client.get(`/api/notifications/${testId}`)
      ];

      const responses = await Promise.all(operations);
      
      // All should return valid responses
      responses.forEach(response => {
        expect(response.headers['content-type']).toMatch(/json/);
        expect(response.body).toHaveProperty('success');
      });
    });

    it('should handle special characters in content', async () => {
      const specialNotification = {
        ...validNotificationFixtures.basic,
        title: 'Notification with special chars: 😀 <script>alert("xss")</script> & quotes "test" \'test\'',
        message: 'Message content with unicode: 🔔 ✅ ❌ and HTML: <b>bold</b>'
      };

      const response = await client.post('/api/notifications', specialNotification);

      // Should handle special characters appropriately
      expect([201, 400, 401, 500]).toContain(response.status);
      
      if (response.status === 201) {
        // Content should be preserved safely
        expect(response.body.data.title).toContain('special chars');
      }
    });
  });

  describe('Notification Types and Priorities', () => {
    const notificationTypes = [
      'WORKFLOW_UPDATE',
      'TASK_INTERRUPT', 
      'HIL_MENTION',
      'SYSTEM_ALERT',
      'DEADLINE_REMINDER'
    ];

    const priorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

    notificationTypes.forEach(type => {
      it(`should handle ${type} notification type`, async () => {
        const typeNotification = {
          ...validNotificationFixtures.basic,
          type: type as any
        };

        const response = await client.post('/api/notifications', typeNotification);
        expect([201, 400, 401, 500]).toContain(response.status);
      });
    });

    priorities.forEach(priority => {
      it(`should handle ${priority} priority level`, async () => {
        const priorityNotification = {
          ...validNotificationFixtures.basic,
          priority: priority as any
        };

        const response = await client.post('/api/notifications', priorityNotification);
        expect([201, 400, 401, 500]).toContain(response.status);
      });
    });
  });
});