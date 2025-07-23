'use client';

import { useWorkflows } from '@/lib/hooks/use-workflows';

export function DashboardStats() {
  const { stats, loading, error, pagination } = useWorkflows({ 
    include: ['task_executions'], 
    limit: 100  // Use max allowed limit for stats calculation
  });
  return (
    <div className="bg-background/80 backdrop-blur-sm px-4 py-3 mb-4 shadow-2xl rounded-lg border border-border/50 flex justify-between items-center">
      <div className="flex gap-8 items-center">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-foreground">
            {loading ? '...' : error ? 'Error' : pagination.total}
          </span>
          <span className="text-xs text-muted-foreground font-medium">Total Workflows</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-foreground">
            {loading ? '...' : error ? 'Error' : stats.active}
          </span>
          <span className="text-xs text-muted-foreground font-medium">Active</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-foreground">
            {loading ? '...' : error ? 'Error' : stats.interrupts}
          </span>
          <span className="text-xs text-muted-foreground font-medium">Interrupts</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-foreground">
            {loading ? '...' : error ? 'Error' : stats.completedToday}
          </span>
          <span className="text-xs text-muted-foreground font-medium">Completed Today</span>
        </div>
      </div>
      
      <div className="flex items-center text-xs">
        {error ? (
          <div className="flex items-center gap-1 px-2 py-1 bg-destructive/10 text-destructive font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-destructive"></div>
            <span>Database Connection Failed</span>
          </div>
        ) : loading ? (
          <div className="flex items-center gap-1 px-2 py-1 bg-muted text-muted-foreground font-medium">
            <span>Loading...</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 px-2 py-1 bg-muted text-muted-foreground font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
            <span>System Online</span>
          </div>
        )}
      </div>
    </div>
  );
}