import { z } from 'zod';

// Base counterparty types
export const CounterpartyTypeSchema = z.enum(['hoa', 'lender', 'municipality', 'utility', 'tax_authority']);
export const WorkflowCounterpartyStatusSchema = z.enum(['PENDING', 'CONTACTED', 'RESPONDED', 'COMPLETED']);

// Contact role types for counterparties
export const CounterpartyContactRoleSchema = z.enum([
  'primary',           // Main contact
  'billing',           // Billing/accounting contact
  'legal',             // Legal representative
  'operations',        // Day-to-day operations
  'board_member',      // HOA board member
  'property_manager',  // HOA property manager
  'loan_processor',    // Lender loan processor
  'underwriter',       // Lender underwriter
  'escrow_officer',    // Title/escrow officer
  'clerk',             // Municipal clerk
  'assessor',          // Tax assessor
  'collector',         // Tax collector
  'customer_service',  // Utility customer service
  'technical',         // Technical/IT contact
  'other'              // Custom role
]);

// Preferred contact method
export const PreferredContactMethodSchema = z.enum([
  'email', 'phone', 'mobile', 'fax', 'any'
]);

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

// Counterparty contact schemas
export const CounterpartyContactSchema = z.object({
  id: z.string().uuid(),
  counterparty_id: z.string().uuid(),
  role: CounterpartyContactRoleSchema,
  name: z.string().min(1),
  title: z.string().optional(),
  department: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  mobile_phone: z.string().optional(),
  fax: z.string().optional(),
  extension: z.string().optional(),
  is_primary: z.boolean().default(false),
  is_active: z.boolean().default(true),
  preferred_contact_method: PreferredContactMethodSchema.default('email'),
  preferred_contact_time: z.string().optional(),
  notes: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const CreateCounterpartyContactSchema = z.object({
  counterparty_id: z.string().uuid('Invalid counterparty ID'),
  role: CounterpartyContactRoleSchema,
  name: z.string().min(1, 'Name is required').max(255),
  title: z.string().max(255).optional(),
  department: z.string().max(255).optional(),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().min(1).optional(),
  mobile_phone: z.string().min(1).optional(),
  fax: z.string().min(1).optional(),
  extension: z.string().max(20).optional(),
  is_primary: z.boolean().default(false),
  is_active: z.boolean().default(true),
  preferred_contact_method: PreferredContactMethodSchema.default('email'),
  preferred_contact_time: z.string().max(255).optional(),
  notes: z.string().max(1000).optional(),
}).refine((data) => {
  // Ensure at least one contact method is provided
  return data.email || data.phone || data.mobile_phone;
}, {
  message: "At least one contact method (email, phone, or mobile_phone) is required",
  path: ["email"] // This will show the error on the email field
});

export const UpdateCounterpartyContactSchema = z.object({
  role: CounterpartyContactRoleSchema.optional(),
  name: z.string().min(1).max(255).optional(),
  title: z.string().max(255).optional(),
  department: z.string().max(255).optional(),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().min(1).optional(),
  mobile_phone: z.string().min(1).optional(),
  fax: z.string().min(1).optional(),
  extension: z.string().max(20).optional(),
  is_primary: z.boolean().optional(),
  is_active: z.boolean().optional(),
  preferred_contact_method: PreferredContactMethodSchema.optional(),
  preferred_contact_time: z.string().max(255).optional(),
  notes: z.string().max(1000).optional(),
});

export const CounterpartyContactFiltersSchema = z.object({
  counterparty_id: z.string().uuid().optional(),
  role: CounterpartyContactRoleSchema.optional(),
  is_primary: z.coerce.boolean().optional(),
  is_active: z.coerce.boolean().optional(),
  search: z.string().optional(), // Search by name, email, or title
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort: z.enum(['name', 'role', 'title', 'created_at']).default('name'),
  order: z.enum(['asc', 'desc']).default('asc'),
});

// Extended counterparty schema with contacts
export const CounterpartyWithContactsSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.enum(['hoa', 'lender', 'municipality', 'utility', 'tax_authority']),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  contact_info: z.record(z.any()).default({}),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  contacts: z.array(CounterpartyContactSchema).default([]),
  primary_contact: CounterpartyContactSchema.optional(),
});

// Contact response schemas
export const CounterpartyContactResponseSchema = z.object({
  success: z.boolean(),
  data: CounterpartyContactSchema,
});

export const CounterpartyContactsResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(CounterpartyContactSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }).optional(),
});

export const CounterpartyWithContactsResponseSchema = z.object({
  success: z.boolean(),
  data: CounterpartyWithContactsSchema,
});

// Role validation helpers for different counterparty types
export const CounterpartyRoleValidation = {
  hoa: ['primary', 'board_member', 'property_manager', 'billing', 'legal', 'operations', 'other'],
  lender: ['primary', 'loan_processor', 'underwriter', 'billing', 'legal', 'customer_service', 'other'],
  municipality: ['primary', 'clerk', 'legal', 'operations', 'billing', 'other'],
  utility: ['primary', 'customer_service', 'billing', 'technical', 'operations', 'other'],
  tax_authority: ['primary', 'assessor', 'collector', 'billing', 'legal', 'other'],
} as const;

// Helper function to get valid roles for a counterparty type
export function getValidRolesForCounterpartyType(counterpartyType: string): string[] {
  return [...(CounterpartyRoleValidation[counterpartyType as keyof typeof CounterpartyRoleValidation] || ['primary', 'other'])];
}

// Business logic helpers
export const CounterpartyContactHelpers = {
  /**
   * Check if a role is valid for a given counterparty type
   */
  isValidRoleForType(role: CounterpartyContactRole, counterpartyType: string): boolean {
    const validRoles = getValidRolesForCounterpartyType(counterpartyType);
    return validRoles.includes(role);
  },

  /**
   * Get display name for a contact role
   */
  getRoleDisplayName(role: CounterpartyContactRole): string {
    const displayNames: Record<CounterpartyContactRole, string> = {
      primary: 'Primary Contact',
      billing: 'Billing Contact',
      legal: 'Legal Representative',
      operations: 'Operations',
      board_member: 'Board Member',
      property_manager: 'Property Manager',
      loan_processor: 'Loan Processor',
      underwriter: 'Underwriter',
      escrow_officer: 'Escrow Officer',
      clerk: 'Clerk',
      assessor: 'Tax Assessor',
      collector: 'Tax Collector',
      customer_service: 'Customer Service',
      technical: 'Technical Contact',
      other: 'Other',
    };
    return displayNames[role] || role;
  },

  /**
   * Get suggested roles for a counterparty type
   */
  getSuggestedRoles(counterpartyType: string): Array<{ value: CounterpartyContactRole; label: string }> {
    const validRoles = getValidRolesForCounterpartyType(counterpartyType);
    return validRoles.map(role => ({
      value: role as CounterpartyContactRole,
      label: this.getRoleDisplayName(role as CounterpartyContactRole)
    }));
  }
};

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

// Contact type exports
export type CounterpartyContactRole = z.infer<typeof CounterpartyContactRoleSchema>;
export type PreferredContactMethod = z.infer<typeof PreferredContactMethodSchema>;
export type CounterpartyContact = z.infer<typeof CounterpartyContactSchema>;
export type CreateCounterpartyContactRequest = z.infer<typeof CreateCounterpartyContactSchema>;
export type UpdateCounterpartyContactRequest = z.infer<typeof UpdateCounterpartyContactSchema>;
export type CounterpartyContactFilters = z.infer<typeof CounterpartyContactFiltersSchema>;
export type CounterpartyWithContacts = z.infer<typeof CounterpartyWithContactsSchema>;