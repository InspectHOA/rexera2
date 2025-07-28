/**
 * Zod validation schemas for Communications
 */

import { z } from 'zod';

// =====================================================
// ENUMS
// =====================================================

export const CommunicationTypeSchema = z.enum(['email', 'phone', 'sms', 'client_chat']);
export const EmailDirectionSchema = z.enum(['INBOUND', 'OUTBOUND']);
export const EmailStatusSchema = z.enum(['SENT', 'DELIVERED', 'READ', 'BOUNCED', 'FAILED']);
export const CallDirectionSchema = z.enum(['INBOUND', 'OUTBOUND']);
export const ClientChatStatusSchema = z.enum(['DRAFT', 'SENT', 'DELIVERED', 'READ', 'BOUNCED', 'FAILED']);
export const ExternalPlatformTypeSchema = z.enum(['qualia', 'gridbase', 'salesforce', 'custom']);

// =====================================================
// CORE SCHEMAS
// =====================================================

export const CommunicationSchema = z.object({
  id: z.string().uuid(),
  workflow_id: z.string().uuid().nullable(),
  thread_id: z.string().uuid().nullable(),
  sender_id: z.string().uuid().nullable(),
  recipient_email: z.string().email().nullable(),
  subject: z.string().nullable(),
  body: z.string().nullable(),
  communication_type: CommunicationTypeSchema,
  direction: EmailDirectionSchema.nullable(),
  status: z.union([EmailStatusSchema, ClientChatStatusSchema]).nullable(),
  metadata: z.record(z.any()).default({}),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  is_deleted: z.boolean().default(false),
  deleted_at: z.string().datetime().nullable(),
  
  // Related data (when included)
  email_metadata: z.object({
    id: z.string().uuid(),
    communication_id: z.string().uuid(),
    message_id: z.string().nullable(),
    in_reply_to: z.string().nullable(),
    email_references: z.array(z.string()).default([]),
    attachments: z.array(z.any()).default([]),
    headers: z.record(z.any()).default({}),
    created_at: z.string().datetime(),
  }).optional(),
  
  phone_metadata: z.object({
    id: z.string().uuid(),
    communication_id: z.string().uuid(),
    phone_number: z.string().nullable(),
    duration_seconds: z.number().int().nullable(),
    call_recording_url: z.string().url().nullable(),
    transcript: z.string().nullable(),
    created_at: z.string().datetime(),
  }).optional(),

  client_chat_metadata: z.object({
    id: z.string().uuid(),
    communication_id: z.string().uuid(),
    external_platform_type: ExternalPlatformTypeSchema.nullable(),
    external_platform_id: z.string().nullable(),
    cc_recipients: z.array(z.string().email()).default([]),
    bcc_recipients: z.array(z.string().email()).default([]),
    created_at: z.string().datetime(),
  }).optional(),

});




// =====================================================
// CREATE SCHEMAS
// =====================================================

export const CreateCommunicationSchema = z.object({
  workflow_id: z.string().uuid().optional(),
  thread_id: z.string().uuid().optional(),
  recipient_email: z.string().email().optional().nullable(),
  subject: z.string().min(1, 'Subject is required').optional().nullable(),
  body: z.string().min(1, 'Message body is required'),
  communication_type: CommunicationTypeSchema,
  direction: EmailDirectionSchema,
  metadata: z.record(z.any()).default({}),
  
  // Email-specific fields
  email_metadata: z.object({
    message_id: z.string().optional(),
    in_reply_to: z.string().optional(),
    email_references: z.array(z.string()).default([]),
    attachments: z.array(z.object({
      filename: z.string(),
      content_type: z.string(),
      size: z.number(),
      url: z.string().url().optional(),
    })).default([]),
    headers: z.record(z.any()).default({}),
  }).optional(),
  
  // Phone-specific fields
  phone_metadata: z.object({
    phone_number: z.string(),
    duration_seconds: z.number().int().positive().optional(),
    call_recording_url: z.string().url().optional(),
    transcript: z.string().optional(),
  }).optional(),
  
  // Client chat-specific fields
  client_chat_metadata: z.object({
    external_platform_type: ExternalPlatformTypeSchema.optional(),
    external_platform_id: z.string().optional(),
    cc_recipients: z.array(z.string().email()).default([]),
    bcc_recipients: z.array(z.string().email()).default([]),
  }).optional(),
});

// =====================================================
// UPDATE SCHEMAS
// =====================================================

export const UpdateCommunicationSchema = z.object({
  status: z.union([EmailStatusSchema, ClientChatStatusSchema]).optional(),
  metadata: z.record(z.any()).optional(),
  
  // Allow updating specific metadata fields
  email_metadata: z.object({
    attachments: z.array(z.any()).optional(),
    headers: z.record(z.any()).optional(),
  }).optional(),
  
  phone_metadata: z.object({
    duration_seconds: z.number().int().positive().optional(),
    call_recording_url: z.string().url().optional(),
    transcript: z.string().optional(),
  }).optional(),
  
  client_chat_metadata: z.object({
    external_platform_type: ExternalPlatformTypeSchema.optional(),
    external_platform_id: z.string().optional(),
    cc_recipients: z.array(z.string().email()).optional(),
    bcc_recipients: z.array(z.string().email()).optional(),
  }).optional(),
});

// =====================================================
// QUERY SCHEMAS
// =====================================================

export const CommunicationFiltersSchema = z.object({
  workflow_id: z.string().uuid().optional(),
  thread_id: z.string().uuid().optional(),
  communication_type: CommunicationTypeSchema.optional(),
  direction: EmailDirectionSchema.optional(),
  status: z.union([EmailStatusSchema, ClientChatStatusSchema]).optional(),
  sender_id: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  include: z.string().optional().transform((val) => val ? val.split(',') : []),
  sortBy: z.enum(['created_at', 'updated_at', 'subject', 'status']).default('created_at'),
  sortDirection: z.enum(['asc', 'desc']).default('desc'),
});

// =====================================================
// REPLY AND FORWARD SCHEMAS
// =====================================================

export const ReplyCommunicationSchema = z.object({
  recipient_email: z.string().email(),
  body: z.string().min(1, 'Reply body is required'),
  include_team: z.boolean().default(false),
  metadata: z.record(z.any()).default({}),
});

export const ForwardCommunicationSchema = z.object({
  recipient_email: z.string().email(),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Forward body is required'),
  include_team: z.boolean().default(false),
  metadata: z.record(z.any()).default({}),
});

// =====================================================
// THREAD SCHEMAS
// =====================================================

export const EmailThreadSchema = z.object({
  thread_id: z.string().uuid().nullable(),
  subject: z.string(),
  communication_count: z.number().int(),
  last_activity: z.string().datetime(),
  participants: z.array(z.string().email()),
  has_unread: z.boolean(),
  workflow_id: z.string().uuid().nullable(),
});

// =====================================================
// TYPE EXPORTS
// =====================================================

export type Communication = z.infer<typeof CommunicationSchema>;
export type CreateCommunication = z.infer<typeof CreateCommunicationSchema>;
export type UpdateCommunication = z.infer<typeof UpdateCommunicationSchema>;
export type CommunicationFilters = z.infer<typeof CommunicationFiltersSchema>;
export type ReplyCommunication = z.infer<typeof ReplyCommunicationSchema>;
export type ForwardCommunication = z.infer<typeof ForwardCommunicationSchema>;
export type EmailThread = z.infer<typeof EmailThreadSchema>;

export type CommunicationType = z.infer<typeof CommunicationTypeSchema>;
export type EmailDirection = z.infer<typeof EmailDirectionSchema>;
export type EmailStatus = z.infer<typeof EmailStatusSchema>;
export type ClientChatStatus = z.infer<typeof ClientChatStatusSchema>;
export type ExternalPlatformType = z.infer<typeof ExternalPlatformTypeSchema>;
export type CallDirection = z.infer<typeof CallDirectionSchema>;