/**
 * Document Schemas for Rexera API
 * Handles file management, deliverables, and workflow artifacts
 */

import { z } from 'zod';

// Document types enum
export const DocumentType = {
  WORKING: 'WORKING',
  DELIVERABLE: 'DELIVERABLE',
} as const;

export const DocumentStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;

// Core document schema
export const DocumentSchema = z.object({
  id: z.string().uuid(),
  workflow_id: z.string().uuid(),
  filename: z.string(),
  url: z.string().url(),
  file_size_bytes: z.number().nullable(),
  mime_type: z.string().nullable(),
  document_type: z.enum(['WORKING', 'DELIVERABLE']).default('WORKING'),
  tags: z.array(z.string()).default([]),
  upload_source: z.string().nullable(),
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']).default('PENDING'),
  metadata: z.record(z.any()).default({}),
  deliverable_data: z.record(z.any()).default({}),
  version: z.number().default(1),
  change_summary: z.string().nullable(),
  created_by: z.string().uuid().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Create document request schema
export const CreateDocumentSchema = z.object({
  workflow_id: z.string().uuid(),
  filename: z.string().min(1, 'Filename is required'),
  url: z.string().url('Valid URL is required'),
  file_size_bytes: z.number().positive().optional(),
  mime_type: z.string().optional(),
  document_type: z.enum(['WORKING', 'DELIVERABLE']).default('WORKING'),
  tags: z.array(z.string()).default([]),
  upload_source: z.string().optional(),
  metadata: z.record(z.any()).default({}),
  deliverable_data: z.record(z.any()).default({}),
});

// Update document request schema
export const UpdateDocumentSchema = z.object({
  filename: z.string().min(1).optional(),
  document_type: z.enum(['WORKING', 'DELIVERABLE']).optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']).optional(),
  metadata: z.record(z.any()).optional(),
  deliverable_data: z.record(z.any()).optional(),
  change_summary: z.string().optional(),
});

// Document filters schema for GET requests
export const DocumentFiltersSchema = z.object({
  workflow_id: z.string().uuid().optional(),
  document_type: z.enum(['WORKING', 'DELIVERABLE']).optional(),
  tags: z.string().optional(), // Comma-separated tags
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']).optional(),
  page: z.string().transform(val => parseInt(val, 10)).refine(val => val >= 1).default('1'),
  limit: z.string().transform(val => parseInt(val, 10)).refine(val => val >= 1 && val <= 100).default('20'),
  include: z.string().optional(), // Comma-separated list of related data to include
  sortBy: z.enum(['created_at', 'updated_at', 'filename', 'file_size_bytes']).default('created_at'),
  sortDirection: z.enum(['asc', 'desc']).default('desc'),
}).default({});

// Create document version schema
export const CreateDocumentVersionSchema = z.object({
  url: z.string().url('Valid URL is required'),
  filename: z.string().min(1).optional(), // If not provided, use existing filename
  file_size_bytes: z.number().positive().optional(),
  mime_type: z.string().optional(),
  change_summary: z.string().min(1, 'Change summary is required'),
  metadata: z.record(z.any()).default({}),
});

// Document with related data (for responses with includes)
export const DocumentWithRelationsSchema = DocumentSchema.extend({
  workflow: z.object({
    id: z.string().uuid(),
    title: z.string(),
    client_id: z.string().uuid(),
    status: z.string(),
  }).optional(),
  created_by_user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    user_type: z.string(),
  }).optional(),
}).transform(data => ({
  ...data,
  // Ensure created_by_user is available
  created_by_user: data.created_by_user || undefined,
}));

// Type exports
export type Document = z.infer<typeof DocumentSchema>;
export type CreateDocument = z.infer<typeof CreateDocumentSchema>;
export type UpdateDocument = z.infer<typeof UpdateDocumentSchema>;
export type DocumentFilters = z.infer<typeof DocumentFiltersSchema>;
export type CreateDocumentVersion = z.infer<typeof CreateDocumentVersionSchema>;
export type DocumentWithRelations = z.infer<typeof DocumentWithRelationsSchema>;

// Export document types and status enums
export const DOCUMENT_TYPES = Object.values(DocumentType);
export const DOCUMENT_STATUSES = Object.values(DocumentStatus);