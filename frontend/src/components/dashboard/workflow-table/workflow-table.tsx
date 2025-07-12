/**
 * Refactored WorkflowTable component - now modular and manageable
 */

'use client';

import { useWorkflows } from '@/lib/hooks/useWorkflows';
import { useWorkflowTableState } from './hooks/useWorkflowTableState';
import { useWorkflowTransformation } from './hooks/useWorkflowTransformation';
import { WorkflowFilters } from './workflow-filters';
import { WorkflowTableHeader } from './workflow-table-header';
import { WorkflowRow } from './workflow-row';
import { WorkflowPagination } from './workflow-pagination';

export function WorkflowTable() {
  const {
    // State
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
  } = useWorkflowTableState();

  const { workflows: workflowData, loading, error, pagination } = useWorkflows(getBackendFilters());

  const workflows = useWorkflowTransformation(workflowData, filterInterrupts, searchQuery);

  if (loading) {
    return <WorkflowTableSkeleton />;
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-500 text-lg font-medium mb-2">Error loading workflows</div>
        <div className="text-gray-600">{error}</div>
      </div>
    );
  }

  if (workflows.length === 0) {
    const hasFilters = filterType || filterStatus || filterInterrupts || searchQuery;
    
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <WorkflowFilters
          filterType={filterType}
          filterStatus={filterStatus}
          filterInterrupts={filterInterrupts}
          searchQuery={searchQuery}
          onFilterTypeChange={handleFilterTypeChange}
          onFilterStatusChange={handleFilterStatusChange}
          onFilterInterruptsChange={handleFilterInterruptsChange}
          onSearchChange={handleSearchChange}
          onClearFilters={handleClearFilters}
        />
        
        <div className="p-8 text-center">
          <div className="text-gray-500 text-lg font-medium mb-2">
            {hasFilters ? 'No workflows match your filters' : 'No workflows found'}
          </div>
          <div className="text-gray-400">
            {hasFilters 
              ? 'Try adjusting your search criteria or clearing filters.'
              : 'Workflows will appear here once they are created.'
            }
          </div>
          {hasFilters && (
            <button
              onClick={handleClearFilters}
              className="mt-4 px-4 py-2 text-sm text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <WorkflowFilters
        filterType={filterType}
        filterStatus={filterStatus}
        filterInterrupts={filterInterrupts}
        searchQuery={searchQuery}
        onFilterTypeChange={handleFilterTypeChange}
        onFilterStatusChange={handleFilterStatusChange}
        onFilterInterruptsChange={handleFilterInterruptsChange}
        onSearchChange={handleSearchChange}
        onClearFilters={handleClearFilters}
      />

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <WorkflowTableHeader
            onSort={handleSort}
            getSortIndicator={getSortIndicator}
          />
          
          <tbody className="bg-white divide-y divide-gray-100">
            {workflows.map((workflow) => (
              <WorkflowRow key={workflow.workflowId} workflow={workflow} />
            ))}
          </tbody>
        </table>
      </div>

      {pagination && (
        <WorkflowPagination
          currentPage={currentPage}
          totalPages={pagination.totalPages}
          total={pagination.total}
          limit={pagination.limit}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}

function WorkflowTableSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Filters skeleton */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-10 bg-gray-200 rounded-md animate-pulse"></div>
          <div className="w-20 h-10 bg-gray-200 rounded-md animate-pulse"></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-32 h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-28 h-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>

      {/* Table skeleton */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-50">
            <tr>
              {Array.from({ length: 9 }).map((_, i) => (
                <th key={i} className="px-3 py-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 10 }).map((_, i) => (
              <tr key={i} className="border-b border-gray-100">
                {Array.from({ length: 9 }).map((_, j) => (
                  <td key={j} className="px-3 py-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
        <div className="w-48 h-5 bg-gray-200 rounded animate-pulse"></div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}