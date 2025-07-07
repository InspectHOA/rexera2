/**
 * Agents endpoint for Vercel serverless function.
 * Handles AI agent monitoring and coordination.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { createServerClient } from '../src/utils/database';
import { handleError, sendSuccess } from '../src/utils/errors';

// Validation schemas
const getAgentsSchema = z.object({
  is_active: z.string().optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
  type: z.string().optional(),
  status: z.string().optional(),
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
  include: z.string().optional().transform(val => val ? val.split(',').map(s => s.trim()) : [])
});

const updateAgentSchema = z.object({
  status: z.enum(['ONLINE', 'BUSY', 'OFFLINE', 'ERROR']).optional(),
  is_active: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
  last_heartbeat: z.string().optional()
});

interface AgentQueryParams {
  id?: string;
}

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
      // List agents
      const input = getAgentsSchema.parse(req.query);

      let query = supabase
        .from('agents')
        .select('*', { count: 'exact' });

      // Apply filtering
      if (input.is_active !== undefined) query = query.eq('is_active', input.is_active);
      if (input.type) query = query.eq('type', input.type);
      if (input.status) query = query.eq('status', input.status);

      // Apply pagination and ordering
      const offset = (input.page - 1) * input.limit;
      query = query
        .order('name', { ascending: true })
        .range(offset, offset + input.limit - 1);

      const { data: agents, error, count } = await query;

      if (error) {
        throw new Error(`Failed to fetch agents: ${error.message}`);
      }

      const totalPages = Math.ceil((count || 0) / input.limit);

      return sendSuccess(res, agents || [], {
        page: input.page,
        limit: input.limit,
        total: count || 0,
        totalPages
      });

    } else if (req.method === 'POST') {
      // Update agent status (heartbeat)
      const input = updateAgentSchema.parse(req.body);
      const { id } = req.query as AgentQueryParams;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Agent ID is required'
        });
      }

      const { data: agent, error } = await supabase
        .from('agents')
        .update({
          ...input,
          last_heartbeat: input.last_heartbeat || new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        throw new Error(`Failed to update agent: ${error.message}`);
      }

      return res.json({
        success: true,
        data: agent
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

    return handleError(error as Error, res, 'Failed to process agents request');
  }
}