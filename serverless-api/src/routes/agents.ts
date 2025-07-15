/**
 * Agent Routes for Rexera API
 * 
 * Handles all agent-related endpoints
 */

import { Hono } from 'hono';
import { createServerClient } from '../utils/database';
import { type AuthUser } from '../middleware';
import { z } from 'zod';

const agents = new Hono();

// Validation schemas for agents
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

// Apply HIL-only middleware to all agent routes (except in test mode)
if (process.env.NODE_ENV !== 'test') {
  // Removed HIL-only middleware - simplified auth allows all authenticated users
}

// GET /api/agents - List agents
agents.get('/', async (c) => {
  try {
    const supabase = createServerClient();
    const rawQuery = c.req.query();
    const result = getAgentsSchema.safeParse(rawQuery);
    
    if (!result.success) {
      return c.json({
        success: false,
        error: 'Invalid query parameters',
        details: result.error.issues,
      }, 400 as any);
    }

    const { is_active, type, status, page, limit } = result.data;

    let query = supabase
      .from('agents')
      .select('*', { count: 'exact' });

    // Apply filtering
    if (is_active !== undefined) query = query.eq('is_active', is_active);
    if (type) query = query.eq('type', type);
    if (status) {
      const isActive = status === 'ACTIVE' || status === 'ONLINE';
      query = query.eq('is_active', isActive);
    }

    // Apply pagination and ordering
    const offset = (page - 1) * limit;
    query = query
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    const { data: agents, error, count } = await query;

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return c.json({
      success: true,
      data: agents,
      pagination: {
        page,
        limit,
        total: count,
        totalPages,
      },
    });

  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to fetch agents',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500 as any);
  }
});

// GET /api/agents/:id - Get single agent
agents.get('/:id', async (c) => {
  try {
    const supabase = createServerClient();
    const id = c.req.param('id');

    const { data: agent, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({
          success: false,
          error: 'Agent not found',
        }, 404 as any);
      }
      throw new Error(`Failed to fetch agent: ${error.message}`);
    }

    return c.json({
      success: true,
      data: agent,
    });

  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to fetch agent',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500 as any);
  }
});

// PATCH /api/agents/:id - Update agent
agents.patch('/:id', async (c) => {
  try {
    const supabase = createServerClient();
    const id = c.req.param('id');
    const body = await c.req.json();
    const result = updateAgentSchema.safeParse(body);

    if (!result.success) {
      return c.json({
        success: false,
        error: 'Invalid request body',
        details: result.error.issues,
      }, 400 as any);
    }

    const updateData = result.data;

    const { data: agent, error } = await supabase
      .from('agents')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({
          success: false,
          error: 'Agent not found',
        }, 404 as any);
      }
      throw new Error(`Failed to update agent: ${error.message}`);
    }

    return c.json({
      success: true,
      data: agent,
    });

  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to update agent',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500 as any);
  }
});

export { agents };