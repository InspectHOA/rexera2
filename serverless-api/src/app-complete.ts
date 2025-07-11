import { Hono } from 'hono';
import { swaggerUI } from '@hono/swagger-ui';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { handle } from 'hono/vercel';
import { createServerClient } from './utils/database';
import { resolveWorkflowId, getWorkflowByHumanId, isUUID } from './utils/workflow-resolver';
import { 
  WorkflowFiltersSchema, 
  CreateWorkflowSchema,
  CreateTaskExecutionSchema,
  UpdateTaskExecutionSchema 
} from '@rexera/shared';
import { z } from 'zod';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', cors({
  origin: ['http://localhost:3000', 'https://*.vercel.app'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/api/health', (c) => {
  return c.json({
    success: true,
    message: 'API server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ============================================================================
// AGENTS ENDPOINTS
// ============================================================================

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

// GET /api/agents - List agents
app.get('/api/agents', async (c) => {
  try {
    const supabase = createServerClient();
    const rawQuery = c.req.query();
    const result = getAgentsSchema.safeParse(rawQuery);
    
    if (!result.success) {
      return c.json({
        success: false,
        error: 'Invalid query parameters',
        details: result.error.issues,
      }, 400);
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
      throw new Error(`Failed to fetch agents: ${error.message}`);
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return c.json({
      success: true,
      data: agents || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to retrieve agents',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// GET /api/agents/:id - Get single agent
app.get('/api/agents/:id', async (c) => {
  try {
    const supabase = createServerClient();
    const id = c.req.param('id');

    if (!z.string().uuid().safeParse(id).success) {
      return c.json({
        success: false,
        error: 'Invalid agent ID format',
      }, 400);
    }

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
        }, 404);
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
      error: 'Failed to retrieve agent',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// POST /api/agents - Update agent status (heartbeat)
app.post('/api/agents', async (c) => {
  try {
    const supabase = createServerClient();
    const id = c.req.query('id');
    const body = await c.req.json();

    if (!id) {
      return c.json({
        success: false,
        error: 'Agent ID is required as query parameter',
      }, 400);
    }

    const result = updateAgentSchema.safeParse(body);
    if (!result.success) {
      return c.json({
        success: false,
        error: 'Invalid request body',
        details: result.error.issues,
      }, 400);
    }

    const { data: agent, error } = await supabase
      .from('agents')
      .update({
        ...result.data,
        last_heartbeat: result.data.last_heartbeat || new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({
          success: false,
          error: 'Agent not found',
        }, 404);
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
    }, 500);
  }
});

// ============================================================================
// WORKFLOWS ENDPOINTS  
// ============================================================================

// GET /api/workflows - List workflows with filters and pagination
app.get('/api/workflows', async (c) => {
  try {
    const supabase = createServerClient();
    const rawQuery = c.req.query();
    const result = WorkflowFiltersSchema.safeParse(rawQuery);
    
    if (!result.success) {
      return c.json({
        success: false,
        error: 'Invalid query parameters',
        details: result.error.issues,
      }, 400);
    }
    
    const {
      workflow_type,
      status,
      client_id,
      assigned_to,
      priority,
      page,
      limit,
      include,
      sortBy,
      sortDirection,
    } = result.data;

    // Build select string based on includes
    const includeArray = include ? include.split(',') : [];
    let selectString = `
      id,
      workflow_type,
      client_id,
      title,
      description,
      status,
      priority,
      metadata,
      created_by,
      assigned_to,
      created_at,
      updated_at,
      completed_at,
      due_date,
      human_readable_id
    `;
    
    if (includeArray.includes('client')) {
      selectString += `, client:clients(id, name, domain)`;
    }
    
    if (includeArray.includes('tasks')) {
      selectString += `, task_executions(*, agents!agent_id(id, name, type))`;
    }

    let dbQuery = supabase
      .from('workflows')
      .select(selectString, { count: 'exact' });

    // Apply filters
    if (workflow_type) dbQuery = dbQuery.eq('workflow_type', workflow_type);
    if (status) dbQuery = dbQuery.eq('status', status);
    if (client_id) dbQuery = dbQuery.eq('client_id', client_id);
    if (assigned_to) dbQuery = dbQuery.eq('assigned_to', assigned_to);
    if (priority) dbQuery = dbQuery.eq('priority', priority);

    // Apply sorting
    const sortField = sortBy || 'created_at';
    const ascending = sortDirection === 'asc';
    dbQuery = dbQuery.order(sortField, { ascending });

    // Apply pagination
    const offset = (page - 1) * limit;
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data: workflows, error, count } = await dbQuery;

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    // Manually join agent data for tasks if needed
    let transformedWorkflows = workflows || [];
    
    if (includeArray.includes('tasks') && transformedWorkflows.length > 0) {
      // Get all unique agent IDs from tasks
      const agentIds = [...new Set(
        transformedWorkflows
          .flatMap((w: any) => w.task_executions || [])
          .map((t: any) => t.agent_id)
          .filter(Boolean)
      )];
      
      // Fetch agents if we have agent IDs
      let agentsMap: { [key: string]: any } = {};
      if (agentIds.length > 0) {
        const { data: agents } = await supabase
          .from('agents')
          .select('id, name, type')
          .in('id', agentIds);
        
        // Create agents lookup map
        agentsMap = (agents || []).reduce((acc: any, agent: any) => {
          acc[agent.id] = agent;
          return acc;
        }, {});
      }
      
      // Join agent data to tasks
      transformedWorkflows = transformedWorkflows.map((workflow: any) => ({
        ...workflow,
        clients: workflow.client,
        tasks: (workflow.task_executions || []).map((task: any) => ({
          ...task,
          agents: task.agent_id ? agentsMap[task.agent_id] : null
        })),
        task_executions: (workflow.task_executions || []).map((task: any) => ({
          ...task,
          agents: task.agent_id ? agentsMap[task.agent_id] : null
        }))
      }));
    } else {
      // Transform workflows for frontend compatibility without agent joins
      transformedWorkflows = workflows?.map((workflow: any) => ({
        ...workflow,
        clients: workflow.client,
        tasks: workflow.task_executions || [],
      })) || [];
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return c.json({
      success: true,
      data: transformedWorkflows,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
      },
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to retrieve workflows',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// POST /api/workflows - Create new workflow
app.post('/api/workflows', async (c) => {
  try {
    const supabase = createServerClient();
    const body = await c.req.json();
    
    const result = CreateWorkflowSchema.safeParse(body);
    if (!result.success) {
      return c.json({
        success: false,
        error: 'Invalid request body',
        details: result.error.issues,
      }, 400);
    }
    
    const {
      workflow_type,
      client_id,
      title,
      description,
      priority,
      metadata,
      due_date,
      created_by,
    } = result.data;

    const { data: workflow, error } = await supabase
      .from('workflows')
      .insert({
        workflow_type,
        client_id,
        title,
        description,
        priority,
        metadata,
        due_date,
        created_by,
      })
      .select(`
        id,
        workflow_type,
        client_id,
        title,
        description,
        status,
        priority,
        metadata,
        created_by,
        assigned_to,
        created_at,
        updated_at,
        completed_at,
        due_date,
        human_readable_id,
        client:clients(id, name, domain)
      `)
      .single();

    if (error) {
      throw new Error(`Failed to create workflow: ${error.message}`);
    }

    return c.json({
      success: true,
      data: {
        ...workflow,
        clients: workflow.client,
      },
    }, 201);
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to create workflow',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// GET /api/workflows/:id - Get single workflow
app.get('/api/workflows/:id', async (c) => {
  try {
    const supabase = createServerClient();
    const id = c.req.param('id');

    const selectString = `
      id,
      workflow_type,
      client_id,
      title,
      description,
      status,
      priority,
      metadata,
      created_by,
      assigned_to,
      created_at,
      updated_at,
      completed_at,
      due_date,
      human_readable_id,
      client:clients(id, name, domain),
      task_executions(*, agents!agent_id(id, name, type))
    `;

    let workflow: any = null;
    
    // If it's a UUID, query directly by ID
    if (isUUID(id)) {
      const { data, error } = await supabase
        .from('workflows')
        .select(selectString)
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return c.json({
            success: false,
            error: 'Workflow not found',
          }, 404);
        }
        throw new Error(`Failed to fetch workflow: ${error.message}`);
      }
      workflow = data;
    } else {
      // Otherwise, look up by human-readable ID
      workflow = await getWorkflowByHumanId(supabase, id, selectString);
      
      if (!workflow) {
        return c.json({
          success: false,
          error: 'Workflow not found',
        }, 404);
      }
    }

    // At this point, workflow is guaranteed to be a valid object
    if (!workflow) {
      return c.json({
        success: false,
        error: 'Workflow not found',
      }, 404);
    }

    // Manually join agent data for tasks
    if (workflow.task_executions && workflow.task_executions.length > 0) {
      // Get all unique agent IDs from tasks
      const agentIds = [...new Set(
        workflow.task_executions
          .map((t: any) => t.agent_id)
          .filter(Boolean)
      )];
      
      // Fetch agents if we have agent IDs
      let agentsMap: { [key: string]: any } = {};
      if (agentIds.length > 0) {
        const { data: agents } = await supabase
          .from('agents')
          .select('id, name, type')
          .in('id', agentIds);
        
        // Create agents lookup map
        agentsMap = (agents || []).reduce((acc: any, agent: any) => {
          acc[agent.id] = agent;
          return acc;
        }, {});
      }
      
      // Join agent data to tasks
      workflow.task_executions = workflow.task_executions.map((task: any) => ({
        ...task,
        agents: task.agent_id ? agentsMap[task.agent_id] : null
      }));
    }

    // Clean response structure - frontend expects specific format
    return c.json({
      success: true,
      data: {
        ...workflow,
        clients: workflow.client, // Frontend expects 'clients'
        tasks: workflow.task_executions || [], // Frontend expects 'tasks' 
        task_executions: workflow.task_executions || [], // Keep for backwards compatibility
      },
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to retrieve workflow',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// ============================================================================
// TASK EXECUTIONS ENDPOINTS
// ============================================================================

// GET /api/task-executions - List task executions by workflow
app.get('/api/task-executions', async (c) => {
  try {
    const supabase = createServerClient();
    const workflowId = c.req.query('workflowId');
    const include = c.req.query('include');
    
    // Build select string based on includes
    let selectString = '*';
    if (include) {
      const includeArray = include.split(',').map(s => s.trim());
      if (includeArray.includes('agent')) {
        selectString = '*, agents!agent_id(id, name, type)';
      }
    }

    let query = supabase
      .from('task_executions')
      .select(selectString)
      .order('sequence_order', { ascending: true });

    // If workflowId is provided, filter by it
    if (workflowId) {
      const actualWorkflowId = await resolveWorkflowId(supabase, workflowId);
      query = query.eq('workflow_id', actualWorkflowId);
    }
    
    const { data, error } = await query;

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    return c.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to retrieve task executions',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// POST /api/task-executions - Create single/bulk task executions
app.post('/api/task-executions', async (c) => {
  try {
    const supabase = createServerClient();
    const body = await c.req.json();

    // Check if it's bulk creation
    if (Array.isArray(body)) {
      const { data, error } = await supabase
        .from('task_executions')
        .insert(body)
        .select();

      if (error) {
        throw new Error(`Failed to bulk create task executions: ${error.message}`);
      }

      return c.json({
        success: true,
        data: data || [],
      }, 201);
    } else {
      const result = CreateTaskExecutionSchema.safeParse(body);
      if (!result.success) {
        return c.json({
          success: false,
          error: 'Invalid request body',
          details: result.error.issues,
        }, 400);
      }

      const { data, error } = await supabase
        .from('task_executions')
        .insert(result.data)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create task execution: ${error.message}`);
      }

      return c.json({
        success: true,
        data,
      }, 201);
    }
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to create task execution(s)',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// POST /api/task-executions/bulk - Explicit bulk endpoint
app.post('/api/task-executions/bulk', async (c) => {
  try {
    const supabase = createServerClient();
    const body = await c.req.json();

    const { data, error } = await supabase
      .from('task_executions')
      .insert(body)
      .select();

    if (error) {
      throw new Error(`Failed to bulk create task executions: ${error.message}`);
    }

    return c.json({
      success: true,
      data: data || [],
    }, 201);
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to bulk create task executions',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// PATCH /api/task-executions/:id - Update task execution
app.patch('/api/task-executions/:id', async (c) => {
  try {
    const supabase = createServerClient();
    const id = c.req.param('id');
    const body = await c.req.json();

    const result = UpdateTaskExecutionSchema.safeParse(body);
    if (!result.success) {
      return c.json({
        success: false,
        error: 'Invalid request body',
        details: result.error.issues,
      }, 400);
    }

    const { data, error } = await supabase
      .from('task_executions')
      .update(result.data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({
          success: false,
          error: 'Task execution not found',
        }, 404);
      }
      throw new Error(`Failed to update task execution: ${error.message}`);
    }

    return c.json({
      success: true,
      data,
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to update task execution',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// ============================================================================
// ACTIVITIES ENDPOINTS
// ============================================================================

const getActivitiesSchema = z.object({
  workflow_id: z.string().optional(),
  type: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// GET /api/activities - List activities
app.get('/api/activities', async (c) => {
  try {
    const supabase = createServerClient();
    const rawQuery = c.req.query();
    const result = getActivitiesSchema.safeParse(rawQuery);
    
    if (!result.success) {
      return c.json({
        success: false,
        error: 'Invalid query parameters',
        details: result.error.issues,
      }, 400);
    }

    const { workflow_id, type, start_date, end_date, page, limit } = result.data;

    let query = supabase
      .from('activities')
      .select('*', { count: 'exact' });

    // Apply filters
    if (workflow_id) query = query.eq('workflow_id', workflow_id);
    if (type) query = query.eq('type', type);
    if (start_date) query = query.gte('created_at', start_date);
    if (end_date) query = query.lte('created_at', end_date);

    // Apply pagination and ordering
    const offset = (page - 1) * limit;
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: activities, error, count } = await query;

    if (error) {
      // Handle case where activities table doesn't exist yet
      if (error.message?.includes('relation "public.activities" does not exist')) {
        return c.json({
          success: true,
          data: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0
          }
        });
      }
      throw new Error(`Failed to fetch activities: ${error.message}`);
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return c.json({
      success: true,
      data: activities || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to retrieve activities',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// ============================================================================
// COMMUNICATIONS ENDPOINTS
// ============================================================================

const getCommunicationsSchema = z.object({
  workflow_id: z.string().optional(),
  direction: z.enum(['INBOUND', 'OUTBOUND']).optional(),
  status: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// GET /api/communications - List communications
app.get('/api/communications', async (c) => {
  try {
    const supabase = createServerClient();
    const rawQuery = c.req.query();
    const result = getCommunicationsSchema.safeParse(rawQuery);
    
    if (!result.success) {
      return c.json({
        success: false,
        error: 'Invalid query parameters',
        details: result.error.issues,
      }, 400);
    }

    const { workflow_id, direction, status, page, limit } = result.data;

    let query = supabase
      .from('communications')
      .select('*', { count: 'exact' });

    // Apply filters
    if (workflow_id) query = query.eq('workflow_id', workflow_id);
    if (direction) query = query.eq('direction', direction);
    if (status) query = query.eq('status', status);

    // Apply pagination and ordering
    const offset = (page - 1) * limit;
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: communications, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch communications: ${error.message}`);
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return c.json({
      success: true,
      data: communications || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to retrieve communications',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// ============================================================================
// INTERRUPTS ENDPOINTS  
// ============================================================================

const getInterruptsSchema = z.object({
  workflow_id: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  resolved: z.string().optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// GET /api/interrupts - List interrupts
app.get('/api/interrupts', async (c) => {
  try {
    const supabase = createServerClient();
    const rawQuery = c.req.query();
    const result = getInterruptsSchema.safeParse(rawQuery);
    
    if (!result.success) {
      return c.json({
        success: false,
        error: 'Invalid query parameters',
        details: result.error.issues,
      }, 400);
    }

    const { workflow_id, type, status, resolved, page, limit } = result.data;

    let query = supabase
      .from('task_executions')
      .select('*', { count: 'exact' })
      .not('interrupt_type', 'is', null);

    // Apply filters
    if (workflow_id) query = query.eq('workflow_id', workflow_id);
    if (type) query = query.eq('interrupt_type', type);
    if (status) query = query.eq('status', status);
    if (resolved !== undefined) {
      query = resolved ? query.eq('status', 'COMPLETED') : query.neq('status', 'COMPLETED');
    }

    // Apply pagination and ordering
    const offset = (page - 1) * limit;
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: interrupts, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch interrupts: ${error.message}`);
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return c.json({
      success: true,
      data: interrupts || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to retrieve interrupts',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// PATCH /api/interrupts/:id - Resolve interrupt
app.patch('/api/interrupts/:id', async (c) => {
  try {
    const supabase = createServerClient();
    const id = c.req.param('id');
    const body = await c.req.json();

    const updateSchema = z.object({
      status: z.enum(['PENDING', 'AWAITING_REVIEW', 'COMPLETED', 'FAILED']).optional(),
      resolution_notes: z.string().optional(),
      resolved_by: z.string().uuid().optional(),
    });

    const result = updateSchema.safeParse(body);
    if (!result.success) {
      return c.json({
        success: false,
        error: 'Invalid request body',
        details: result.error.issues,
      }, 400);
    }

    const { data, error } = await supabase
      .from('task_executions')
      .update({
        ...result.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .not('interrupt_type', 'is', null)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({
          success: false,
          error: 'Interrupt not found',
        }, 404);
      }
      throw new Error(`Failed to update interrupt: ${error.message}`);
    }

    return c.json({
      success: true,
      data,
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to resolve interrupt',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// ============================================================================
// INCOMING EMAIL ENDPOINT
// ============================================================================

const processEmailSchema = z.object({
  workflow_id: z.string().uuid().optional(),
  email_data: z.object({
    from: z.string().email(),
    to: z.string().email().optional(),
    subject: z.string(),
    body: z.string(),
    received_at: z.string(),
    attachments: z.array(z.any()).optional(),
  }),
});

// POST /api/incoming-email - Process incoming email
app.post('/api/incoming-email', async (c) => {
  try {
    const supabase = createServerClient();
    const body = await c.req.json();

    const result = processEmailSchema.safeParse(body);
    if (!result.success) {
      return c.json({
        success: false,
        error: 'Invalid request body',
        details: result.error.issues,
      }, 400);
    }

    const { workflow_id, email_data } = result.data;

    // Store the incoming email in communications table
    const { data: communication, error: commError } = await supabase
      .from('communications')
      .insert({
        workflow_id,
        direction: 'INBOUND',
        type: 'EMAIL',
        subject: email_data.subject,
        content: email_data.body,
        from_address: email_data.from,
        to_address: email_data.to,
        status: 'RECEIVED',
        received_at: email_data.received_at,
        metadata: {
          attachments: email_data.attachments?.length || 0,
          original_data: email_data,
        },
      })
      .select()
      .single();

    if (commError) {
      throw new Error(`Failed to store email: ${commError.message}`);
    }

    // If workflow_id is provided, create a follow-up task
    if (workflow_id) {
      const { error: taskError } = await supabase
        .from('task_executions')
        .insert({
          workflow_id,
          title: 'Process Incoming Email',
          description: `Process email from ${email_data.from}: ${email_data.subject}`,
          task_type: 'EMAIL_PROCESSING',
          status: 'PENDING',
          executor_type: 'AI',
          priority: 'NORMAL',
          sequence_order: 999, // High sequence to run after other tasks
          input_data: {
            communication_id: communication.id,
            email_data,
          },
        });

      if (taskError) {
        console.error('Failed to create follow-up task:', taskError);
        // Don't fail the whole request if task creation fails
      }
    }

    return c.json({
      success: true,
      data: {
        communication_id: communication.id,
        message: 'Email processed successfully',
        created_task: !!workflow_id,
      },
    }, 201);
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to process incoming email',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// ============================================================================
// WEBHOOKS ENDPOINTS
// ============================================================================

// POST /api/webhooks/n8n - n8n webhook handler
app.post('/api/webhooks/n8n', async (c) => {
  try {
    const supabase = createServerClient();
    const body = await c.req.json();

    // Basic validation for n8n webhook payload
    const webhookSchema = z.object({
      workflow_id: z.string().uuid(),
      execution_id: z.string(),
      status: z.enum(['RUNNING', 'SUCCESS', 'ERROR', 'WAITING']),
      data: z.any().optional(),
      error: z.string().optional(),
    });

    const result = webhookSchema.safeParse(body);
    if (!result.success) {
      return c.json({
        success: false,
        error: 'Invalid webhook payload',
        details: result.error.issues,
      }, 400);
    }

    const { workflow_id, execution_id, status, data, error: webhookError } = result.data;

    // Update workflow with n8n execution info
    const { error: updateError } = await supabase
      .from('workflows')
      .update({
        n8n_execution_id: execution_id,
        status: status === 'SUCCESS' ? 'COMPLETED' : 
                status === 'ERROR' ? 'BLOCKED' : 'IN_PROGRESS',
        updated_at: new Date().toISOString(),
        ...(status === 'SUCCESS' ? { completed_at: new Date().toISOString() } : {}),
      })
      .eq('id', workflow_id);

    if (updateError) {
      console.error('Failed to update workflow:', updateError);
    }

    // Log the webhook event
    const { error: logError } = await supabase
      .from('activities')
      .insert({
        workflow_id,
        type: 'N8N_WEBHOOK',
        description: `n8n execution ${status}: ${execution_id}`,
        metadata: {
          execution_id,
          status,
          data,
          error: webhookError,
        },
      });

    if (logError) {
      console.error('Failed to log webhook event:', logError);
    }

    return c.json({
      success: true,
      message: 'Webhook processed successfully',
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to process webhook',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// ============================================================================
// OPTIONS ENDPOINT
// ============================================================================

// GET /api/options - Simple endpoint that returns OK
app.get('/api/options', (c) => {
  return c.json({
    success: true,
    message: 'Options endpoint is working',
  });
});

// ============================================================================
// OpenAPI specification  
// ============================================================================

app.get('/api/openapi.json', (c) => c.json({
  openapi: '3.0.0',
  info: {
    version: '2.0.0',
    title: 'Rexera API',
    description: 'Complete Real Estate Workflow Automation Platform API - Dual-layer architecture with n8n Cloud integration',
    contact: {
      name: 'Rexera Development Team',
      email: 'dev@rexera.com',
    },
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Development server',
    },
    {
      url: 'https://api.rexera.com',
      description: 'Production server',
    },
  ],
  tags: [
    { name: 'System', description: 'System health and status endpoints' },
    { name: 'Agents', description: 'AI agent management and monitoring' },
    { name: 'Workflows', description: 'Workflow management endpoints' },
    { name: 'Task Executions', description: 'Task execution management' },
    { name: 'Activities', description: 'Activity logging and tracking' },
    { name: 'Communications', description: 'Email and communication management' },
    { name: 'Interrupts', description: 'Workflow interrupt management' },
    { name: 'Webhooks', description: 'External system integrations' },
  ],
  paths: {
    '/api/health': {
      get: {
        summary: 'Health Check',
        tags: ['System'],
        responses: {
          200: {
            description: 'API is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    timestamp: { type: 'string', format: 'date-time' },
                    environment: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/agents': {
      get: {
        summary: 'List agents',
        tags: ['Agents'],
        parameters: [
          { name: 'is_active', in: 'query', schema: { type: 'boolean' } },
          { name: 'type', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100 } },
        ],
        responses: {
          200: { description: 'Agents retrieved successfully' }
        }
      },
      post: {
        summary: 'Update agent status',
        tags: ['Agents'],
        parameters: [
          { name: 'id', in: 'query', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          200: { description: 'Agent updated successfully' }
        }
      }
    },
    // Additional paths would be added for all other endpoints...
  }
}));

// Swagger UI
app.get('/api/docs', swaggerUI({ 
  url: '/api/openapi.json',
}));

// Root endpoint
app.get('/', (c) => c.json({ 
  message: 'Rexera API v2.0 - Complete Real Estate Workflow Automation',
  description: 'Dual-layer architecture: PostgreSQL + Next.js (business visibility) + n8n Cloud (workflow orchestration)',
  endpoints: {
    health: '/api/health',
    agents: '/api/agents',
    workflows: '/api/workflows',
    taskExecutions: '/api/task-executions',
    activities: '/api/activities',
    communications: '/api/communications',
    interrupts: '/api/interrupts',
    incomingEmail: '/api/incoming-email',
    webhooks: '/api/webhooks/n8n',
    options: '/api/options',
  },
  docs: '/api/docs',
  openapi: '/api/openapi.json',
  version: '2.0.0',
}));

// Export the raw Hono app for development server
export { app };

// Export the Vercel handler as default for serverless deployment
export default handle(app);