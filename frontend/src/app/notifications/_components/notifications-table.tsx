/**
 * Main notifications table component - follows workflow table pattern
 */

'use client';

import { useUnifiedNotifications } from '@/lib/hooks/use-unified-notifications';
import { useNotificationsTableState } from '@/lib/hooks/use-notifications-table-state';
import { NotificationsFilters } from './notifications-filters';
import { NotificationRow } from './notification-row';
import { NotificationsPagination } from './notifications-pagination';

function NotificationsTableSkeleton() {
  return (
    <div className="bg-background/80 backdrop-blur-sm rounded-lg border border-border/50 shadow-2xl">
      <div className="p-6">
        <div className="space-y-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 animate-pulse">
              <div className="w-2 h-2 bg-muted rounded-full"></div>
              <div className="w-16 h-6 bg-muted rounded"></div>
              <div className="w-24 h-6 bg-muted rounded"></div>
              <div className="flex-1 h-6 bg-muted rounded"></div>
              <div className="w-20 h-6 bg-muted rounded"></div>
              <div className="w-16 h-6 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function NotificationsTable() {
  const { notifications, loading, error } = useUnifiedNotifications();
  
  const {
    // State
    filterType,
    filterPriority,
    filterReadStatus,
    searchQuery,
    currentPage,
    itemsPerPage,

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
  } = useNotificationsTableState();

  if (loading) {
    return <NotificationsTableSkeleton />;
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-background/80 backdrop-blur-sm rounded-lg border border-border/50 shadow-2xl">
        <div className="text-destructive text-lg font-medium mb-2">Error loading notifications</div>
        <div className="text-muted-foreground">{error}</div>
      </div>
    );
  }

  // Process notifications through filters, sorting, and pagination
  const filteredNotifications = getFilteredNotifications(notifications);
  const sortedNotifications = getSortedNotifications(filteredNotifications);
  const paginatedNotifications = getPaginatedNotifications(sortedNotifications);

  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);

  return (
    <div className="bg-background/80 backdrop-blur-sm rounded-lg border border-border/50 shadow-2xl">
      <div className="p-6">
        {/* Filters */}
        <NotificationsFilters
          filterType={filterType}
          filterPriority={filterPriority}
          filterReadStatus={filterReadStatus}
          searchQuery={searchQuery}
          onFilterTypeChange={handleFilterTypeChange}
          onFilterPriorityChange={handleFilterPriorityChange}
          onFilterReadStatusChange={handleFilterReadStatusChange}
          onSearchChange={handleSearchChange}
          onClearFilters={handleClearFilters}
        />

        {/* Results Summary */}
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {paginatedNotifications.length} of {filteredNotifications.length} notifications
          {filteredNotifications.length !== notifications.length && ` (filtered from ${notifications.length} total)`}
        </div>

        {/* Table */}
        {paginatedNotifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground text-lg mb-2">No notifications found</div>
            <div className="text-muted-foreground text-sm">
              {notifications.length === 0 
                ? "You don't have any notifications yet."
                : "Try adjusting your filters to see more results."
              }
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-left">
                  <th className="px-4 py-3 w-4"></th>
                  <th 
                    className="px-3 py-3 text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors w-20"
                    onClick={() => handleSort('priority')}
                  >
                    Priority{getSortIndicator('priority')}
                  </th>
                  <th 
                    className="px-3 py-3 text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors w-32"
                    onClick={() => handleSort('type')}
                  >
                    Type{getSortIndicator('type')}
                  </th>
                  <th className="px-3 py-3 text-muted-foreground font-medium">
                    Message
                  </th>
                  <th className="px-3 py-3 text-muted-foreground font-medium w-32">
                    Workflow
                  </th>
                  <th 
                    className="px-3 py-3 text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors w-24"
                    onClick={() => handleSort('created_at')}
                  >
                    Created{getSortIndicator('created_at')}
                  </th>
                  <th className="px-3 py-3 text-muted-foreground font-medium w-16">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedNotifications.map((notification, index) => (
                  <NotificationRow 
                    key={notification.id} 
                    notification={notification} 
                    isEven={index % 2 === 0}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <NotificationsPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
}