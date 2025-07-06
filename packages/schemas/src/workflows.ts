import { z } from 'zod';

// Input schemas
export const GetWorkflowInput = z.object({
  id: z.string(),
  include: z.array(z.enum(['client', 'tasks', 'assigned_user'])).default([])
});

export const GetWorkflowsInput = z.object({
  workflow_type: z.enum(['HOA_ACQUISITION', 'MUNI_LIEN_SEARCH', 'PAYOFF_REQUEST']).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'AWAITING_REVIEW', 'BLOCKED', 'COMPLETED']).optional(),
  client_id: z.string().uuid().optional(),
  assigned_to: z.string().uuid().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  include: z.array(z.enum(['client', 'tasks', 'assigned_user'])).default([])
});

export const CreateWorkflowInput = z.object({
  workflow_type: z.enum(['HOA_ACQUISITION', 'MUNI_LIEN_SEARCH', 'PAYOFF_REQUEST']),
  client_id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  metadata: z.record(z.any()).default({}),
  due_date: z.string().optional(),
  created_by: z.string().uuid()
});

// Output schemas
export const Workflow = z.object({
  id: z.string(),
  workflow_type: z.enum(['HOA_ACQUISITION', 'MUNI_LIEN_SEARCH', 'PAYOFF_REQUEST']),
  title: z.string(),
  description: z.string().nullable(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'AWAITING_REVIEW', 'BLOCKED', 'COMPLETED']),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
  metadata: z.record(z.any()),
  created_by: z.string(),
  assigned_to: z.string().nullable(),
  client_id: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  completed_at: z.string().nullable(),
  due_date: z.string().nullable(),
  client: z.object({
    id: z.string(),
    name: z.string(),
    domain: z.string().nullable()
  }).optional(),
  tasks: z.array(z.any()).optional(),
  assigned_user: z.object({
    id: z.string(),
    full_name: z.string(),
    email: z.string()
  }).optional()
});

export const WorkflowListResponse = z.object({
  data: z.array(Workflow),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number()
  })
});

// Type exports
export type GetWorkflowInput = z.infer<typeof GetWorkflowInput>;
export type GetWorkflowsInput = z.infer<typeof GetWorkflowsInput>;
export type CreateWorkflowInput = z.infer<typeof CreateWorkflowInput>;
export type Workflow = z.infer<typeof Workflow>;
export type WorkflowListResponse = z.infer<typeof WorkflowListResponse>;