/**
 * Custom hook for managing workflow table state
 */

import { useState } from 'react';

export interface WorkflowTableFilters {
  type: string;
  status: string;
  interrupts: string;
  search: string;
}

export interface WorkflowTableSorting {
  field: string;
  direction: 'asc' | 'desc';
}

export function useWorkflowTableState() {
  const [sortField, setSortField] = useState<string>('due');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterInterrupts, setFilterInterrupts] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Map frontend sort fields to backend database columns
  const getBackendSortField = (frontendField: string): string => {
    const fieldMap: Record<string, string> = {
      'id': 'created_at', // Sort by creation date since ID is UUID-based
      'created_at': 'created_at',
      'type': 'workflow_type',
      'client': 'client_id',
      'property': 'title',
      'status': 'status',
      'interrupts': 'interrupt_count',
      'due': 'due_date'
    };
    return fieldMap[frontendField] || 'created_at';
  };

  // Map frontend filters to backend API parameters
  const getBackendFilters = () => {
    const filters: Record<string, unknown> = {
      include: ['client', 'task_executions'],
      limit: 20,
      page: currentPage,
      sortBy: getBackendSortField(sortField),
      sortDirection: sortDirection
    };

    // Workflow type filter
    if (filterType && filterType !== 'all') {
      filters.workflow_type = filterType;
    }

    // Status filter - map frontend values to backend values
    if (filterStatus && filterStatus !== 'all') {
      const statusMap: Record<string, string> = {
        'urgent': 'BLOCKED,INTERRUPT', // Map to multiple statuses (note: workflows don't have INTERRUPT, but task executions do)
        'progress': 'IN_PROGRESS',
        'completed': 'COMPLETED'
      };
      filters.status = statusMap[filterStatus] || filterStatus;
    }

    // Note: Search and interrupt filtering will need custom handling
    // For now, we'll handle them client-side until backend search is implemented

    return filters;
  };

  // Sort handler
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      // For interrupts column, default to descending (most interrupts first)
      // For other columns, default to ascending
      setSortDirection(field === 'interrupts' ? 'desc' : 'asc');
    }
    // Reset to page 1 when sorting changes since the order of all records changes
    setCurrentPage(1);
  };

  // Filter change handlers that reset to page 1
  const handleFilterTypeChange = (value: string) => {
    setFilterType(value);
    setCurrentPage(1);
  };

  const handleFilterStatusChange = (value: string) => {
    setFilterStatus(value);
    setCurrentPage(1);
  };

  const handleFilterInterruptsChange = (value: string) => {
    setFilterInterrupts(value);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilterType('all');
    setFilterStatus('all');
    setFilterInterrupts('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Get sort indicator
  const getSortIndicator = (field: string) => {
    if (sortField !== field) return '⇅';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return {
    // State
    sortField,
    sortDirection,
    filterType,
    filterStatus,
    filterInterrupts,
    searchQuery,
    currentPage,

    // Computed values
    getBackendFilters,
    getSortIndicator,

    // Actions
    handleSort,
    handleFilterTypeChange,
    handleFilterStatusChange,
    handleFilterInterruptsChange,
    handleSearchChange,
    handleClearFilters,
    handlePageChange,
  };
}