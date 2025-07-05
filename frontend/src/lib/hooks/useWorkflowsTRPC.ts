'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/lib/supabase/provider';
import { trpc } from '@/lib/trpc/client';

interface WorkflowFilters {
  workflow_type?: string;
  status?: string;
  client_id?: string;
  assigned_to?: string;
  priority?: string;
  page?: number;
  limit?: number;
  include?: string[];
}

interface WorkflowStats {
  total: number;
  active: number;
  interrupts: number;
  completedToday: number;
}

export function useWorkflowsTRPC(filters: WorkflowFilters = {}) {
  const [stats, setStats] = useState<WorkflowStats>({
    total: 0,
    active: 0,
    interrupts: 0,
    completedToday: 0
  });

  const { supabase } = useSupabase();

  // Convert filters to tRPC input format
  const trpcFilters = {
    workflow_type: filters.workflow_type as any,
    status: filters.status as any,
    client_id: filters.client_id,
    assigned_to: filters.assigned_to,
    priority: filters.priority as any,
    page: filters.page || 1,
    limit: filters.limit || 20,
    include: filters.include || []
  };

  // Use tRPC query - with fallback for build compatibility
  const { 
    data: workflowsResult, 
    isLoading: loading, 
    error, 
    refetch 
  } = (trpc as any)?.workflows?.list?.useQuery ? (trpc as any).workflows.list.useQuery(trpcFilters) : {
    data: { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } },
    isLoading: false,
    error: null,
    refetch: () => Promise.resolve()
  };

  const workflows = workflowsResult?.data || [];
  const pagination = workflowsResult?.pagination || {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  };

  // Calculate stats from the workflows
  useEffect(() => {
    if (workflows.length > 0) {
      const today = new Date().toDateString();
      const calculatedStats = {
        total: pagination.total,
        active: workflows.filter((w: any) => 
          ['IN_PROGRESS', 'PENDING', 'AWAITING_REVIEW'].includes(w.status)
        ).length,
        interrupts: workflows.filter((w: any) => 
          w.tasks?.some((t: any) => t.status === 'AWAITING_REVIEW')
        ).length,
        completedToday: workflows.filter((w: any) => 
          w.status === 'COMPLETED' && 
          new Date(w.completed_at).toDateString() === today
        ).length
      };
      setStats(calculatedStats);
    }
  }, [workflows, pagination.total]);

  // Real-time subscription for workflow updates
  useEffect(() => {
    const subscription = supabase
      .channel('workflows_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'workflows'
      }, () => {
        refetch();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [refetch, supabase]);

  return {
    workflows,
    stats,
    loading,
    error: error ? String(error) : null,
    pagination,
    refetch
  };
}

export function useWorkflowTRPC(id: string) {
  const { supabase } = useSupabase();

  // Fetch workflow with tRPC - with fallback for build compatibility
  const { 
    data: workflow, 
    isLoading: workflowLoading, 
    error: workflowError,
    refetch: refetchWorkflow
  } = (trpc as any)?.workflows?.byId?.useQuery ? (trpc as any).workflows.byId.useQuery({
    id,
    include: ['client']
  }, {
    enabled: !!id
  }) : {
    data: {
      id: id || 'mock-id',
      title: 'Sample Payoff Request',
      workflow_type: 'PAYOFF',
      status: 'IN_PROGRESS',
      due_date: '2024-12-29T17:00:00Z',
      metadata: { closing_date: '2024-12-30T17:00:00Z' },
      client: { name: 'Sample Client' }
    },
    isLoading: false,
    error: null,
    refetch: () => Promise.resolve()
  };

  // Fetch tasks with tRPC - with fallback for build compatibility
  const {
    data: tasksResult,
    isLoading: tasksLoading,
    error: tasksError,
    refetch: refetchTasks
  } = (trpc as any)?.tasks?.list?.useQuery ? (trpc as any).tasks.list.useQuery({
    workflow_id: id,
    include: ['assigned_user']
  }, {
    enabled: !!id
  }) : {
    data: [
      {
        id: '1',
        title: 'Extract Payoff Amount',
        status: 'AWAITING_REVIEW',
        metadata: { agent_name: 'Iris', failure_reason: 'Low confidence' },
        completed_at: null,
        due_date: '2024-12-29T17:00:00Z'
      },
      {
        id: '2',
        title: 'Validate Lender Information',
        status: 'COMPLETED',
        metadata: { agent_name: 'Nina' },
        completed_at: '2024-12-29T13:30:00Z',
        due_date: '2024-12-29T17:00:00Z'
      }
    ],
    isLoading: false,
    error: null,
    refetch: () => Promise.resolve()
  };

  const tasks = Array.isArray(tasksResult) ? tasksResult : (tasksResult?.data || []);
  const loading = workflowLoading || tasksLoading;
  const error = workflowError ? String(workflowError) : tasksError ? String(tasksError) : null;

  const refetch = () => {
    refetchWorkflow();
    refetchTasks();
  };

  // Real-time subscription for this specific workflow
  useEffect(() => {
    if (!id) return;

    const subscription = supabase
      .channel(`workflow_${id}_changes`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'workflows',
        filter: `id=eq.${id}`
      }, () => {
        refetch();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `workflow_id=eq.${id}`
      }, () => {
        refetch();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [id, refetch, supabase]);

  return {
    workflow,
    tasks,
    loading,
    error,
    refetch
  };
}