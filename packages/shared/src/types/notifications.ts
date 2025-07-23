/**
 * Notification system types for Rexera 2.0
 */

import { Database } from './database';

// Base notification type from database
export type HilNotification = Database['public']['Tables']['hil_notifications']['Row'];
export type HilNotificationInsert = Database['public']['Tables']['hil_notifications']['Insert'];
export type HilNotificationUpdate = Database['public']['Tables']['hil_notifications']['Update'];

// Notification enums
export type NotificationType = Database['public']['Enums']['notification_type'];
export type PriorityLevel = Database['public']['Enums']['priority_level'];

// UI-specific notification interface
export interface UnifiedNotification extends Omit<HilNotification, 'metadata'> {
  // Metadata is strongly typed instead of Json
  metadata?: {
    workflow_id?: string;
    task_id?: string;
    agent_id?: string;
    client_id?: string;
    counterparty_id?: string;
    [key: string]: any;
  } | null;
}

// Notification settings interface
export interface NotificationSettings {
  showPopupsForUrgent: boolean;
  showPopupsForHigh: boolean;
  showPopupsForNormal: boolean;
  showPopupsForLow: boolean;
  enableTaskInterrupts: boolean;
  enableWorkflowFailures: boolean;
  enableTaskCompletions: boolean;
  enableSlaWarnings: boolean;
}

// Filter state for notifications table
export interface NotificationFilters {
  type: NotificationType | '';
  priority: PriorityLevel | '';
  readStatus: 'read' | 'unread' | '';
  searchQuery: string;
}

// Sorting options
export type NotificationSortField = 'created_at' | 'priority' | 'type';
export type SortDirection = 'asc' | 'desc';

// API response types
export interface NotificationsApiResponse {
  notifications: UnifiedNotification[];
  error?: string;
}

export interface NotificationStatsResponse {
  total: number;
  unread: number;
  urgent: number;
  taskInterrupts: number;
}

// Hook return types
export interface UseUnifiedNotificationsReturn {
  notifications: UnifiedNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  settings: NotificationSettings;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissNotification: (id: string) => Promise<void>;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
}

export interface UseNotificationsTableStateReturn {
  // State
  filterType: string;
  filterPriority: string;
  filterReadStatus: string;
  searchQuery: string;
  currentPage: number;
  itemsPerPage: number;
  sortField: NotificationSortField;
  sortDirection: SortDirection;
  
  // Computed values
  getSortIndicator: (field: string) => string;
  
  // Processing functions
  getFilteredNotifications: (notifications: UnifiedNotification[]) => UnifiedNotification[];
  getSortedNotifications: (notifications: UnifiedNotification[]) => UnifiedNotification[];
  getPaginatedNotifications: (notifications: UnifiedNotification[]) => UnifiedNotification[];
  
  // Actions
  handleSort: (field: NotificationSortField) => void;
  handleFilterTypeChange: (value: string) => void;
  handleFilterPriorityChange: (value: string) => void;
  handleFilterReadStatusChange: (value: string) => void;
  handleSearchChange: (value: string) => void;
  handleClearFilters: () => void;
  handlePageChange: (page: number) => void;
}