'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface InterruptItem {
  id: string;
  workflow_id: string;
  task_type: string;
  status: string;
  created_at: string;
  updated_at: string;
  workflow: {
    human_readable_id: string;
    workflow_type: string;
    title?: string;
  };
}

export function useInterrupts() {
  const [interrupts, setInterrupts] = useState<InterruptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch interrupts function
  const fetchInterrupts = async () => {
    try {
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('task_executions' as any)
        .select(`
          *,
          workflows!inner(
            human_readable_id,
            workflow_type,
            title
          )
        `)
        .eq('status', 'AWAITING_REVIEW')
        .order('created_at', { ascending: false })
        .limit(20);

      if (fetchError) {
        throw fetchError;
      }

      // Transform data to match our interface
      const transformedData = (data || []).map((item: any) => ({
        id: item.id,
        workflow_id: item.workflow_id,
        task_type: item.task_type,
        status: item.status,
        created_at: item.created_at,
        updated_at: item.updated_at,
        workflow: {
          human_readable_id: item.workflows?.human_readable_id || item.workflow_id,
          workflow_type: item.workflows?.workflow_type || 'PAYOFF',
          title: item.workflows?.title || 'Workflow'
        }
      }));

      setInterrupts(transformedData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load interrupts';
      setError(errorMessage);
      console.error('Interrupt fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchInterrupts();
  }, []);

  // Real-time subscription for interrupt updates
  useEffect(() => {
    const subscription = supabase
      .channel('interrupt_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'task_executions',
        filter: 'status=eq.AWAITING_REVIEW'
      }, () => {
        // Refetch interrupts when any AWAITING_REVIEW task changes
        fetchInterrupts();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'task_executions'
      }, (payload) => {
        // If a task changes TO or FROM AWAITING_REVIEW, refetch
        const newStatus = payload.new.status;
        const oldStatus = payload.old.status;
        
        if (newStatus === 'AWAITING_REVIEW' || oldStatus === 'AWAITING_REVIEW') {
          fetchInterrupts();
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    interrupts,
    loading,
    error,
    refetch: fetchInterrupts
  };
}