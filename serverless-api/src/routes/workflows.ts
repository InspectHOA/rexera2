/**
 * Workflow Routes for Rexera API
 * 
 * Handles all workflow-related endpoints
 */

import { Hono } from 'hono';
import { createServerClient } from '../utils/database';
import { getCompanyFilter, clientDataMiddleware, type AuthUser } from '../middleware';
import { resolveWorkflowId, getWorkflowByHumanId, isUUID } from '../utils/workflow-resolver';
import { 
  WorkflowFiltersSchema, 
  CreateWorkflowSchema,
  WorkflowCounterpartyFiltersSchema,
  CreateWorkflowCounterpartySchema,
  UpdateWorkflowCounterpartySchema,
  AuditHelpers,
  isCounterpartyAllowedForWorkflow
} from '@rexera/shared';
import { auditLogger } from './audit-events';

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
      due_date
    `;
    
    if (includeArray.includes('client')) {
      selectString += `, client:clients(id, name, domain)`;
    }
    
    if (includeArray.includes('tasks')) {
      selectString += `, task_executions!workflow_id(*, agents!agent_id(id, name, type))`;
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
      // For interrupt count, we need to sort by the count of INTERRUPTED tasks
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
                .filter((task: any) => task.status === 'INTERRUPT').length
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

    // Log audit event for workflow creation
    try {
      await auditLogger.log(
        AuditHelpers.workflowEvent(
          user.id,
          user.email, // Use email as actor name for now
          'create',
          workflow.id,
          workflow.client_id,
          {
            workflow_type: workflow.workflow_type,
            initial_status: workflow.status,
            created_via: 'api',
            user_agent: c.req.header('user-agent')
          }
        )
      );
    } catch (auditError) {
      console.warn('Failed to log audit event for workflow creation:', auditError);
      // Don't fail the request if audit logging fails
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

// PATCH /api/workflows/:id - Update workflow
workflows.patch('/:id', async (c) => {
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

    // Validate that the workflow exists and user has access
    const companyFilter = getCompanyFilter(user);
    let query = supabase
      .from('workflows')
      .select('id, client_id')
      .eq('id', id);

    if (companyFilter) {
      query = query.eq('client_id', companyFilter);
    }

    const { data: existingWorkflow, error: fetchError } = await query.single();

    if (fetchError || !existingWorkflow) {
      return c.json({
        success: false,
        error: 'Workflow not found',
      }, 404 as any);
    }

    // Update the workflow
    const { data: workflow, error } = await supabase
      .from('workflows')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update workflow: ${error.message}`);
    }

    return c.json({
      success: true,
      data: workflow,
    });

  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to update workflow',
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
      client:clients(id, name, domain),
      task_executions!workflow_id(*, agents!agent_id(id, name, type))
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

// ============================================================================
// WORKFLOW COUNTERPARTY ROUTES
// ============================================================================

// GET /api/workflows/:workflowId/counterparties - Get counterparties for a workflow
workflows.get('/:workflowId/counterparties', async (c) => {
  try {
    const workflowIdParam = c.req.param('workflowId');
    const queryParams = c.req.query();
    
    const filters = WorkflowCounterpartyFiltersSchema.parse(queryParams);
    const { status, include } = filters;
    
    const supabase = createServerClient();
    
    // Resolve workflow ID (supports both UUID and human-readable IDs)
    let workflowId: string;
    try {
      workflowId = await resolveWorkflowId(supabase, workflowIdParam);
    } catch (error) {
      return c.json({
        success: false,
        error: 'Workflow not found'
      }, 404);
    }
    
    // Build base query
    let selectFields = 'id, workflow_id, counterparty_id, status, created_at, updated_at';
    if (include === 'counterparty') {
      selectFields += ', counterparties(id, name, type, email, phone, address, contact_info)';
    }
    
    let query = supabase
      .from('workflow_counterparties')
      .select(selectFields)
      .eq('workflow_id', workflowId);
    
    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status);
    }
    
    // Order by creation date
    query = query.order('created_at', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching workflow counterparties:', error);
      return c.json({
        success: false,
        error: 'Failed to fetch workflow counterparties',
        details: error.message
      }, 500);
    }
    
    return c.json({
      success: true,
      data: data || []
    });
    
  } catch (error) {
    console.error('Error in GET /workflows/:workflowId/counterparties:', error);
    return c.json({
      success: false,
      error: 'Invalid request parameters',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 400);
  }
});

// POST /api/workflows/:workflowId/counterparties - Add counterparty to workflow
workflows.post('/:workflowId/counterparties', async (c) => {
  try {
    const workflowIdParam = c.req.param('workflowId');
    const body = await c.req.json();
    
    const validatedData = CreateWorkflowCounterpartySchema.parse(body);
    
    const supabase = createServerClient();
    
    // Resolve workflow ID (supports both UUID and human-readable IDs)
    let workflowId: string;
    try {
      workflowId = await resolveWorkflowId(supabase, workflowIdParam);
    } catch (error) {
      return c.json({
        success: false,
        error: 'Workflow not found'
      }, 404);
    }
    
    // Fetch workflow and counterparty info for validation
    const [workflowResult, counterpartyResult] = await Promise.all([
      supabase
        .from('workflows')
        .select('id, workflow_type')
        .eq('id', workflowId)
        .single(),
      supabase
        .from('counterparties')
        .select('id, type')
        .eq('id', validatedData.counterparty_id)
        .single()
    ]);
    
    if (workflowResult.error || !workflowResult.data) {
      return c.json({
        success: false,
        error: 'Workflow not found'
      }, 404);
    }
    
    if (counterpartyResult.error || !counterpartyResult.data) {
      return c.json({
        success: false,
        error: 'Counterparty not found'
      }, 404);
    }
    
    // Validate workflow-counterparty type compatibility
    const workflow = workflowResult.data;
    const counterparty = counterpartyResult.data;
    
    if (!isCounterpartyAllowedForWorkflow(workflow.workflow_type, counterparty.type)) {
      return c.json({
        success: false,
        error: `Counterparty type '${counterparty.type}' is not allowed for workflow type '${workflow.workflow_type}'`
      }, 400);
    }
    
    // Check if relationship already exists
    const { data: existing, error: existingError } = await supabase
      .from('workflow_counterparties')
      .select('id')
      .eq('workflow_id', workflowId)
      .eq('counterparty_id', validatedData.counterparty_id)
      .single();
    
    if (existing && !existingError) {
      return c.json({
        success: false,
        error: 'Counterparty already associated with this workflow'
      }, 409);
    }
    
    // Create the relationship
    const insertData = {
      workflow_id: workflowId,
      ...validatedData
    };
    
    const { data, error } = await supabase
      .from('workflow_counterparties')
      .insert([insertData])
      .select('*, counterparties(id, name, type, email, phone, address, contact_info)')
      .single();
    
    if (error) {
      console.error('Error creating workflow counterparty relationship:', error);
      return c.json({
        success: false,
        error: 'Failed to add counterparty to workflow',
        details: error.message
      }, 500);
    }
    
    return c.json({
      success: true,
      data
    }, 201);
    
  } catch (error) {
    console.error('Error in POST /workflows/:workflowId/counterparties:', error);
    return c.json({
      success: false,
      error: 'Invalid request data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 400);
  }
});

// PATCH /api/workflows/:workflowId/counterparties/:id - Update workflow counterparty status
workflows.patch('/:workflowId/counterparties/:id', async (c) => {
  try {
    const workflowIdParam = c.req.param('workflowId');
    const relationshipId = c.req.param('id');
    const body = await c.req.json();
    
    const validatedData = UpdateWorkflowCounterpartySchema.parse(body);
    
    const supabase = createServerClient();
    
    // Resolve workflow ID (supports both UUID and human-readable IDs)
    let workflowId: string;
    try {
      workflowId = await resolveWorkflowId(supabase, workflowIdParam);
    } catch (error) {
      return c.json({
        success: false,
        error: 'Workflow not found'
      }, 404);
    }
    
    // Add updated_at timestamp
    const updateData = {
      ...validatedData,
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('workflow_counterparties')
      .update(updateData)
      .eq('id', relationshipId)
      .eq('workflow_id', workflowId)  // Ensure it belongs to the correct workflow
      .select('*, counterparties(id, name, type, email, phone, address, contact_info)')
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({
          success: false,
          error: 'Workflow counterparty relationship not found'
        }, 404);
      }
      
      console.error('Error updating workflow counterparty:', error);
      return c.json({
        success: false,
        error: 'Failed to update workflow counterparty',
        details: error.message
      }, 500);
    }
    
    return c.json({
      success: true,
      data
    });
    
  } catch (error) {
    console.error('Error in PATCH /workflows/:workflowId/counterparties/:id:', error);
    return c.json({
      success: false,
      error: 'Invalid request data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 400);
  }
});

// DELETE /api/workflows/:workflowId/counterparties/:id - Remove counterparty from workflow
workflows.delete('/:workflowId/counterparties/:id', async (c) => {
  try {
    const workflowIdParam = c.req.param('workflowId');
    const relationshipId = c.req.param('id');
    
    const supabase = createServerClient();
    
    // Resolve workflow ID (supports both UUID and human-readable IDs)
    let workflowId: string;
    try {
      workflowId = await resolveWorkflowId(supabase, workflowIdParam);
    } catch (error) {
      return c.json({
        success: false,
        error: 'Workflow not found'
      }, 404);
    }
    
    const { error } = await supabase
      .from('workflow_counterparties')
      .delete()
      .eq('id', relationshipId)
      .eq('workflow_id', workflowId);  // Ensure it belongs to the correct workflow
    
    if (error) {
      console.error('Error removing workflow counterparty:', error);
      return c.json({
        success: false,
        error: 'Failed to remove counterparty from workflow',
        details: error.message
      }, 500);
    }
    
    return c.json({
      success: true,
      message: 'Counterparty removed from workflow successfully'
    });
    
  } catch (error) {
    console.error('Error in DELETE /workflows/:workflowId/counterparties/:id:', error);
    return c.json({
      success: false,
      error: 'Invalid request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 400);
  }
});

export { workflows };