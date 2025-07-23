'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/lib/supabase/provider';
import { api } from '@/lib/api/client';
import { type WorkflowStatus, type TaskStatus, type WorkflowType, type PriorityLevel } from '@rexera/shared';
import type { WorkflowData, TaskExecution } from '@/types/workflow';
import type { PaginatedFilters } from '@/types/api';
import { formatErrorMessage } from '@/lib/utils/formatting';

// Query key factory for task executions
export const taskExecutionKeys = {
  all: ['taskExecutions'] as const,
  lists: () => [...taskExecutionKeys.all, 'list'] as const,
  list: (filters: { workflow_id?: string; [key: string]: any }) => [...taskExecutionKeys.lists(), filters] as const,
};

interface WorkflowFilters extends PaginatedFilters {
  workflow_type?: WorkflowType;
  status?: WorkflowStatus;
  client_id?: string;
  assigned_to?: string;
  priority?: PriorityLevel;
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
    staleTime: 0, // Force fresh data
    retry: 2,
    retryDelay: 1000
    // Temporarily removed placeholderData to see real errors
  });

  const workflows = (workflowsResult?.data && Array.isArray(workflowsResult.data)) ? workflowsResult.data : [];
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
        active: workflows.filter((w: WorkflowData) => {
          const activeStatuses: WorkflowStatus[] = ['IN_PROGRESS', 'NOT_STARTED', 'BLOCKED', 'WAITING_FOR_CLIENT'];
          return activeStatuses.includes(w.status as WorkflowStatus);
        }).length,
        interrupts: workflows.filter((w: WorkflowData) => {
          const INTERRUPT_STATUS: TaskStatus = 'INTERRUPT';
          return (w.task_executions || []).some((t: TaskExecution) => t.status === INTERRUPT_STATUS);
        }).length,
        completedToday: workflows.filter((w: WorkflowData) => {
          const COMPLETED_STATUS: WorkflowStatus = 'COMPLETED';
          return w.status === COMPLETED_STATUS && 
            w.updated_at && new Date(w.updated_at).toDateString() === today;
        }).length
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
    error: error ? formatErrorMessage(error) : null,
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

  // Determine if ID is a human-readable format (e.g., "HOA-1002") or UUID
  const isHumanId = /^[A-Z]+-\d+$/.test(id) || /^\d+$/.test(id);
  
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
    staleTime: 0, // Force fresh data
  });

  // Fetch task executions for the workflow
  const {
    data: taskExecutionsResult,
    isLoading: taskExecutionsLoading,
    error: taskExecutionsError,
    refetch: refetchTaskExecutions
  } = useQuery({
    queryKey: taskExecutionKeys.list({ workflow_id: id }),
    queryFn: () => api.taskExecutions.list({
      workflow_id: id,
      include: ['assigned_user', 'agents']
    }),
    enabled: !!id,
    staleTime: 0, // Force fresh data
  });

  const taskExecutions = taskExecutionsResult?.data || [];
  
  const loading = workflowLoading || taskExecutionsLoading;
  const error = workflowError ? formatErrorMessage(workflowError) : taskExecutionsError ? formatErrorMessage(taskExecutionsError) : null;

  const refetch = () => {
    refetchWorkflow();
    refetchTaskExecutions();
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
        queryClient.invalidateQueries({ queryKey: taskExecutionKeys.list({ workflow_id: id }) });
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [id, queryClient, supabase]);

  // Create task execution mutation
  const createTaskExecutionMutation = useMutation({
    mutationFn: api.taskExecutions.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskExecutions', { workflow_id: id }] });
    },
  });

  return {
    workflow,
    taskExecutions,
    loading,
    error,
    refetch,
    createTaskExecution: createTaskExecutionMutation.mutate,
    createTaskExecutionAsync: createTaskExecutionMutation.mutateAsync,
    isCreatingTaskExecution: createTaskExecutionMutation.isPending,
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
    error: error ? formatErrorMessage(error) : null,
    refetch,
    cancelN8nExecution: cancelN8nMutation.mutate,
    cancelN8nExecutionAsync: cancelN8nMutation.mutateAsync,
    isCancelling: cancelN8nMutation.isPending,
  };
}