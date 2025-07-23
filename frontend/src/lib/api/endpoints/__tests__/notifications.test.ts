/**
 * @jest-environment jsdom
 */

import { notificationsApi } from '../notifications';
import { apiRequest } from '../../core/request';

// Mock the API request function
jest.mock('../../core/request', () => ({
  apiRequest: jest.fn(),
}));

const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

describe('notificationsApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    const mockNotifications = [
      {
        id: '1',
        user_id: 'user-1',
        type: 'TASK_INTERRUPT',
        priority: 'URGENT',
        title: 'Test Notification',
        message: 'Test message',
        action_url: null,
        metadata: null,
        read: false,
        read_at: null,
        created_at: '2024-01-01T00:00:00Z',
      },
    ];

    it('should fetch notifications with default parameters', async () => {
      // apiRequest extracts the 'data' field, so it returns the notifications array directly
      mockApiRequest.mockResolvedValue(mockNotifications);

      const result = await notificationsApi.list();

      expect(mockApiRequest).toHaveBeenCalledWith('/notifications');
      expect(result).toEqual(mockNotifications);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
    });

    it('should fetch notifications with filters', async () => {
      mockApiRequest.mockResolvedValue(mockNotifications);

      const filters = {
        type: 'TASK_INTERRUPT',
        priority: 'URGENT',
        read: false,
        limit: 50,
        offset: 10,
      };

      const result = await notificationsApi.list(filters);

      expect(mockApiRequest).toHaveBeenCalledWith(
        '/notifications?type=TASK_INTERRUPT&priority=URGENT&read=false&limit=50&offset=10'
      );
      expect(result).toEqual(mockNotifications);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle empty filters', async () => {
      mockApiRequest.mockResolvedValue(mockNotifications);

      const result = await notificationsApi.list({});

      expect(mockApiRequest).toHaveBeenCalledWith('/notifications');
      expect(result).toEqual(mockNotifications);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle partial filters', async () => {
      mockApiRequest.mockResolvedValue(mockNotifications);

      const filters = {
        type: 'SLA_WARNING',
        limit: 25,
      };

      const result = await notificationsApi.list(filters);

      expect(mockApiRequest).toHaveBeenCalledWith(
        '/notifications?type=SLA_WARNING&limit=25'
      );
      expect(result).toEqual(mockNotifications);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle empty notifications list', async () => {
      mockApiRequest.mockResolvedValue([]);

      const result = await notificationsApi.list();

      expect(mockApiRequest).toHaveBeenCalledWith('/notifications');
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });
  });

  describe('getStats', () => {
    const mockStats = {
      total: 10,
      unread: 5,
      urgent: 2,
      taskInterrupts: 3,
    };

    it('should fetch notification statistics', async () => {
      mockApiRequest.mockResolvedValue(mockStats);

      const result = await notificationsApi.getStats();

      expect(mockApiRequest).toHaveBeenCalledWith('/notifications/stats');
      expect(result).toEqual(mockStats);
    });
  });

  describe('markAsRead', () => {
    const mockResponse = {
      notification: {
        id: '1',
        user_id: 'user-1',
        type: 'TASK_INTERRUPT',
        priority: 'URGENT',
        title: 'Test Notification',
        message: 'Test message',
        action_url: null,
        metadata: null,
        read: true,
        read_at: '2024-01-01T01:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
      },
    };

    it('should mark a notification as read', async () => {
      mockApiRequest.mockResolvedValue(mockResponse);

      const notificationId = '1';
      const result = await notificationsApi.markAsRead(notificationId);

      expect(mockApiRequest).toHaveBeenCalledWith(
        '/notifications/1/read',
        { method: 'PATCH' }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('markAllAsRead', () => {
    const mockResponse = {
      message: 'Marked 5 notifications as read',
      updated_count: 5,
    };

    it('should mark all notifications as read', async () => {
      mockApiRequest.mockResolvedValue(mockResponse);

      const result = await notificationsApi.markAllAsRead();

      expect(mockApiRequest).toHaveBeenCalledWith(
        '/notifications/mark-all-read',
        { method: 'PATCH' }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('error handling', () => {
    it('should propagate API errors', async () => {
      const errorMessage = 'Network error';
      mockApiRequest.mockRejectedValue(new Error(errorMessage));

      await expect(notificationsApi.list()).rejects.toThrow(errorMessage);
    });

    it('should handle malformed responses gracefully', async () => {
      mockApiRequest.mockResolvedValue(null);

      const result = await notificationsApi.list();

      expect(result).toBeNull();
    });
  });
});