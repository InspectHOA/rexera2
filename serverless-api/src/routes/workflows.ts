/**
 * Workflow Routes for Rexera API
 * 
 * Handles all workflow-related endpoints
 */

import { Hono } from 'hono';
import { createServerClient } from '../utils/database';
import { clientDataMiddleware, getCompanyFilter, type AuthUser } from '../middleware';
import { resolveWorkflowId, getWorkflowByHumanId, isUUID } from '../utils/workflow-resolver';
import { 
  WorkflowFiltersSchema, 
  CreateWorkflowSchema
} from '@rexera/shared';

const workflows = new Hono();

// Apply client data middleware to all workflow routes (except in test mode)
if (process.env.NODE_ENV !== 'test') {
  workflows.use('*', clientDataMiddleware);
}

// GET /api/workflows - List workflows with filters and pagination
workflows.get('/', async (c) => {
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
    const result = WorkflowFiltersSchema.safeParse(rawQuery);
    
    if (!result.success) {
      return c.json({
        success: false,
        error: 'Invalid query parameters',
        details: result.error.issues,
      }, 400 as any);
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

    // Apply client access control
    const companyFilter = getCompanyFilter(user);
    if (companyFilter) {
      // Client users can only see their own company's workflows
      dbQuery = dbQuery.eq('client_id', companyFilter);
    } else if (client_id) {
      // HIL users can filter by specific client_id if provided
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

    let transformedWorkflows = workflows || [];

    // Handle interrupt count sorting if needed
    if (sortField === 'interrupt_count') {
      transformedWorkflows = transformedWorkflows
        .map((workflow: any) => {
          const interruptCount = workflow.task_executions
            ? workflow.task_executions
                .filter((task: any) => task.status === 'AWAITING_REVIEW').length
            : 0;
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
        total: count,
        totalPages,
      },
    });

  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to fetch workflows',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500 as any);
  }
});

// POST /api/workflows - Create new workflow
workflows.post('/', async (c) => {
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
    const result = CreateWorkflowSchema.safeParse(body);

    if (!result.success) {
      return c.json({
        success: false,
        error: 'Invalid request body',
        details: result.error.issues,
      }, 400 as any);
    }

    const workflowData = result.data;

    // Apply client access control for creation
    const companyFilter = getCompanyFilter(user);
    if (companyFilter && workflowData.client_id !== companyFilter) {
      return c.json({
        success: false,
        error: 'Access denied. Cannot create workflow for different company.',
      }, 403 as any);
    }

    const { data: workflow, error } = await supabase
      .from('workflows')
      .insert(workflowData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create workflow: ${error.message}`);
    }

    return c.json({
      success: true,
      data: workflow,
    }, 201 as any);

  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to create workflow',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500 as any);
  }
});

// GET /api/workflows/:id - Get single workflow
workflows.get('/:id', async (c) => {
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

      // Apply client access control
      const companyFilter = getCompanyFilter(user);
      if (companyFilter) {
        query = query.eq('client_id', companyFilter);
      }

      const { data, error } = await query.single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return c.json({
            success: false,
            error: 'Workflow not found',
          }, 404 as any);
        }
        throw new Error(`Failed to fetch workflow: ${error.message}`);
      }
      workflow = data;
    } else {
      // Otherwise, look up by human-readable ID
      workflow = await getWorkflowByHumanId(supabase, id, selectString);
      
      // Apply client access control for human-readable ID lookup
      const companyFilter = getCompanyFilter(user);
      if (companyFilter && workflow && workflow.client_id !== companyFilter) {
        return c.json({
          success: false,
          error: 'Workflow not found',
        }, 404 as any);
      }
      
      if (!workflow) {
        return c.json({
          success: false,
          error: 'Workflow not found',
        }, 404 as any);
      }
    }

    return c.json({
      success: true,
      data: workflow,
    });

  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to fetch workflow',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500 as any);
  }
});

export { workflows };