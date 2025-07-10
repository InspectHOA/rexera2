/**
 * Shared enums for Rexera 2.0
 * These are used across the entire application for type safety
 */

// =====================================================
// CORE BUSINESS ENUMS
// =====================================================

export type UserType = 'client_user' | 'hil_user';

export type WorkflowType = 'MUNI_LIEN_SEARCH' | 'HOA_ACQUISITION' | 'PAYOFF_REQUEST';
export type WorkflowStatus = 'PENDING' | 'IN_PROGRESS' | 'AWAITING_REVIEW' | 'BLOCKED' | 'COMPLETED';
export type TaskStatus = 'PENDING' | 'AWAITING_REVIEW' | 'COMPLETED' | 'FAILED';
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
  'PENDING',
  'IN_PROGRESS',
  'AWAITING_REVIEW', 
  'BLOCKED',
  'COMPLETED'
] as const;

export const TASK_STATUSES = [
  'PENDING',
  'AWAITING_REVIEW',
  'COMPLETED',
  'FAILED'
] as const;