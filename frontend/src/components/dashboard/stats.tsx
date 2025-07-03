'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface DashboardStats {
  totalWorkflows: number;
  activeWorkflows: number;
  interrupts: number;
  completedToday: number;
  agentsOnline: number;
  queueSize: number;
  successRate: number;
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  // Fetch workflow stats
  const { data: workflows, error: workflowError } = await supabase
    .from('workflows')
    .select('status, created_at')
    .order('created_at', { ascending: false });

  if (workflowError) throw workflowError;

  // Fetch HIL assignments (interrupts)
  const { data: hilAssignments, error: hilError } = await supabase
    .from('hil_assignments')
    .select('id')
    .is('resolved_at', null);

  if (hilError) throw hilError;

  // Fetch agent stats
  const { data: agents, error: agentsError } = await supabase
    .from('agents')
    .select('is_active')
    .eq('is_active', true);

  if (agentsError) throw agentsError;

  // Calculate stats
  const today = new Date().toISOString().split('T')[0];
  const totalWorkflows = workflows?.length || 0;
  const activeWorkflows = workflows?.filter(w => 
    ['PENDING', 'IN_PROGRESS', 'AWAITING_REVIEW'].includes(w.status)
  ).length || 0;
  const completedToday = workflows?.filter(w => 
    w.status === 'COMPLETED' && w.created_at?.startsWith(today)
  ).length || 0;

  return {
    totalWorkflows,
    activeWorkflows,
    interrupts: hilAssignments?.length || 0,
    completedToday,
    agentsOnline: agents?.length || 0,
    queueSize: 47, // Mock data
    successRate: 94.2, // Mock data
  };
}

export function DashboardStats() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-center h-20">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="text-center text-red-600">
          Failed to load dashboard stats
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Left side - Workflow stats */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Total Workflows"
              value={stats?.totalWorkflows || 0}
            />
            <StatCard
              label="Active"
              value={stats?.activeWorkflows || 0}
            />
            <StatCard
              label="Interrupts"
              value={stats?.interrupts || 0}
              variant={stats?.interrupts && stats.interrupts > 0 ? 'warning' : 'default'}
            />
            <StatCard
              label="Completed Today"
              value={stats?.completedToday || 0}
              variant="success"
            />
          </div>
        </div>

        {/* Right side - System status */}
        <div className="lg:col-span-1">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="text-gray-600">All Agents Online</span>
            </div>
            <div className="text-xs text-gray-500">
              {stats?.queueSize || 0} in Queue
            </div>
            <div className="text-xs text-gray-500">
              {stats?.successRate || 0}% Success
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

function StatCard({ label, value, variant = 'default' }: StatCardProps) {
  const variantStyles = {
    default: 'text-gray-900',
    success: 'text-green-600',
    warning: 'text-orange-600',
    error: 'text-red-600',
  };

  return (
    <div className="text-center">
      <div className={cn('text-lg font-bold', variantStyles[variant])}>
        {value.toLocaleString()}
      </div>
      <div className="text-xs text-gray-500 font-medium">
        {label}
      </div>
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}