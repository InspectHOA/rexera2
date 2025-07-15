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
import {
  authMiddleware,
  rateLimitMiddleware,
  securityHeadersMiddleware,
  requestValidationMiddleware,
  errorHandlerMiddleware,
  corsMiddleware,
  getEndpointRateLimit,
  type AuthUser
} from './middleware';

const app = new Hono();

// Global Middleware
app.use('*', errorHandlerMiddleware);
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', corsMiddleware);
app.use('*', securityHeadersMiddleware);
app.use('*', requestValidationMiddleware);
app.use('*', rateLimitMiddleware());

// ============================================================================
// PUBLIC ENDPOINTS (No Auth Required)
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
// PROTECTED ENDPOINTS (Authentication Required)
// ============================================================================

// Apply authentication middleware to all protected routes
app.use('/api/agents/*', authMiddleware);
app.use('/api/workflows/*', authMiddleware);
app.use('/api/task-executions/*', authMiddleware);
app.use('/api/communications/*', authMiddleware);
app.use('/api/documents/*', authMiddleware);
app.use('/api/interrupts/*', authMiddleware);
app.use('/api/costs/*', authMiddleware);
app.use('/api/activities/*', authMiddleware);

// Simplified auth - no HIL-only restrictions

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
    const user = c.get('user') as AuthUser;
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
    if (assigned_to) dbQuery = dbQuery.eq('assigned_to', assigned_to);
    if (priority) dbQuery = dbQuery.eq('priority', priority);

    // Simplified auth - no company filtering, just apply client_id filter if provided
    if (client_id) {
      dbQuery = dbQuery.eq('client_id', client_id);
    }

    // Apply sorting
    const sortField = sortBy || 'created_at';
    const ascending = sortDirection === 'asc';
    
    // Handle interrupt count sorting specially since it requires aggregation
    if (sortField === 'interrupt_count') {
      // For interrupt count, we need to sort by the count of AWAITING_REVIEW tasks
      // This is more complex and will be handled after the main query
    } else {
      dbQuery = dbQuery.order(sortField, { ascending });
    }

    // Apply pagination (skip for interrupt_count sorting as we need all data first)
    if (sortField !== 'interrupt_count') {
      const offset = (page - 1) * limit;
      dbQuery = dbQuery.range(offset, offset + limit - 1);
    }

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

    // Handle interrupt count sorting after main query
    if (sortField === 'interrupt_count') {
      transformedWorkflows = transformedWorkflows
        .map((workflow: any) => {
          // Calculate interrupt count for each workflow
          const interruptCount = (workflow.task_executions || workflow.tasks || [])
            .filter((task: any) => task.status === 'AWAITING_REVIEW').length;
          return { ...workflow, interrupt_count: interruptCount };
        })
        .sort((a: any, b: any) => {
          // Sort by interrupt count
          const diff = a.interrupt_count - b.interrupt_count;
          return ascending ? diff : -diff;
        });
      
      // Apply pagination after sorting for interrupt_count
      const offset = (page - 1) * limit;
      transformedWorkflows = transformedWorkflows.slice(offset, offset + limit);
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
    const user = c.get('user') as AuthUser;
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
      let query = supabase
        .from('workflows')
        .select(selectString)
        .eq('id', id);

      // Simplified auth - no company filtering

      const { data, error } = await query.single();
      
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
      
      // Simplified auth - no company filtering for human-readable ID lookup
      
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

app.get('/api/openapi.json', (c) => {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://api.rexera.com' 
    : 'http://localhost:3001';

  return c.json({
    "openapi": "3.0.0",
    "info": {
      "title": "Rexera API",
      "version": "2.0.0",
      "description": "# Rexera Real Estate Workflow Automation API\n\n## Overview\nRexera is a dual-layer platform that combines:\n- **PostgreSQL + Next.js**: Business visibility and workflow management\n- **n8n Cloud**: Workflow orchestration and automation\n\n## Authentication\nAll API endpoints (except health check) require JWT authentication via Supabase Auth.\n\nInclude the JWT token in the Authorization header:\n```\nAuthorization: Bearer <your-jwt-token>\n```\n\n## Workflow Types\n- **PAYOFF_REQUEST**: Mortgage payoff request processing\n- **HOA_ACQUISITION**: HOA acquisition workflows  \n- **MUNI_LIEN_SEARCH**: Municipal lien search processes",
      "contact": {
        "name": "Rexera API Support",
        "email": "support@rexera.com"
      }
    },
    "servers": [
      {
        "url": baseUrl,
        "description": process.env.NODE_ENV === 'production' ? 'Production' : 'Development'
      }
    ],
    "security": [
      {
        "bearerAuth": []
      }
    ],
    "components": {
      "securitySchemes": {
        "bearerAuth": {
          "type": "http",
          "scheme": "bearer",
          "bearerFormat": "JWT",
          "description": "Supabase JWT token obtained from authentication"
        }
      },
      "schemas": {
        "ErrorResponse": {
          "type": "object",
          "properties": {
            "success": { "type": "boolean", "example": false },
            "error": {
              "type": "object",
              "properties": {
                "code": { "type": "string", "example": "NOT_FOUND" },
                "message": { "type": "string", "example": "Resource not found" },
                "timestamp": { "type": "string", "format": "date-time" }
              }
            }
          }
        },
        "Workflow": {
          "type": "object",
          "properties": {
            "id": { "type": "string", "format": "uuid" },
            "workflow_type": { "type": "string", "enum": ["MUNI_LIEN_SEARCH", "HOA_ACQUISITION", "PAYOFF_REQUEST"] },
            "client_id": { "type": "string", "format": "uuid" },
            "title": { "type": "string" },
            "status": { "type": "string", "enum": ["PENDING", "IN_PROGRESS", "AWAITING_REVIEW", "BLOCKED", "COMPLETED"] },
            "priority": { "type": "string", "enum": ["LOW", "NORMAL", "HIGH", "URGENT"] },
            "created_at": { "type": "string", "format": "date-time" },
            "updated_at": { "type": "string", "format": "date-time" },
            "human_readable_id": { "type": "integer" }
          }
        }
      }
    },
    "tags": [
      { "name": "System", "description": "System health and information endpoints" },
      { "name": "Workflows", "description": "Workflow management and tracking" },
      { "name": "Task Executions", "description": "Individual task execution within workflows" },
      { "name": "Agents", "description": "AI agent management and status" }
    ],
    "paths": {
      "/api/health": {
        "get": {
          "tags": ["System"],
          "summary": "Health Check",
          "description": "Check API health status",
          "security": [],
          "responses": {
            "200": {
              "description": "API is healthy",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": { "type": "boolean", "example": true },
                      "message": { "type": "string", "example": "Rexera API is running" },
                      "timestamp": { "type": "string", "format": "date-time" },
                      "environment": { "type": "string", "example": "development" },
                      "version": { "type": "string", "example": "2.0.0" }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "/api/workflows": {
        "get": {
          "tags": ["Workflows"],
          "summary": "List Workflows",
          "description": "Retrieve a paginated list of workflows with optional filtering",
          "parameters": [
            { "name": "workflow_type", "in": "query", "schema": { "type": "string", "enum": ["MUNI_LIEN_SEARCH", "HOA_ACQUISITION", "PAYOFF_REQUEST"] } },
            { "name": "status", "in": "query", "schema": { "type": "string", "enum": ["PENDING", "IN_PROGRESS", "AWAITING_REVIEW", "BLOCKED", "COMPLETED"] } },
            { "name": "page", "in": "query", "schema": { "type": "integer", "minimum": 1, "default": 1 } },
            { "name": "limit", "in": "query", "schema": { "type": "integer", "minimum": 1, "maximum": 100, "default": 20 } }
          ],
          "responses": {
            "200": {
              "description": "Successfully retrieved workflows",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": { "type": "boolean", "example": true },
                      "data": { "type": "array", "items": { "$ref": "#/components/schemas/Workflow" } },
                      "pagination": {
                        "type": "object",
                        "properties": {
                          "page": { "type": "integer" },
                          "limit": { "type": "integer" },
                          "total": { "type": "integer" },
                          "totalPages": { "type": "integer" }
                        }
                      }
                    }
                  }
                }
              }
            },
            "401": { "description": "Authentication required", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/ErrorResponse" } } } }
          }
        },
        "post": {
          "tags": ["Workflows"],
          "summary": "Create Workflow",
          "description": "Create a new workflow instance",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": ["workflow_type", "client_id", "title", "created_by"],
                  "properties": {
                    "workflow_type": { "type": "string", "enum": ["MUNI_LIEN_SEARCH", "HOA_ACQUISITION", "PAYOFF_REQUEST"] },
                    "client_id": { "type": "string", "format": "uuid" },
                    "title": { "type": "string" },
                    "created_by": { "type": "string", "format": "uuid" }
                  }
                }
              }
            }
          },
          "responses": {
            "201": { "description": "Workflow created successfully" },
            "400": { "description": "Invalid request data" },
            "401": { "description": "Authentication required" }
          }
        }
      },
      "/api/workflows/{id}": {
        "get": {
          "tags": ["Workflows"],
          "summary": "Get Workflow",
          "description": "Retrieve a specific workflow by ID",
          "parameters": [
            { "name": "id", "in": "path", "required": true, "schema": { "type": "string" }, "description": "Workflow ID (UUID or human-readable ID)" }
          ],
          "responses": {
            "200": { "description": "Successfully retrieved workflow" },
            "404": { "description": "Workflow not found" },
            "401": { "description": "Authentication required" }
          }
        }
      },
      "/api/task-executions": {
        "get": {
          "tags": ["Task Executions"],
          "summary": "List Task Executions",
          "description": "Retrieve task executions for a workflow",
          "parameters": [
            { "name": "workflowId", "in": "query", "required": true, "schema": { "type": "string", "format": "uuid" } }
          ],
          "responses": {
            "200": { "description": "Successfully retrieved task executions" },
            "401": { "description": "Authentication required" }
          }
        }
      },
      "/api/agents": {
        "get": {
          "tags": ["Agents"],
          "summary": "List Agents",
          "description": "Retrieve a list of AI agents",
          "responses": {
            "200": { "description": "Successfully retrieved agents" },
            "401": { "description": "Authentication required" }
          }
        }
      }
    }
  });
});

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