/**
 * Workflow table filters component
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
  const hasActiveFilters = (filterType && filterType !== 'all') || (filterStatus && filterStatus !== 'all') || (filterInterrupts && filterInterrupts !== 'all') || searchQuery;

  return (
    <div className="mb-4 space-y-3">
      {/* Search and Clear */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search workflows..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="text-sm"
          />
        </div>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="px-3 py-2 text-sm text-muted-foreground bg-muted rounded-md hover:bg-muted/80 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Filter Dropdowns */}
      <div className="flex items-center gap-3 text-sm pl-4">
        {/* Type Filter */}
        <div className="flex items-center gap-4">
          <label className="text-muted-foreground font-medium">Type:</label>
          <Select value={filterType} onValueChange={onFilterTypeChange}>
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="PAYOFF_REQUEST">Payoff Request</SelectItem>
              <SelectItem value="HOA_ACQUISITION">HOA Documents</SelectItem>
              <SelectItem value="MUNI_LIEN_SEARCH">Lien Search</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-4">
          <label className="text-muted-foreground font-medium">Status:</label>
          <Select value={filterStatus} onValueChange={onFilterStatusChange}>
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="urgent">🚨 Urgent</SelectItem>
              <SelectItem value="progress">🔄 In Progress</SelectItem>
              <SelectItem value="completed">✅ Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Interrupts Filter */}
        <div className="flex items-center gap-4">
          <label className="text-muted-foreground font-medium">Interrupts:</label>
          <Select value={filterInterrupts} onValueChange={onFilterInterruptsChange}>
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="has-interrupts">Has Interrupts</SelectItem>
              <SelectItem value="no-interrupts">No Interrupts</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Active filters:</span>
          
          {filterType && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
              Type: {getDisplayValue('type', filterType)}
              <button
                onClick={() => onFilterTypeChange('')}
                className="hover:text-primary/80"
                aria-label="Remove type filter"
              >
                ×
              </button>
            </span>
          )}
          
          {filterStatus && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-secondary/10 text-secondary-foreground rounded-full">
              Status: {getDisplayValue('status', filterStatus)}
              <button
                onClick={() => onFilterStatusChange('')}
                className="hover:text-secondary-foreground/80"
                aria-label="Remove status filter"
              >
                ×
              </button>
            </span>
          )}
          
          {filterInterrupts && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-accent/10 text-accent-foreground rounded-full">
              Interrupts: {getDisplayValue('interrupts', filterInterrupts)}
              <button
                onClick={() => onFilterInterruptsChange('')}
                className="hover:text-accent-foreground/80"
                aria-label="Remove interrupts filter"
              >
                ×
              </button>
            </span>
          )}
          
          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-muted text-muted-foreground rounded-full">
              Search: &quot;{searchQuery}&quot;
              <button
                onClick={() => onSearchChange('')}
                className="hover:text-muted-foreground/80"
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