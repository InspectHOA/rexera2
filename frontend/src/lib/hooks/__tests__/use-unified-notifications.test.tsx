/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';
import { useUnifiedNotifications } from '../use-unified-notifications';
import { api } from '@/lib/api';
import type { UnifiedNotification } from '@rexera/shared';

// Mock dependencies
jest.mock('@/lib/auth/provider', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
    loading: false,
  }),
}));

jest.mock('@/lib/supabase/provider', () => ({
  useSupabase: () => ({
    supabase: {
      channel: jest.fn(() => ({
        on: jest.fn(() => ({ subscribe: jest.fn() })),
      })),
    },
  }),
}));

jest.mock('@/lib/hooks/use-toast', () => ({
  toast: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  api: {
    notifications: {
      list: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
    },
  },
}));

const mockApi = api as any;

// Test component that uses the hook
const TestComponent = () => {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    dismissNotification,
  } = useUnifiedNotifications();

  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'ready'}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <div data-testid="notifications-count">{notifications.length}</div>
      <div data-testid="unread-count">{unreadCount}</div>
      <button 
        data-testid="mark-as-read-btn" 
        onClick={() => markAsRead('test-id')}
      >
        Mark as Read
      </button>
      <button 
        data-testid="mark-all-read-btn" 
        onClick={() => markAllAsRead()}
      >
        Mark All Read
      </button>
      <button 
        data-testid="dismiss-btn" 
        onClick={() => dismissNotification('test-id')}
      >
        Dismiss
      </button>
    </div>
  );
};

// Wrapper component with React Query provider
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useUnifiedNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockNotifications: UnifiedNotification[] = [
    {
      id: '1',
      user_id: 'test-user-id',
      type: 'TASK_INTERRUPT',
      priority: 'URGENT',
      title: 'Test Notification 1',
      message: 'Test message 1',
      action_url: null,
      metadata: undefined,
      read: false,
      read_at: null,
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      user_id: 'test-user-id',
      type: 'SLA_WARNING',
      priority: 'HIGH',
      title: 'Test Notification 2',
      message: 'Test message 2',
      action_url: '/workflow/123',
      metadata: { workflow_id: '123' },
      read: true,
      read_at: '2024-01-01T01:00:00Z',
      created_at: '2024-01-01T00:30:00Z',
    },
  ];

  it('should fetch and display notifications', async () => {
    // Fixed: Mock should return the array directly, not wrapped in { data: ... }
    mockApi.notifications.list.mockResolvedValue(mockNotifications);

    const { getByTestId } = render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    // Initially loading
    expect(getByTestId('loading')).toHaveTextContent('loading');

    // Wait for data to load
    await waitFor(() => {
      expect(getByTestId('loading')).toHaveTextContent('ready');
    });

    expect(getByTestId('notifications-count')).toHaveTextContent('2');
    expect(getByTestId('unread-count')).toHaveTextContent('1');
    expect(getByTestId('error')).toHaveTextContent('no-error');
  });

  it('should handle empty notifications list', async () => {
    mockApi.notifications.list.mockResolvedValue([]);

    const { getByTestId } = render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByTestId('loading')).toHaveTextContent('ready');
    });

    expect(getByTestId('notifications-count')).toHaveTextContent('0');
    expect(getByTestId('unread-count')).toHaveTextContent('0');
  });

  it('should handle API errors gracefully', async () => {
    const errorMessage = 'Failed to fetch notifications';
    mockApi.notifications.list.mockRejectedValue(new Error(errorMessage));

    const { getByTestId } = render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByTestId('loading')).toHaveTextContent('ready');
    }, { timeout: 3000 });

    expect(getByTestId('error')).toHaveTextContent(errorMessage);
  });

  it('should mark notification as read', async () => {
    mockApi.notifications.list.mockResolvedValue(mockNotifications);

    mockApi.notifications.markAsRead.mockResolvedValue({
      notification: { ...mockNotifications[0], read: true, read_at: '2024-01-01T02:00:00Z' },
    });

    const { getByTestId } = render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByTestId('loading')).toHaveTextContent('ready');
    });

    // Click mark as read button
    await act(async () => {
      getByTestId('mark-as-read-btn').click();
    });

    expect(mockApi.notifications.markAsRead).toHaveBeenCalledWith('test-id');
  });

  it('should mark all notifications as read', async () => {
    mockApi.notifications.list.mockResolvedValue(mockNotifications);

    mockApi.notifications.markAllAsRead.mockResolvedValue({
      message: 'Marked 1 notifications as read',
      updated_count: 1,
    });

    const { getByTestId } = render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByTestId('loading')).toHaveTextContent('ready');
    });

    // Click mark all as read button
    await act(async () => {
      getByTestId('mark-all-read-btn').click();
    });

    expect(mockApi.notifications.markAllAsRead).toHaveBeenCalled();
  });

  it('should calculate unread count correctly', async () => {
    const mixedNotifications: UnifiedNotification[] = [
      { ...mockNotifications[0], read: false },
      { ...mockNotifications[1], read: false },
      { ...mockNotifications[0], id: '3', read: true },
    ];

    mockApi.notifications.list.mockResolvedValue(mixedNotifications);

    const { getByTestId } = render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByTestId('loading')).toHaveTextContent('ready');
    });

    expect(getByTestId('notifications-count')).toHaveTextContent('3');
    expect(getByTestId('unread-count')).toHaveTextContent('2');
  });

  it('should handle dismiss notification', async () => {
    mockApi.notifications.list.mockResolvedValue(mockNotifications);

    mockApi.notifications.markAsRead.mockResolvedValue({
      notification: { ...mockNotifications[0], read: true, read_at: '2024-01-01T02:00:00Z' },
    });

    const { getByTestId } = render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByTestId('loading')).toHaveTextContent('ready');
    });

    // Click dismiss button (which should call markAsRead)
    await act(async () => {
      getByTestId('dismiss-btn').click();
    });

    expect(mockApi.notifications.markAsRead).toHaveBeenCalledWith('test-id');
  });
});