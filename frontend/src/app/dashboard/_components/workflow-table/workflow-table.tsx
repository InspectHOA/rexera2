/**
 * Refactored WorkflowTable component - now modular and manageable
 */

'use client';

import { useWorkflows } from '@/lib/hooks/use-workflows';
import { useWorkflowTableState } from '@/lib/hooks/use-workflow-table-state';
import { useWorkflowTransformation } from '@/lib/hooks/use-workflow-transformation';
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

  const workflows = useWorkflowTransformation(Array.isArray(workflowData) ? workflowData : [], filterInterrupts, searchQuery);

  if (loading) {
    return <WorkflowTableSkeleton />;
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-destructive text-lg font-medium mb-2">Error loading workflows</div>
        <div className="text-muted-foreground">{error}</div>
      </div>
    );
  }

  if (workflows.length === 0) {
    const hasFilters = filterType || filterStatus || filterInterrupts || searchQuery;
    
    return (
      <div className="bg-background rounded-lg border border-border">
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
          <div className="text-muted-foreground text-lg font-medium mb-2">
            {hasFilters ? 'No workflows match your filters' : 'No workflows found'}
          </div>
          <div className="text-muted-foreground/70">
            {hasFilters 
              ? 'Try adjusting your search criteria or clearing filters.'
              : 'Workflows will appear here once they are created.'
            }
          </div>
          {hasFilters && (
            <button
              onClick={handleClearFilters}
              className="mt-4 px-4 py-2 text-sm text-primary bg-primary/10 rounded-md hover:bg-primary/20 transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background rounded-lg border border-border">
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
        <table className="min-w-full divide-y divide-border">
          <WorkflowTableHeader
            onSort={handleSort}
            getSortIndicator={getSortIndicator}
          />
          
          <tbody className="bg-background divide-y divide-border/50">
            {workflows.map((workflow, index) => (
              <WorkflowRow key={workflow.workflowId} workflow={workflow} isEven={index % 2 === 0} />
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
  const ShimmerBox = ({ className = "" }: { className?: string }) => (
    <div className={`shimmer bg-muted/50 rounded ${className}`} />
  );

  return (
    <div className="bg-background rounded-lg border border-border p-4 space-y-4">
      {/* Filters skeleton */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <ShimmerBox className="h-8 w-32" />
          <ShimmerBox className="h-8 w-24" />
          <ShimmerBox className="h-8 w-24" />
        </div>
        <ShimmerBox className="h-10 w-48" />
      </div>

      {/* Table skeleton */}
      <div className="space-y-2">
        {/* Header */}
        <div className="flex gap-4 px-2">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="flex-1 h-4 bg-muted/20 rounded" />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex gap-4 p-2 border-b border-border/50">
            {Array.from({ length: 9 }).map((_, j) => (
              <div key={j} className="flex-1">
                <ShimmerBox className="h-5" />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Pagination skeleton */}
      <div className="flex justify-between items-center pt-2">
        <ShimmerBox className="h-5 w-48" />
        <div className="flex items-center gap-2">
          <ShimmerBox className="h-8 w-8" />
          <ShimmerBox className="h-8 w-8" />
          <ShimmerBox className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}
