'use client';

import { useWorkflows } from '@/lib/hooks/useWorkflows';

export function DashboardStats() {
  const { stats, loading, error } = useWorkflows({ 
    include: ['tasks'], 
    limit: 1000  // Get all workflows for accurate stats
  });
  return (
    <div className="bg-white/80 backdrop-blur-sm px-4 py-3 mb-4 shadow-2xl rounded-lg border border-gray-200/50 flex justify-between items-center">
      <div className="flex gap-8 items-center">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900">
            {loading ? '...' : error ? 'Error' : stats.total}
          </span>
          <span className="text-xs text-gray-600 font-medium">Total Workflows</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900">
            {loading ? '...' : error ? 'Error' : stats.active}
          </span>
          <span className="text-xs text-gray-600 font-medium">Active</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900">
            {loading ? '...' : error ? 'Error' : stats.interrupts}
          </span>
          <span className="text-xs text-gray-600 font-medium">Interrupts</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900">
            {loading ? '...' : error ? 'Error' : stats.completedToday}
          </span>
          <span className="text-xs text-gray-600 font-medium">Completed Today</span>
        </div>
      </div>
      
      <div className="flex items-center text-xs">
        {error ? (
          <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-600 font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
            <span>Database Connection Failed</span>
          </div>
        ) : loading ? (
          <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 font-medium">
            <span>Loading...</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
            <span>System Online</span>
          </div>
        )}
      </div>
    </div>
  );
}