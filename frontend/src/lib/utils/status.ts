/**
 * Status utility functions for consistent styling and mapping
 */

import type { WorkflowStatus, TaskStatus } from '@rexera/shared';

// Status color mappings
export const statusColors = {
  workflow: {
    NOT_STARTED: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    BLOCKED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    WAITING_FOR_CLIENT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    PAUSED: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  },
  task: {
    NOT_STARTED: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    INTERRUPT: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    FAILED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
  priority: {
    LOW: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    NORMAL: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    HIGH: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    URGENT: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
  sla: {
    ON_TIME: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    AT_RISK: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    BREACHED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
  document: {
    PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    PROCESSING: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    FAILED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    DELIVERED: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  }
} as const;

// Status display names
export const statusDisplayNames = {
  workflow: {
    NOT_STARTED: 'Not Started',
    IN_PROGRESS: 'In Progress',
    BLOCKED: 'Blocked',
    WAITING_FOR_CLIENT: 'Waiting for Client',
    COMPLETED: 'Completed',
    PAUSED: 'Paused',
    CANCELLED: 'Cancelled',
  },
  task: {
    NOT_STARTED: 'Not Started',
    IN_PROGRESS: 'In Progress',
    INTERRUPT: 'Needs Attention',
    COMPLETED: 'Completed',
    FAILED: 'Failed',
  },
  priority: {
    LOW: 'Low',
    NORMAL: 'Normal',
    HIGH: 'High',
    URGENT: 'Urgent',
  },
  sla: {
    ON_TIME: 'On Time',
    AT_RISK: 'At Risk',
    BREACHED: 'Breached',
  }
} as const;

// Utility functions
export const getWorkflowStatusColor = (status: WorkflowStatus): string => {
  return statusColors.workflow[status] || statusColors.workflow.NOT_STARTED;
};

export const getTaskStatusColor = (status: TaskStatus): string => {
  return statusColors.task[status] || statusColors.task.NOT_STARTED;
};

export const getPriorityColor = (priority: string): string => {
  return statusColors.priority[priority as keyof typeof statusColors.priority] || statusColors.priority.NORMAL;
};

export const getSlaStatusColor = (sla: string): string => {
  return statusColors.sla[sla as keyof typeof statusColors.sla] || statusColors.sla.ON_TIME;
};

export const getDocumentStatusColor = (status: string): string => {
  return statusColors.document[status as keyof typeof statusColors.document] || statusColors.document.PENDING;
};

export const getWorkflowStatusDisplay = (status: WorkflowStatus): string => {
  return statusDisplayNames.workflow[status] || status;
};

export const getTaskStatusDisplay = (status: TaskStatus): string => {
  return statusDisplayNames.task[status] || status;
};

export const getPriorityDisplay = (priority: string): string => {
  return statusDisplayNames.priority[priority as keyof typeof statusDisplayNames.priority] || priority;
};

export const getSlaStatusDisplay = (sla: string): string => {
  return statusDisplayNames.sla[sla as keyof typeof statusDisplayNames.sla] || sla;
};

// Status icon mappings
export const getStatusIcon = (type: 'workflow' | 'task', status: string): string => {
  const icons = {
    workflow: {
      NOT_STARTED: '⭕',
      IN_PROGRESS: '🔄',
      BLOCKED: '🚫',
      WAITING_FOR_CLIENT: '⏳',
      COMPLETED: '✅',
      PAUSED: '⏸️',
      CANCELLED: '❌',
    },
    task: {
      NOT_STARTED: '⭕',
      IN_PROGRESS: '🔄',
      INTERRUPT: '⚠️',
      COMPLETED: '✅',
      FAILED: '❌',
    }
  };

  return icons[type][status as keyof typeof icons[typeof type]] || '❓';
};

// SLA calculation utilities
export const calculateSlaStatus = (dueDate: string, completedAt?: string): string => {
  const due = new Date(dueDate);
  const now = new Date();
  const completed = completedAt ? new Date(completedAt) : null;

  if (completed) {
    return completed <= due ? 'ON_TIME' : 'BREACHED';
  }

  const timeUntilDue = due.getTime() - now.getTime();
  const hoursUntilDue = timeUntilDue / (1000 * 60 * 60);

  if (timeUntilDue < 0) return 'BREACHED';
  if (hoursUntilDue <= 24) return 'AT_RISK';
  return 'ON_TIME';
};

// Progress calculation utilities
export const calculateWorkflowProgress = (tasks: Array<{ status: TaskStatus }>): number => {
  if (tasks.length === 0) return 0;
  
  const completedTasks = tasks.filter(task => task.status === 'COMPLETED').length;
  return Math.round((completedTasks / tasks.length) * 100);
};