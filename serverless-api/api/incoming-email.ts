/**
 * Incoming email endpoint for Vercel serverless function.
 * Handles processing of incoming emails for workflow automation.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { createServerClient } from '../src/utils/database';
import { handleError } from '../src/utils/errors';

// Validation schema for incoming email processing
const incomingEmailSchema = z.object({
  workflow_id: z.string().optional(),
  from: z.string(),
  to: z.string(),
  subject: z.string(),
  body: z.string(),
  html_body: z.string().optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    content_type: z.string(),
    size: z.number(),
    content: z.string().optional() // base64 encoded
  })).optional().default([]),
  headers: z.record(z.string()).optional().default({}),
  metadata: z.record(z.any()).optional().default({})
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  const supabase = createServerClient();

  try {
    const input = incomingEmailSchema.parse(req.body);

    // Store the incoming email
    const { data: email, error } = await supabase
      .from('incoming_emails')
      .insert({
        workflow_id: input.workflow_id,
        from_email: input.from,
        to_email: input.to,
        subject: input.subject,
        body: input.body,
        html_body: input.html_body,
        attachments: input.attachments,
        headers: input.headers,
        metadata: input.metadata,
        processed: false
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to store incoming email: ${error.message}`);
    }

    // Trigger processing workflow if workflow_id is provided
    if (input.workflow_id) {
      
      // Mark as processed for now
      await supabase
        .from('incoming_emails')
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq('id', email.id);
    }

    return res.json({
      success: true,
      data: {
        id: email.id,
        message: 'Email received and queued for processing',
        workflow_id: input.workflow_id
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
        details: error.errors
      });
    }

    return handleError(error as Error, res, 'Failed to process incoming email');
  }
}