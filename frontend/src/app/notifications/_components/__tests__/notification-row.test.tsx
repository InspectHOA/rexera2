/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NotificationRow } from '../notification-row';
import { useUnifiedNotifications } from '@/lib/hooks/use-unified-notifications';
import { useRouter } from 'next/navigation';
import type { UnifiedNotification } from '@rexera/shared';

// Mock dependencies
jest.mock('@/lib/hooks/use-unified-notifications');
jest.mock('next/navigation');

const mockUseUnifiedNotifications = useUnifiedNotifications as jest.MockedFunction<typeof useUnifiedNotifications>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockPush = jest.fn();
const mockMarkAsRead = jest.fn();

describe('NotificationRow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseRouter.mockReturnValue({
      push: mockPush,
    } as any);
    
    mockUseUnifiedNotifications.mockReturnValue({
      markAsRead: mockMarkAsRead,
    } as any);
  });

  const mockNotification: UnifiedNotification = {
    id: 'test-id',
    user_id: 'user-1',
    type: 'TASK_INTERRUPT',
    priority: 'URGENT',
    title: 'Test Notification Title',
    message: 'This is a test notification message',
    action_url: '/workflow/123',
    metadata: { workflow_id: '123' },
    read: false,
    read_at: null,
    created_at: '2024-01-01T12:00:00Z',
  };

  it('should render notification details correctly', () => {
    const { getByText, container } = render(
      <table>
        <tbody>
          <NotificationRow notification={mockNotification} isEven={true} />
        </tbody>
      </table>
    );

    expect(getByText('Test Notification Title')).toBeInTheDocument();
    expect(getByText('This is a test notification message')).toBeInTheDocument();
    expect(getByText('URGENT')).toBeInTheDocument();
    expect(getByText('TASK INTERRUPT')).toBeInTheDocument();
    expect(getByText('Unread')).toBeInTheDocument();
    
    // Check for workflow ID
    expect(getByText('123...')).toBeInTheDocument();
  });

  it('should show read status for read notifications', () => {
    const readNotification = {
      ...mockNotification,
      read: true,
      read_at: '2024-01-01T12:30:00Z',
    };

    const { getByText } = render(
      <table>
        <tbody>
          <NotificationRow notification={readNotification} isEven={false} />
        </tbody>
      </table>
    );

    expect(getByText('Read')).toBeInTheDocument();
  });

  it('should apply correct priority colors', () => {
    const { container, rerender } = render(
      <table>
        <tbody>
          <NotificationRow notification={mockNotification} isEven={true} />
        </tbody>
      </table>
    );

    // URGENT should have red background
    const urgentBadge = container.querySelector('.bg-red-100');
    expect(urgentBadge).toBeInTheDocument();

    // Test HIGH priority
    const highNotification = { ...mockNotification, priority: 'HIGH' as const };
    rerender(
      <table>
        <tbody>
          <NotificationRow notification={highNotification} isEven={true} />
        </tbody>
      </table>
    );

    const highBadge = container.querySelector('.bg-orange-100');
    expect(highBadge).toBeInTheDocument();
  });

  it('should apply correct type colors', () => {
    const { container, rerender } = render(
      <table>
        <tbody>
          <NotificationRow notification={mockNotification} isEven={true} />
        </tbody>
      </table>
    );

    // TASK_INTERRUPT should have yellow background
    const taskInterruptBadge = container.querySelector('.bg-yellow-100');
    expect(taskInterruptBadge).toBeInTheDocument();

    // Test SLA_WARNING type
    const slaNotification = { ...mockNotification, type: 'SLA_WARNING' as const };
    rerender(
      <table>
        <tbody>
          <NotificationRow notification={slaNotification} isEven={true} />
        </tbody>
      </table>
    );

    const slaBadge = container.querySelector('.bg-red-100');
    expect(slaBadge).toBeInTheDocument();
  });

  it('should format dates correctly', () => {
    // Test recent notification (should show minutes ago)
    const recentDate = new Date(Date.now() - 30 * 60 * 1000).toISOString(); // 30 minutes ago
    const recentNotification = { ...mockNotification, created_at: recentDate };

    const { getByText } = render(
      <table>
        <tbody>
          <NotificationRow notification={recentNotification} isEven={true} />
        </tbody>
      </table>
    );

    expect(getByText('30m ago')).toBeInTheDocument();
  });

  it('should show hours ago for notifications within 24 hours', () => {
    const hoursAgoDate = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // 2 hours ago
    const hoursAgoNotification = { ...mockNotification, created_at: hoursAgoDate };

    const { getByText } = render(
      <table>
        <tbody>
          <NotificationRow notification={hoursAgoNotification} isEven={true} />
        </tbody>
      </table>
    );

    expect(getByText('2h ago')).toBeInTheDocument();
  });

  it('should handle click event correctly for unread notifications', async () => {
    const { container } = render(
      <table>
        <tbody>
          <NotificationRow notification={mockNotification} isEven={true} />
        </tbody>
      </table>
    );

    const row = container.querySelector('tr');
    expect(row).toBeInTheDocument();

    fireEvent.click(row!);

    await waitFor(() => {
      expect(mockMarkAsRead).toHaveBeenCalledWith('test-id');
      expect(mockPush).toHaveBeenCalledWith('/workflow/123');
    });
  });

  it('should not mark read notifications as read again', async () => {
    const readNotification = {
      ...mockNotification,
      read: true,
      read_at: '2024-01-01T12:30:00Z',
    };

    const { container } = render(
      <table>
        <tbody>
          <NotificationRow notification={readNotification} isEven={true} />
        </tbody>
      </table>
    );

    const row = container.querySelector('tr');
    fireEvent.click(row!);

    await waitFor(() => {
      expect(mockMarkAsRead).not.toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/workflow/123');
    });
  });

  it('should handle external URLs correctly', async () => {
    const externalNotification = {
      ...mockNotification,
      action_url: 'https://external-site.com',
    };

    // Mock window.open
    const mockOpen = jest.fn();
    Object.defineProperty(window, 'open', {
      writable: true,
      value: mockOpen,
    });

    const { container } = render(
      <table>
        <tbody>
          <NotificationRow notification={externalNotification} isEven={true} />
        </tbody>
      </table>
    );

    const row = container.querySelector('tr');
    fireEvent.click(row!);

    await waitFor(() => {
      expect(mockMarkAsRead).toHaveBeenCalledWith('test-id');
      expect(mockOpen).toHaveBeenCalledWith('https://external-site.com', '_blank');
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it('should handle notifications without action URLs', async () => {
    const noActionNotification = {
      ...mockNotification,
      action_url: null,
    };

    const { container } = render(
      <table>
        <tbody>
          <NotificationRow notification={noActionNotification} isEven={true} />
        </tbody>
      </table>
    );

    const row = container.querySelector('tr');
    fireEvent.click(row!);

    await waitFor(() => {
      expect(mockMarkAsRead).toHaveBeenCalledWith('test-id');
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it('should apply correct styling for even/odd rows', () => {
    const { container, rerender } = render(
      <table>
        <tbody>
          <NotificationRow notification={mockNotification} isEven={true} />
        </tbody>
      </table>
    );

    let row = container.querySelector('tr');
    expect(row).toHaveClass('bg-background');

    rerender(
      <table>
        <tbody>
          <NotificationRow notification={mockNotification} isEven={false} />
        </tbody>
      </table>
    );

    row = container.querySelector('tr');
    expect(row).toHaveClass('bg-muted/20');
  });

  it('should show workflow ID when metadata is available', () => {
    const { getByText } = render(
      <table>
        <tbody>
          <NotificationRow notification={mockNotification} isEven={true} />
        </tbody>
      </table>
    );

    expect(getByText('123...')).toBeInTheDocument();
  });

  it('should show dash when no workflow metadata', () => {
    const noMetadataNotification = {
      ...mockNotification,
      metadata: null,
    };

    const { getByText } = render(
      <table>
        <tbody>
          <NotificationRow notification={noMetadataNotification} isEven={true} />
        </tbody>
      </table>
    );

    expect(getByText('—')).toBeInTheDocument();
  });

  it('should apply correct read status indicator', () => {
    const { container } = render(
      <table>
        <tbody>
          <NotificationRow notification={mockNotification} isEven={true} />
        </tbody>
      </table>
    );

    // Unread notification should have primary colored dot
    const dot = container.querySelector('.bg-primary');
    expect(dot).toBeInTheDocument();
  });

  it('should truncate long titles and messages', () => {
    const longNotification = {
      ...mockNotification,
      title: 'This is a very long notification title that should be truncated when displayed in the table',
      message: 'This is a very long notification message that should also be truncated to prevent layout issues',
    };

    const { container } = render(
      <table>
        <tbody>
          <NotificationRow notification={longNotification} isEven={true} />
        </tbody>
      </table>
    );

    const titleElement = container.querySelector('.truncate');
    expect(titleElement).toBeInTheDocument();
  });
});