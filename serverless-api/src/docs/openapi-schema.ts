/**
 * OpenAPI Schema Definition for Rexera API
 * 
 * Comprehensive API documentation using Hono OpenAPI
 */

import { createRoute, z } from '@hono/zod-openapi';

// ============================================================================
// SHARED SCHEMAS
// ============================================================================

const ErrorResponseSchema = z.object({
  success: z.boolean().default(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
    timestamp: z.string(),
    requestId: z.string().optional(),
  }),
});

const SuccessResponseSchema = z.object({
  success: z.boolean().default(true),
  data: z.any(),
  pagination: z.object({
    page: z.number(),
    limit: z.number(), 
    total: z.number(),
    totalPages: z.number(),
  }).optional(),
});

// ============================================================================
// WORKFLOW SCHEMAS
// ============================================================================

const WorkflowSchema = z.object({
  id: z.string().uuid(),
  workflow_type: z.enum(['MUNI_LIEN_SEARCH', 'HOA_ACQUISITION', 'PAYOFF_REQUEST']),
  client_id: z.string().uuid(),
  title: z.string(),
  description: z.string().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'AWAITING_REVIEW', 'BLOCKED', 'COMPLETED']),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
  metadata: z.record(z.any()).optional(),
  created_by: z.string().uuid(),
  assigned_to: z.string().uuid().optional(),
  due_date: z.string().datetime().optional(),
  completed_at: z.string().datetime().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  human_readable_id: z.number().optional(),
});

const CreateWorkflowSchema = z.object({
  workflow_type: z.enum(['MUNI_LIEN_SEARCH', 'HOA_ACQUISITION', 'PAYOFF_REQUEST']),
  client_id: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  metadata: z.record(z.any()).optional(),
  due_date: z.string().datetime().optional(),
  created_by: z.string().uuid(),
});

const WorkflowFiltersSchema = z.object({
  workflow_type: z.enum(['MUNI_LIEN_SEARCH', 'HOA_ACQUISITION', 'PAYOFF_REQUEST']).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'AWAITING_REVIEW', 'BLOCKED', 'COMPLETED']).optional(),
  client_id: z.string().uuid().optional(),
  assigned_to: z.string().uuid().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  include: z.string().optional(),
  sortBy: z.string().optional(),
  sortDirection: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================================
// TASK EXECUTION SCHEMAS
// ============================================================================

const TaskExecutionSchema = z.object({
  id: z.string().uuid(),
  workflow_id: z.string().uuid(),
  agent_id: z.string().uuid().optional(),
  title: z.string(),
  description: z.string().optional(),
  sequence_order: z.number(),
  task_type: z.string(),
  executor_type: z.enum(['AI', 'HIL']),
  status: z.enum(['PENDING', 'AWAITING_REVIEW', 'COMPLETED', 'FAILED']),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  input_data: z.record(z.any()).optional(),
  output_data: z.record(z.any()).optional(),
  assigned_to: z.string().uuid().optional(),
  started_at: z.string().datetime().optional(),
  completed_at: z.string().datetime().optional(),
  error_message: z.string().optional(),
  execution_time_ms: z.number().optional(),
  retry_count: z.number().default(0),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// ============================================================================
// AGENT SCHEMAS  
// ============================================================================

const AgentSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.string(),
  description: z.string().optional(),
  capabilities: z.array(z.string()),
  api_endpoint: z.string().url().optional(),
  configuration: z.record(z.any()),
  is_active: z.boolean().default(true),
  status: z.enum(['ONLINE', 'BUSY', 'OFFLINE', 'ERROR']).optional(),
  last_heartbeat: z.string().datetime().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// ============================================================================
// ROUTE DEFINITIONS
// ============================================================================

// Health Check Route
export const healthRoute = createRoute({
  method: 'get',
  path: '/api/health',
  summary: 'Health Check',
  description: 'Check API health status and get basic information',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean().default(true),
            message: z.string(),
            timestamp: z.string(),
            environment: z.string(),
            version: z.string(),
          }),
        },
      },
      description: 'API is healthy and operational',
    },
  },
  tags: ['System'],
});

// List Workflows Route
export const listWorkflowsRoute = createRoute({
  method: 'get',
  path: '/api/workflows',
  summary: 'List Workflows',
  description: 'Retrieve a paginated list of workflows with optional filtering',
  request: {
    query: WorkflowFiltersSchema,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean().default(true),
            data: z.array(WorkflowSchema),
            pagination: z.object({
              page: z.number(),
              limit: z.number(),
              total: z.number(),
              totalPages: z.number(),
            }),
          }),
        },
      },
      description: 'Successfully retrieved workflows',
    },
    401: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'Authentication required',
    },
  },
  tags: ['Workflows'],
});

// Create Workflow Route
export const createWorkflowRoute = createRoute({
  method: 'post',
  path: '/api/workflows',
  summary: 'Create Workflow',
  description: 'Create a new workflow instance',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateWorkflowSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean().default(true),
            data: WorkflowSchema,
          }),
        },
      },
      description: 'Workflow created successfully',
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'Invalid request data',
    },
    401: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'Authentication required',
    },
  },
  tags: ['Workflows'],
});

// Get Workflow by ID Route
export const getWorkflowRoute = createRoute({
  method: 'get',
  path: '/api/workflows/{id}',
  summary: 'Get Workflow',
  description: 'Retrieve a specific workflow by ID (UUID or human-readable ID)',
  request: {
    params: z.object({
      id: z.string().describe('Workflow ID (UUID) or human-readable ID (number)'),
    }),
    query: z.object({
      include: z.string().optional().describe('Comma-separated list of related entities to include (client, tasks, etc.)'),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean().default(true),
            data: WorkflowSchema,
          }),
        },
      },
      description: 'Successfully retrieved workflow',
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'Workflow not found',
    },
    401: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'Authentication required',
    },
  },
  tags: ['Workflows'],
});

// List Task Executions Route
export const listTaskExecutionsRoute = createRoute({
  method: 'get',
  path: '/api/task-executions',
  summary: 'List Task Executions',
  description: 'Retrieve task executions for a specific workflow',
  request: {
    query: z.object({
      workflowId: z.string().uuid().describe('Workflow ID to filter tasks'),
      include: z.string().optional().describe('Comma-separated list of related entities to include'),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean().default(true),
            data: z.array(TaskExecutionSchema),
          }),
        },
      },
      description: 'Successfully retrieved task executions',
    },
    401: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'Authentication required',
    },
  },
  tags: ['Task Executions'],
});

// List Agents Route
export const listAgentsRoute = createRoute({
  method: 'get',
  path: '/api/agents',
  summary: 'List Agents',
  description: 'Retrieve a list of all AI agents and their status',
  request: {
    query: z.object({
      is_active: z.coerce.boolean().optional().describe('Filter by active status'),
      type: z.string().optional().describe('Filter by agent type'),
      status: z.enum(['ONLINE', 'BUSY', 'OFFLINE', 'ERROR']).optional().describe('Filter by agent status'),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean().default(true),
            data: z.array(AgentSchema),
            pagination: z.object({
              page: z.number(),
              limit: z.number(), 
              total: z.number(),
              totalPages: z.number(),
            }),
          }),
        },
      },
      description: 'Successfully retrieved agents',
    },
    401: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'Authentication required',
    },
  },
  tags: ['Agents'],
});

// Export all schemas for reuse
export {
  WorkflowSchema,
  CreateWorkflowSchema,
  WorkflowFiltersSchema,
  TaskExecutionSchema,
  AgentSchema,
  ErrorResponseSchema,
  SuccessResponseSchema,
};