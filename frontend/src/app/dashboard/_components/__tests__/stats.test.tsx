/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardStats } from '../stats';
import { useWorkflows } from '@/lib/hooks/use-workflows';

// Mock dependencies
jest.mock('@/lib/hooks/use-workflows');

const mockUseWorkflows = useWorkflows as jest.MockedFunction<typeof useWorkflows>;

const mockStats = {
  active: 25,
  interrupts: 3,
  completedToday: 8,
  completed: 120,
  failed: 2,
  pending: 5
};

const mockPagination = {
  page: 1,
  limit: 100,
  total: 155,
  totalPages: 2
};

describe('DashboardStats', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <DashboardStats />
      </QueryClientProvider>
    );
  };

  describe('Component Rendering', () => {
    it('should render all stat categories', () => {
      mockUseWorkflows.mockReturnValue({
        stats: mockStats,
        pagination: mockPagination,
        loading: false,
        error: null
      } as any);

      renderComponent();

      expect(screen.getByText('Total Workflows')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Interrupts')).toBeInTheDocument();
      expect(screen.getByText('Completed Today')).toBeInTheDocument();
    });

    it('should display correct stat values', () => {
      mockUseWorkflows.mockReturnValue({
        stats: mockStats,
        pagination: mockPagination,
        loading: false,
        error: null
      } as any);

      renderComponent();

      expect(screen.getByText('155')).toBeInTheDocument(); // Total workflows
      expect(screen.getByText('25')).toBeInTheDocument(); // Active
      expect(screen.getByText('3')).toBeInTheDocument(); // Interrupts
      expect(screen.getByText('8')).toBeInTheDocument(); // Completed today
    });

    it('should show system online status when data loads successfully', () => {
      mockUseWorkflows.mockReturnValue({
        stats: mockStats,
        pagination: mockPagination,
        loading: false,
        error: null
      } as any);

      renderComponent();

      expect(screen.getByText('System Online')).toBeInTheDocument();
      const statusIndicator = document.querySelector('.bg-green-500');
      expect(statusIndicator).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading indicators for all stats', () => {
      mockUseWorkflows.mockReturnValue({
        stats: {},
        pagination: {},
        loading: true,
        error: null
      } as any);

      renderComponent();

      const loadingIndicators = screen.getAllByText('...');
      expect(loadingIndicators).toHaveLength(4); // One for each stat
    });

    it('should show loading status message', () => {
      mockUseWorkflows.mockReturnValue({
        stats: {},
        pagination: {},
        loading: true,
        error: null
      } as any);

      renderComponent();

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error indicators for all stats', () => {
      mockUseWorkflows.mockReturnValue({
        stats: {},
        pagination: {},
        loading: false,
        error: new Error('Database connection failed')
      } as any);

      renderComponent();

      const errorIndicators = screen.getAllByText('Error');
      expect(errorIndicators).toHaveLength(4); // One for each stat
    });

    it('should show database connection failed status', () => {
      mockUseWorkflows.mockReturnValue({
        stats: {},
        pagination: {},
        loading: false,
        error: new Error('Database connection failed')
      } as any);

      renderComponent();

      expect(screen.getByText('Database Connection Failed')).toBeInTheDocument();
      
      // Check for error status indicator
      const errorContainer = screen.getByText('Database Connection Failed').closest('div');
      expect(errorContainer).toHaveClass('bg-destructive/10');
      expect(errorContainer).toHaveClass('text-destructive');
    });

    it('should show red status indicator on error', () => {
      mockUseWorkflows.mockReturnValue({
        stats: {},
        pagination: {},
        loading: false,
        error: new Error('Network error')
      } as any);

      renderComponent();

      const errorIndicator = document.querySelector('.bg-destructive');
      expect(errorIndicator).toBeInTheDocument();
    });
  });

  describe('Zero Values', () => {
    it('should handle zero values correctly', () => {
      const zeroStats = {
        active: 0,
        interrupts: 0,
        completedToday: 0,
        completed: 0,
        failed: 0,
        pending: 0
      };

      const zeroPagination = {
        page: 1,
        limit: 100,
        total: 0,
        totalPages: 0
      };

      mockUseWorkflows.mockReturnValue({
        stats: zeroStats,
        pagination: zeroPagination,
        loading: false,
        error: null
      } as any);

      renderComponent();

      // Check that zeros are displayed properly
      const zeroTexts = screen.getAllByText('0');
      expect(zeroTexts.length).toBeGreaterThanOrEqual(4); // At least 4 zeros for our stats
    });
  });

  describe('Large Numbers', () => {
    it('should handle large numbers correctly', () => {
      const largeStats = {
        active: 9999,
        interrupts: 1234,
        completedToday: 567,
        completed: 99999,
        failed: 890,
        pending: 456
      };

      const largePagination = {
        page: 1,
        limit: 100,
        total: 99999,
        totalPages: 1000
      };

      mockUseWorkflows.mockReturnValue({
        stats: largeStats,
        pagination: largePagination,
        loading: false,
        error: null
      } as any);

      renderComponent();

      expect(screen.getByText('99999')).toBeInTheDocument(); // Total workflows
      expect(screen.getByText('9999')).toBeInTheDocument(); // Active
      expect(screen.getByText('1234')).toBeInTheDocument(); // Interrupts
      expect(screen.getByText('567')).toBeInTheDocument(); // Completed today
    });
  });

  describe('Component Structure', () => {
    it('should have proper CSS classes for styling', () => {
      mockUseWorkflows.mockReturnValue({
        stats: mockStats,
        pagination: mockPagination,
        loading: false,
        error: null
      } as any);

      const { container } = renderComponent();

      const mainContainer = container.firstChild;
      expect(mainContainer).toHaveClass('bg-background/80');
      expect(mainContainer).toHaveClass('backdrop-blur-sm');
      expect(mainContainer).toHaveClass('shadow-2xl');
      expect(mainContainer).toHaveClass('rounded-lg');
      expect(mainContainer).toHaveClass('border');
    });

    it('should have proper layout structure', () => {
      mockUseWorkflows.mockReturnValue({
        stats: mockStats,
        pagination: mockPagination,
        loading: false,
        error: null
      } as any);

      const { container } = renderComponent();

      const mainContainer = container.firstChild;
      expect(mainContainer).toHaveClass('flex');
      expect(mainContainer).toHaveClass('justify-between');
      expect(mainContainer).toHaveClass('items-center');
    });
  });

  describe('Status Indicator', () => {
    it('should show different status colors based on state', () => {
      // Test success state
      mockUseWorkflows.mockReturnValue({
        stats: mockStats,
        pagination: mockPagination,
        loading: false,
        error: null
      } as any);

      const { rerender } = renderComponent();

      let statusIndicator = document.querySelector('.bg-green-500');
      expect(statusIndicator).toBeInTheDocument();

      // Test error state
      mockUseWorkflows.mockReturnValue({
        stats: {},
        pagination: {},
        loading: false,
        error: new Error('Test error')
      } as any);

      rerender(
        <QueryClientProvider client={queryClient}>
          <DashboardStats />
        </QueryClientProvider>
      );

      statusIndicator = document.querySelector('.bg-destructive');
      expect(statusIndicator).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have readable text contrast', () => {
      mockUseWorkflows.mockReturnValue({
        stats: mockStats,
        pagination: mockPagination,
        loading: false,
        error: null
      } as any);

      renderComponent();

      // Check that stat values have good contrast
      const statValues = document.querySelectorAll('.text-foreground');
      expect(statValues.length).toBeGreaterThan(0);

      // Check that labels have muted styling
      const statLabels = document.querySelectorAll('.text-muted-foreground');
      expect(statLabels.length).toBeGreaterThan(0);
    });

    it('should maintain proper font sizes and weights', () => {
      mockUseWorkflows.mockReturnValue({
        stats: mockStats,
        pagination: mockPagination,
        loading: false,
        error: null
      } as any);

      renderComponent();

      // Check stat values have large, bold font
      const statValues = document.querySelectorAll('.text-lg.font-bold');
      expect(statValues.length).toBe(4);

      // Check labels have small font
      const statLabels = document.querySelectorAll('.text-xs');
      expect(statLabels.length).toBeGreaterThan(4); // Stats labels + status text
    });
  });

  describe('Hook Integration', () => {
    it('should call useWorkflows with correct parameters', () => {
      mockUseWorkflows.mockReturnValue({
        stats: mockStats,
        pagination: mockPagination,
        loading: false,
        error: null
      } as any);

      renderComponent();

      expect(mockUseWorkflows).toHaveBeenCalledWith({
        include: ['task_executions'],
        limit: 100
      });
    });

    it('should handle undefined stats gracefully', () => {
      mockUseWorkflows.mockReturnValue({
        stats: undefined,
        pagination: undefined,
        loading: false,
        error: null
      } as any);

      const { container } = renderComponent();

      // Should not crash and should render something
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});