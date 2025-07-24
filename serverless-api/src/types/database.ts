/**
 * Type-safe database operations
 * This ensures we catch schema mismatches at compile time
 */

// Database insert types that match the actual schema
export interface HilNotificationInsert {
  user_id: string;
  type: 'WORKFLOW_UPDATE' | 'TASK_INTERRUPT' | 'HIL_MENTION' | 'CLIENT_MESSAGE_RECEIVED' | 'COUNTERPARTY_MESSAGE_RECEIVED' | 'SLA_WARNING' | 'AGENT_FAILURE';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  title: string;
  message: string;
  action_url?: string;
  metadata?: Record<string, any>;
  read?: boolean;
  read_at?: string;
}

export interface CommunicationInsert {
  workflow_id?: string;
  thread_id?: string;
  sender_id?: string;
  recipient_email?: string | null;
  subject?: string | null;
  body?: string;
  communication_type: 'email' | 'phone' | 'sms' | 'client_chat';
  direction?: 'INBOUND' | 'OUTBOUND';
  status?: 'SENT' | 'DELIVERED' | 'READ' | 'BOUNCED' | 'FAILED';
  metadata?: Record<string, any>;
}

export interface HilNoteInsert {
  workflow_id: string;
  author_id: string;
  content: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  mentions?: string[];
  parent_id?: string;
  is_resolved?: boolean;
  resolved_at?: string;
  resolved_by?: string;
}

export interface WorkflowInsert {
  workflow_type: 'MUNI_LIEN_SEARCH' | 'HOA_ACQUISITION' | 'PAYOFF_REQUEST';
  client_id: string;
  custom_identifier?: string;
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'BLOCKED' | 'WAITING_FOR_CLIENT' | 'COMPLETED';
  metadata?: Record<string, any>;
  sla_due_date?: string;
}

export interface WorkflowUpdate {
  workflow_type?: 'MUNI_LIEN_SEARCH' | 'HOA_ACQUISITION' | 'PAYOFF_REQUEST';
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'BLOCKED' | 'WAITING_FOR_CLIENT' | 'COMPLETED';
  metadata?: Record<string, any>;
  sla_due_date?: string;
}

export interface CounterpartyInsert {
  name: string;
  type: 'hoa' | 'lender' | 'municipality' | 'utility' | 'tax_authority';
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  notes?: string;
  is_active?: boolean;
  metadata?: Record<string, any>;
}

export interface CounterpartyUpdate {
  name?: string;
  type?: 'hoa' | 'lender' | 'municipality' | 'utility' | 'tax_authority';
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  notes?: string;
  is_active?: boolean;
  metadata?: Record<string, any>;
}

export interface TaskExecutionInsert {
  workflow_id: string;
  task_id: string;
  agent_id?: string;
  executor_type: 'AI' | 'HIL';
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'INTERRUPT' | 'COMPLETED' | 'FAILED';
  started_at?: string;
  completed_at?: string;
  execution_time_ms?: number;
  input_data?: Record<string, any>;
  output_data?: Record<string, any>;
  error_message?: string;
  metadata?: Record<string, any>;
}

export interface TaskExecutionUpdate {
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'INTERRUPT' | 'COMPLETED' | 'FAILED';
  started_at?: string;
  completed_at?: string;
  execution_time_ms?: number;
  input_data?: Record<string, any>;
  output_data?: Record<string, any>;
  error_message?: string;
  metadata?: Record<string, any>;
}

export interface NotificationUpdate {
  read?: boolean;
  read_at?: string | null;
}

export interface WorkflowCounterpartyInsert {
  workflow_id: string;
  counterparty_id: string;
  status?: 'PENDING' | 'CONTACTED' | 'RESPONDED' | 'COMPLETED';
  assigned_at?: string;
  notes?: string;
}

export interface WorkflowCounterpartyUpdate {
  status?: 'PENDING' | 'CONTACTED' | 'RESPONDED' | 'COMPLETED';
  notes?: string;
}

export interface AuditEventInsert {
  actor_id: string;
  actor_type: 'user' | 'system' | 'api';
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
}

export interface EmailMetadataInsert {
  communication_id: string;
  message_id?: string;
  in_reply_to?: string;
  email_references?: string[];
  attachments?: any[];
  headers?: Record<string, any>;
}

export interface PhoneMetadataInsert {
  communication_id: string;
  phone_number?: string;
  duration_seconds?: number;
  call_recording_url?: string;
  transcript?: string;
}

export interface DocumentInsert {
  name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  workflow_id?: string;
  task_execution_id?: string;
  uploaded_by: string;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface UserProfileInsert {
  id: string;
  user_type: 'client_user' | 'hil_user';
  email: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  timezone?: string;
  company_id?: string;
  role?: string;
  metadata?: Record<string, any>;
}

export interface UserPreferencesInsert {
  user_id: string;
  theme?: 'light' | 'dark' | 'system';
  notifications_enabled?: boolean;
  email_notifications?: boolean;
  preferences?: Record<string, any>;
}

export interface UserPreferencesUpdate {
  theme?: 'light' | 'dark' | 'system';
  notifications_enabled?: boolean;
  email_notifications?: boolean;
  preferences?: Record<string, any>;
}