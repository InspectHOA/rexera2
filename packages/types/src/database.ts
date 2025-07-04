/**
 * Database types for Rexera 2.0
 * Generated from the PostgreSQL schema definition
 */

import type {
  UserType,
  WorkflowType,
  WorkflowStatus,
  TaskStatus,
  ExecutorType,
  EmailDirection,
  EmailStatus,
  ThreadStatus,
  CallDirection,
  CounterpartyType,
  WorkflowCounterpartyStatus,
  InvoiceStatus,
  PriorityLevel,
  SlaTrackingStatus,
  AlertLevel
} from './enums';

// PaginationParams available from utilities if needed

// =====================================================
// 2. CORE USER AND CLIENT MANAGEMENT
// =====================================================

export interface Client {
  id: string;
  name: string;
  domain?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_type: UserType;
  email: string;
  full_name?: string;
  role: string;
  company_id?: string;
  created_at: string;
  updated_at: string;
}

// =====================================================
// 3. WORKFLOW AND TASK MANAGEMENT
// =====================================================

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
}

export interface Task {
  id: string;
  workflow_id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  executor_type: ExecutorType;
  assigned_to?: string;
  priority: PriorityLevel;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  due_date?: string;
}

export interface TaskDependency {
  id: string;
  dependent_task_id: string;
  prerequisite_task_id: string;
  created_at: string;
}

export interface TaskExecution {
  id: string;
  task_id: string;
  executor_id?: string;
  execution_data: Record<string, any>;
  result_data?: Record<string, any>;
  started_at: string;
  completed_at?: string;
  status: TaskStatus;
}

// =====================================================
// 4. COMMUNICATION SYSTEM
// =====================================================

export interface Communication {
  id: string;
  workflow_id?: string;
  task_id?: string;
  thread_id?: string;
  sender_id?: string;
  recipient_email?: string;
  subject?: string;
  body?: string;
  communication_type: 'email' | 'phone' | 'sms' | 'internal_note';
  direction?: EmailDirection | CallDirection;
  status?: EmailStatus;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface EmailMetadata {
  id: string;
  communication_id: string;
  message_id?: string;
  in_reply_to?: string;
  references?: string[];
  attachments?: Record<string, any>[];
  headers?: Record<string, any>;
  created_at: string;
}

export interface PhoneMetadata {
  id: string;
  communication_id: string;
  phone_number?: string;
  duration_seconds?: number;
  call_recording_url?: string;
  transcript?: string;
  created_at: string;
}

export interface Thread {
  id: string;
  workflow_id?: string;
  task_id?: string;
  subject?: string;
  status: ThreadStatus;
  participant_emails: string[];
  created_at: string;
  updated_at: string;
}

// =====================================================
// 5. COUNTERPARTY MANAGEMENT
// =====================================================

export interface Counterparty {
  id: string;
  name: string;
  type: CounterpartyType;
  email?: string;
  phone?: string;
  address?: string;
  contact_info: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface WorkflowCounterparty {
  id: string;
  workflow_id: string;
  counterparty_id: string;
  role: string;
  status: WorkflowCounterpartyStatus;
  contact_priority: number;
  last_contacted_at?: string;
  created_at: string;
  updated_at: string;
}

// =====================================================
// 6. DOCUMENT MANAGEMENT
// =====================================================

export interface Document {
  id: string;
  workflow_id?: string;
  task_id?: string;
  filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  document_type?: string;
  tags: string[];
  metadata: Record<string, any>;
  deliverable_data?: Record<string, any>;
  version: number;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

// =====================================================
// 7. AI AGENT SYSTEM
// =====================================================

export interface Agent {
  id: string;
  name: string;
  type: string;
  description?: string;
  capabilities: string[];
  api_endpoint: string;
  configuration: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AgentExecution {
  id: string;
  agent_id: string;
  workflow_id?: string;
  task_id?: string;
  execution_data: Record<string, any>;
  result_data?: Record<string, any>;
  confidence_score?: number;
  execution_time_ms?: number;
  cost_cents?: number;
  started_at: string;
  completed_at?: string;
  status: TaskStatus;
}

export interface AgentPerformanceMetric {
  id: string;
  agent_id: string;
  metric_type: string;
  metric_value: number;
  measurement_date: string;
  created_at: string;
}

// =====================================================
// 8. SLA AND TRACKING SYSTEM
// =====================================================

export interface SlaDefinition {
  id: string;
  workflow_type: WorkflowType;
  task_type?: string;
  client_id?: string;
  hours_to_complete: number;
  alert_hours_before: number[];
  is_business_hours_only: boolean;
  created_at: string;
  updated_at: string;
}

export interface SlaTracking {
  id: string;
  workflow_id?: string;
  task_id?: string;
  sla_definition_id: string;
  start_time: string;
  due_time: string;
  completed_time?: string;
  status: SlaTrackingStatus;
  alert_level: AlertLevel;
  created_at: string;
  updated_at: string;
}

export interface SlaAlert {
  id: string;
  sla_tracking_id: string;
  alert_level: AlertLevel;
  message: string;
  notified_users: string[];
  created_at: string;
  resolved_at?: string;
}

// =====================================================
// 9. HIL ASSIGNMENT AND INTERVENTION
// =====================================================

export interface HilAssignment {
  id: string;
  workflow_id?: string;
  task_id?: string;
  assigned_to: string;
  assignment_type: 'approval' | 'review' | 'intervention' | 'escalation';
  priority: PriorityLevel;
  notes?: string;
  created_at: string;
  resolved_at?: string;
}

export interface HilIntervention {
  id: string;
  workflow_id?: string;
  task_id?: string;
  intervened_by: string;
  intervention_type: string;
  reason: string;
  action_taken: string;
  result?: string;
  created_at: string;
}

// =====================================================
// 10. FINANCIAL TRACKING
// =====================================================

export interface Invoice {
  id: string;
  workflow_id?: string;
  client_id: string;
  invoice_number: string;
  status: InvoiceStatus;
  line_items: Record<string, any>[];
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  issued_date: string;
  due_date: string;
  paid_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Cost {
  id: string;
  workflow_id?: string;
  task_id?: string;
  agent_execution_id?: string;
  cost_type: string;
  amount_cents: number;
  description?: string;
  metadata: Record<string, any>;
  created_at: string;
}

// =====================================================
// 11. AUDIT AND LOGGING
// =====================================================

export interface AuditEvent {
  id: string;
  event_type: string;
  user_id?: string;
  workflow_id?: string;
  task_id?: string;
  resource_type: string;
  resource_id: string;
  changes: Record<string, any>;
  metadata: Record<string, any>;
  created_at: string;
}

// =====================================================
// 12. UTILITY TYPES
// =====================================================

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface TimestampedEntity extends BaseEntity {
  created_at: string;
  updated_at: string;
}

export interface SoftDeletable {
  deleted_at?: string;
}

// Database insert types (omit generated fields)
export type ClientInsert = Omit<Client, 'id' | 'created_at' | 'updated_at'>;
export type WorkflowInsert = Omit<Workflow, 'id' | 'created_at' | 'updated_at'>;
export type TaskInsert = Omit<Task, 'id' | 'created_at' | 'updated_at'>;
export type CommunicationInsert = Omit<Communication, 'id' | 'created_at' | 'updated_at'>;
export type DocumentInsert = Omit<Document, 'id' | 'created_at' | 'updated_at'>;

// Database update types (omit immutable fields)
export type ClientUpdate = Partial<Omit<Client, 'id' | 'created_at'>>;
export type WorkflowUpdate = Partial<Omit<Workflow, 'id' | 'created_at'>>;
export type TaskUpdate = Partial<Omit<Task, 'id' | 'created_at'>>;
export type CommunicationUpdate = Partial<Omit<Communication, 'id' | 'created_at'>>;
export type DocumentUpdate = Partial<Omit<Document, 'id' | 'created_at'>>;

// AgentPerformanceMetrics is imported from agents.ts

// Database query filters
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

export interface TaskFilters {
  workflow_id?: string;
  status?: TaskStatus;
  executor_type?: ExecutorType;
  assigned_to?: string;
  priority?: PriorityLevel;
  created_after?: string;
  created_before?: string;
  due_after?: string;
  due_before?: string;
}

// PaginationParams is imported from utilities.ts

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  links?: {
    first?: string;
    previous?: string;
    next?: string;
    last?: string;
  };
}