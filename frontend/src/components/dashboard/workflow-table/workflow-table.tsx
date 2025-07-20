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
  const ShimmerBox = ({ className = "", style }: { className?: string; style?: React.CSSProperties }) => (
    <div className={`relative overflow-hidden bg-muted/50 rounded ${className}`} style={style}>
      <div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]"
      ></div>
    </div>
  );

  return (
    <>
      <div className="bg-background rounded-lg border border-border">
        {/* Filters skeleton with staggered animation */}
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <ShimmerBox className="flex-1 h-10 rounded-md" />
            <ShimmerBox className="w-20 h-10 rounded-md" />
          </div>
          <div className="flex items-center gap-3">
            <ShimmerBox className="w-24 h-8" />
            <ShimmerBox className="w-32 h-8" />
            <ShimmerBox className="w-28 h-8" />
          </div>
        </div>

        {/* Table skeleton with wave effect */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-muted/50">
              <tr>
                {Array.from({ length: 9 }).map((_, i) => (
                  <th key={i} className="px-3 py-2">
                    <ShimmerBox 
                      className={`h-4 rounded`}
                      style={{ animationDelay: `${i * 100}ms` }}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {Array.from({ length: 9 }).map((_, j) => (
                    <td key={j} className="px-3 py-3">
                      <ShimmerBox 
                        className={`h-4 rounded`}
                        style={{ animationDelay: `${(i * 9 + j) * 50}ms` }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination skeleton */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <ShimmerBox className="w-48 h-5 rounded" />
          <div className="flex items-center space-x-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <ShimmerBox 
                key={i}
                className="w-8 h-8 rounded"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
