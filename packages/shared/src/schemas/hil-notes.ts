/**
 * Zod validation schemas for HIL Notes
 */

import { z } from 'zod';

// =====================================================
// ENUMS
// =====================================================

export const PriorityLevelSchema = z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']);

// =====================================================
// CORE SCHEMAS
// =====================================================

export const HilNoteSchema: z.ZodType<any> = z.object({
  id: z.string().uuid(),
  workflow_id: z.string().uuid(),
  author_id: z.string().uuid(),
  content: z.string(),
  priority: PriorityLevelSchema,
  is_resolved: z.boolean(),
  parent_note_id: z.string().uuid().nullable(),
  mentions: z.array(z.string().uuid()).default([]),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  
  // Related data (when included)
  author: z.object({
    id: z.string().uuid(),
    full_name: z.string(),
    email: z.string().email(),
  }).optional(),
  
  replies: z.array(z.lazy((): z.ZodType<any> => HilNoteSchema)).optional(),
});

export type HilNote = z.infer<typeof HilNoteSchema>;

// =====================================================
// REQUEST SCHEMAS
// =====================================================

export const HilNoteFiltersSchema = z.object({
  workflow_id: z.string().uuid(),
  is_resolved: z.boolean().optional(),
  priority: PriorityLevelSchema.optional(),
  author_id: z.string().uuid().optional(),
  parent_note_id: z.string().uuid().optional(),
  include: z.string().optional(), // 'author,replies'
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
});

export const CreateHilNoteSchema = z.object({
  workflow_id: z.string().uuid(),
  content: z.string().min(1, 'Content is required'),
  priority: PriorityLevelSchema.default('NORMAL'),
  mentions: z.array(z.string().uuid()).default([]),
  parent_note_id: z.string().uuid().optional(),
});

export const UpdateHilNoteSchema = z.object({
  content: z.string().min(1, 'Content is required').optional(),
  priority: PriorityLevelSchema.optional(),
  is_resolved: z.boolean().optional(),
  mentions: z.array(z.string().uuid()).optional(),
});

export const ReplyHilNoteSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  mentions: z.array(z.string().uuid()).default([]),
});

// =====================================================
// TYPE EXPORTS
// =====================================================

export type HilNoteFilters = z.infer<typeof HilNoteFiltersSchema>;
export type CreateHilNote = z.infer<typeof CreateHilNoteSchema>;
export type UpdateHilNote = z.infer<typeof UpdateHilNoteSchema>;
export type ReplyHilNote = z.infer<typeof ReplyHilNoteSchema>;
export type PriorityLevel = z.infer<typeof PriorityLevelSchema>;