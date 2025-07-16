/**
 * Custom hook for transforming workflow data for display
 */

import { useMemo } from 'react';
import { formatWorkflowIdWithType } from '@rexera/shared';
import type { WorkflowData, TaskExecution, TransformedWorkflow } from '@/types/workflow';

export function useWorkflowTransformation(
  workflowData: WorkflowData[],
  filterInterrupts: string,
  searchQuery: string
) {
  const transformedWorkflows = useMemo(() => {
    return workflowData.map((workflow: WorkflowData) => {
      const tasks: TaskExecution[] = workflow.task_executions || workflow.tasks || [];
      const interruptCount = tasks.filter((t: TaskExecution) => t.status === 'AWAITING_REVIEW')?.length || 0;
      const hasInterrupts = interruptCount > 0;
      
      // Use simple UUID-based display ID
      const displayId = formatWorkflowIdWithType(workflow.id, workflow.workflow_type);
      
      return {
        id: displayId,
        workflowId: workflow.id, // Use UUID for navigation, displayId for display
        created: formatCreatedDate(workflow.created_at),
        createdRaw: workflow.created_at, // For sorting
        type: getDisplayWorkflowType(workflow.workflow_type),
        typeRaw: workflow.workflow_type, // For sorting
        client: workflow.clients?.name || 'Unknown Client',
        property: workflow.metadata?.property_address || workflow.title || 'No property info',
        status: getDisplayStatus(workflow.status),
        statusRaw: workflow.status, // For sorting
        statusClass: getStatusClass(workflow.status),
        interrupts: hasInterrupts ? {
          type: workflow.priority === 'URGENT' ? 'critical' as const : 'standard' as const,
          count: interruptCount,
          icons: getInterruptIcons(tasks.filter((t: TaskExecution) => t.status === 'AWAITING_REVIEW') || [])
        } : null,
        interruptCount: interruptCount, // For sorting
        due: formatDate(workflow.due_date),
        dueRaw: workflow.due_date, // For sorting
        eta: formatDate(workflow.due_date), // Could be enhanced with better ETA logic
        dueColor: getDueColor(workflow.status, workflow.due_date)
      };
    });
  }, [workflowData]);

  // Apply remaining client-side filters (search and interrupts) until backend supports them
  const filteredWorkflows = useMemo(() => {
    return transformedWorkflows.filter((workflow: TransformedWorkflow) => {
      // Interrupts filter (client-side until backend implementation)
      if (filterInterrupts) {
        if (filterInterrupts === 'has-interrupts' && workflow.interruptCount === 0) {
          return false;
        }
        if (filterInterrupts === 'no-interrupts' && workflow.interruptCount > 0) {
          return false;
        }
      }

      // Search filter (client-side until backend implementation)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchableText = [
          workflow.id,
          workflow.client,
          workflow.property,
          workflow.type
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [transformedWorkflows, filterInterrupts, searchQuery]);

  return filteredWorkflows;
}

// Helper functions
function getDisplayWorkflowType(type: string) {
  const typeMap: Record<string, string> = {
    'PAYOFF_REQUEST': 'Payoff Request',
    'HOA_ACQUISITION': 'HOA Documents', 
    'MUNI_LIEN_SEARCH': 'Lien Search'
  };
  return typeMap[type] || type;
}

function formatCreatedDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return 'Today';
  } else if (diffInDays === 1) {
    return 'Yesterday';
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }
}

function getDisplayStatus(status: string) {
  const statusMap: Record<string, string> = {
    'PENDING': 'Pending',
    'IN_PROGRESS': 'In Progress',
    'AWAITING_REVIEW': 'Review',
    'BLOCKED': 'Blocked',
    'COMPLETED': 'Completed'
  };
  return statusMap[status] || status;
}

function getStatusClass(status: string) {
  const statusClasses: Record<string, string> = {
    'PENDING': 'bg-gray-100 text-gray-700',
    'IN_PROGRESS': 'bg-blue-100 text-gray-900',
    'AWAITING_REVIEW': 'bg-yellow-100 text-yellow-700',
    'BLOCKED': 'bg-red-100 text-red-700',
    'COMPLETED': 'bg-green-100 text-green-700'
  };
  return statusClasses[status] || 'bg-gray-100 text-gray-700';
}

function getInterruptIcons(tasks: TaskExecution[]): { icon: string; agent: string; }[] {
  const icons: { icon: string; agent: string; }[] = [];
  const hasDocumentIssue = tasks.some(t => t.status === 'AWAITING_REVIEW' && (t as any).agents?.name === 'iris');
  const hasEmailIssue = tasks.some(t => t.status === 'AWAITING_REVIEW' && (t as any).agents?.name === 'mia');
  const hasNinaIssue = tasks.some(t => t.status === 'AWAITING_REVIEW' && (t as any).agents?.name === 'nina');

  if (hasDocumentIssue) icons.push({ icon: '📄', agent: 'iris' });
  if (hasEmailIssue) icons.push({ icon: '✉️', agent: 'mia' });
  if (hasNinaIssue) icons.push({ icon: '🔍', agent: 'nina' });

  return icons;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Tomorrow';
  } else if (diffDays === -1) {
    return 'Yesterday';
  } else if (diffDays > 0) {
    return `${diffDays} days`;
  } else {
    return `${Math.abs(diffDays)} days ago`;
  }
}

function getDueColor(status: string, dueDate: string | null): string {
  if (!dueDate || status === 'COMPLETED') return 'text-gray-500';
  
  const due = new Date(dueDate);
  const now = new Date();
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'text-red-600 font-medium'; // Overdue
  if (diffDays <= 1) return 'text-amber-600 font-medium'; // Due soon
  if (diffDays <= 3) return 'text-gray-900'; // Coming up
  return 'text-gray-500'; // Normal
}