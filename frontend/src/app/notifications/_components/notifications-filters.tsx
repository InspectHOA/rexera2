/**
 * Notifications table filters component - follows workflow filters pattern
 */

import { Fragment } from 'react';

interface NotificationsFiltersProps {
  filterType: string;
  filterPriority: string;
  filterReadStatus: string;
  searchQuery: string;
  onFilterTypeChange: (value: string) => void;
  onFilterPriorityChange: (value: string) => void;
  onFilterReadStatusChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onClearFilters: () => void;
}

export function NotificationsFilters({
  filterType,
  filterPriority,
  filterReadStatus,
  searchQuery,
  onFilterTypeChange,
  onFilterPriorityChange,
  onFilterReadStatusChange,
  onSearchChange,
  onClearFilters,
}: NotificationsFiltersProps) {
  const hasActiveFilters = filterType || filterPriority || filterReadStatus || searchQuery;

  return (
    <div className="mb-4 space-y-3">
      {/* Search and Clear */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-muted transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Type Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Type:</span>
          <select
            value={filterType}
            onChange={(e) => onFilterTypeChange(e.target.value)}
            className="px-2 py-1 text-sm border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Types</option>
            <option value="TASK_INTERRUPT">Task Interrupts</option>
            <option value="WORKFLOW_UPDATE">Workflow Updates</option>
            <option value="SLA_WARNING">SLA Warnings</option>
            <option value="AGENT_FAILURE">Agent Failures</option>
            <option value="HIL_MENTION">HIL Mentions</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Priority:</span>
          <select
            value={filterPriority}
            onChange={(e) => onFilterPriorityChange(e.target.value)}
            className="px-2 py-1 text-sm border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="NORMAL">Normal</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        {/* Read Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <select
            value={filterReadStatus}
            onChange={(e) => onFilterReadStatusChange(e.target.value)}
            className="px-2 py-1 text-sm border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
        </div>
      </div>
    </div>
  );
}