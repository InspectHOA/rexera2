/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useNotificationsTableState } from '../use-notifications-table-state';
import type { UnifiedNotification } from '@rexera/shared';

describe('useNotificationsTableState', () => {
  const mockNotifications: UnifiedNotification[] = [
    {
      id: '1',
      user_id: 'user-1',
      type: 'TASK_INTERRUPT',
      priority: 'URGENT',
      title: 'Urgent Task',
      message: 'This task needs immediate attention',
      action_url: '/workflow/123',
      metadata: { workflow_id: '123' },
      read: false,
      read_at: null,
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      user_id: 'user-1',
      type: 'SLA_WARNING',
      priority: 'HIGH',
      title: 'SLA Breach Warning',
      message: 'SLA deadline approaching',
      action_url: '/workflow/456',
      metadata: { workflow_id: '456' },
      read: true,
      read_at: '2024-01-01T01:00:00Z',
      created_at: '2024-01-01T00:30:00Z',
    },
    {
      id: '3',
      user_id: 'user-1',
      type: 'WORKFLOW_UPDATE',
      priority: 'NORMAL',
      title: 'Workflow Completed',
      message: 'Your workflow has been completed successfully',
      action_url: '/workflow/789',
      metadata: { workflow_id: '789' },
      read: false,
      read_at: null,
      created_at: '2024-01-01T01:00:00Z',
    },
  ];

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useNotificationsTableState());

    expect(result.current.filterType).toBe('');
    expect(result.current.filterPriority).toBe('');
    expect(result.current.filterReadStatus).toBe('');
    expect(result.current.searchQuery).toBe('');
    expect(result.current.currentPage).toBe(1);
    expect(result.current.itemsPerPage).toBe(50);
    expect(result.current.sortField).toBe('created_at');
    expect(result.current.sortDirection).toBe('desc');
  });

  describe('filtering', () => {
    it('should filter notifications by type', () => {
      const { result } = renderHook(() => useNotificationsTableState());

      act(() => {
        result.current.handleFilterTypeChange('TASK_INTERRUPT');
      });

      expect(result.current.filterType).toBe('TASK_INTERRUPT');
      expect(result.current.currentPage).toBe(1); // Should reset page

      const filtered = result.current.getFilteredNotifications(mockNotifications);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].type).toBe('TASK_INTERRUPT');
    });

    it('should filter notifications by priority', () => {
      const { result } = renderHook(() => useNotificationsTableState());

      act(() => {
        result.current.handleFilterPriorityChange('URGENT');
      });

      expect(result.current.filterPriority).toBe('URGENT');

      const filtered = result.current.getFilteredNotifications(mockNotifications);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].priority).toBe('URGENT');
    });

    it('should filter notifications by read status', () => {
      const { result } = renderHook(() => useNotificationsTableState());

      act(() => {
        result.current.handleFilterReadStatusChange('unread');
      });

      expect(result.current.filterReadStatus).toBe('unread');

      const filtered = result.current.getFilteredNotifications(mockNotifications);
      expect(filtered).toHaveLength(2);
      expect(filtered.every(n => !n.read)).toBe(true);
    });

    it('should filter notifications by read status (read)', () => {
      const { result } = renderHook(() => useNotificationsTableState());

      act(() => {
        result.current.handleFilterReadStatusChange('read');
      });

      const filtered = result.current.getFilteredNotifications(mockNotifications);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].read).toBe(true);
    });

    it('should search notifications by title and message', () => {
      const { result } = renderHook(() => useNotificationsTableState());

      act(() => {
        result.current.handleSearchChange('SLA');
      });

      expect(result.current.searchQuery).toBe('SLA');

      const filtered = result.current.getFilteredNotifications(mockNotifications);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toContain('SLA');
    });

    it('should search notifications by type', () => {
      const { result } = renderHook(() => useNotificationsTableState());

      act(() => {
        result.current.handleSearchChange('WORKFLOW_UPDATE');
      });

      const filtered = result.current.getFilteredNotifications(mockNotifications);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].type).toBe('WORKFLOW_UPDATE');
    });

    it('should apply multiple filters simultaneously', () => {
      const { result } = renderHook(() => useNotificationsTableState());

      act(() => {
        result.current.handleFilterTypeChange('TASK_INTERRUPT');
        result.current.handleFilterPriorityChange('URGENT');
        result.current.handleFilterReadStatusChange('unread');
      });

      const filtered = result.current.getFilteredNotifications(mockNotifications);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].type).toBe('TASK_INTERRUPT');
      expect(filtered[0].priority).toBe('URGENT');
      expect(filtered[0].read).toBe(false);
    });

    it('should clear all filters', () => {
      const { result } = renderHook(() => useNotificationsTableState());

      // Set some filters
      act(() => {
        result.current.handleFilterTypeChange('TASK_INTERRUPT');
        result.current.handleFilterPriorityChange('URGENT');
        result.current.handleSearchChange('test');
      });

      // Clear filters
      act(() => {
        result.current.handleClearFilters();
      });

      expect(result.current.filterType).toBe('');
      expect(result.current.filterPriority).toBe('');
      expect(result.current.filterReadStatus).toBe('');
      expect(result.current.searchQuery).toBe('');
      expect(result.current.currentPage).toBe(1);
    });
  });

  describe('sorting', () => {
    it('should sort notifications by created_at (default)', () => {
      const { result } = renderHook(() => useNotificationsTableState());

      const sorted = result.current.getSortedNotifications(mockNotifications);
      
      // Should be sorted by created_at desc (newest first)
      expect(sorted[0].id).toBe('3'); // 2024-01-01T01:00:00Z
      expect(sorted[1].id).toBe('2'); // 2024-01-01T00:30:00Z
      expect(sorted[2].id).toBe('1'); // 2024-01-01T00:00:00Z
    });

    it('should sort notifications by priority', () => {
      const { result } = renderHook(() => useNotificationsTableState());

      act(() => {
        result.current.handleSort('priority');
      });

      expect(result.current.sortField).toBe('priority');
      expect(result.current.sortDirection).toBe('desc');

      const sorted = result.current.getSortedNotifications(mockNotifications);
      
      // Should be sorted by priority desc (URGENT > HIGH > NORMAL)
      expect(sorted[0].priority).toBe('URGENT');
      expect(sorted[1].priority).toBe('HIGH');
      expect(sorted[2].priority).toBe('NORMAL');
    });

    it('should sort notifications by type', () => {
      const { result } = renderHook(() => useNotificationsTableState());

      act(() => {
        result.current.handleSort('type');
      });

      expect(result.current.sortField).toBe('type');
      expect(result.current.sortDirection).toBe('desc');

      const sorted = result.current.getSortedNotifications(mockNotifications);
      
      // Should be sorted by type desc (alphabetically)
      expect(sorted[0].type).toBe('WORKFLOW_UPDATE');
      expect(sorted[1].type).toBe('TASK_INTERRUPT');
      expect(sorted[2].type).toBe('SLA_WARNING');
    });

    it('should toggle sort direction when clicking same field', () => {
      const { result } = renderHook(() => useNotificationsTableState());

      // First click - should set to desc
      act(() => {
        result.current.handleSort('priority');
      });

      expect(result.current.sortDirection).toBe('desc');

      // Second click - should toggle to asc
      act(() => {
        result.current.handleSort('priority');
      });

      expect(result.current.sortDirection).toBe('asc');
    });

    it('should provide sort indicators', () => {
      const { result } = renderHook(() => useNotificationsTableState());

      // No indicator for non-active field
      expect(result.current.getSortIndicator('type')).toBe('');

      // Set sort field
      act(() => {
        result.current.handleSort('priority');
      });

      expect(result.current.getSortIndicator('priority')).toBe(' ↓'); // desc
      expect(result.current.getSortIndicator('type')).toBe(''); // inactive
    });
  });

  describe('pagination', () => {
    it('should paginate notifications correctly', () => {
      const { result } = renderHook(() => useNotificationsTableState());

      // Test with smaller page size for easier testing
      const paginated = result.current.getPaginatedNotifications(mockNotifications);
      
      // With itemsPerPage = 50 and 3 notifications, should return all 3
      expect(paginated).toHaveLength(3);
    });

    it('should handle page changes', () => {
      const { result } = renderHook(() => useNotificationsTableState());

      act(() => {
        result.current.handlePageChange(2);
      });

      expect(result.current.currentPage).toBe(2);
    });

    it('should reset page when filters change', () => {
      const { result } = renderHook(() => useNotificationsTableState());

      // Set page to 2
      act(() => {
        result.current.handlePageChange(2);
      });

      expect(result.current.currentPage).toBe(2);

      // Change filter - should reset page
      act(() => {
        result.current.handleFilterTypeChange('TASK_INTERRUPT');
      });

      expect(result.current.currentPage).toBe(1);
    });

    it('should reset page when sort changes', () => {
      const { result } = renderHook(() => useNotificationsTableState());

      // Set page to 2
      act(() => {
        result.current.handlePageChange(2);
      });

      expect(result.current.currentPage).toBe(2);

      // Change sort - should reset page
      act(() => {
        result.current.handleSort('priority');
      });

      expect(result.current.currentPage).toBe(1);
    });
  });

  describe('data processing pipeline', () => {
    it('should process notifications through complete pipeline', () => {
      const { result } = renderHook(() => useNotificationsTableState());

      // Set filters and sort
      act(() => {
        result.current.handleFilterReadStatusChange('unread');
        result.current.handleSort('priority');
      });

      // Process through complete pipeline
      const filtered = result.current.getFilteredNotifications(mockNotifications);
      const sorted = result.current.getSortedNotifications(filtered);
      const paginated = result.current.getPaginatedNotifications(sorted);

      // Should have 2 unread notifications, sorted by priority
      expect(filtered).toHaveLength(2);
      expect(sorted[0].priority).toBe('URGENT');
      expect(sorted[1].priority).toBe('NORMAL');
      expect(paginated).toEqual(sorted); // All fit on one page
    });
  });
});