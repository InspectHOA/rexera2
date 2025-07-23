import { z } from 'zod';

// Base counterparty types
export const CounterpartyTypeSchema = z.enum(['hoa', 'lender', 'municipality', 'utility', 'tax_authority']);
export const WorkflowCounterpartyStatusSchema = z.enum(['PENDING', 'CONTACTED', 'RESPONDED', 'COMPLETED']);

// Counterparty schemas
export const CounterpartySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  type: CounterpartyTypeSchema,
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  contact_info: z.record(z.any()).default({}),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const CreateCounterpartySchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  type: CounterpartyTypeSchema,
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  contact_info: z.record(z.any()).default({}),
});

export const UpdateCounterpartySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  type: CounterpartyTypeSchema.optional(),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  contact_info: z.record(z.any()).optional(),
});

export const CounterpartyFiltersSchema = z.object({
  type: CounterpartyTypeSchema.optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort: z.enum(['name', 'type', 'created_at']).default('name'),
  order: z.enum(['asc', 'desc']).default('asc'),
  include: z.enum(['workflows']).optional(),
});

export const CounterpartySearchSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  type: CounterpartyTypeSchema.optional(),
  limit: z.coerce.number().min(1).max(50).default(10),
});

// Workflow counterparty schemas
export const WorkflowCounterpartySchema = z.object({
  id: z.string().uuid(),
  workflow_id: z.string().uuid(),
  counterparty_id: z.string().uuid(),
  status: WorkflowCounterpartyStatusSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const CreateWorkflowCounterpartySchema = z.object({
  counterparty_id: z.string().uuid('Invalid counterparty ID'),
  status: WorkflowCounterpartyStatusSchema.default('PENDING'),
});

export const UpdateWorkflowCounterpartySchema = z.object({
  status: WorkflowCounterpartyStatusSchema,
});

export const WorkflowCounterpartyFiltersSchema = z.object({
  status: WorkflowCounterpartyStatusSchema.optional(),
  include: z.enum(['counterparty']).optional(),
});

// Response schemas
export const CounterpartyResponseSchema = z.object({
  success: z.boolean(),
  data: CounterpartySchema,
});

export const CounterpartiesResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(CounterpartySchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export const WorkflowCounterpartiesResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(WorkflowCounterpartySchema),
});

// Type exports
export type CounterpartyType = z.infer<typeof CounterpartyTypeSchema>;
export type WorkflowCounterpartyStatus = z.infer<typeof WorkflowCounterpartyStatusSchema>;
export type Counterparty = z.infer<typeof CounterpartySchema>;
export type CreateCounterpartyRequest = z.infer<typeof CreateCounterpartySchema>;
export type UpdateCounterpartyRequest = z.infer<typeof UpdateCounterpartySchema>;
export type CounterpartyFilters = z.infer<typeof CounterpartyFiltersSchema>;
export type CounterpartySearchFilters = z.infer<typeof CounterpartySearchSchema>;
export type WorkflowCounterparty = z.infer<typeof WorkflowCounterpartySchema>;
export type CreateWorkflowCounterpartyRequest = z.infer<typeof CreateWorkflowCounterpartySchema>;
export type UpdateWorkflowCounterpartyRequest = z.infer<typeof UpdateWorkflowCounterpartySchema>;
export type WorkflowCounterpartyFilters = z.infer<typeof WorkflowCounterpartyFiltersSchema>;