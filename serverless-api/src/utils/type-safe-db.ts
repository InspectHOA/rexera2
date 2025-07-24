/**
 * Type-safe database operations to prevent runtime errors
 */

import { createServerClient } from './database';
import type { 
  HilNotificationInsert, 
  CommunicationInsert, 
  HilNoteInsert,
  HilNoteUpdate,
  WorkflowInsert,
  WorkflowUpdate,
  CounterpartyInsert,
  CounterpartyUpdate,
  TaskExecutionInsert,
  TaskExecutionUpdate,
  NotificationUpdate,
  WorkflowCounterpartyInsert,
  WorkflowCounterpartyUpdate,
  AuditEventInsert,
  EmailMetadataInsert,
  PhoneMetadataInsert,
  DocumentInsert,
  UserProfileInsert,
  UserPreferencesInsert,
  UserPreferencesUpdate
} from '../types/database';

export async function insertNotifications(notifications: HilNotificationInsert[]) {
  const supabase = createServerClient();
  
  // Validate all notifications have required fields and valid enum values
  const validTypes = ['WORKFLOW_UPDATE', 'TASK_INTERRUPT', 'HIL_MENTION', 'CLIENT_MESSAGE_RECEIVED', 'COUNTERPARTY_MESSAGE_RECEIVED', 'SLA_WARNING', 'AGENT_FAILURE'];
  const validPriorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
  
  for (const notification of notifications) {
    if (!notification.user_id || !notification.type || !notification.priority || !notification.title || !notification.message) {
      throw new Error('Missing required notification fields');
    }
    
    if (!validTypes.includes(notification.type)) {
      throw new Error(`Invalid notification type: ${notification.type}`);
    }
    
    if (!validPriorities.includes(notification.priority)) {
      throw new Error(`Invalid notification priority: ${notification.priority}`);
    }
  }
  
  const { data, error } = await supabase
    .from('hil_notifications')
    .insert(notifications)
    .select();
    
  if (error) {
    console.error('Database error inserting notifications:', error);
    throw error;
  }
  
  return data;
}

// Communication operations
export async function updateCommunication(id: string, updates: { status?: string; metadata?: Record<string, any> }) {
  const supabase = createServerClient();
  
  // Validate enum values if provided
  if (updates.status) {
    const validStatuses = ['SENT', 'DELIVERED', 'READ', 'BOUNCED', 'FAILED'];
    if (!validStatuses.includes(updates.status)) {
      throw new Error(`Invalid communication status: ${updates.status}`);
    }
  }
  
  const { data, error } = await supabase
    .from('communications')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    console.error('Database error updating communication:', error);
    throw error;
  }
  
  return data;
}

export async function deleteCommunication(id: string) {
  const supabase = createServerClient();
  
  const { error } = await supabase
    .from('communications')
    .delete()
    .eq('id', id);
    
  if (error) {
    console.error('Database error deleting communication:', error);
    throw error;
  }
  
  return true;
}

export async function insertCommunication(communication: CommunicationInsert) {
  const supabase = createServerClient();
  
  // Validate required fields
  if (!communication.body || !communication.communication_type) {
    throw new Error('Missing required communication fields');
  }
  
  // Validate enum values
  const validTypes = ['email', 'phone', 'sms', 'client_chat'];
  const validDirections = ['INBOUND', 'OUTBOUND'];
  const validStatuses = ['SENT', 'DELIVERED', 'READ', 'BOUNCED', 'FAILED'];
  
  if (!validTypes.includes(communication.communication_type)) {
    throw new Error(`Invalid communication type: ${communication.communication_type}`);
  }
  
  if (communication.direction && !validDirections.includes(communication.direction)) {
    throw new Error(`Invalid communication direction: ${communication.direction}`);
  }
  
  if (communication.status && !validStatuses.includes(communication.status)) {
    throw new Error(`Invalid communication status: ${communication.status}`);
  }
  
  const { data, error } = await supabase
    .from('communications')
    .insert(communication)
    .select()
    .single();
    
  if (error) {
    console.error('Database error inserting communication:', error);
    throw error;
  }
  
  return data;
}

export async function insertHilNote(note: HilNoteInsert) {
  const supabase = createServerClient();
  
  // Validate required fields
  if (!note.workflow_id || !note.author_id || !note.content || !note.priority) {
    throw new Error('Missing required HIL note fields');
  }
  
  // Validate enum values
  const validPriorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
  if (!validPriorities.includes(note.priority)) {
    throw new Error(`Invalid HIL note priority: ${note.priority}`);
  }
  
  const { data, error } = await supabase
    .from('hil_notes')
    .insert(note)
    .select(`
      *,
      author:user_profiles!hil_notes_author_id_fkey (
        id,
        full_name,
        email
      )
    `)
    .single();
    
  if (error) {
    console.error('Database error inserting HIL note:', error);
    throw error;
  }
  
  return data;
}

export async function updateHilNote(id: string, updates: HilNoteUpdate) {
  const supabase = createServerClient();
  
  // Validate enum values if provided
  if (updates.priority) {
    const validPriorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
    if (!validPriorities.includes(updates.priority)) {
      throw new Error(`Invalid HIL note priority: ${updates.priority}`);
    }
  }
  
  const { data, error } = await supabase
    .from('hil_notes')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      author:user_profiles!hil_notes_author_id_fkey (
        id,
        full_name,
        email
      )
    `)
    .single();
    
  if (error) {
    console.error('Database error updating HIL note:', error);
    throw error;
  }
  
  return data;
}

export async function deleteHilNote(id: string) {
  const supabase = createServerClient();
  
  const { error } = await supabase
    .from('hil_notes')
    .delete()
    .eq('id', id);
    
  if (error) {
    console.error('Database error deleting HIL note:', error);
    throw error;
  }
  
  return true;
}

// Workflows
export async function insertWorkflow(workflow: WorkflowInsert) {
  const supabase = createServerClient();
  
  if (!workflow.workflow_type || !workflow.client_id) {
    throw new Error('Missing required workflow fields: workflow_type, client_id');
  }
  
  // Validate enum values
  const validWorkflowTypes = ['MUNI_LIEN_SEARCH', 'HOA_ACQUISITION', 'PAYOFF_REQUEST'];
  const validStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'WAITING_FOR_CLIENT', 'COMPLETED'];
  
  if (!validWorkflowTypes.includes(workflow.workflow_type)) {
    throw new Error(`Invalid workflow type: ${workflow.workflow_type}`);
  }
  
  if (workflow.status && !validStatuses.includes(workflow.status)) {
    throw new Error(`Invalid workflow status: ${workflow.status}`);
  }
  
  const { data, error } = await supabase
    .from('workflows')
    .insert(workflow)
    .select()
    .single();
    
  if (error) {
    console.error('Database error inserting workflow:', error);
    throw error;
  }
  
  return data;
}

export async function updateWorkflow(id: string, updates: WorkflowUpdate) {
  const supabase = createServerClient();
  
  // Validate enum values if provided
  if (updates.workflow_type) {
    const validWorkflowTypes = ['MUNI_LIEN_SEARCH', 'HOA_ACQUISITION', 'PAYOFF_REQUEST'];
    if (!validWorkflowTypes.includes(updates.workflow_type)) {
      throw new Error(`Invalid workflow type: ${updates.workflow_type}`);
    }
  }
  
  if (updates.status) {
    const validStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'WAITING_FOR_CLIENT', 'COMPLETED'];
    if (!validStatuses.includes(updates.status)) {
      throw new Error(`Invalid workflow status: ${updates.status}`);
    }
  }
  
  const { data, error } = await supabase
    .from('workflows')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    console.error('Database error updating workflow:', error);
    throw error;
  }
  
  return data;
}

// Counterparties
export async function insertCounterparty(counterparty: CounterpartyInsert) {
  const supabase = createServerClient();
  
  if (!counterparty.name || !counterparty.type) {
    throw new Error('Missing required counterparty fields: name, type');
  }
  
  // Validate enum values
  const validTypes = ['hoa', 'lender', 'municipality', 'utility', 'tax_authority'];
  if (!validTypes.includes(counterparty.type)) {
    throw new Error(`Invalid counterparty type: ${counterparty.type}`);
  }
  
  const { data, error } = await supabase
    .from('counterparties')
    .insert(counterparty)
    .select()
    .single();
    
  if (error) {
    console.error('Database error inserting counterparty:', error);
    throw error;
  }
  
  return data;
}

export async function updateCounterparty(id: string, updates: CounterpartyUpdate) {
  const supabase = createServerClient();
  
  // Validate enum values if provided
  if (updates.type) {
    const validTypes = ['hoa', 'lender', 'municipality', 'utility', 'tax_authority'];
    if (!validTypes.includes(updates.type)) {
      throw new Error(`Invalid counterparty type: ${updates.type}`);
    }
  }
  
  const { data, error } = await supabase
    .from('counterparties')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    console.error('Database error updating counterparty:', error);
    throw error;
  }
  
  return data;
}

export async function deleteCounterparty(id: string) {
  const supabase = createServerClient();
  
  const { error } = await supabase
    .from('counterparties')
    .delete()
    .eq('id', id);
    
  if (error) {
    console.error('Database error deleting counterparty:', error);
    throw error;
  }
  
  return true;
}

// Task Executions
export async function insertTaskExecution(taskExecution: TaskExecutionInsert) {
  const supabase = createServerClient();
  
  if (!taskExecution.workflow_id || !taskExecution.title || !taskExecution.task_type || !taskExecution.executor_type) {
    throw new Error('Missing required task execution fields: workflow_id, title, task_type, executor_type');
  }
  
  // Validate enum values if provided
  if (taskExecution.status) {
    const validStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'INTERRUPT', 'COMPLETED', 'FAILED'];
    if (!validStatuses.includes(taskExecution.status)) {
      throw new Error(`Invalid task execution status: ${taskExecution.status}`);
    }
  }
  
  const validExecutorTypes = ['AI', 'HIL'];
  if (!validExecutorTypes.includes(taskExecution.executor_type)) {
    throw new Error(`Invalid executor type: ${taskExecution.executor_type}`);
  }
  
  if (taskExecution.priority) {
    const validPriorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
    if (!validPriorities.includes(taskExecution.priority)) {
      throw new Error(`Invalid priority: ${taskExecution.priority}`);
    }
  }
  
  if (taskExecution.sla_status) {
    const validSlaStatuses = ['ON_TIME', 'AT_RISK', 'BREACHED'];
    if (!validSlaStatuses.includes(taskExecution.sla_status)) {
      throw new Error(`Invalid SLA status: ${taskExecution.sla_status}`);
    }
  }
  
  const { data, error } = await supabase
    .from('task_executions')
    .insert(taskExecution)
    .select()
    .single();
    
  if (error) {
    console.error('Database error inserting task execution:', error);
    throw error;
  }
  
  return data;
}

export async function updateTaskExecution(id: string, updates: TaskExecutionUpdate) {
  const supabase = createServerClient();
  
  // Validate enum values if provided
  if (updates.status) {
    const validStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'INTERRUPT', 'COMPLETED', 'FAILED'];
    if (!validStatuses.includes(updates.status)) {
      throw new Error(`Invalid task execution status: ${updates.status}`);
    }
  }
  
  if (updates.executor_type) {
    const validExecutorTypes = ['AI', 'HIL'];
    if (!validExecutorTypes.includes(updates.executor_type)) {
      throw new Error(`Invalid executor type: ${updates.executor_type}`);
    }
  }
  
  const { data, error } = await supabase
    .from('task_executions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    console.error('Database error updating task execution:', error);
    throw error;
  }
  
  return data;
}

export async function insertTaskExecutions(taskExecutions: TaskExecutionInsert[]) {
  const supabase = createServerClient();
  
  // Validate all task executions
  for (const taskExecution of taskExecutions) {
    if (!taskExecution.workflow_id || !taskExecution.title || !taskExecution.task_type || !taskExecution.executor_type) {
      throw new Error('Missing required task execution fields: workflow_id, title, task_type, executor_type');
    }
    
    // Validate enum values if provided
    if (taskExecution.status) {
      const validStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'INTERRUPT', 'COMPLETED', 'FAILED'];
      if (!validStatuses.includes(taskExecution.status)) {
        throw new Error(`Invalid task execution status: ${taskExecution.status}`);
      }
    }
    
    const validExecutorTypes = ['AI', 'HIL'];
    if (!validExecutorTypes.includes(taskExecution.executor_type)) {
      throw new Error(`Invalid executor type: ${taskExecution.executor_type}`);
    }
    
    if (taskExecution.priority) {
      const validPriorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
      if (!validPriorities.includes(taskExecution.priority)) {
        throw new Error(`Invalid priority: ${taskExecution.priority}`);
      }
    }
    
    if (taskExecution.sla_status) {
      const validSlaStatuses = ['ON_TIME', 'AT_RISK', 'BREACHED'];
      if (!validSlaStatuses.includes(taskExecution.sla_status)) {
        throw new Error(`Invalid SLA status: ${taskExecution.sla_status}`);
      }
    }
  }
  
  const { data, error } = await supabase
    .from('task_executions')
    .insert(taskExecutions)
    .select();
    
  if (error) {
    console.error('Database error inserting task executions:', error);
    throw error;
  }
  
  return data;
}

export async function updateTaskExecutionByWorkflowAndType(workflowId: string, taskType: string, updates: TaskExecutionUpdate) {
  const supabase = createServerClient();
  
  // Validate enum values if provided
  if (updates.status) {
    const validStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'INTERRUPT', 'COMPLETED', 'FAILED'];
    if (!validStatuses.includes(updates.status)) {
      throw new Error(`Invalid task execution status: ${updates.status}`);
    }
  }
  
  if (updates.executor_type) {
    const validExecutorTypes = ['AI', 'HIL'];
    if (!validExecutorTypes.includes(updates.executor_type)) {
      throw new Error(`Invalid executor type: ${updates.executor_type}`);
    }
  }
  
  const { data, error } = await supabase
    .from('task_executions')
    .update(updates)
    .eq('workflow_id', workflowId)
    .eq('task_type', taskType)
    .select(`
      *,
      workflows!workflow_id(id, title, client_id),
      agents!agent_id(id, name, type)
    `)
    .single();
    
  if (error) {
    console.error('Database error updating task execution by workflow and type:', error);
    throw error;
  }
  
  return data;
}

// Notifications
export async function updateNotification(id: string, updates: NotificationUpdate) {
  const supabase = createServerClient();
  
  const { data, error } = await supabase
    .from('hil_notifications')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    console.error('Database error updating notification:', error);
    throw error;
  }
  
  return data;
}

export async function updateNotificationForUser(id: string, userId: string, updates: NotificationUpdate) {
  const supabase = createServerClient();
  
  const { data, error } = await supabase
    .from('hil_notifications')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
    
  if (error) {
    console.error('Database error updating notification for user:', error);
    throw error;
  }
  
  return data;
}

export async function bulkMarkNotificationsAsRead(userId: string) {
  const supabase = createServerClient();
  
  const { data, error } = await supabase
    .from('hil_notifications')
    .update({ 
      read: true, 
      read_at: new Date().toISOString() 
    })
    .eq('user_id', userId)
    .eq('read', false)
    .select();
    
  if (error) {
    console.error('Database error bulk updating notifications:', error);
    throw error;
  }
  
  return data;
}

export async function deleteNotification(id: string) {
  const supabase = createServerClient();
  
  const { error } = await supabase
    .from('hil_notifications')
    .delete()
    .eq('id', id);
    
  if (error) {
    console.error('Database error deleting notification:', error);
    throw error;
  }
  
  return true;
}

export async function deleteNotificationForUser(id: string, userId: string) {
  const supabase = createServerClient();
  
  const { error } = await supabase
    .from('hil_notifications')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
    
  if (error) {
    console.error('Database error deleting notification for user:', error);
    throw error;
  }
  
  return true;
}

// Workflow Counterparties
export async function insertWorkflowCounterparty(workflowCounterparty: WorkflowCounterpartyInsert) {
  const supabase = createServerClient();
  
  if (!workflowCounterparty.workflow_id || !workflowCounterparty.counterparty_id) {
    throw new Error('Missing required workflow counterparty fields: workflow_id, counterparty_id');
  }
  
  const { data, error } = await supabase
    .from('workflow_counterparties')
    .insert(workflowCounterparty)
    .select()
    .single();
    
  if (error) {
    console.error('Database error inserting workflow counterparty:', error);
    throw error;
  }
  
  return data;
}

export async function updateWorkflowCounterparty(id: string, updates: WorkflowCounterpartyUpdate) {
  const supabase = createServerClient();
  
  // Validate enum values if provided
  if (updates.status) {
    const validStatuses = ['PENDING', 'CONTACTED', 'RESPONDED', 'COMPLETED'];
    if (!validStatuses.includes(updates.status)) {
      throw new Error(`Invalid workflow counterparty status: ${updates.status}`);
    }
  }
  
  const { data, error } = await supabase
    .from('workflow_counterparties')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    console.error('Database error updating workflow counterparty:', error);
    throw error;
  }
  
  return data;
}

export async function deleteWorkflowCounterparty(id: string) {
  const supabase = createServerClient();
  
  const { error } = await supabase
    .from('workflow_counterparties')
    .delete()
    .eq('id', id);
    
  if (error) {
    console.error('Database error deleting workflow counterparty:', error);
    throw error;
  }
  
  return true;
}

// Audit Events
export async function insertAuditEvent(auditEvent: AuditEventInsert) {
  const supabase = createServerClient();
  
  if (!auditEvent.actor_id || !auditEvent.actor_type || !auditEvent.action || !auditEvent.resource_type) {
    throw new Error('Missing required audit event fields: actor_id, actor_type, action, resource_type');
  }
  
  const { data, error } = await supabase
    .from('audit_events')
    .insert(auditEvent)
    .select()
    .single();
    
  if (error) {
    console.error('Database error inserting audit event:', error);
    throw error;
  }
  
  return data;
}

export async function insertAuditEvents(auditEvents: AuditEventInsert[]) {
  const supabase = createServerClient();
  
  // Validate all events
  for (const event of auditEvents) {
    if (!event.actor_id || !event.actor_type || !event.action || !event.resource_type) {
      throw new Error('Missing required audit event fields in batch insert');
    }
  }
  
  const { data, error } = await supabase
    .from('audit_events')
    .insert(auditEvents)
    .select();
    
  if (error) {
    console.error('Database error inserting audit events:', error);
    throw error;
  }
  
  return data;
}

// Email Metadata
export async function insertEmailMetadata(emailMetadata: EmailMetadataInsert) {
  const supabase = createServerClient();
  
  if (!emailMetadata.communication_id) {
    throw new Error('Missing required email metadata field: communication_id');
  }
  
  const { data, error } = await supabase
    .from('email_metadata')
    .insert(emailMetadata)
    .select()
    .single();
    
  if (error) {
    console.error('Database error inserting email metadata:', error);
    throw error;
  }
  
  return data;
}

// Phone Metadata
export async function insertPhoneMetadata(phoneMetadata: PhoneMetadataInsert) {
  const supabase = createServerClient();
  
  if (!phoneMetadata.communication_id) {
    throw new Error('Missing required phone metadata field: communication_id');
  }
  
  const { data, error } = await supabase
    .from('phone_metadata')
    .insert(phoneMetadata)
    .select()
    .single();
    
  if (error) {
    console.error('Database error inserting phone metadata:', error);
    throw error;
  }
  
  return data;
}

// Documents
export async function insertDocument(document: DocumentInsert) {
  const supabase = createServerClient();
  
  if (!document.name || !document.file_path || !document.file_size || !document.mime_type || !document.uploaded_by) {
    throw new Error('Missing required document fields: name, file_path, file_size, mime_type, uploaded_by');
  }
  
  const { data, error } = await supabase
    .from('documents')
    .insert(document)
    .select()
    .single();
    
  if (error) {
    console.error('Database error inserting document:', error);
    throw error;
  }
  
  return data;
}

// User Profiles
export async function insertUserProfile(userProfile: UserProfileInsert) {
  const supabase = createServerClient();
  
  if (!userProfile.id || !userProfile.user_type || !userProfile.email) {
    throw new Error('Missing required user profile fields: id, user_type, email');
  }
  
  const { data, error } = await supabase
    .from('user_profiles')
    .insert(userProfile)
    .select()
    .single();
    
  if (error) {
    console.error('Database error inserting user profile:', error);
    throw error;
  }
  
  return data;
}

// User Preferences
export async function insertUserPreferences(userPreferences: UserPreferencesInsert) {
  const supabase = createServerClient();
  
  if (!userPreferences.user_id) {
    throw new Error('Missing required user preferences field: user_id');
  }
  
  const { data, error } = await supabase
    .from('user_preferences')
    .insert(userPreferences)
    .select()
    .single();
    
  if (error) {
    console.error('Database error inserting user preferences:', error);
    throw error;
  }
  
  return data;
}

export async function updateUserPreferences(userId: string, updates: UserPreferencesUpdate) {
  const supabase = createServerClient();
  
  const { data, error } = await supabase
    .from('user_preferences')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();
    
  if (error) {
    console.error('Database error updating user preferences:', error);
    throw error;
  }
  
  return data;
}