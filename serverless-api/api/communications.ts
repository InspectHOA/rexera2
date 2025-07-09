/**
 * Communications API endpoint for Vercel serverless function.
 * Handles email and other communication data for agent interfaces.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { createServerClient } from '../src/utils/database';
import { handleError } from '../src/utils/errors';

const getCommunicationsSchema = z.object({
  workflow_id: z.string().optional(), // Accept human-readable ID or UUID
  type: z.enum(['email', 'phone', 'sms', 'internal_note']).optional(),
  direction: z.enum(['INBOUND', 'OUTBOUND']).optional(),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional()
});

const createCommunicationSchema = z.object({
  workflow_id: z.string().uuid(),
  recipient_email: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1),
  communication_type: z.enum(['email', 'phone', 'sms', 'internal_note']),
  direction: z.enum(['INBOUND', 'OUTBOUND']),
  thread_id: z.string().uuid().optional()
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabase = createServerClient();

  try {
    if (req.method === 'GET') {
      // Get communications with optional filtering
      const query = getCommunicationsSchema.parse(req.query);
      
      let dbQuery = supabase
        .from('communications')
        .select(`
          id,
          workflow_id,
          thread_id,
          sender_id,
          recipient_email,
          subject,
          body,
          communication_type,
          direction,
          status,
          metadata,
          created_at,
          updated_at,
          email_metadata(
            message_id,
            in_reply_to,
            email_references,
            attachments,
            headers
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (query.workflow_id) {
        console.log(`Communications API: Looking up workflow_id: ${query.workflow_id}`);
        
        // Check if workflow_id is a UUID or human-readable ID
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query.workflow_id);
        console.log(`Communications API: isUUID: ${isUUID}`);
        
        if (isUUID) {
          // Use UUID directly
          console.log(`Communications API: Using UUID directly: ${query.workflow_id}`);
          dbQuery = dbQuery.eq('workflow_id', query.workflow_id);
        } else {
          // Look up UUID by human_readable_id
          console.log(`Communications API: Looking up human-readable ID: ${query.workflow_id}`);
          const { data: workflow, error: workflowError } = await supabase
            .from('workflows')
            .select('id')
            .eq('human_readable_id', query.workflow_id)
            .single();
            
          if (workflowError || !workflow) {
            console.log(`Communications API: Workflow not found - error:`, workflowError);
            return res.status(404).json({
              success: false,
              error: `Workflow not found with ID: ${query.workflow_id}`
            });
          }
          
          console.log(`Communications API: Found workflow UUID: ${workflow.id}`);
          dbQuery = dbQuery.eq('workflow_id', workflow.id);
        }
      }
      
      if (query.type) {
        dbQuery = dbQuery.eq('communication_type', query.type);
      }
      
      if (query.direction) {
        dbQuery = dbQuery.eq('direction', query.direction);
      }
      
      if (query.limit) {
        dbQuery = dbQuery.limit(query.limit);
      }

      const { data: communications, error } = await dbQuery;

      if (error) {
        throw new Error(`Failed to fetch communications: ${error.message}`);
      }

      return res.json({
        success: true,
        data: communications || []
      });

    } else if (req.method === 'POST') {
      // Create new communication
      const input = createCommunicationSchema.parse(req.body);

      const { data: communication, error } = await supabase
        .from('communications')
        .insert({
          workflow_id: input.workflow_id,
          recipient_email: input.recipient_email,
          subject: input.subject,
          body: input.body,
          communication_type: input.communication_type,
          direction: input.direction,
          thread_id: input.thread_id,
          status: input.direction === 'OUTBOUND' ? 'SENT' : 'READ',
          metadata: {}
        })
        .select(`
          id,
          workflow_id,
          thread_id,
          sender_id,
          recipient_email,
          subject,
          body,
          communication_type,
          direction,
          status,
          metadata,
          created_at,
          updated_at
        `)
        .single();

      if (error) {
        throw new Error(`Failed to create communication: ${error.message}`);
      }

      return res.status(201).json({
        success: true,
        data: communication
      });

    } else {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }

    return handleError(error as Error, res, 'Failed to process communications request');
  }
}