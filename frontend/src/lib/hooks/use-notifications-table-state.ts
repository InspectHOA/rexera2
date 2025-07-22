/**
 * Notifications table state management hook
 * Follows the same pattern as use-workflow-table-state
 */

import { useState, useMemo } from 'react';

export function useNotificationsTableState() {
  // Filter states
  const [filterType, setFilterType] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterReadStatus, setFilterReadStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50); // Show more notifications per page
  
  // Sorting
  const [sortField, setSortField] = useState<'created_at' | 'priority' | 'type'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filter and search logic
  const getFilteredNotifications = (notifications: any[]) => {
    return notifications.filter(notification => {
      // Type filter
      if (filterType && notification.type !== filterType) {
        return false;
      }
      
      // Priority filter
      if (filterPriority && notification.priority !== filterPriority) {
        return false;
      }
      
      // Read status filter
      if (filterReadStatus === 'read' && !notification.read) {
        return false;
      }
      if (filterReadStatus === 'unread' && notification.read) {
        return false;
      }
      
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchableText = `${notification.title} ${notification.message} ${notification.type}`.toLowerCase();
        if (!searchableText.includes(query)) {
          return false;
        }
      }
      
      return true;
    });
  };

  // Sorting logic
  const getSortedNotifications = (notifications: any[]) => {
    return [...notifications].sort((a, b) => {
      let aVal, bVal;
      
      switch (sortField) {
        case 'created_at':
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
          break;
        case 'priority':
          const priorityOrder = { 'URGENT': 4, 'HIGH': 3, 'NORMAL': 2, 'LOW': 1 };
          aVal = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          bVal = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          break;
        case 'type':
          aVal = a.type;
          bVal = b.type;
          break;
        default:
          return 0;
      }
      
      if (sortDirection === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });
  };

  // Pagination logic
  const getPaginatedNotifications = (notifications: any[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return notifications.slice(startIndex, endIndex);
  };

  // Get sort indicator for UI
  const getSortIndicator = (field: string) => {
    if (sortField !== field) return '';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  // Action handlers
  const handleSort = (field: 'created_at' | 'priority' | 'type') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  const handleFilterTypeChange = (value: string) => {
    setFilterType(value);
    setCurrentPage(1);
  };

  const handleFilterPriorityChange = (value: string) => {
    setFilterPriority(value);
    setCurrentPage(1);
  };

  const handleFilterReadStatusChange = (value: string) => {
    setFilterReadStatus(value);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilterType('');
    setFilterPriority('');
    setFilterReadStatus('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return {
    // State
    filterType,
    filterPriority,
    filterReadStatus,
    searchQuery,
    currentPage,
    itemsPerPage,
    sortField,
    sortDirection,

    // Computed values
    getSortIndicator,

    // Processing functions
    getFilteredNotifications,
    getSortedNotifications,
    getPaginatedNotifications,

    // Actions
    handleSort,
    handleFilterTypeChange,
    handleFilterPriorityChange,
    handleFilterReadStatusChange,
    handleSearchChange,
    handleClearFilters,
    handlePageChange,
  };
}