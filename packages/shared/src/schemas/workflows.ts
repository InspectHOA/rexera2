import { z } from 'zod';
import { WORKFLOW_STATUSES, PRIORITY_LEVELS, SUPPORTED_WORKFLOW_TYPES } from '../enums';

// Core workflow schema based on database structure
export const WorkflowSchema = z.object({
  id: z.string().uuid(),
  workflow_type: z.enum(['MUNI_LIEN_SEARCH', 'HOA_ACQUISITION', 'PAYOFF_REQUEST']),
  client_id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable().optional(),
  status: z.enum(WORKFLOW_STATUSES),
  priority: z.enum(PRIORITY_LEVELS),
  metadata: z.record(z.any()).default({}),
  created_by: z.string().uuid().nullable().optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  completed_at: z.string().datetime().nullable().optional(),
  due_date: z.string().datetime().nullable().optional(),
  n8n_execution_id: z.string().nullable().optional(),
});

// Create workflow request schema
export const CreateWorkflowSchema = z.object({
  workflow_type: z.enum(['MUNI_LIEN_SEARCH', 'HOA_ACQUISITION', 'PAYOFF_REQUEST']),
  client_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  priority: z.enum(PRIORITY_LEVELS).default('NORMAL'),
  metadata: z.record(z.any()).default({}),
  due_date: z.string().datetime().optional(),
  created_by: z.string().uuid().optional(),
});

// Update workflow schema (partial update)
export const UpdateWorkflowSchema = WorkflowSchema.pick({
  title: true,
  description: true,
  status: true,
  priority: true,
  metadata: true,
  assigned_to: true,
  due_date: true,
  completed_at: true,
}).partial();

// Workflow filters for queries
export const WorkflowFiltersSchema = z.object({
  workflow_type: z.enum(['MUNI_LIEN_SEARCH', 'HOA_ACQUISITION', 'PAYOFF_REQUEST']).optional(),
  status: z.enum(WORKFLOW_STATUSES).optional(),
  client_id: z.string().uuid().optional(),
  assigned_to: z.string().uuid().optional(),
  priority: z.enum(PRIORITY_LEVELS).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  include: z.string().optional(),
  sortBy: z.enum(['created_at', 'updated_at', 'due_date', 'status', 'workflow_type', 'title', 'client_id', 'interrupt_count']).optional(),
  sortDirection: z.enum(['asc', 'desc']).optional(),
});

// Extended workflow with relationships
export const WorkflowWithRelationsSchema = WorkflowSchema.extend({
  client: z.object({
    id: z.string().uuid(),
    name: z.string(),
    domain: z.string().optional(),
  }).optional(),
  clients: z.object({
    id: z.string().uuid(),
    name: z.string(),
    domain: z.string().optional(),
  }).optional(), // Deprecated: kept for backward compatibility
  assigned_user: z.object({
    id: z.string().uuid(),
    full_name: z.string(),
    email: z.string().email().optional(),
  }).optional(),
  task_executions: z.array(z.any()).optional(), // Use TaskExecutionSchema when imported
  tasks: z.array(z.any()).optional(), // Alias for task_executions
});

// Response schemas
export const WorkflowListResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(WorkflowWithRelationsSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(), 
    total: z.number(),
    totalPages: z.number(),
  }),
});

export const WorkflowResponseSchema = z.object({
  success: z.literal(true),
  data: WorkflowWithRelationsSchema,
});

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  details: z.string().optional(),
});

// Type exports
export type Workflow = z.infer<typeof WorkflowSchema>;
export type CreateWorkflow = z.infer<typeof CreateWorkflowSchema>;
export type UpdateWorkflow = z.infer<typeof UpdateWorkflowSchema>;
export type WorkflowFilters = z.infer<typeof WorkflowFiltersSchema>;
export type WorkflowWithRelations = z.infer<typeof WorkflowWithRelationsSchema>;
export type WorkflowListResponse = z.infer<typeof WorkflowListResponseSchema>;
export type WorkflowResponse = z.infer<typeof WorkflowResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;