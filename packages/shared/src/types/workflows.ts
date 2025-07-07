/**
 * Simplified workflow types for Rexera 2.0
 * Basic types for workflow status and metadata
 */

import type { WorkflowType, PriorityLevel, WorkflowStatus, TaskStatus } from '../enums';

// =====================================================
// BASIC WORKFLOW TYPES
// =====================================================

/**
 * Basic workflow instance - represents a workflow execution
 */
export interface Workflow {
  id: string;
  workflow_type: WorkflowType;
  client_id: string;
  title: string;
  description?: string;
  status: WorkflowStatus;
  priority: PriorityLevel;
  metadata: Record<string, any>;
  created_by: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  due_date?: string;
  n8n_execution_id?: string;
}

/**
 * Basic task definition for workflow steps
 */
export interface WorkflowTask {
  id: string;
  workflow_id: string;
  task_type: string;
  sequence_order: number;
  status: TaskStatus;
  agent_name?: string;
  result?: Record<string, any>;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

// =====================================================
// WORKFLOW FILTERS & QUERIES
// =====================================================

/**
 * Filters for workflow queries
 */
export interface WorkflowFilters {
  workflow_type?: WorkflowType;
  status?: WorkflowStatus;
  client_id?: string;
  assigned_to?: string;
  priority?: PriorityLevel;
  created_after?: string;
  created_before?: string;
  due_after?: string;
  due_before?: string;
}

/**
 * Pagination for workflow lists
 */
export interface WorkflowPagination {
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'updated_at' | 'due_date' | 'priority';
  sort_order?: 'asc' | 'desc';
}