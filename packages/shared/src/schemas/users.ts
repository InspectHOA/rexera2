/**
 * Zod validation schemas for User data
 */

import { z } from 'zod';

// =====================================================
// USER SCHEMAS
// =====================================================

export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(), // This will be full_name from database
  email: z.string().email(),
  user_type: z.enum(['client_user', 'hil_user']),
  role: z.string(),
  company_id: z.string().uuid().nullable().optional(),
});

export const UserFiltersSchema = z.object({
  q: z.string().optional(), // Search query
  limit: z.number().min(1).max(100).default(20).optional(),
  user_type: z.enum(['client_user', 'hil_user']).optional(),
});

// =====================================================
// TYPE EXPORTS
// =====================================================

export type User = z.infer<typeof UserSchema>;
export type UserFilters = z.infer<typeof UserFiltersSchema>;