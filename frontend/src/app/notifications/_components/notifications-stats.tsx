'use client';

import { useUnifiedNotifications } from '@/lib/hooks/use-unified-notifications';

export function NotificationsStats() {
  const { notifications, loading, error } = useUnifiedNotifications();

  // Calculate stats from notifications
  const stats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.read).length,
    urgent: notifications.filter(n => n.priority === 'URGENT').length,
    taskInterrupts: notifications.filter(n => n.type === 'TASK_INTERRUPT').length,
  };

  return (
    <div className="bg-background/80 backdrop-blur-sm px-4 py-3 mb-4 shadow-2xl rounded-lg border border-border/50 flex justify-between items-center">
      <div className="flex gap-8 items-center">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-foreground">
            {loading ? '...' : error ? 'Error' : stats.total}
          </span>
          <span className="text-xs text-muted-foreground font-medium">Total Notifications</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-foreground">
            {loading ? '...' : error ? 'Error' : stats.unread}
          </span>
          <span className="text-xs text-muted-foreground font-medium">Unread</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-foreground">
            {loading ? '...' : error ? 'Error' : stats.urgent}
          </span>
          <span className="text-xs text-muted-foreground font-medium">Urgent</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-foreground">
            {loading ? '...' : error ? 'Error' : stats.taskInterrupts}
          </span>
          <span className="text-xs text-muted-foreground font-medium">Task Interrupts</span>
        </div>
      </div>
      
      <div className="flex items-center text-xs">
        {error ? (
          <div className="flex items-center gap-1 px-2 py-1 bg-destructive/10 text-destructive font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-destructive"></div>
            <span>Failed to Load</span>
          </div>
        ) : loading ? (
          <div className="flex items-center gap-1 px-2 py-1 bg-muted text-muted-foreground font-medium">
            <span>Loading...</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 px-2 py-1 bg-muted text-muted-foreground font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
            <span>Notifications Active</span>
          </div>
        )}
      </div>
    </div>
  );
}