/**
 * Interrupts endpoint for Vercel serverless function.
 * Handles Human-in-the-Loop (HIL) interrupts.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { createServerClient } from '../src/utils/database';
import { handleError, sendSuccess } from '../src/utils/errors';

// Validation schemas
const getInterruptsSchema = z.object({
  workflow_id: z.string().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED']).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  assigned_to: z.string().optional(),
  interrupt_type: z.string().optional(),
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
  include: z.string().optional().transform(val => val ? val.split(',').map(s => s.trim()) : [])
});

const createInterruptSchema = z.object({
  workflow_id: z.string().optional(),
  task_id: z.string().optional(),
  interrupt_type: z.string(),
  title: z.string(),
  description: z.string(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional().default('NORMAL'),
  metadata: z.record(z.any()).optional().default({}),
  created_by: z.string()
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
      // List interrupts
      const input = getInterruptsSchema.parse(req.query);

      let selectQuery = '*';
      if (input.include.includes('workflow')) {
        selectQuery += ', workflow:workflows(id, title, workflow_type, status)';
      }
      if (input.include.includes('task')) {
        selectQuery += ', task:tasks(id, title, status)';
      }
      if (input.include.includes('assigned_user')) {
        selectQuery += ', assigned_user:user_profiles!interrupts_assigned_to_fkey(id, full_name, email)';
      }

      let query = supabase
        .from('interrupts')
        .select(selectQuery, { count: 'exact' });

      // Apply filtering
      if (input.workflow_id) query = query.eq('workflow_id', input.workflow_id);
      if (input.status) query = query.eq('status', input.status);
      if (input.priority) query = query.eq('priority', input.priority);
      if (input.assigned_to) query = query.eq('assigned_to', input.assigned_to);
      if (input.interrupt_type) query = query.eq('interrupt_type', input.interrupt_type);

      // Apply pagination and ordering
      const offset = (input.page - 1) * input.limit;
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + input.limit - 1);

      const { data: interrupts, error, count } = await query;

      if (error) {
        throw new Error(`Failed to fetch interrupts: ${error.message}`);
      }

      const totalPages = Math.ceil((count || 0) / input.limit);

      return sendSuccess(res, interrupts || [], {
        page: input.page,
        limit: input.limit,
        total: count || 0,
        totalPages
      });

    } else if (req.method === 'POST') {
      // Create interrupt
      const input = createInterruptSchema.parse(req.body);

      const { data: interrupt, error } = await supabase
        .from('interrupts')
        .insert({
          workflow_id: input.workflow_id,
          task_id: input.task_id,
          interrupt_type: input.interrupt_type,
          title: input.title,
          description: input.description,
          priority: input.priority,
          metadata: input.metadata,
          created_by: input.created_by,
        })
        .select(`
          *,
          workflow:workflows(id, title, workflow_type, status)
        `)
        .single();

      if (error) {
        throw new Error(`Failed to create interrupt: ${error.message}`);
      }

      return res.status(201).json({
        success: true,
        data: interrupt
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

    return handleError(error as Error, res, 'Failed to process interrupts request');
  }
}