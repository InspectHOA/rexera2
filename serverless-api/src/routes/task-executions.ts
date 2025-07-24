/**
 * Task Execution Routes for Rexera API
 * 
 * Handles all task execution-related endpoints
 */

import { Hono } from 'hono';
import { createServerClient } from '../utils/database';
import { insertTaskExecution, updateTaskExecution, insertTaskExecutions, updateTaskExecutionByWorkflowAndType } from '../utils/type-safe-db';
import { getCompanyFilter, clientDataMiddleware, type AuthUser } from '../middleware';
import { 
  CreateTaskExecutionSchema,
  UpdateTaskExecutionSchema 
} from '@rexera/shared';
import { auditLogger } from './audit-events';
import { z } from 'zod';

const taskExecutions = new Hono();

// Validation schemas
const getTaskExecutionsSchema = z.object({
  workflow_id: z.string().optional(),
  agent_id: z.string().optional(),
  status: z.string().optional(),
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
  include: z.string().optional().transform(val => val ? val.split(',').map(s => s.trim()) : []),
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

    const { workflow_id, agent_id, status, page, limit, include } = result.data;

    // Build dynamic select based on include parameter
    let selectFields = '*';
    if (include.includes('workflows')) {
      selectFields += ', workflows!workflow_id(id, title, client_id)';
    }
    if (include.includes('agents')) {
      selectFields += ', agents!agent_id(id, name, type)';
    }

    let query = supabase
      .from('task_executions')
      .select(selectFields, { count: 'exact' });

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

      const unauthorizedWorkflows = workflows?.filter((w: any) => w.client_id !== companyFilter);
      if (unauthorizedWorkflows?.length) {
        return c.json({
          success: false,
          error: 'Access denied. Cannot create tasks for workflows from different companies.',
        }, 403 as any);
      }
    }

    // Check for existing task executions to avoid duplicates
    const workflowIds = [...new Set(task_executions.map(te => te.workflow_id))];
    const { data: existingTasks, error: checkError } = await supabase
      .from('task_executions')
      .select('workflow_id, task_type')
      .in('workflow_id', workflowIds);

    if (checkError) {
      throw new Error(`Failed to check existing tasks: ${checkError.message}`);
    }

    // Create a Set of existing workflow_id + task_type combinations
    const existingCombinations = new Set(
      existingTasks?.map(t => `${t.workflow_id}|${t.task_type}`) || []
    );

    // Filter out tasks that already exist
    const tasksToCreate = task_executions.filter(te => 
      !existingCombinations.has(`${te.workflow_id}|${te.task_type}`)
    );

    // If no tasks to create, return empty success
    if (tasksToCreate.length === 0) {
      return c.json({
        success: true,
        data: [],
      }, 201 as any);
    }

    let taskExecutions;
    try {
      taskExecutions = await insertTaskExecutions(tasksToCreate);
    } catch (error) {
      throw new Error(`Failed to create task executions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Log audit events for bulk creation
    try {
      const auditEvents = taskExecutions?.map(te => ({
        actor_type: 'human' as const,
        actor_id: user.id,
        actor_name: user.email,
        event_type: 'task_execution' as const,
        action: 'create' as const,
        resource_type: 'task_execution' as const,
        resource_id: te.id,
        workflow_id: te.workflow_id,
        event_data: {
          task_type: te.task_type,
          status: te.status,
          executor_type: te.executor_type,
          priority: te.priority
        }
      })) || [];
      
      if (auditEvents.length > 0) {
        await auditLogger.logBatch(auditEvents);
      }
    } catch (auditError) {
      console.error('Failed to log audit events for task creation:', auditError);
      // Don't fail the request for audit errors
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

    // Get the current task for audit logging
    const { data: existingTask } = await supabase
      .from('task_executions')
      .select('id, status, task_type')
      .eq('workflow_id', workflow_id)
      .eq('task_type', task_type)
      .single();

    // Find and update the task by workflow_id and task_type using type-safe function
    let taskExecution;
    try {
      taskExecution = await updateTaskExecutionByWorkflowAndType(workflow_id, task_type, result.data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('PGRST116')) {
        return c.json({
          success: false,
          error: 'Task execution not found',
        }, 404 as any);
      }
      throw new Error(`Failed to update task execution: ${errorMessage}`);
    }

    // Log audit event for task update
    try {
      await auditLogger.log({
        actor_type: 'human',
        actor_id: user.id,
        actor_name: user.email,
        event_type: 'task_execution',
        action: 'update',
        resource_type: 'task_execution',
        resource_id: taskExecution.id,
        workflow_id: taskExecution.workflow_id,
        event_data: {
          task_type: taskExecution.task_type,
          old_status: existingTask?.status,
          new_status: taskExecution.status,
          updated_fields: Object.keys(result.data),
          update_method: 'by_workflow_and_type'
        }
      });
    } catch (auditError) {
      console.error('Failed to log audit event for task update:', auditError);
      // Don't fail the request for audit errors
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

    // Get existing task for audit logging
    const { data: existingTask } = await supabase
      .from('task_executions')
      .select('status, task_type')
      .eq('id', id)
      .single();

    let taskExecution;
    try {
      taskExecution = await updateTaskExecution(id, updateData);
      
      // Get the task execution with related data for the response
      const { data: taskWithRelations, error: selectError } = await supabase
        .from('task_executions')
        .select(`
          *,
          workflows!workflow_id(id, title, client_id),
          agents!agent_id(id, name, type)
        `)
        .eq('id', id)
        .single();
      
      if (selectError) {
        console.error('Error fetching task execution details:', selectError);
        // Return the basic task execution if we can't get relations
      } else {
        taskExecution = taskWithRelations;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('PGRST116')) {
        return c.json({
          success: false,
          error: 'Task execution not found',
        }, 404 as any);
      }
      throw new Error(`Failed to update task execution: ${errorMessage}`);
    }

    // Log audit event for task update
    try {
      await auditLogger.log({
        actor_type: 'human',
        actor_id: user.id,
        actor_name: user.email,
        event_type: 'task_execution',
        action: 'update',
        resource_type: 'task_execution',
        resource_id: taskExecution.id,
        workflow_id: taskExecution.workflow_id,
        event_data: {
          task_type: taskExecution.task_type,
          old_status: existingTask?.status,
          new_status: taskExecution.status,
          updated_fields: Object.keys(updateData),
          update_method: 'by_id'
        }
      });
    } catch (auditError) {
      console.error('Failed to log audit event for task update:', auditError);
      // Don't fail the request for audit errors
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