/**
 * Notifications API endpoints
 */

import { apiRequest } from '../core/request';
import type { 
  UnifiedNotification, 
  NotificationStatsResponse,
  NotificationsApiResponse 
} from '@rexera/shared';

export interface NotificationFilters {
  type?: string;
  priority?: string;
  read?: boolean;
  limit?: number;
  offset?: number;
}

export interface NotificationsPaginatedResponse {
  notifications: UnifiedNotification[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * Notifications API client
 */
export const notificationsApi = {
  /**
   * List notifications for the current user
   */
  async list(filters: NotificationFilters = {}): Promise<NotificationsPaginatedResponse> {
    const params = new URLSearchParams();
    
    if (filters.type) params.append('type', filters.type);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.read !== undefined) params.append('read', filters.read.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());

    const queryString = params.toString();
    const url = queryString ? `/notifications?${queryString}` : '/notifications';
    
    return apiRequest(url);
  },

  /**
   * Get notification statistics
   */
  async getStats(): Promise<NotificationStatsResponse> {
    return apiRequest('/notifications/stats');
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<{ notification: UnifiedNotification }> {
    return apiRequest(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ message: string; updated_count: number }> {
    return apiRequest('/notifications/mark-all-read', {
      method: 'PATCH',
    });
  },
};