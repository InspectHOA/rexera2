'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from '@/hooks/use-toast';

interface TaskNotificationPayload {
  new: {
    id: string;
    workflow_id: string;
    task_type: string;
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'AWAITING_REVIEW';
    agent_name?: string;
    output_data?: any;
  };
  old: {
    status: string;
  };
}

interface WorkflowNotificationPayload {
  new: {
    id: string;
    human_readable_id: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'BLOCKED';
    workflow_type: string;
    title?: string;
  };
  old: {
    status: string;
  };
}

export function useNotifications() {
  useEffect(() => {
    const subscription = supabase
      .channel('instant_notifications')
      // Task execution notifications
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'task_executions'
      }, (payload: { new: any; old: any }) => {
        const { new: newTask, old: oldTask } = payload as TaskNotificationPayload;
        
        // Only notify on status changes
        if (newTask.status !== oldTask.status) {
          handleTaskStatusChange(newTask, oldTask.status);
        }
      })
      // Workflow status notifications  
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'workflows'
      }, (payload: { new: any; old: any }) => {
        const { new: newWorkflow, old: oldWorkflow } = payload as WorkflowNotificationPayload;
        
        // Only notify on status changes
        if (newWorkflow.status !== oldWorkflow.status) {
          handleWorkflowStatusChange(newWorkflow, oldWorkflow.status);
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);
}

function handleTaskStatusChange(task: TaskNotificationPayload['new'], oldStatus: string) {
  const workflowId = task.workflow_id;
  const taskName = formatTaskType(task.task_type);
  
  switch (task.status) {
    case 'AWAITING_REVIEW':
      toast({
        variant: 'destructive',
        title: '🚨 Task Needs Review',
        description: `${taskName} in workflow ${workflowId} requires attention`,
      });
      break;
      
    case 'COMPLETED':
      if (oldStatus === 'RUNNING') {
        toast({
          variant: 'default',
          title: '✅ Task Completed',
          description: `${taskName} finished successfully`,
        });
      }
      break;
      
    case 'FAILED':
      toast({
        variant: 'destructive', 
        title: '❌ Task Failed',
        description: `${taskName} in workflow ${workflowId} encountered an error`,
      });
      break;
      
    case 'RUNNING':
      if (oldStatus === 'PENDING') {
        toast({
          variant: 'default',
          title: '🔄 Task Started',
          description: `${taskName} is now running`,
        });
      }
      break;
  }
}

function handleWorkflowStatusChange(workflow: WorkflowNotificationPayload['new'], oldStatus: string) {
  const workflowId = workflow.human_readable_id || workflow.id;
  const workflowType = formatWorkflowType(workflow.workflow_type);
  
  switch (workflow.status) {
    case 'COMPLETED':
      toast({
        variant: 'default',
        title: '🎉 Workflow Completed',
        description: `${workflowType} ${workflowId} finished successfully`,
      });
      break;
      
    case 'FAILED':
      toast({
        variant: 'destructive',
        title: '💥 Workflow Failed', 
        description: `${workflowType} ${workflowId} encountered critical errors`,
      });
      break;
      
    case 'BLOCKED':
      toast({
        variant: 'destructive',
        title: '⚠️ Workflow Blocked',
        description: `${workflowType} ${workflowId} is blocked and needs intervention`,
      });
      break;
  }
}

function formatTaskType(taskType: string): string {
  return taskType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function formatWorkflowType(workflowType: string): string {
  const typeMap: Record<string, string> = {
    'PAYOFF': 'Payoff Request',
    'HOA_ACQUISITION': 'HOA Documents',
    'MUNI_LIEN_SEARCH': 'Municipal Lien Search'
  };
  return typeMap[workflowType] || workflowType;
}