// =====================================================
// n8n Integration Types
// TypeScript types for n8n API responses and webhook events
// =====================================================

// n8n API Response Types
export interface N8nExecutionResponse {
  id: string;
  workflowId: string;
  mode: 'manual' | 'trigger' | 'webhook' | 'retry';
  startedAt: string;
  stoppedAt?: string;
  finished: boolean;
  retryOf?: string;
  retrySuccessId?: string;
  status: 'new' | 'running' | 'success' | 'error' | 'canceled' | 'crashed' | 'waiting';
  data?: {
    resultData?: {
      runData?: Record<string, any>;
      lastNodeExecuted?: string;
      error?: {
        message: string;
        stack?: string;
        name?: string;
      };
    };
  };
}

export interface N8nWorkflowResponse {
  id: string;
  name: string;
  active: boolean;
  nodes: Array<{
    id: string;
    name: string;
    type: string;
    position: [number, number];
    parameters?: Record<string, any>;
  }>;
  connections: Record<string, any>;
  settings?: Record<string, any>;
  staticData?: Record<string, any>;
  tags?: string[];
  versionId?: string;
  createdAt: string;
  updatedAt: string;
}

// n8n Webhook Event Types
export type N8nWebhookEventType = 
  | 'workflow_started'
  | 'task_assigned_to_agent'
  | 'agent_task_completed'
  | 'workflow_completed'
  | 'error_occurred';

export interface N8nWebhookEvent {
  eventType: N8nWebhookEventType;
  executionId: string;
  workflowId: string;
  timestamp: string;
  data: Record<string, any>;
}

export interface N8nWorkflowStartedEvent extends N8nWebhookEvent {
  eventType: 'workflow_started';
  data: {
    rexeraWorkflowId: string;
    workflowType: 'PAYOFF';
    clientId: string;
    metadata: Record<string, any>;
  };
}

export interface N8nTaskAssignedEvent extends N8nWebhookEvent {
  eventType: 'task_assigned_to_agent';
  data: {
    rexeraWorkflowId: string;
    taskId: string;
    agentName: string;
    taskType: string;
    taskData: Record<string, any>;
  };
}

export interface N8nAgentTaskCompletedEvent extends N8nWebhookEvent {
  eventType: 'agent_task_completed';
  data: {
    rexeraWorkflowId: string;
    taskId: string;
    agentName: string;
    result: Record<string, any>;
    status: 'success' | 'failed';
    error?: string;
  };
}

export interface N8nWorkflowCompletedEvent extends N8nWebhookEvent {
  eventType: 'workflow_completed';
  data: {
    rexeraWorkflowId: string;
    status: 'success' | 'failed';
    result: Record<string, any>;
    error?: string;
  };
}

export interface N8nErrorEvent extends N8nWebhookEvent {
  eventType: 'error_occurred';
  data: {
    rexeraWorkflowId: string;
    error: string;
    stack?: string;
    nodeId?: string;
    nodeName?: string;
  };
}

// n8n API Client Types
export interface N8nApiConfig {
  baseUrl: string;
  apiKey: string;
  webhookUrl: string;
}

export interface TriggerN8nWorkflowParams {
  workflowId: string;
  rexeraWorkflowId: string;
  workflowType: 'PAYOFF';
  clientId: string;
  metadata: Record<string, any>;
}

export interface N8nExecutionStatus {
  id: string;
  status: 'new' | 'running' | 'success' | 'error' | 'canceled' | 'crashed' | 'waiting';
  finished: boolean;
  startedAt: string;
  stoppedAt?: string;
  error?: {
    message: string;
    stack?: string;
  };
}

// Enhanced Workflow Types with n8n Integration
export interface WorkflowWithN8n {
  id: string;
  workflow_type: 'MUNI_LIEN_SEARCH' | 'HOA_ACQUISITION' | 'PAYOFF';
  client_id: string;
  title: string;
  description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'AWAITING_REVIEW' | 'BLOCKED' | 'COMPLETED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  metadata: Record<string, any>;
  created_by: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  due_date?: string;
  n8n_execution_id?: string;
}

// n8n Integration Error Types
export class N8nError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'N8nError';
  }
}

export class N8nApiError extends N8nError {
  constructor(message: string, statusCode: number, details?: Record<string, any>) {
    super(message, 'N8N_API_ERROR', statusCode, details);
    this.name = 'N8nApiError';
  }
}

export class N8nWebhookError extends N8nError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'N8N_WEBHOOK_ERROR', undefined, details);
    this.name = 'N8nWebhookError';
  }
}