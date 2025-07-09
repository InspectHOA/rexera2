'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/lib/supabase/provider';
import { api } from '@/lib/api/client';

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

export function useWorkflows(filters: WorkflowFilters = {}) {
  const [stats, setStats] = useState<WorkflowStats>({
    total: 0,
    active: 0,
    interrupts: 0,
    completedToday: 0
  });

  const { supabase } = useSupabase();
  const queryClient = useQueryClient();

  // React Query for workflows
  const {
    data: workflowsResult,
    isLoading: loading,
    error,
    refetch
  } = useQuery({
    queryKey: ['workflows', filters],
    queryFn: () => api.workflows.list(filters),
    staleTime: 30000, // 30 seconds
  });

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
        queryClient.invalidateQueries({ queryKey: ['workflows'] });
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient, supabase]);

  // Create workflow mutation
  const createWorkflowMutation = useMutation({
    mutationFn: api.workflows.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });

  return {
    workflows,
    stats,
    loading,
    error: error ? String(error) : null,
    pagination,
    refetch,
    createWorkflow: createWorkflowMutation.mutate,
    createWorkflowAsync: createWorkflowMutation.mutateAsync,
    isCreating: createWorkflowMutation.isPending,
  };
}

export function useWorkflow(id: string) {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();

  // Determine if ID is a human-readable number or UUID
  const isHumanId = /^\d+$/.test(id);
  
  // Fetch workflow
  const {
    data: workflow,
    isLoading: workflowLoading,
    error: workflowError,
    refetch: refetchWorkflow
  } = useQuery({
    queryKey: ['workflow', id],
    queryFn: () => isHumanId 
      ? api.workflows.byHumanId(id, ['client'])
      : api.workflows.byId(id, ['client']),
    enabled: !!id,
    staleTime: 30000,
  });

  // Fetch tasks for the workflow
  const {
    data: tasksResult,
    isLoading: tasksLoading,
    error: tasksError,
    refetch: refetchTasks
  } = useQuery({
    queryKey: ['tasks', { workflow_id: id }],
    queryFn: () => api.tasks.list({
      workflowId: workflow?.id || id, // Use actual UUID for task filtering
      include: ['assigned_user', 'agent']
    }),
    enabled: !!id && !!workflow,
    staleTime: 30000,
  });

  const tasks = tasksResult?.data || [];
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
        queryClient.invalidateQueries({ queryKey: ['workflow', id] });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'task_executions',
        filter: `workflow_id=eq.${id}`
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['tasks', { workflow_id: id }] });
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [id, queryClient, supabase]);

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: api.tasks.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', { workflow_id: id }] });
    },
  });

  return {
    workflow,
    tasks,
    loading,
    error,
    refetch,
    createTask: createTaskMutation.mutate,
    createTaskAsync: createTaskMutation.mutateAsync,
    isCreatingTask: createTaskMutation.isPending,
  };
}

// Hook for n8n operations
export function useWorkflowN8n(id: string) {
  const queryClient = useQueryClient();

  const {
    data: n8nStatus,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['workflow-n8n-status', id],
    queryFn: () => api.workflows.getN8nStatus(id),
    enabled: !!id,
    staleTime: 10000, // 10 seconds
  });

  const cancelN8nMutation = useMutation({
    mutationFn: () => api.workflows.cancelN8nExecution(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-n8n-status', id] });
      queryClient.invalidateQueries({ queryKey: ['workflow', id] });
    },
  });

  return {
    n8nStatus,
    loading: isLoading,
    error: error ? String(error) : null,
    refetch,
    cancelN8nExecution: cancelN8nMutation.mutate,
    cancelN8nExecutionAsync: cancelN8nMutation.mutateAsync,
    isCancelling: cancelN8nMutation.isPending,
  };
}