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

// Zod validation schemas
export * from './schemas/taskExecutions';
export * from './schemas/workflows';
export * from './schemas/communications';

// Utility functions
export * from './utils/uuid-formatter';

// =====================================================
// SPECIFIC EXPORTS FOR COMMON USE CASES
// =====================================================

// Database types (for Supabase)
export type { Database, Tables, TablesInsert, TablesUpdate, Enums } from './types/database';

// Core workflow types
export type { Workflow, WorkflowTask, WorkflowFilters, WorkflowPagination } from './types/workflows';

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
} from './schemas/taskExecutions';

export type {
  TaskExecution,
  CreateTaskExecution,
  UpdateTaskExecution
} from './schemas/taskExecutions';

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
  CallDirection
} from './schemas/communications';

// =====================================================
// CONSTANTS
// =====================================================

export const SHARED_VERSION = '1.0.0';