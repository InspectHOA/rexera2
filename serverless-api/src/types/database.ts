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
  parent_note_id?: string;
  is_resolved?: boolean;
  resolved_at?: string;
  resolved_by?: string;
}

export interface HilNoteUpdate {
  content?: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  mentions?: string[];
  is_resolved?: boolean;
  resolved_at?: string | null;
  resolved_by?: string | null;
  updated_at?: string;
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
  n8n_status?: string;
  n8n_started_at?: string;
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
  agent_id?: string | null;
  title: string;
  description?: string | null;
  sequence_order?: number;
  task_type: string;
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'INTERRUPT' | 'COMPLETED' | 'FAILED';
  interrupt_type?: 'MISSING_DOCUMENT' | 'PAYMENT_REQUIRED' | 'CLIENT_CLARIFICATION' | 'MANUAL_VERIFICATION' | null;
  executor_type: 'AI' | 'HIL';
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  input_data?: Record<string, any>;
  output_data?: Record<string, any> | null;
  error_message?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  execution_time_ms?: number | null;
  retry_count?: number;
  sla_hours?: number;
  sla_due_at?: string | null;
  sla_status?: 'ON_TIME' | 'AT_RISK' | 'BREACHED';
}

export interface TaskExecutionUpdate {
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'INTERRUPT' | 'COMPLETED' | 'FAILED';
  executor_type?: 'AI' | 'HIL';
  started_at?: string | null;
  completed_at?: string | null;
  execution_time_ms?: number | null;
  input_data?: Record<string, any> | null;
  output_data?: Record<string, any> | null;
  error_message?: string | null;
  metadata?: Record<string, any> | null;
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
  actor_type: 'human' | 'agent' | 'system';
  actor_id: string;
  actor_name?: string;
  event_type: 'workflow_management' | 'task_execution' | 'task_intervention' | 'sla_management' | 'user_authentication' | 'document_management' | 'communication' | 'counterparty_management' | 'system_operation';
  action: 'create' | 'read' | 'update' | 'delete' | 'execute' | 'approve' | 'reject' | 'login' | 'logout';
  resource_type: 'workflow' | 'task_execution' | 'user_profile' | 'client' | 'agent' | 'document' | 'communication' | 'notification' | 'counterparty';
  resource_id: string;
  workflow_id?: string;
  client_id?: string;
  event_data?: Record<string, any>;
  created_at?: string;
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

export interface CounterpartyContactInsert {
  counterparty_id: string;
  role: 'primary' | 'billing' | 'legal' | 'operations' | 'board_member' | 'property_manager' | 'loan_processor' | 'underwriter' | 'escrow_officer' | 'clerk' | 'assessor' | 'collector' | 'customer_service' | 'technical' | 'other';
  name: string;
  title?: string;
  department?: string;
  email?: string;
  phone?: string;
  mobile_phone?: string;
  fax?: string;
  extension?: string;
  is_primary?: boolean;
  is_active?: boolean;
  preferred_contact_method?: 'email' | 'phone' | 'mobile' | 'fax' | 'website' | 'any';
  preferred_contact_time?: string;
  notes?: string;
}

export interface CounterpartyContactUpdate {
  role?: 'primary' | 'billing' | 'legal' | 'operations' | 'board_member' | 'property_manager' | 'loan_processor' | 'underwriter' | 'escrow_officer' | 'clerk' | 'assessor' | 'collector' | 'customer_service' | 'technical' | 'other';
  name?: string;
  title?: string;
  department?: string;
  email?: string;
  phone?: string;
  mobile_phone?: string;
  fax?: string;
  extension?: string;
  is_primary?: boolean;
  is_active?: boolean;
  preferred_contact_method?: 'email' | 'phone' | 'mobile' | 'fax' | 'website' | 'any';
  preferred_contact_time?: string;
  notes?: string;
  updated_at?: string;
}