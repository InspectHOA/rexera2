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

// Zod validation schemas
export * from './schemas/taskExecutions';

// =====================================================
// SPECIFIC EXPORTS FOR COMMON USE CASES
// =====================================================

// Database types (for Supabase)
export type { Database, Tables, TablesInsert, TablesUpdate, Enums } from './types/database';

// Core workflow types
export type { Workflow, WorkflowTask, WorkflowFilters, WorkflowPagination } from './types/workflows';

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

// =====================================================
// CONSTANTS
// =====================================================

export const SHARED_VERSION = '1.0.0';