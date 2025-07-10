// Workflow and related types for frontend components

export interface WorkflowData {
  id: string;
  workflow_type: 'PAYOFF' | 'HOA_ACQUISITION' | 'MUNI_LIEN_SEARCH';
  title: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'AWAITING_REVIEW' | 'COMPLETED' | 'BLOCKED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  created_at: string;
  updated_at: string;
  due_date: string | null;
  human_readable_id: string;
  metadata?: {
    property_address?: string;
    borrower_name?: string;
    loan_number?: string;
    closing_date?: string;
    [key: string]: string | number | boolean | null | undefined;
  };
  clients?: {
    id: string;
    name: string;
    domain?: string;
  };
  assigned_user?: {
    id: string;
    full_name: string;
    email?: string;
  };
  task_executions?: TaskExecution[];
  tasks?: TaskExecution[]; // Alias for task_executions
}

export interface TaskExecution {
  id: string;
  workflow_id: string;
  title: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'AWAITING_REVIEW' | 'COMPLETED' | 'FAILED';
  executor_type: 'AI' | 'HIL';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  sequence_order: number;
  task_type: string;
  agent_name?: string;
  assigned_agent?: string;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  due_date?: string;
  execution_time_ms?: number;
  retry_count?: number;
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