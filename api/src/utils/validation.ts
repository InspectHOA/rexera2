/**
 * @fileoverview Input validation schemas and utilities for Rexera 2.0.
 * 
 * This module provides comprehensive input validation using Zod schemas for
 * the Rexera real estate workflow automation platform. It ensures data
 * integrity, type safety, and consistent validation across all API endpoints
 * and business logic operations.
 * 
 * Validation Architecture:
 * - Zod-based schema validation with type inference
 * - Reusable validation schemas for common data structures
 * - Centralized validation logic for consistency
 * - Comprehensive error handling and reporting
 * 
 * Key Capabilities:
 * - Type-safe input validation with compile-time checking
 * - Reusable schemas for workflows, tasks, and pagination
 * - Automatic data coercion and transformation
 * - Detailed validation error reporting
 * - Business rule enforcement through schema constraints
 * 
 * Business Context:
 * - Ensures data integrity for workflow and task management
 * - Prevents invalid data from entering the system
 * - Enforces business rules and constraints
 * - Provides consistent validation across all interfaces
 * 
 * Security Considerations:
 * - Input sanitization and validation prevents injection attacks
 * - UUID validation ensures proper identifier formats
 * - Length limits prevent buffer overflow and DoS attacks
 * - Enum validation restricts values to allowed options
 * 
 * Integration Points:
 * - tRPC procedure input validation
 * - REST API request validation
 * - Database operation validation
 * - Business logic constraint enforcement
 * 
 * @module ValidationUtils
 * @requires zod - Schema validation library
 */

import { z } from 'zod';

/**
 * Pagination validation schema for list operations.
 * 
 * Business Context:
 * - Standardizes pagination parameters across all list endpoints
 * - Prevents performance issues from excessive page sizes
 * - Ensures consistent pagination behavior for client applications
 * - Supports efficient database query optimization
 * 
 * Validation Rules:
 * - page: Minimum value of 1, defaults to 1
 * - limit: Range of 1-100 results, defaults to 20
 * - Automatic coercion from string to number for URL parameters
 * - Prevents negative values and zero-based pagination confusion
 * 
 * Performance Considerations:
 * - Maximum limit of 100 prevents excessive database load
 * - Default limit of 20 balances performance and usability
 * - Page validation prevents invalid database offset calculations
 * - Coercion handles URL parameter string conversion
 * 
 * @schema paginationSchema
 */
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

/**
 * Workflow creation validation schema.
 * 
 * Business Context:
 * - Validates all required fields for workflow creation
 * - Enforces business rules for workflow types and priorities
 * - Ensures proper client association and audit trail
 * - Supports metadata flexibility for workflow-specific data
 * 
 * Validation Rules:
 * - workflow_type: Must be one of the three core Rexera workflows
 * - client_id: Must be valid UUID for proper client association
 * - title: Required, 1-255 characters for human readability
 * - description: Optional detailed description
 * - priority: Enum with default NORMAL for proper scheduling
 * - metadata: Flexible record for workflow-specific data
 * - due_date: Optional ISO datetime for SLA management
 * - created_by: Required UUID for audit trail and accountability
 * 
 * Business Rules:
 * - HOA: HOA Acquisition workflow type
 * - LIEN: Municipal Lien Search workflow type
 * - PAYOFF: Payoff Request workflow type
 * - Priority levels support workload management and scheduling
 * - Client association ensures data isolation and security
 * 
 * @schema workflowCreateSchema
 */
export const workflowCreateSchema = z.object({
  workflow_type: z.enum(['HOA', 'LIEN', 'PAYOFF']),
  client_id: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  metadata: z.record(z.any()).default({}),
  due_date: z.string().datetime().optional(),
  created_by: z.string().uuid(),
});

/**
 * Workflow update validation schema.
 * 
 * Business Context:
 * - Validates partial updates to existing workflows
 * - Supports workflow state transitions and progress tracking
 * - Enables assignment changes and priority adjustments
 * - Maintains audit trail through optional completion timestamps
 * 
 * Validation Rules:
 * - All fields optional for partial updates
 * - Status enum enforces valid workflow states
 * - Priority changes support dynamic workload management
 * - Assignment changes enable workflow delegation
 * - Metadata updates support workflow evolution
 * - Completion timestamp for workflow lifecycle tracking
 * 
 * Workflow States:
 * - PENDING: Initial state, awaiting processing
 * - IN_PROGRESS: Active workflow execution
 * - AWAITING_REVIEW: Human review required
 * - BLOCKED: Workflow blocked by external dependencies
 * - COMPLETED: Workflow successfully completed
 * 
 * @schema workflowUpdateSchema
 */
export const workflowUpdateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'AWAITING_REVIEW', 'BLOCKED', 'COMPLETED']).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  assigned_to: z.string().uuid().optional(),
  metadata: z.record(z.any()).optional(),
  due_date: z.string().datetime().optional(),
  completed_at: z.string().datetime().optional(),
});

/**
 * Task creation validation schema.
 * 
 * Business Context:
 * - Validates task creation within workflow context
 * - Enforces executor type constraints for proper task routing
 * - Supports task assignment and priority management
 * - Enables flexible task metadata for execution context
 * 
 * Validation Rules:
 * - workflow_id: Required UUID for proper workflow association
 * - title: Required, 1-255 characters for task identification
 * - description: Optional detailed task instructions
 * - executor_type: AI or HIL (Human-in-the-Loop) for routing
 * - assigned_to: Optional UUID for specific task assignment
 * - priority: Enum with default NORMAL for task scheduling
 * - metadata: Flexible record for task-specific data
 * - due_date: Optional ISO datetime for task deadlines
 * 
 * Executor Types:
 * - AI: Tasks for AI agent processing and automation
 * - HIL: Tasks requiring human intervention and decision-making
 * 
 * Task Management:
 * - Workflow association ensures proper task context
 * - Priority levels enable task scheduling and resource allocation
 * - Assignment supports task delegation and responsibility tracking
 * - Metadata provides execution context and configuration
 * 
 * @schema taskCreateSchema
 */
export const taskCreateSchema = z.object({
  workflow_id: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  executor_type: z.enum(['AI', 'HIL']),
  assigned_to: z.string().uuid().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  metadata: z.record(z.any()).default({}),
  due_date: z.string().datetime().optional(),
});

/**
 * Task update validation schema.
 * 
 * Business Context:
 * - Validates partial updates to existing tasks
 * - Supports task state transitions and progress tracking
 * - Enables task reassignment and priority adjustments
 * - Maintains task lifecycle and completion tracking
 * 
 * Validation Rules:
 * - All fields optional for partial updates
 * - Status enum enforces valid task states
 * - Priority changes support dynamic task management
 * - Assignment changes enable task delegation
 * - Metadata updates support task evolution
 * - Completion timestamp for task lifecycle tracking
 * 
 * Task States:
 * - PENDING: Initial state, awaiting execution
 * - IN_PROGRESS: Active task execution
 * - COMPLETED: Task successfully completed
 * - FAILED: Task execution failed
 * - BLOCKED: Task blocked by dependencies or issues
 * 
 * @schema taskUpdateSchema
 */
export const taskUpdateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'BLOCKED']).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  assigned_to: z.string().uuid().optional(),
  metadata: z.record(z.any()).optional(),
  due_date: z.string().datetime().optional(),
  completed_at: z.string().datetime().optional(),
});

/**
 * Workflow action validation schema.
 * 
 * Business Context:
 * - Validates workflow state transition actions
 * - Enforces valid workflow lifecycle operations
 * - Supports workflow control and management
 * - Enables automated and manual workflow operations
 * 
 * Validation Rules:
 * - action: Must be one of the defined workflow actions
 * - Enum validation prevents invalid state transitions
 * - Action-based workflow control and automation
 * 
 * Workflow Actions:
 * - start: Begin workflow execution
 * - pause: Temporarily halt workflow execution
 * - resume: Continue paused workflow execution
 * - complete: Mark workflow as completed
 * - cancel: Cancel workflow execution
 * - retry: Retry failed workflow execution
 * 
 * @schema workflowActionSchema
 */
export const workflowActionSchema = z.object({
  action: z.enum(['start', 'pause', 'resume', 'complete', 'cancel', 'retry']),
});

/**
 * Generic validation helper function with comprehensive error handling.
 * 
 * Business Context:
 * - Provides consistent validation across all application layers
 * - Enables type-safe validation with detailed error reporting
 * - Supports both success and error cases with discriminated unions
 * - Facilitates debugging and troubleshooting validation issues
 * 
 * Validation Process:
 * - Attempts to parse data against provided schema
 * - Returns success result with parsed and validated data
 * - Returns error result with detailed validation messages
 * - Handles Zod validation errors with path and message details
 * 
 * Error Handling:
 * - ZodError: Detailed field-level validation errors
 * - Generic errors: Fallback error handling
 * - Error message formatting for client consumption
 * - Path-based error reporting for field identification
 * 
 * Type Safety:
 * - Generic type parameter for schema inference
 * - Discriminated union return type for type safety
 * - Compile-time type checking for validated data
 * - Runtime validation with type guarantees
 * 
 * Usage Patterns:
 * - API endpoint input validation
 * - Business logic constraint checking
 * - Database operation validation
 * - Configuration validation
 * 
 * @template T - Inferred type from the Zod schema
 * @param schema - Zod schema for validation
 * @param data - Data to validate against schema
 * @returns Discriminated union of success or error result
 */
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { success: false, error: errorMessages.join(', ') };
    }
    return { success: false, error: 'Validation failed' };
  }
}