/**
 * Shared enums for Rexera 2.0
 * These are used across the entire application for type safety
 */

// =====================================================
// CORE BUSINESS ENUMS
// =====================================================

export type UserType = 'client_user' | 'hil_user';

export type WorkflowType = 'MUNI_LIEN_SEARCH' | 'HOA_ACQUISITION' | 'PAYOFF_REQUEST';
/**
 * Workflow Status Definitions:
 * - NOT_STARTED: Workflow created but not yet started
 * - IN_PROGRESS: Workflow is actively being processed
 * - BLOCKED: Something prevents both agents and HIL from completing workflow
 * - WAITING_FOR_CLIENT: Workflow waiting for client response or action
 * - COMPLETED: Workflow successfully finished
 */
export type WorkflowStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'BLOCKED' | 'WAITING_FOR_CLIENT' | 'COMPLETED';

/**
 * Task Status Definitions:
 * - NOT_STARTED: Task created but not yet started
 * - IN_PROGRESS: Task is actively being processed
 * - INTERRUPT: Task requires human review or approval (replaces AWAITING_REVIEW)
 * - COMPLETED: Task successfully finished
 * - FAILED: Task failed and cannot proceed
 */
export type TaskStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'INTERRUPT' | 'COMPLETED' | 'FAILED';
export type ExecutorType = 'AI' | 'HIL';
export type SlaStatus = 'ON_TIME' | 'AT_RISK' | 'BREACHED';

export type EmailDirection = 'INBOUND' | 'OUTBOUND';
export type EmailStatus = 'SENT' | 'DELIVERED' | 'READ' | 'BOUNCED' | 'FAILED';
export type ThreadStatus = 'ACTIVE' | 'RESOLVED' | 'ARCHIVED';
export type CallDirection = 'INBOUND' | 'OUTBOUND';

export type CounterpartyType = 'hoa' | 'lender' | 'municipality' | 'utility' | 'tax_authority';
export type WorkflowCounterpartyStatus = 'PENDING' | 'CONTACTED' | 'RESPONDED' | 'COMPLETED';

export type InvoiceStatus = 'DRAFT' | 'FINALIZED' | 'PAID' | 'VOID';

export type PriorityLevel = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type NotificationType = 
  | 'WORKFLOW_UPDATE' 
  | 'TASK_INTERRUPT' 
  | 'HIL_MENTION' 
  | 'CLIENT_MESSAGE_RECEIVED' 
  | 'COUNTERPARTY_MESSAGE_RECEIVED' 
  | 'SLA_WARNING' 
  | 'AGENT_FAILURE';
export type SenderType = 'CLIENT' | 'INTERNAL';

export type SlaTrackingStatus = 'ACTIVE' | 'COMPLETED' | 'BREACHED' | 'PAUSED';
export type AlertLevel = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';

export type InterruptType = 'MISSING_DOCUMENT' | 'PAYMENT_REQUIRED' | 'CLIENT_CLARIFICATION' | 'MANUAL_VERIFICATION';

// =====================================================
// AGENT ENUMS
// =====================================================

export type AgentType = 'nina' | 'mia' | 'florian' | 'rex' | 'iris' | 'ria' | 'kosha' | 'cassy' | 'max' | 'corey';

// =====================================================
// CONSTANTS DERIVED FROM ENUMS
// =====================================================

export const SUPPORTED_WORKFLOW_TYPES = [
  'MUNI_LIEN_SEARCH',
  'HOA_ACQUISITION', 
  'PAYOFF_REQUEST'
] as const;

export const SUPPORTED_AGENT_TYPES = [
  'nina',
  'mia', 
  'florian',
  'rex',
  'iris',
  'ria',
  'kosha',
  'cassy',
  'max',
  'corey'
] as const;

export const PRIORITY_LEVELS = [
  'LOW',
  'NORMAL', 
  'HIGH',
  'URGENT'
] as const;

export const WORKFLOW_STATUSES = [
  'NOT_STARTED',
  'IN_PROGRESS',
  'BLOCKED',
  'WAITING_FOR_CLIENT',
  'COMPLETED'
] as const;

export const TASK_STATUSES = [
  'NOT_STARTED',
  'IN_PROGRESS',
  'INTERRUPT',
  'COMPLETED',
  'FAILED'
] as const;

// =====================================================
// AUDIT SYSTEM ENUMS
// =====================================================

/**
 * Actor types for audit events - who performed the action
 */
export type ActorType = 'human' | 'agent' | 'system';

/**
 * Audit action types - what was done
 */
export type AuditAction = 
  | 'create' 
  | 'read' 
  | 'update' 
  | 'delete' 
  | 'execute' 
  | 'approve' 
  | 'reject' 
  | 'login' 
  | 'logout';

/**
 * Event types for categorizing audit events
 */
export type AuditEventType =
  | 'workflow_management'
  | 'task_execution'
  | 'task_intervention'
  | 'sla_management'
  | 'user_authentication'
  | 'document_management'
  | 'communication'
  | 'system_operation';

/**
 * Resource types that can be audited
 */
export type AuditResourceType =
  | 'workflow'
  | 'task_execution'
  | 'user_profile'
  | 'client'
  | 'agent'
  | 'document'
  | 'communication'
  | 'notification'
  | 'counterparty';

export const AUDIT_ACTOR_TYPES = ['human', 'agent', 'system'] as const;

export const AUDIT_ACTIONS = [
  'create',
  'read', 
  'update',
  'delete',
  'execute',
  'approve',
  'reject',
  'login',
  'logout'
] as const;

export const AUDIT_EVENT_TYPES = [
  'workflow_management',
  'task_execution',
  'task_intervention', 
  'sla_management',
  'user_authentication',
  'document_management',
  'communication',
  'system_operation'
] as const;

export const AUDIT_RESOURCE_TYPES = [
  'workflow',
  'task_execution',
  'user_profile',
  'client',
  'agent',
  'document',
  'communication',
  'notification',
  'counterparty'
] as const;