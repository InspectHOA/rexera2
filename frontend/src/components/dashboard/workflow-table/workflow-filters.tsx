/**
 * Workflow table filters component
 */

import { Fragment } from 'react';

interface WorkflowFiltersProps {
  filterType: string;
  filterStatus: string;
  filterInterrupts: string;
  searchQuery: string;
  onFilterTypeChange: (value: string) => void;
  onFilterStatusChange: (value: string) => void;
  onFilterInterruptsChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onClearFilters: () => void;
}

export function WorkflowFilters({
  filterType,
  filterStatus,
  filterInterrupts,
  searchQuery,
  onFilterTypeChange,
  onFilterStatusChange,
  onFilterInterruptsChange,
  onSearchChange,
  onClearFilters,
}: WorkflowFiltersProps) {
  const hasActiveFilters = filterType || filterStatus || filterInterrupts || searchQuery;

  return (
    <div className="mb-4 space-y-3">
      {/* Search and Clear */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search workflows..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Filter Dropdowns */}
      <div className="flex items-center gap-3 text-sm">
        {/* Type Filter */}
        <div className="flex items-center gap-2">
          <label className="text-gray-600 font-medium">Type:</label>
          <select
            value={filterType}
            onChange={(e) => onFilterTypeChange(e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All</option>
            <option value="PAYOFF_REQUEST">Payoff Request</option>
            <option value="HOA_ACQUISITION">HOA Documents</option>
            <option value="MUNI_LIEN_SEARCH">Lien Search</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <label className="text-gray-600 font-medium">Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => onFilterStatusChange(e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All</option>
            <option value="urgent">🚨 Urgent</option>
            <option value="progress">🔄 In Progress</option>
            <option value="completed">✅ Completed</option>
          </select>
        </div>

        {/* Interrupts Filter */}
        <div className="flex items-center gap-2">
          <label className="text-gray-600 font-medium">Interrupts:</label>
          <select
            value={filterInterrupts}
            onChange={(e) => onFilterInterruptsChange(e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All</option>
            <option value="has-interrupts">Has Interrupts</option>
            <option value="no-interrupts">No Interrupts</option>
          </select>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500">Active filters:</span>
          
          {filterType && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
              Type: {getDisplayValue('type', filterType)}
              <button
                onClick={() => onFilterTypeChange('')}
                className="hover:text-blue-900"
                aria-label="Remove type filter"
              >
                ×
              </button>
            </span>
          )}
          
          {filterStatus && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
              Status: {getDisplayValue('status', filterStatus)}
              <button
                onClick={() => onFilterStatusChange('')}
                className="hover:text-green-900"
                aria-label="Remove status filter"
              >
                ×
              </button>
            </span>
          )}
          
          {filterInterrupts && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full">
              Interrupts: {getDisplayValue('interrupts', filterInterrupts)}
              <button
                onClick={() => onFilterInterruptsChange('')}
                className="hover:text-yellow-900"
                aria-label="Remove interrupts filter"
              >
                ×
              </button>
            </span>
          )}
          
          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
              Search: "{searchQuery}"
              <button
                onClick={() => onSearchChange('')}
                className="hover:text-purple-900"
                aria-label="Remove search filter"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function getDisplayValue(type: string, value: string): string {
  const displayMaps = {
    type: {
      'PAYOFF_REQUEST': 'Payoff Request',
      'HOA_ACQUISITION': 'HOA Documents',
      'MUNI_LIEN_SEARCH': 'Lien Search'
    },
    status: {
      'urgent': 'Urgent',
      'progress': 'In Progress',
      'completed': 'Completed'
    },
    interrupts: {
      'has-interrupts': 'Has Interrupts',
      'no-interrupts': 'No Interrupts'
    }
  };

  return (displayMaps as any)[type]?.[value] || value;
}