'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/lib/supabase/provider';
import type { Database } from '@/types';

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

function calculateStatsFromData(workflows: any[]) {
  const today = new Date().toDateString();
  return {
    total: workflows.length,
    active: workflows.filter(w => ['IN_PROGRESS', 'PENDING', 'AWAITING_REVIEW'].includes(w.status)).length,
    interrupts: workflows.filter(w => w.tasks?.some((t: any) => t.status === 'AWAITING_REVIEW')).length,
    completedToday: workflows.filter(w => 
      w.status === 'COMPLETED' && 
      w.completed_at && 
      new Date(w.completed_at).toDateString() === today
    ).length
  };
}

export function useWorkflows(filters: WorkflowFilters = {}) {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [stats, setStats] = useState<WorkflowStats>({
    total: 0,
    active: 0,
    interrupts: 0,
    completedToday: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  const { supabase } = useSupabase();

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      if (filters.workflow_type) params.append('workflow_type', filters.workflow_type);
      if (filters.status) params.append('status', filters.status);
      if (filters.client_id) params.append('client_id', filters.client_id);
      if (filters.assigned_to) params.append('assigned_to', filters.assigned_to);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.include?.length) params.append('include', filters.include.join(','));

      const response = await fetch(`/api/workflows?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch workflows: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setWorkflows(result.data);
        setPagination(result.pagination);
        
        // Calculate stats from the workflows
        const today = new Date().toDateString();
        const calculatedStats = {
          total: result.pagination.total,
          active: result.data.filter((w: any) => 
            ['IN_PROGRESS', 'PENDING', 'AWAITING_REVIEW'].includes(w.status)
          ).length,
          interrupts: result.data.filter((w: any) => 
            w.tasks?.some((t: any) => t.status === 'AWAITING_REVIEW')
          ).length,
          completedToday: result.data.filter((w: any) => 
            w.status === 'COMPLETED' && 
            new Date(w.completed_at).toDateString() === today
          ).length
        };
        setStats(calculatedStats);
      } else {
        throw new Error(result.error?.message || 'Failed to fetch workflows');
      }
    } catch (err) {
      console.error('Error fetching workflows:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, [
    filters.workflow_type,
    filters.status,
    filters.client_id,
    filters.assigned_to,
    filters.priority,
    filters.page,
    filters.limit
  ]);

  // Real-time subscription for workflow updates
  useEffect(() => {
    const subscription = supabase
      .channel('workflows_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'workflows'
      }, () => {
        // Refetch data when workflows change
        fetchWorkflows();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    workflows,
    stats,
    loading,
    error,
    pagination,
    refetch: fetchWorkflows
  };
}

export function useWorkflow(id: string) {
  const [workflow, setWorkflow] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { supabase } = useSupabase();

  const fetchWorkflow = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch specific workflow by ID
      const workflowResponse = await fetch(`/api/workflows/${id}?include=client,tasks`);
      
      if (!workflowResponse.ok) {
        throw new Error(`Failed to fetch workflow: ${workflowResponse.status} ${workflowResponse.statusText}`);
      }

      const workflowResult = await workflowResponse.json();
      
      if (workflowResult.success) {
        setWorkflow(workflowResult.data);
        setTasks(workflowResult.data.tasks || []);
      } else {
        throw new Error(workflowResult.error?.message || 'Failed to fetch workflow');
      }
    } catch (err) {
      console.error('Error fetching workflow:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchWorkflow();
    }
  }, [id]);

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
        fetchWorkflow();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `workflow_id=eq.${id}`
      }, () => {
        fetchWorkflow();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [id]);

  return {
    workflow,
    tasks,
    loading,
    error,
    refetch: fetchWorkflow
  };
}