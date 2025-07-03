/**
 * Rexera 2.0 Types
 * Main export file for all shared TypeScript types
 */

// Database types
export * from './database';

// API types  
export * from './api';

// Agent types
export * from './agents';

// Workflow types
export * from './workflows';

// Supabase types
export * from './supabase';
export type { Database } from './supabase';

// Re-export commonly used types for convenience
export type {
  // Core entities
  Workflow,
  Task,
  Communication,
  Document,
  Counterparty,
  Agent,
  Client,
  UserProfile,
  
  // Enums
  WorkflowType,
  WorkflowStatus,
  TaskStatus,
  PriorityLevel,
  
  // Performance metrics
  AgentPerformanceMetrics
} from './database';

export type {
  // Agent types
  AgentType,
  AgentTaskRequest,
  AgentTaskResponse
} from './agents';

export type {
  // API types
  ApiResponse,
  ApiError,
  WorkflowResponse,
  TaskResponse
} from './api';

export type {
  // Workflow types
  WorkflowDefinition,
  WorkflowExecution,
  WorkflowTemplate
} from './workflows';

export type {
  // API request/response types
  CreateWorkflowRequest,
  UpdateWorkflowRequest,
  CreateTaskRequest,
  UpdateTaskRequest,
  WorkflowQueryParams,
  TaskQueryParams,
  
  // Dashboard types
  DashboardStatsResponse,
  InterruptQueueResponse,
  ActivityFeedResponse,
  
  // Real-time types
  WebSocketMessage,
  SubscriptionRequest
} from './api';

export type {
  // Agent execution types
  AgentExecutionContext,
  AgentExecutionResult,
  AgentCoordinationPlan,
  AgentHandoffRequest,
  
  // Agent performance types
  AgentHealthCheck,
  AgentConfiguration,
  
  // Workflow-specific agent types
  MunicipalLienAgentTask,
  HoaAcquisitionAgentTask,
  PayoffRequestAgentTask
} from './agents';

export type {
  // Workflow definition types
  WorkflowTaskDefinition,
  TaskDependency,
  TaskExecutionConfig,
  HilInterventionConfig,
  
  // Coordination types
  AgentCoordinationStrategy,
  ErrorHandlingStrategy,
  
  // Execution types
  WorkflowMetrics,
  WorkflowError,
  HilIntervention,
  
  // Dual-layer types
  TechnicalLayer,
  BusinessLayer,
  
  // Monitoring types
  WorkflowMonitoring,
  WorkflowAlert,
  WorkflowEvent
} from './workflows';

// Version and metadata
export const TYPES_VERSION = '1.0.0';
export const SCHEMA_VERSION = '2.0.0';

// Common constants
export const SUPPORTED_WORKFLOW_TYPES = [
  'MUNI_LIEN_SEARCH',
  'HOA_ACQUISITION', 
  'PAYOFF'
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