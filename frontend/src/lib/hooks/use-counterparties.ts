'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/lib/supabase/provider';
import { counterpartiesApi } from '@/lib/api/endpoints/counterparties';
import { workflowCounterpartiesApi } from '@/lib/api/endpoints/workflow-counterparties';
import type { 
  Counterparty, 
  CounterpartyFilters, 
  CounterpartySearchFilters, 
  CreateCounterpartyRequest, 
  UpdateCounterpartyRequest,
  WorkflowCounterparty,
  WorkflowCounterpartyStatus
} from '@rexera/shared';
import { formatErrorMessage } from '@/lib/utils/formatting';

// Query key factory following consistency patterns
export const counterpartiesKeys = {
  all: ['counterparties'] as const,
  lists: () => [...counterpartiesKeys.all, 'list'] as const,
  list: (filters: Partial<CounterpartyFilters>) => 
    [...counterpartiesKeys.lists(), filters] as const,
  details: () => [...counterpartiesKeys.all, 'detail'] as const,
  detail: (id: string) => [...counterpartiesKeys.details(), id] as const,
  search: (filters: CounterpartySearchFilters) => 
    [...counterpartiesKeys.all, 'search', filters] as const,
  workflowAssignments: (workflowId: string) => 
    [...counterpartiesKeys.all, 'workflow', workflowId] as const,
} as const;

/**
 * Hook for managing counterparties with React Query
 * Provides listing, searching, and CRUD operations with caching and real-time updates
 */
export function useCounterparties(filters: Partial<CounterpartyFilters> = {}) {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();

  // List counterparties with pagination and filtering
  const {
    data: counterpartiesResult,
    isLoading: loading,
    error,
    refetch
  } = useQuery({
    queryKey: counterpartiesKeys.list(filters),
    queryFn: () => counterpartiesApi.list(filters),
    staleTime: 30000, // 30 seconds
    retry: 2,
    retryDelay: 1000
  });

  const counterparties = counterpartiesResult?.data || [];
  const pagination = counterpartiesResult?.pagination || {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  };

  // Real-time subscriptions for counterparties
  useEffect(() => {
    if (!supabase) return;

    const subscription = supabase
      .channel('counterparties_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'counterparties'
      }, () => {
        queryClient.invalidateQueries({ queryKey: counterpartiesKeys.all });
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient, supabase]);

  // Create counterparty mutation
  const createCounterpartyMutation = useMutation({
    mutationFn: async (data: CreateCounterpartyRequest) => {
      const response = await counterpartiesApi.create(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: counterpartiesKeys.all });
    }
  });

  // Update counterparty mutation
  const updateCounterpartyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCounterpartyRequest }) => {
      const response = await counterpartiesApi.update(id, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: counterpartiesKeys.all });
    }
  });

  // Delete counterparty mutation
  const deleteCounterpartyMutation = useMutation({
    mutationFn: (id: string) => counterpartiesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: counterpartiesKeys.all });
    }
  });

  return {
    // Data
    counterparties,
    pagination,
    
    // Loading states
    loading,
    error: error ? formatErrorMessage(error) : null,
    
    // Actions
    refetch,
    createCounterparty: createCounterpartyMutation.mutateAsync,
    updateCounterparty: updateCounterpartyMutation.mutateAsync,
    deleteCounterparty: deleteCounterpartyMutation.mutateAsync,
    
    // Mutation states
    isCreating: createCounterpartyMutation.isPending,
    isUpdating: updateCounterpartyMutation.isPending,
    isDeleting: deleteCounterpartyMutation.isPending,
  };
}

/**
 * Hook for searching counterparties
 */
export function useCounterpartiesSearch(filters: CounterpartySearchFilters) {
  const {
    data: searchResult,
    isLoading,
    error
  } = useQuery({
    queryKey: counterpartiesKeys.search(filters),
    queryFn: () => counterpartiesApi.search(filters),
    enabled: filters.q.length > 0, // Only search when query exists
    staleTime: 30000,
    retry: 1
  });

  return {
    results: searchResult?.data || [],
    meta: searchResult?.meta,
    loading: isLoading,
    error: error ? formatErrorMessage(error) : null
  };
}

/**
 * Hook for managing workflow counterparty assignments
 */
export function useWorkflowCounterparties(workflowId: string) {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();

  // Get assigned counterparties for workflow
  const {
    data: rawAssignedCounterparties,
    isLoading: loadingAssigned,
    error: assignedError
  } = useQuery({
    queryKey: counterpartiesKeys.workflowAssignments(workflowId),
    queryFn: () => workflowCounterpartiesApi.list(workflowId, { include: 'counterparty' }),
    enabled: !!workflowId,
    staleTime: 30000
  });

  // Transform the data to match expected format (counterparties -> counterparty)
  const assignedCounterparties = rawAssignedCounterparties?.map(assignment => ({
    ...assignment,
    counterparty: (assignment as any).counterparties || null
  })) || [];

  // Real-time subscriptions for workflow counterparty assignments
  useEffect(() => {
    if (!supabase || !workflowId) return;

    const subscription = supabase
      .channel('workflow_counterparties_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'workflow_counterparties',
        filter: `workflow_id=eq.${workflowId}`
      }, () => {
        queryClient.invalidateQueries({ 
          queryKey: counterpartiesKeys.workflowAssignments(workflowId) 
        });
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient, supabase, workflowId]);

  // Add counterparty to workflow mutation
  const addCounterpartyMutation = useMutation({
    mutationFn: ({ counterpartyId, status }: { counterpartyId: string; status: WorkflowCounterpartyStatus }) =>
      workflowCounterpartiesApi.add(workflowId, {
        counterparty_id: counterpartyId,
        status
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: counterpartiesKeys.workflowAssignments(workflowId) 
      });
    }
  });

  // Update counterparty status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ assignmentId, status }: { assignmentId: string; status: WorkflowCounterpartyStatus }) =>
      workflowCounterpartiesApi.updateStatus(workflowId, assignmentId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: counterpartiesKeys.workflowAssignments(workflowId) 
      });
    }
  });

  // Remove counterparty from workflow mutation
  const removeCounterpartyMutation = useMutation({
    mutationFn: (assignmentId: string) =>
      workflowCounterpartiesApi.remove(workflowId, assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: counterpartiesKeys.workflowAssignments(workflowId) 
      });
    }
  });

  return {
    // Data
    assignedCounterparties: assignedCounterparties || [],
    
    // Loading states
    loadingAssigned,
    error: assignedError ? formatErrorMessage(assignedError) : null,
    
    // Actions
    addCounterparty: addCounterpartyMutation.mutateAsync,
    updateStatus: updateStatusMutation.mutateAsync,
    removeCounterparty: removeCounterpartyMutation.mutateAsync,
    
    // Mutation states
    isAdding: addCounterpartyMutation.isPending,
    isUpdatingStatus: updateStatusMutation.isPending,
    isRemoving: removeCounterpartyMutation.isPending,
  };
}