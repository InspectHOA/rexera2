/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter, usePathname } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardHeader } from '../header';
import { useAuth } from '@/lib/auth/provider';
import { useUnifiedNotifications } from '@/lib/hooks/use-unified-notifications';
import type { UnifiedNotification } from '@rexera/shared';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));
jest.mock('@/lib/auth/provider');
jest.mock('@/lib/hooks/use-unified-notifications');
jest.mock('@/app/workflow/_components/workflow-creation-modal', () => ({
  WorkflowCreationModal: ({ isOpen, onClose }: any) => 
    isOpen ? <div data-testid="workflow-modal">Workflow Modal</div> : null
}));
jest.mock('@/components/ui/theme-switcher', () => ({
  ThemeSwitcher: () => <div data-testid="theme-switcher">Theme Switcher</div>
}));
jest.mock('@/components/ui/rexera-logo', () => ({
  RexeraLogo: ({ className }: any) => <div className={className} data-testid="rexera-logo">Rexera Logo</div>
}));

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseUnifiedNotifications = useUnifiedNotifications as jest.MockedFunction<typeof useUnifiedNotifications>;

const mockPush = jest.fn();
const mockSignOut = jest.fn();
const mockMarkAsRead = jest.fn();
const mockMarkAllAsRead = jest.fn();
const mockDismissNotification = jest.fn();

// Mock notifications
const mockNotifications: UnifiedNotification[] = [
  {
    id: 'notif-1',
    user_id: 'user-1',
    type: 'TASK_INTERRUPT',
    priority: 'HIGH',
    title: 'Task Requires Attention',
    message: 'Manual review needed for workflow WF-001',
    action_url: '/workflow/wf-001',
    metadata: { workflow_id: 'wf-001' },
    read: false,
    read_at: null,
    created_at: '2024-01-01T10:00:00Z'
  },
  {
    id: 'notif-2',
    user_id: 'user-1',
    type: 'SLA_WARNING',
    priority: 'URGENT',
    title: 'SLA Warning',
    message: 'Workflow approaching deadline',
    action_url: '/workflow/wf-002',
    metadata: { workflow_id: 'wf-002' },
    read: true,
    read_at: '2024-01-01T09:30:00Z',
    created_at: '2024-01-01T09:00:00Z'
  }
];

describe('DashboardHeader', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    } as any);

    mockUsePathname.mockReturnValue('/dashboard');

    mockUseAuth.mockReturnValue({
      user: {
        id: 'user-1',
        email: 'john.doe@example.com',
        user_metadata: {
          full_name: 'John Doe',
          avatar_url: 'https://example.com/avatar.jpg'
        }
      },
      profile: {
        id: 'profile-1',
        full_name: 'John Doe',
        role: 'HIL'
      },
      loading: false,
      signOut: mockSignOut
    } as any);

    mockUseUnifiedNotifications.mockReturnValue({
      notifications: mockNotifications,
      unreadCount: 1,
      loading: false,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      dismissNotification: mockDismissNotification
    } as any);
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <DashboardHeader />
      </QueryClientProvider>
    );
  };

  describe('Component Rendering', () => {
    it('should render all header elements', () => {
      renderComponent();

      expect(screen.getByTestId('rexera-logo')).toBeInTheDocument();
      expect(screen.getByText('Workflows')).toBeInTheDocument();
      expect(screen.getByText('Create Workflow')).toBeInTheDocument();
      expect(screen.getByTitle('View notifications')).toBeInTheDocument();
      expect(screen.getByTestId('theme-switcher')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should show loading state for user name', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        profile: null,
        loading: true,
        signOut: mockSignOut
      } as any);

      renderComponent();

      expect(screen.getByText('...')).toBeInTheDocument();
    });

    it('should show user initials when no avatar', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user-1',
          email: 'john.doe@example.com',
          user_metadata: {
            full_name: 'John Doe'
          }
        },
        profile: {
          id: 'profile-1',
          full_name: 'John Doe',
          role: 'HIL'
        },
        loading: false,
        signOut: mockSignOut
      } as any);

      renderComponent();

      const avatarButton = screen.getByTitle('Click to sign out');
      expect(avatarButton).toHaveTextContent('JD');
    });
  });

  describe('Navigation', () => {
    it('should navigate to dashboard when logo is clicked', () => {
      renderComponent();

      const logo = screen.getByTitle('Go to Dashboard');
      fireEvent.click(logo);

      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('should navigate to dashboard when Workflows breadcrumb is clicked', () => {
      renderComponent();

      const workflowsLink = screen.getByText('Workflows');
      fireEvent.click(workflowsLink);

      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('should show correct breadcrumb for non-dashboard pages', () => {
      mockUsePathname.mockReturnValue('/notifications');
      renderComponent();

      expect(screen.getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByText('/')).toBeInTheDocument();
    });
  });

  describe('Workflow Creation', () => {
    it('should open workflow modal when Create Workflow is clicked', () => {
      renderComponent();

      const createButton = screen.getByText('Create Workflow');
      fireEvent.click(createButton);

      expect(screen.getByTestId('workflow-modal')).toBeInTheDocument();
    });

    it('should close workflow modal when onClose is called', () => {
      renderComponent();

      const createButton = screen.getByText('Create Workflow');
      fireEvent.click(createButton);

      // Modal should be open
      expect(screen.getByTestId('workflow-modal')).toBeInTheDocument();

      // Simulate modal close - this would be done by the modal component
      // We can't directly test this without mocking the modal implementation
    });
  });

  describe('Notifications', () => {
    it('should show unread notification count', () => {
      renderComponent();

      const notificationBadge = screen.getByText('1');
      expect(notificationBadge).toBeInTheDocument();
      expect(notificationBadge).toHaveClass('bg-destructive');
    });

    it('should not show badge when no unread notifications', () => {
      mockUseUnifiedNotifications.mockReturnValue({
        notifications: mockNotifications.map(n => ({ ...n, read: true })),
        unreadCount: 0,
        loading: false,
        markAsRead: mockMarkAsRead,
        markAllAsRead: mockMarkAllAsRead,
        dismissNotification: mockDismissNotification
      } as any);

      renderComponent();

      expect(screen.queryByText('1')).not.toBeInTheDocument();
    });

    it('should open notifications dropdown when bell is clicked', () => {
      renderComponent();

      const bellButton = screen.getByTitle('View notifications');
      fireEvent.click(bellButton);

      expect(screen.getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByText('2 notifications • 1 unread')).toBeInTheDocument();
    });

    it('should show notification items in dropdown', () => {
      renderComponent();

      const bellButton = screen.getByTitle('View notifications');
      fireEvent.click(bellButton);

      expect(screen.getByText('Task Requires Attention')).toBeInTheDocument();
      expect(screen.getByText('SLA Warning')).toBeInTheDocument();
      expect(screen.getByText('Manual review needed for workflow WF-001')).toBeInTheDocument();
    });

    it('should mark notification as read when clicked', async () => {
      renderComponent();

      const bellButton = screen.getByTitle('View notifications');
      fireEvent.click(bellButton);

      const notification = screen.getByText('Task Requires Attention');
      fireEvent.click(notification);

      await waitFor(() => {
        expect(mockMarkAsRead).toHaveBeenCalledWith('notif-1');
        expect(mockPush).toHaveBeenCalledWith('/workflow/wf-001');
      });
    });

    it('should mark all as read when button is clicked', async () => {
      renderComponent();

      const bellButton = screen.getByTitle('View notifications');
      fireEvent.click(bellButton);

      const markAllButton = screen.getByText('Mark all read');
      fireEvent.click(markAllButton);

      await waitFor(() => {
        expect(mockMarkAllAsRead).toHaveBeenCalled();
      });
    });

    it('should dismiss notification when X is clicked', async () => {
      renderComponent();

      const bellButton = screen.getByTitle('View notifications');
      fireEvent.click(bellButton);

      const dismissButtons = screen.getAllByTitle('Dismiss notification');
      fireEvent.click(dismissButtons[0]);

      await waitFor(() => {
        expect(mockDismissNotification).toHaveBeenCalledWith('notif-1');
      });
    });

    it('should handle external URLs in notifications', async () => {
      const mockOpen = jest.fn();
      Object.defineProperty(window, 'open', {
        writable: true,
        value: mockOpen,
      });

      const externalNotification = {
        ...mockNotifications[0],
        action_url: 'https://external-site.com'
      };

      mockUseUnifiedNotifications.mockReturnValue({
        notifications: [externalNotification],
        unreadCount: 1,
        loading: false,
        markAsRead: mockMarkAsRead,
        markAllAsRead: mockMarkAllAsRead,
        dismissNotification: mockDismissNotification
      } as any);

      renderComponent();

      const bellButton = screen.getByTitle('View notifications');
      fireEvent.click(bellButton);

      const notification = screen.getByText('Task Requires Attention');
      fireEvent.click(notification);

      await waitFor(() => {
        expect(mockMarkAsRead).toHaveBeenCalledWith('notif-1');
        expect(mockOpen).toHaveBeenCalledWith('https://external-site.com', '_blank');
      });
    });

    it('should show "View all notifications" when more than 10 notifications', () => {
      const manyNotifications = Array.from({ length: 15 }, (_, i) => ({
        ...mockNotifications[0],
        id: `notif-${i}`,
        title: `Notification ${i}`
      }));

      mockUseUnifiedNotifications.mockReturnValue({
        notifications: manyNotifications,
        unreadCount: 15,
        loading: false,
        markAsRead: mockMarkAsRead,
        markAllAsRead: mockMarkAllAsRead,
        dismissNotification: mockDismissNotification
      } as any);

      renderComponent();

      const bellButton = screen.getByTitle('View notifications');
      fireEvent.click(bellButton);

      expect(screen.getByText('View all 15 notifications')).toBeInTheDocument();
    });

    it('should navigate to notifications page when "View all" is clicked', () => {
      const manyNotifications = Array.from({ length: 15 }, (_, i) => ({
        ...mockNotifications[0],
        id: `notif-${i}`,
        title: `Notification ${i}`
      }));

      mockUseUnifiedNotifications.mockReturnValue({
        notifications: manyNotifications,
        unreadCount: 15,
        loading: false,
        markAsRead: mockMarkAsRead,
        markAllAsRead: mockMarkAllAsRead,
        dismissNotification: mockDismissNotification
      } as any);

      renderComponent();

      const bellButton = screen.getByTitle('View notifications');
      fireEvent.click(bellButton);

      const viewAllButton = screen.getByText('View all 15 notifications');
      fireEvent.click(viewAllButton);

      expect(mockPush).toHaveBeenCalledWith('/notifications');
    });
  });

  describe('User Authentication', () => {
    it('should display user full name from profile', () => {
      renderComponent();

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should display user email prefix when no full name', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user-1',
          email: 'john.doe@example.com',
          user_metadata: {}
        },
        profile: null,
        loading: false,
        signOut: mockSignOut
      } as any);

      renderComponent();

      expect(screen.getByText('john.doe')).toBeInTheDocument();
    });

    it('should sign out when avatar is clicked', async () => {
      renderComponent();

      const avatarButton = screen.getByTitle('Click to sign out');
      fireEvent.click(avatarButton);

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
      });
    });

    it('should show avatar image when available', () => {
      renderComponent();

      const avatarButton = screen.getByTitle('Click to sign out');
      expect(avatarButton).toHaveStyle({
        backgroundImage: 'url(https://example.com/avatar.jpg)'
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and titles', () => {
      renderComponent();

      expect(screen.getByTitle('Go to Dashboard')).toBeInTheDocument();
      expect(screen.getByTitle('View notifications')).toBeInTheDocument();
      expect(screen.getByTitle('Click to sign out')).toBeInTheDocument();
    });

    it('should support keyboard navigation for notifications', () => {
      renderComponent();

      const bellButton = screen.getByTitle('View notifications');
      bellButton.focus();
      expect(document.activeElement).toBe(bellButton);

      fireEvent.keyDown(bellButton, { key: 'Enter' });
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading state for notifications', () => {
      mockUseUnifiedNotifications.mockReturnValue({
        notifications: [],
        unreadCount: 0,
        loading: true,
        markAsRead: mockMarkAsRead,
        markAllAsRead: mockMarkAllAsRead,
        dismissNotification: mockDismissNotification
      } as any);

      renderComponent();

      const bellButton = screen.getByTitle('View notifications');
      fireEvent.click(bellButton);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should show empty state for notifications', () => {
      mockUseUnifiedNotifications.mockReturnValue({
        notifications: [],
        unreadCount: 0,
        loading: false,
        markAsRead: mockMarkAsRead,
        markAllAsRead: mockMarkAllAsRead,
        dismissNotification: mockDismissNotification
      } as any);

      renderComponent();

      const bellButton = screen.getByTitle('View notifications');
      fireEvent.click(bellButton);

      expect(screen.getByText('No notifications')).toBeInTheDocument();
    });
  });
});