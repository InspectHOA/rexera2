/**
 * API types for Rexera 2.0
 * Request/response types for all API endpoints
 */

import {
  Workflow,
  Task,
  Communication,
  Document,
  Counterparty,
  Agent,
  WorkflowFilters,
  TaskFilters,
  PaginatedResponse
} from './database';

import type {
  WorkflowType,
  WorkflowStatus,
  TaskStatus,
  PriorityLevel
} from './enums';

// WebSocketMessage and SubscriptionRequest available from utilities if needed

// =====================================================
// COMMON API TYPES
// =====================================================

export interface SuccessResponse {
  success: boolean;
  message?: string;
}

// =====================================================
// WORKFLOW API TYPES
// =====================================================

export interface CreateWorkflowRequest {
  workflow_type: WorkflowType;
  client_id: string;
  title: string;
  description?: string;
  priority?: PriorityLevel;
  metadata?: Record<string, any>;
  due_date?: string;
}

export interface UpdateWorkflowRequest {
  title?: string;
  description?: string;
  status?: WorkflowStatus;
  priority?: PriorityLevel;
  assigned_to?: string;
  metadata?: Record<string, any>;
  due_date?: string;
}

export interface WorkflowResponse extends Workflow {
  tasks?: Task[];
  client?: {
    id: string;
    name: string;
  };
  assigned_user?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface WorkflowListResponse extends PaginatedResponse<WorkflowResponse> {}

export interface WorkflowQueryParams extends WorkflowFilters {
  include?: string[]; // ['tasks', 'client', 'assigned_user', 'documents', 'communications']
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Workflow Actions
export interface WorkflowActionRequest {
  action: 'start' | 'pause' | 'resume' | 'complete' | 'cancel';
  reason?: string;
  metadata?: Record<string, any>;
}

// =====================================================
// TASK API TYPES
// =====================================================

export interface CreateTaskRequest {
  workflow_id: string;
  title: string;
  description?: string;
  executor_type: 'AI' | 'HIL';
  assigned_to?: string;
  priority?: PriorityLevel;
  metadata?: Record<string, any>;
  due_date?: string;
  dependencies?: string[]; // Task IDs that this task depends on
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  executor_type?: 'AI' | 'HIL';
  assigned_to?: string;
  priority?: PriorityLevel;
  metadata?: Record<string, any>;
  due_date?: string;
}

export interface TaskResponse extends Task {
  workflow?: {
    id: string;
    title: string;
    workflow_type: WorkflowType;
  };
  assigned_user?: {
    id: string;
    full_name: string;
    email: string;
  };
  dependencies?: Task[];
  dependents?: Task[];
}

export interface TaskListResponse extends PaginatedResponse<TaskResponse> {}

export interface TaskQueryParams extends TaskFilters {
  include?: string[]; // ['workflow', 'assigned_user', 'dependencies', 'executions']
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Task Actions
export interface TaskActionRequest {
  action: 'execute' | 'approve' | 'reject' | 'retry' | 'skip' | 'escalate';
  reason?: string;
  metadata?: Record<string, any>;
  execution_data?: Record<string, any>;
}

// =====================================================
// COMMUNICATION API TYPES
// =====================================================

export interface CreateCommunicationRequest {
  workflow_id?: string;
  task_id?: string;
  thread_id?: string;
  recipient_email?: string;
  subject?: string;
  body?: string;
  communication_type: 'email' | 'phone' | 'sms' | 'internal_note';
  metadata?: Record<string, any>;
}

export interface UpdateCommunicationRequest {
  subject?: string;
  body?: string;
  status?: string;
  metadata?: Record<string, any>;
}

export interface CommunicationResponse extends Communication {
  sender?: {
    id: string;
    full_name: string;
    email: string;
  };
  workflow?: {
    id: string;
    title: string;
  };
  task?: {
    id: string;
    title: string;
  };
  thread?: {
    id: string;
    subject: string;
  };
}

export interface CommunicationListResponse extends PaginatedResponse<CommunicationResponse> {}

export interface CommunicationQueryParams {
  workflow_id?: string;
  task_id?: string;
  thread_id?: string;
  communication_type?: string;
  include?: string[]; // ['sender', 'workflow', 'task', 'thread']
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// =====================================================
// DOCUMENT API TYPES
// =====================================================

export interface CreateDocumentRequest {
  workflow_id?: string;
  task_id?: string;
  filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  document_type?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  deliverable_data?: Record<string, any>;
}

export interface UpdateDocumentRequest {
  filename?: string;
  document_type?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  deliverable_data?: Record<string, any>;
}

export interface DocumentResponse extends Document {
  workflow?: {
    id: string;
    title: string;
  };
  task?: {
    id: string;
    title: string;
  };
  uploaded_by_user?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface DocumentListResponse extends PaginatedResponse<DocumentResponse> {}

export interface DocumentQueryParams {
  workflow_id?: string;
  task_id?: string;
  document_type?: string;
  tags?: string[];
  include?: string[]; // ['workflow', 'task', 'uploaded_by_user']
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// =====================================================
// COUNTERPARTY API TYPES
// =====================================================

export interface CreateCounterpartyRequest {
  name: string;
  type: 'hoa' | 'lender' | 'municipality' | 'utility' | 'tax_authority';
  email?: string;
  phone?: string;
  address?: string;
  contact_info?: Record<string, any>;
}

export interface UpdateCounterpartyRequest {
  name?: string;
  type?: 'hoa' | 'lender' | 'municipality' | 'utility' | 'tax_authority';
  email?: string;
  phone?: string;
  address?: string;
  contact_info?: Record<string, any>;
}

export interface CounterpartyResponse extends Counterparty {
  workflows?: {
    id: string;
    title: string;
    role: string;
    status: string;
  }[];
}

export interface CounterpartyListResponse extends PaginatedResponse<CounterpartyResponse> {}

export interface CounterpartyQueryParams {
  type?: string;
  include?: string[]; // ['workflows']
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// =====================================================
// AGENT API TYPES
// =====================================================

export interface AgentResponse extends Agent {
  recent_executions?: {
    id: string;
    workflow_id: string;
    task_id: string;
    status: string;
    started_at: string;
    completed_at?: string;
  }[];
  performance_metrics?: {
    avg_execution_time: number;
    success_rate: number;
    total_executions: number;
    avg_confidence_score: number;
  };
}

export interface AgentListResponse extends PaginatedResponse<AgentResponse> {}

export interface AgentQueryParams {
  type?: string;
  is_active?: boolean;
  include?: string[]; // ['recent_executions', 'performance_metrics']
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// =====================================================
// DASHBOARD API TYPES
// =====================================================

export interface DashboardStatsResponse {
  workflows: {
    total: number;
    active: number;
    completed_today: number;
    overdue: number;
    by_status: Record<WorkflowStatus, number>;
    by_type: Record<WorkflowType, number>;
  };
  tasks: {
    total: number;
    pending: number;
    in_progress: number;
    awaiting_review: number;
    completed_today: number;
    hil_assignments: number;
  };
  agents: {
    total: number;
    active: number;
    avg_response_time: number;
    success_rate: number;
    executions_today: number;
  };
  sla: {
    on_time: number;
    at_risk: number;
    breached: number;
    avg_completion_time: number;
  };
}

export interface InterruptQueueResponse {
  interrupts: {
    id: string;
    workflow_id: string;
    task_id?: string;
    type: 'approval' | 'review' | 'intervention' | 'escalation';
    priority: PriorityLevel;
    title: string;
    description: string;
    assigned_to: string;
    created_at: string;
    due_at?: string;
    sla_status: 'on_time' | 'at_risk' | 'breached';
    workflow: {
      id: string;
      title: string;
      workflow_type: WorkflowType;
      client_name: string;
    };
  }[];
  total: number;
}

export interface ActivityFeedResponse {
  activities: {
    id: string;
    type: 'workflow_created' | 'task_completed' | 'agent_executed' | 'hil_intervention' | 'sla_alert';
    title: string;
    description: string;
    user?: {
      id: string;
      full_name: string;
    };
    workflow?: {
      id: string;
      title: string;
    };
    created_at: string;
  }[];
  total: number;
}

// =====================================================
// REAL-TIME API TYPES
// =====================================================

// WebSocketMessage and SubscriptionRequest are imported from utilities

// =====================================================
// SEARCH API TYPES
// =====================================================

export interface SearchRequest {
  query: string;
  types?: string[]; // ['workflows', 'tasks', 'communications', 'documents', 'counterparties']
  filters?: {
    client_id?: string;
    workflow_type?: WorkflowType;
    date_range?: {
      start: string;
      end: string;
    };
  };
  limit?: number;
}

export interface SearchResponse {
  results: {
    type: string;
    id: string;
    title: string;
    description?: string;
    highlights: string[];
    relevance_score: number;
    metadata: Record<string, any>;
  }[];
  total: number;
  query: string;
  execution_time_ms: number;
}

// =====================================================
// EXPORT API TYPES
// =====================================================

export interface ExportRequest {
  type: 'workflows' | 'tasks' | 'communications' | 'documents';
  format: 'csv' | 'xlsx' | 'pdf' | 'json';
  filters?: WorkflowFilters | TaskFilters;
  columns?: string[];
  date_range?: {
    start: string;
    end: string;
  };
}

export interface ExportResponse {
  export_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  download_url?: string;
  created_at: string;
  expires_at: string;
}

// =====================================================
// WEBHOOK API TYPES
// =====================================================

export interface WebhookPayload {
  event: string;
  workflow_id?: string;
  task_id?: string;
  data: Record<string, any>;
  timestamp: string;
  signature: string;
}

export interface N8nWebhookRequest {
  workflow_id: string;
  step_id: string;
  status: 'started' | 'completed' | 'failed';
  result?: Record<string, any>;
  error?: string;
  metadata?: Record<string, any>;
}

// =====================================================
// UTILITY TYPES
// =====================================================

export type IncludeParam = string | string[];
export type SortParam = string;
export type OrderParam = 'asc' | 'desc';

export interface QueryParams {
  include?: IncludeParam;
  sort?: SortParam;
  order?: OrderParam;
  page?: number;
  limit?: number;
}

export interface BulkOperationRequest<T> {
  operation: 'create' | 'update' | 'delete';
  items: T[];
}

export interface BulkOperationResponse {
  successful: number;
  failed: number;
  errors?: Array<{
    index: number;
    error: string;
  }>;
}