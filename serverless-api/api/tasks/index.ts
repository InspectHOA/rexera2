/**
 * Tasks endpoint for Vercel serverless function.
 * Handles task listing and creation.
 */

import { NextApiRequest, NextApiResponse } from '../types/next';
import { z } from 'zod';
import { createServerClient } from '../utils/database';

// Validation schemas
const getTasksSchema = z.object({
  workflow_id: z.string().optional(),
  status: z.enum(['PENDING', 'AWAITING_REVIEW', 'COMPLETED', 'FAILED']).optional(),
  executor_type: z.enum(['AI', 'HIL']).optional(),
  assigned_to: z.string().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
  include: z.string().optional().transform(val => val ? val.split(',').map(s => s.trim()) : [])
});

const createTaskSchema = z.object({
  workflow_id: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  executor_type: z.enum(['AI', 'HIL']),
  assigned_to: z.string().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional().default('NORMAL'),
  metadata: z.record(z.any()).optional().default({}),
  due_date: z.string().optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServerClient();

  try {
    if (req.method === 'GET') {
      // List tasks
      const input = getTasksSchema.parse(req.query);

      // Build dynamic select query based on requested inclusions
      let selectQuery = '*';
      
      if (input.include.includes('workflow')) {
        selectQuery += ', workflow:workflows(id, title, workflow_type, client_id, status)';
      }
      if (input.include.includes('assigned_user')) {
        selectQuery += ', assigned_user:user_profiles!tasks_assigned_to_fkey(id, full_name, email)';
      }
      if (input.include.includes('executions')) {
        selectQuery += ', task_executions(*)';
      }
      if (input.include.includes('dependencies')) {
        selectQuery += ', task_dependencies(*)';
      }

      // Build base query with dynamic select
      let query = supabase
        .from('tasks')
        .select(selectQuery);

      // Apply filtering
      if (input.workflow_id) query = query.eq('workflow_id', input.workflow_id);
      if (input.status) query = query.eq('status', input.status);
      if (input.executor_type) query = query.eq('executor_type', input.executor_type);
      if (input.assigned_to) query = query.eq('assigned_to', input.assigned_to);
      if (input.priority) query = query.eq('priority', input.priority);

      // Apply pagination and ordering
      const offset = (input.page - 1) * input.limit;
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + input.limit - 1);

      const { data: tasks, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch tasks: ${error.message}`);
      }

      // Get total count for pagination metadata
      const { count } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true });

      const totalPages = Math.ceil((count || 0) / input.limit);

      return res.json({
        success: true,
        data: tasks || [],
        pagination: {
          page: input.page,
          limit: input.limit,
          total: count || 0,
          totalPages
        }
      });

    } else if (req.method === 'POST') {
      // Create task
      const input = createTaskSchema.parse(req.body);

      const { data: task, error } = await supabase
        .from('tasks')
        .insert({
          workflow_id: input.workflow_id,
          title: input.title,
          description: input.description,
          executor_type: input.executor_type,
          assigned_to: input.assigned_to,
          priority: input.priority,
          metadata: input.metadata,
          due_date: input.due_date,
        })
        .select(`
          *,
          workflow:workflows(id, title, workflow_type, client_id, status)
        `)
        .single();

      if (error) {
        throw new Error(`Failed to create task: ${error.message}`);
      }

      return res.status(201).json({
        success: true,
        data: task
      });

    } else {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }
  } catch (error: any) {
    console.error('Tasks API error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}