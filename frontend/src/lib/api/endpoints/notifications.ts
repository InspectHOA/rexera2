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
  page?: number;
  include?: string[];
}

export interface NotificationsPaginatedResponse {
  data: UnifiedNotification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
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
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.include) params.append('include', filters.include.join(','));

    const queryString = params.toString();
    const url = queryString ? `/notifications?${queryString}` : '/notifications';
    
    return apiRequest(url);
  },

  /**
   * Get notification by ID
   */
  async byId(id: string, include?: string[]): Promise<UnifiedNotification> {
    const params = new URLSearchParams();
    if (include) params.append('include', include.join(','));
    
    const url = `/notifications/${id}${params.toString() ? `?${params.toString()}` : ''}`;
    return apiRequest<UnifiedNotification>(url);
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

  /**
   * Create a new notification (typically used by system/HIL users)
   */
  async create(data: {
    user_id: string;
    type: string;
    priority: string;
    title: string;
    message: string;
    metadata?: Record<string, any>;
  }): Promise<UnifiedNotification> {
    return apiRequest('/notifications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update notification
   */
  async update(id: string, data: {
    read?: boolean;
    read_at?: string;
  }): Promise<UnifiedNotification> {
    return apiRequest(`/notifications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete notification
   */
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    return apiRequest<{ success: boolean; message: string }>(`/notifications/${id}`, {
      method: 'DELETE'
    });
  },
};