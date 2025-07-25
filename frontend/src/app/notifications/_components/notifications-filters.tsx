/**
 * Notifications table filters component - follows workflow filters pattern
 */

import { Fragment } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  const hasActiveFilters = (filterType && filterType !== 'all') || (filterPriority && filterPriority !== 'all') || (filterReadStatus && filterReadStatus !== 'all') || searchQuery;

  return (
    <div className="mb-4 space-y-3">
      {/* Search and Clear */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="text-sm"
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
          <Select value={filterType} onValueChange={onFilterTypeChange}>
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="TASK_INTERRUPT">Task Interrupts</SelectItem>
              <SelectItem value="WORKFLOW_UPDATE">Workflow Updates</SelectItem>
              <SelectItem value="SLA_WARNING">SLA Warnings</SelectItem>
              <SelectItem value="AGENT_FAILURE">Agent Failures</SelectItem>
              <SelectItem value="HIL_MENTION">HIL Mentions</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Priority:</span>
          <Select value={filterPriority} onValueChange={onFilterPriorityChange}>
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="NORMAL">Normal</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Read Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Select value={filterReadStatus} onValueChange={onFilterReadStatusChange}>
            <SelectTrigger className="w-[120px] h-8">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}