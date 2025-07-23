/**
 * Simplified workflow types for Rexera 2.0
 * Basic types for workflow status and metadata
 */

import type { WorkflowType, PriorityLevel, WorkflowStatus, TaskStatus, InterruptType } from '../enums';

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

// =====================================================
// FRONTEND WORKFLOW TYPES
// =====================================================

/**
 * Complete workflow data with related entities (for frontend)
 */
export interface WorkflowData {
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
  completed_at: string | null;
  due_date: string | null;
  n8n_execution_id?: string;
  client?: {
    id: string;
    name: string;
    domain?: string;
  };
  clients?: {
    id: string;
    name: string;
    domain?: string;
  }; // Deprecated: kept for backward compatibility
  assigned_user?: {
    id: string;
    full_name: string;
    email?: string;
  };
  task_executions?: TaskExecution[];
  tasks?: TaskExecution[]; // Alias for task_executions
}

/**
 * Task execution data (from database schema)
 */
export interface TaskExecution {
  id: string;
  workflow_id: string;
  agent_id: string | null;
  title: string;
  description: string | null;
  sequence_order: number;
  task_type: string;
  status: TaskStatus;
  interrupt_type: InterruptType | null;
  executor_type: 'AI' | 'HIL';
  priority: PriorityLevel;
  input_data: any; // Json type
  output_data: any | null; // Json type
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  execution_time_ms: number | null;
  retry_count: number;
  created_at: string;
  // Simple SLA tracking fields
  sla_hours: number;
  sla_due_at: string | null;
  sla_status: 'ON_TIME' | 'AT_RISK' | 'BREACHED';
  // Notification read tracking
  read_by_users: any; // Json type
  
  // Extended frontend properties (added by joins/transforms)
  agent_name?: string;
  assigned_agent?: string;
  updated_at?: string;
  due_date?: string;
  metadata?: {
    agent_name?: string;
    assigned_agent?: string;
    failure_reason?: string;
    conditional?: boolean;
    [key: string]: string | number | boolean | null | undefined;
  };
  agents?: {
    id: string;
    name: string;
    type: string;
  };
}

/**
 * Transformed workflow for frontend table display
 */
export interface TransformedWorkflow {
  id: string; // Display ID (e.g., "HOA-1001")
  workflowId: string; // Actual UUID
  created: string;
  createdRaw: string;
  type: string;
  typeRaw: string;
  client: string;
  property: string;
  status: string;
  statusRaw: string;
  statusClass: string;
  interrupts: {
    type: 'critical' | 'standard';
    count: number;
    icons: Array<{
      icon: string;
      agent: string;
    }>;
  } | null;
  interruptCount: number;
  due: string;
  dueRaw: string | null;
  eta: string;
  dueColor: string;
}