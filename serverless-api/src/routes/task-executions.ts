/**
 * Task Execution Routes for Rexera API
 * 
 * Handles all task execution-related endpoints
 */

import { Hono } from 'hono';
import { createServerClient } from '../utils/database';
import { getCompanyFilter, clientDataMiddleware, type AuthUser } from '../middleware';
import { 
  CreateTaskExecutionSchema,
  UpdateTaskExecutionSchema 
} from '@rexera/shared';
import { z } from 'zod';

const taskExecutions = new Hono();

// Validation schemas
const getTaskExecutionsSchema = z.object({
  workflow_id: z.string().optional(),
  agent_id: z.string().optional(),
  status: z.string().optional(),
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
});

const bulkCreateSchema = z.object({
  task_executions: z.array(CreateTaskExecutionSchema)
});

// Apply client data middleware to all task execution routes (except in test mode)
if (process.env.NODE_ENV !== 'test') {
  taskExecutions.use('*', clientDataMiddleware);
}

// GET /api/taskExecutions - List task executions
taskExecutions.get('/', async (c) => {
  try {
    const supabase = createServerClient();
    const user = c.get('user') as AuthUser || { 
      id: 'test-user', 
      email: 'test@example.com', 
      user_type: 'hil_user' as const, 
      role: 'HIL', 
      company_id: undefined 
    };
    const rawQuery = c.req.query();
    const result = getTaskExecutionsSchema.safeParse(rawQuery);
    
    if (!result.success) {
      return c.json({
        success: false,
        error: 'Invalid query parameters',
        details: result.error.issues,
      }, 400 as any);
    }

    const { workflow_id, agent_id, status, page, limit } = result.data;

    let query = supabase
      .from('task_executions')
      .select(`
        *,
        workflows!workflow_id(id, title, client_id),
        agents!agent_id(id, name, type)
      `, { count: 'exact' });

    // Apply filters
    if (workflow_id) query = query.eq('workflow_id', workflow_id);
    if (agent_id) query = query.eq('agent_id', agent_id);
    if (status) query = query.eq('status', status);

    // Apply client access control through workflow relationship
    const companyFilter = getCompanyFilter(user);
    if (companyFilter) {
      query = query.eq('workflows.client_id', companyFilter);
    }

    // Apply pagination and ordering
    const offset = (page - 1) * limit;
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: taskExecutions, error, count } = await query;

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return c.json({
      success: true,
      data: taskExecutions,
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
      error: 'Failed to fetch task executions',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500 as any);
  }
});

// POST /api/taskExecutions/bulk - Create multiple task executions
taskExecutions.post('/bulk', async (c) => {
  try {
    const supabase = createServerClient();
    const user = c.get('user') as AuthUser || { 
      id: 'test-user', 
      email: 'test@example.com', 
      user_type: 'hil_user' as const, 
      role: 'HIL', 
      company_id: undefined 
    };
    const body = await c.req.json();
    const result = bulkCreateSchema.safeParse(body);

    if (!result.success) {
      return c.json({
        success: false,
        error: 'Invalid request body',
        details: result.error.issues,
      }, 400 as any);
    }

    const { task_executions } = result.data;

    // Verify access to all workflows for client users
    const companyFilter = getCompanyFilter(user);
    if (companyFilter) {
      const workflowIds = [...new Set(task_executions.map(te => te.workflow_id))];
      
      const { data: workflows, error: workflowError } = await supabase
        .from('workflows')
        .select('id, client_id')
        .in('id', workflowIds);

      if (workflowError) {
        throw new Error(`Failed to verify workflow access: ${workflowError.message}`);
      }

      const unauthorizedWorkflows = workflows?.filter(w => w.client_id !== companyFilter);
      if (unauthorizedWorkflows?.length) {
        return c.json({
          success: false,
          error: 'Access denied. Cannot create tasks for workflows from different companies.',
        }, 403 as any);
      }
    }

    const { data: taskExecutions, error } = await supabase
      .from('task_executions')
      .insert(task_executions)
      .select();

    if (error) {
      throw new Error(`Failed to create task executions: ${error.message}`);
    }

    return c.json({
      success: true,
      data: taskExecutions,
    }, 201 as any);

  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to create task executions',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500 as any);
  }
});

// GET /api/taskExecutions/:id - Get single task execution
taskExecutions.get('/:id', async (c) => {
  try {
    const supabase = createServerClient();
    const user = c.get('user') as AuthUser || { 
      id: 'test-user', 
      email: 'test@example.com', 
      user_type: 'hil_user' as const, 
      role: 'HIL', 
      company_id: undefined 
    };
    const id = c.req.param('id');

    let query = supabase
      .from('task_executions')
      .select(`
        *,
        workflows!workflow_id(id, title, client_id),
        agents!agent_id(id, name, type)
      `)
      .eq('id', id);

    // Apply client access control
    const companyFilter = getCompanyFilter(user);
    if (companyFilter) {
      query = query.eq('workflows.client_id', companyFilter);
    }

    const { data: taskExecution, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({
          success: false,
          error: 'Task execution not found',
        }, 404 as any);
      }
      throw new Error(`Failed to fetch task execution: ${error.message}`);
    }

    return c.json({
      success: true,
      data: taskExecution,
    });

  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to fetch task execution',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500 as any);
  }
});

// PATCH /api/taskExecutions/by-workflow-and-type - Update task execution by workflow_id and task_type
taskExecutions.patch('/by-workflow-and-type', async (c) => {
  try {
    const supabase = createServerClient();
    const user = c.get('user') as AuthUser || {
      id: 'test-user',
      email: 'test@example.com',
      user_type: 'hil_user' as const,
      role: 'HIL',
      company_id: undefined
    };
    const body = await c.req.json();
    const { workflow_id, task_type, ...updateData } = body;

    if (!workflow_id || !task_type) {
      return c.json({
        success: false,
        error: 'workflow_id and task_type are required',
      }, 400 as any);
    }

    const result = UpdateTaskExecutionSchema.safeParse(updateData);

    if (!result.success) {
      return c.json({
        success: false,
        error: 'Invalid request body',
        details: result.error.issues,
      }, 400 as any);
    }

    // First verify access to the workflow
    const companyFilter = getCompanyFilter(user);
    if (companyFilter) {
      const { data: workflow, error: workflowError } = await supabase
        .from('workflows')
        .select('id, client_id')
        .eq('id', workflow_id)
        .eq('client_id', companyFilter)
        .single();

      if (workflowError || !workflow) {
        return c.json({
          success: false,
          error: 'Workflow not found or access denied',
        }, 404 as any);
      }
    }

    // Find and update the task by workflow_id and task_type
    const { data: taskExecution, error } = await supabase
      .from('task_executions')
      .update(result.data)
      .eq('workflow_id', workflow_id)
      .eq('task_type', task_type)
      .select(`
        *,
        workflows!workflow_id(id, title, client_id),
        agents!agent_id(id, name, type)
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({
          success: false,
          error: 'Task execution not found',
        }, 404 as any);
      }
      throw new Error(`Failed to update task execution: ${error.message}`);
    }

    return c.json({
      success: true,
      data: taskExecution,
    });

  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to update task execution',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500 as any);
  }
});

// PATCH /api/taskExecutions/:id - Update task execution
taskExecutions.patch('/:id', async (c) => {
  try {
    const supabase = createServerClient();
    const user = c.get('user') as AuthUser || { 
      id: 'test-user', 
      email: 'test@example.com', 
      user_type: 'hil_user' as const, 
      role: 'HIL', 
      company_id: undefined 
    };
    const id = c.req.param('id');
    const body = await c.req.json();
    const result = UpdateTaskExecutionSchema.safeParse(body);

    if (!result.success) {
      return c.json({
        success: false,
        error: 'Invalid request body',
        details: result.error.issues,
      }, 400 as any);
    }

    // First verify access to the task execution
    const companyFilter = getCompanyFilter(user);
    if (companyFilter) {
      const { data: existingTask, error: accessError } = await supabase
        .from('task_executions')
        .select('id, workflows!workflow_id(client_id)')
        .eq('id', id)
        .single();

      if (accessError || !existingTask) {
        return c.json({
          success: false,
          error: 'Task execution not found',
        }, 404 as any);
      }

      if ((existingTask.workflows as any)?.client_id !== companyFilter) {
        return c.json({
          success: false,
          error: 'Access denied',
        }, 403 as any);
      }
    }

    const updateData = result.data;

    const { data: taskExecution, error } = await supabase
      .from('task_executions')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        workflows!workflow_id(id, title, client_id),
        agents!agent_id(id, name, type)
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({
          success: false,
          error: 'Task execution not found',
        }, 404 as any);
      }
      throw new Error(`Failed to update task execution: ${error.message}`);
    }

    return c.json({
      success: true,
      data: taskExecution,
    });

  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to update task execution',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500 as any);
  }
});

export { taskExecutions };