import { z } from 'zod';

// Common validation schemas
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

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

export const workflowActionSchema = z.object({
  action: z.enum(['start', 'pause', 'resume', 'complete', 'cancel', 'retry']),
});

// Validation helper function
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