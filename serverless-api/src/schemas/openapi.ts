/**
 * OpenAPI Schema Definitions
 * 
 * Shared schemas for request/response validation and OpenAPI documentation
 */

import { z } from 'zod';

// ============================================================================
// Base Schemas
// ============================================================================

export const ErrorResponseSchema = z.object({
  success: z.boolean().default(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    timestamp: z.string().datetime()
  })
});

export const SuccessResponseSchema = z.object({
  success: z.boolean().default(true),
  message: z.string(),
  timestamp: z.string().datetime()
});

// ============================================================================
// Workflow Schemas
// ============================================================================

export const WorkflowSchema = z.object({
  id: z.string().uuid(),
  workflow_type: z.enum(['MUNI_LIEN_SEARCH', 'HOA_ACQUISITION', 'PAYOFF_REQUEST']),
  client_id: z.string().uuid(),
  title: z.string(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'INTERRUPT', 'BLOCKED', 'WAITING_FOR_CLIENT', 'COMPLETED']),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  client: z.object({
    id: z.string().uuid(),
    company_name: z.string(),
    primary_contact_name: z.string().optional(),
    primary_contact_email: z.string().email().optional()
  }).optional(),
  tasks: z.array(z.object({
    id: z.string().uuid(),
    task_name: z.string(),
    status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'INTERRUPT', 'COMPLETED', 'FAILED']),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime()
  })).optional()
});

export const CreateWorkflowSchema = z.object({
  workflow_type: z.enum(['MUNI_LIEN_SEARCH', 'HOA_ACQUISITION', 'PAYOFF_REQUEST']),
  client_id: z.string().uuid(),
  title: z.string().min(1).max(255),
  created_by: z.string().uuid()
});

export const WorkflowListResponseSchema = z.object({
  success: z.boolean().default(true),
  data: z.array(WorkflowSchema),
  pagination: z.object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1).max(100),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0)
  })
});

// ============================================================================
// Query Parameter Schemas
// ============================================================================

export const WorkflowQuerySchema = z.object({
  workflow_type: z.enum(['MUNI_LIEN_SEARCH', 'HOA_ACQUISITION', 'PAYOFF_REQUEST']).optional(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'INTERRUPT', 'BLOCKED', 'WAITING_FOR_CLIENT', 'COMPLETED']).optional(),
  include: z.string().optional().describe('Comma-separated list: client,tasks'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['created_at', 'updated_at', 'title', 'status']).default('created_at'),
  sortDirection: z.enum(['asc', 'desc']).default('desc')
});

export const WorkflowParamsSchema = z.object({
  id: z.string().describe('Workflow ID (UUID or human-readable ID)')
});

// ============================================================================
// Task Execution Schemas
// ============================================================================

export const TaskExecutionSchema = z.object({
  id: z.string().uuid(),
  workflow_id: z.string().uuid(),
  task_name: z.string(),
  status: z.enum(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED']),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  started_at: z.string().datetime().optional(),
  completed_at: z.string().datetime().optional(),
  error_message: z.string().optional()
});

export const TaskExecutionQuerySchema = z.object({
  workflowId: z.string().uuid(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'INTERRUPT', 'COMPLETED', 'FAILED']).optional()
});

export const UpdateTaskExecutionSchema = z.object({
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'INTERRUPT', 'COMPLETED', 'FAILED']),
  error_message: z.string().optional()
});

// ============================================================================
// Agent Schemas
// ============================================================================

export const AgentSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  agent_type: z.enum(['MUNI_SEARCH', 'HOA_RESEARCH', 'PAYOFF_PROCESSOR']),
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});