/**
 * Rexera 2.0 Shared Package
 * 
 * This package contains:
 * ✅ Shared types, enums, and constants
 * ✅ Zod validation schemas
 * ✅ Database type definitions
 * ✅ External service interfaces
 */

// =====================================================
// CORE EXPORTS
// =====================================================

// Enums and constants
export * from './enums';

// TypeScript types
export * from './types/workflows';
export * from './types/database';
export * from './types/api';
export * from './types/errors';
export * from './types/notifications';

// Zod validation schemas
export * from './schemas/task-executions';
export * from './schemas/workflows';
export * from './schemas/communications';
export * from './schemas/documents';
export * from './schemas/counterparties';
export * from './schemas/audit-events';
export * from './schemas/hil-notes';
export * from './schemas/notifications';
export * from './schemas/users';

// Utility functions
export * from './utils/uuid-formatter';
export * from './utils/audit-logger';

// =====================================================
// SPECIFIC EXPORTS FOR COMMON USE CASES
// =====================================================

// Database types (for Supabase)
export type { Database, Tables, TablesInsert, TablesUpdate, Enums } from './types/database';

// Core workflow types
export type { Workflow, WorkflowTask, WorkflowFilters, WorkflowPagination } from './types/workflows';

// Notification types
export type { 
  HilNotification, 
  HilNotificationInsert, 
  HilNotificationUpdate,
  UnifiedNotification, 
  NotificationSettings, 
  NotificationFilters,
  NotificationType,
  NotificationSortField,
  UseUnifiedNotificationsReturn,
  UseNotificationsTableStateReturn
} from './types/notifications';

// API types (most commonly used)
export type { 
  ApiResponse, 
  ApiSuccessResponse, 
  ApiErrorResponse, 
  PaginationMeta,
  PaginatedResponse,
  PaginationQuery,
  ListQuery 
} from './types/api';

// Error classes
export { 
  ApiError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError,
  WorkflowError,
  N8nIntegrationError,
  createApiError,
  createValidationError,
  createNotFoundError,
  isApiError,
  getErrorCode,
  getErrorStatus,
  API_ERROR_CODES
} from './types/errors';

// Task execution schemas (most commonly used)
export {
  TaskExecutionSchema,
  CreateTaskExecutionSchema, 
  UpdateTaskExecutionSchema
} from './schemas/task-executions';

export type {
  TaskExecution,
  CreateTaskExecution,
  UpdateTaskExecution
} from './schemas/task-executions';

// Communications schemas
export {
  CommunicationSchema,
  CreateCommunicationSchema,
  UpdateCommunicationSchema,
  CommunicationFiltersSchema,
  ReplyCommunicationSchema,
  ForwardCommunicationSchema,
  EmailThreadSchema,
  CommunicationTypeSchema,
  EmailDirectionSchema,
  EmailStatusSchema,
  ClientChatStatusSchema,
  ExternalPlatformTypeSchema,
  CallDirectionSchema
} from './schemas/communications';

export type {
  Communication,
  CreateCommunication,
  UpdateCommunication,
  CommunicationFilters,
  ReplyCommunication,
  ForwardCommunication,
  EmailThread,
  CommunicationType,
  EmailDirection,
  EmailStatus,
  ClientChatStatus,
  ExternalPlatformType,
  CallDirection
} from './schemas/communications';

// Documents schemas
export {
  DocumentSchema,
  CreateDocumentSchema,
  UpdateDocumentSchema,
  DocumentFiltersSchema,
  CreateDocumentVersionSchema,
  DocumentWithRelationsSchema,
  DocumentType,
  DocumentStatus,
  DOCUMENT_TYPES,
  DOCUMENT_STATUSES
} from './schemas/documents';

export type {
  Document,
  CreateDocument,
  UpdateDocument,
  DocumentFilters,
  CreateDocumentVersion,
  DocumentWithRelations
} from './schemas/documents';

// Audit events schemas
export {
  AuditEventSchema,
  CreateAuditEventSchema,
  AuditEventQuerySchema,
  WorkflowAuditEventSchema,
  TaskAuditEventSchema,
  SlaAuditEventSchema,
  AuthAuditEventSchema
} from './schemas/audit-events';

export type {
  AuditEvent,
  CreateAuditEvent,
  AuditEventQuery,
  WorkflowAuditEvent,
  TaskAuditEvent,
  SlaAuditEvent,
  AuthAuditEvent
} from './schemas/audit-events';

// HIL Notes schemas
export {
  HilNoteSchema,
  CreateHilNoteSchema,
  UpdateHilNoteSchema,
  HilNoteFiltersSchema,
  ReplyHilNoteSchema,
  PriorityLevelSchema
} from './schemas/hil-notes';

export type {
  HilNote,
  CreateHilNote,
  UpdateHilNote,
  HilNoteFilters,
  ReplyHilNote,
  PriorityLevel
} from './schemas/hil-notes';

// Counterparties schemas
export {
  CounterpartySchema,
  CreateCounterpartySchema,
  UpdateCounterpartySchema,
  CounterpartyFiltersSchema,
  WorkflowCounterpartySchema,
  CreateWorkflowCounterpartySchema,
  UpdateWorkflowCounterpartySchema,
  WorkflowCounterpartyFiltersSchema,
  CounterpartyTypeSchema,
  WorkflowCounterpartyStatusSchema
} from './schemas/counterparties';

export type {
  Counterparty,
  CreateCounterpartyRequest,
  UpdateCounterpartyRequest,
  CounterpartyFilters,
  WorkflowCounterparty,
  CreateWorkflowCounterpartyRequest,
  UpdateWorkflowCounterpartyRequest,
  WorkflowCounterpartyFilters,
  CounterpartyType,
  WorkflowCounterpartyStatus
} from './schemas/counterparties';

// Notifications schemas
export {
  NotificationSchema,
  NotificationFiltersSchema,
  CreateNotificationSchema,
  UpdateNotificationSchema
} from './schemas/notifications';

export type {
  Notification,
  CreateNotification,
  UpdateNotification
} from './schemas/notifications';

// Audit logger utilities
export {
  BaseAuditLogger,
  AuditHelpers
} from './utils/audit-logger';

export type {
  IAuditLogger,
  AuditLoggerConfig
} from './utils/audit-logger';

// =====================================================
// CONSTANTS
// =====================================================

export const SHARED_VERSION = '1.0.0';