import { z } from 'zod';
import { TASK_STATUSES, PRIORITY_LEVELS } from '../enums';

export const TaskExecutionSchema = z.object({
  id: z.string().uuid(),
  workflow_id: z.string().uuid(),
  agent_id: z.string().uuid().optional().nullable(),
  title: z.string(),
  description: z.string().optional().nullable(),
  sequence_order: z.number().int(),
  task_type: z.string(),
  status: z.enum(TASK_STATUSES),
  interrupt_type: z.enum(['MISSING_DOCUMENT', 'PAYMENT_REQUIRED', 'CLIENT_CLARIFICATION', 'MANUAL_VERIFICATION']).optional().nullable(),
  executor_type: z.enum(['AI', 'HIL']),
  priority: z.enum(PRIORITY_LEVELS),
  input_data: z.record(z.any()),
  output_data: z.record(z.any()).optional().nullable(),
  error_message: z.string().optional().nullable(),
  started_at: z.string().datetime().optional().nullable(),
  completed_at: z.string().datetime().optional().nullable(),
  execution_time_ms: z.number().int().optional().nullable(),
  retry_count: z.number().int(),
  created_at: z.string().datetime(),
});

export const CreateTaskExecutionSchema = TaskExecutionSchema.omit({
  id: true,
  created_at: true,
}).partial({
  status: true,
  priority: true,
  retry_count: true,
  input_data: true,
});

export const UpdateTaskExecutionSchema = TaskExecutionSchema.pick({
  status: true,
  output_data: true,
  completed_at: true,
  started_at: true,
  error_message: true,
  execution_time_ms: true,
  retry_count: true,
}).partial();

export type TaskExecution = z.infer<typeof TaskExecutionSchema>;
export type CreateTaskExecution = z.infer<typeof CreateTaskExecutionSchema>;
export type UpdateTaskExecution = z.infer<typeof UpdateTaskExecutionSchema>;