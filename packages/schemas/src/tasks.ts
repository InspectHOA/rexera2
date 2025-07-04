import { z } from 'zod';

// Input schemas
export const GetTasksInput = z.object({
  workflow_id: z.string().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED', 'AWAITING_REVIEW']).optional(),
  executor_type: z.enum(['AI', 'HIL']).optional(),
  assigned_to: z.string().uuid().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  include: z.array(z.enum(['assigned_user', 'executions', 'dependencies', 'workflow'])).default([])
});

export const CreateTaskInput = z.object({
  workflow_id: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  executor_type: z.enum(['AI', 'HIL']),
  assigned_to: z.string().uuid().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  metadata: z.record(z.any()).default({}),
  due_date: z.string().optional()
});

// Output schemas
export const Task = z.object({
  id: z.string(),
  workflow_id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED', 'AWAITING_REVIEW']),
  executor_type: z.enum(['AI', 'HIL']),
  assigned_to: z.string().nullable(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
  metadata: z.record(z.any()),
  created_at: z.string(),
  updated_at: z.string(),
  completed_at: z.string().nullable(),
  due_date: z.string().nullable(),
  workflow: z.object({
    id: z.string(),
    title: z.string(),
    workflow_type: z.string(),
    client_id: z.string(),
    status: z.string()
  }).optional(),
  assigned_user: z.object({
    id: z.string(),
    full_name: z.string(),
    email: z.string()
  }).optional()
});

export const TaskListResponse = z.object({
  data: z.array(Task),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number()
  })
});

// Type exports
export type GetTasksInput = z.infer<typeof GetTasksInput>;
export type CreateTaskInput = z.infer<typeof CreateTaskInput>;
export type Task = z.infer<typeof Task>;
export type TaskListResponse = z.infer<typeof TaskListResponse>;