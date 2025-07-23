/**
 * Standardized Response Schemas for OpenAPIHono
 * Ensures type consistency across all routes
 */

import { z } from 'zod';

// Base response schemas  
export const SuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) => 
  z.object({
    success: z.literal(true),
    data: dataSchema,
  });

export const SuccessListResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) => 
  z.object({
    success: z.literal(true),
    data: z.array(itemSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  });

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  details: z.string().optional(),
});

export const MessageResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
});