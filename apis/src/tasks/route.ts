import { NextRequest } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@rexera/types';
import { 
  withAuth, 
  withErrorHandling, 
  withRateLimit,
  parseJsonBody,
  validateRequiredFields,
  createApiResponse,
  createErrorResponse,
  AuthenticatedRequest
} from '../utils/middleware';

// GET /api/tasks - List tasks with filtering and pagination
export const GET = withRateLimit(
  withAuth(
    withErrorHandling(async (req: AuthenticatedRequest) => {
      const supabase = createServerComponentClient<Database>({ cookies });
      const { searchParams } = new URL(req.url);

      // Parse query parameters
      const page = parseInt(searchParams.get('page') || '1');
      const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
      const offset = (page - 1) * limit;
      
      const workflowId = searchParams.get('workflow_id');
      const status = searchParams.get('status');
      const executorType = searchParams.get('executor_type');
      const assignedTo = searchParams.get('assigned_to');
      const priority = searchParams.get('priority');
      const include = searchParams.get('include')?.split(',') || [];
      const sort = searchParams.get('sort') || 'created_at';
      const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc';

      // Build base query
      let query = supabase.from('tasks').select(`
        *,
        workflow:workflows(id, title, workflow_type, client_id, status),
        ${include.includes('assigned_user') ? 'assigned_user:user_profiles!tasks_assigned_to_fkey(id, full_name, email),' : ''}
        ${include.includes('dependencies') ? 'dependencies:task_dependencies!task_dependencies_dependent_task_id_fkey(prerequisite_task:tasks!task_dependencies_prerequisite_task_id_fkey(*)),' : ''}
        ${include.includes('dependents') ? 'dependents:task_dependencies!task_dependencies_prerequisite_task_id_fkey(dependent_task:tasks!task_dependencies_dependent_task_id_fkey(*)),' : ''}
        ${include.includes('executions') ? 'task_executions(*),' : ''}
        ${include.includes('agent_executions') ? 'agent_executions(*, agent:agents(*))' : ''}
      `.replace(/,\s*$/, ''));

      // Apply client access control for client users
      if (req.user.user_type === 'client_user' && req.user.company_id) {
        query = query.eq('workflow.client_id', req.user.company_id);
      }

      // Apply filters
      if (workflowId) query = query.eq('workflow_id', workflowId);
      if (status) query = query.eq('status', status);
      if (executorType) query = query.eq('executor_type', executorType);
      if (assignedTo) query = query.eq('assigned_to', assignedTo);
      if (priority) query = query.eq('priority', priority);

      // Apply sorting and pagination
      query = query.order(sort, { ascending: order === 'asc' });

      // Get total count
      const { count } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true });

      // Execute main query
      const { data: tasks, error } = await query
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Tasks query error:', error);
        return createErrorResponse('Database Error', 'Failed to fetch tasks', 500);
      }

      // Filter out tasks from inaccessible workflows for client users
      const filteredTasks = req.user.user_type === 'client_user' 
        ? tasks?.filter(task => task.workflow?.client_id === req.user.company_id)
        : tasks;

      const totalPages = Math.ceil((count || 0) / limit);
      const baseUrl = req.url.split('?')[0];

      return createApiResponse(
        filteredTasks || [],
        {
          total: count || 0,
          page,
          limit,
          totalPages,
        },
        {
          ...(page > 1 && { previous: `${baseUrl}?page=${page - 1}&limit=${limit}` }),
          ...(page < totalPages && { next: `${baseUrl}?page=${page + 1}&limit=${limit}` }),
          first: `${baseUrl}?page=1&limit=${limit}`,
          last: `${baseUrl}?page=${totalPages}&limit=${limit}`,
        }
      );
    })
  )
);

// POST /api/tasks - Create new task
export const POST = withRateLimit(
  withAuth(
    withErrorHandling(async (req: AuthenticatedRequest) => {
      const supabase = createServerComponentClient<Database>({ cookies });
      const body = await parseJsonBody(req);

      validateRequiredFields(body, ['workflow_id', 'title', 'executor_type']);

      // Validate executor type
      if (!['AI', 'HIL'].includes(body.executor_type)) {
        return createErrorResponse('Validation Error', 'Invalid executor type', 400);
      }

      // Verify workflow exists and user has access
      const { data: workflow, error: workflowError } = await supabase
        .from('workflows')
        .select('id, client_id, status')
        .eq('id', body.workflow_id)
        .single();

      if (workflowError || !workflow) {
        return createErrorResponse('Validation Error', 'Invalid workflow ID', 400);
      }

      // Check access permissions
      if (req.user.user_type === 'client_user' && workflow.client_id !== req.user.company_id) {
        return createErrorResponse('Forbidden', 'Access denied to this workflow', 403);
      }

      // Validate HIL task assignment
      if (body.executor_type === 'HIL') {
        if (!body.assigned_to) {
          return createErrorResponse(
            'Validation Error', 
            'HIL tasks must have an assigned user', 
            400
          );
        }

        // Verify assigned user is HIL
        const { data: assignedUser, error: userError } = await supabase
          .from('user_profiles')
          .select('user_type')
          .eq('id', body.assigned_to)
          .single();

        if (userError || assignedUser?.user_type !== 'hil_user') {
          return createErrorResponse(
            'Validation Error', 
            'HIL tasks can only be assigned to HIL users', 
            400
          );
        }
      }

      // Create task
      const taskData = {
        workflow_id: body.workflow_id,
        title: body.title,
        description: body.description,
        executor_type: body.executor_type,
        assigned_to: body.assigned_to,
        priority: body.priority || 'NORMAL',
        metadata: body.metadata || {},
        due_date: body.due_date,
      };

      const { data: task, error } = await supabase
        .from('tasks')
        .insert(taskData)
        .select(`
          *,
          workflow:workflows(id, title, workflow_type),
          assigned_user:user_profiles!tasks_assigned_to_fkey(id, full_name, email)
        `)
        .single();

      if (error) {
        console.error('Task creation error:', error);
        return createErrorResponse('Database Error', 'Failed to create task', 500);
      }

      // Create task dependencies if specified
      if (body.dependencies && Array.isArray(body.dependencies)) {
        const dependencies = body.dependencies.map((prereqId: string) => ({
          dependent_task_id: task.id,
          prerequisite_task_id: prereqId,
        }));

        await supabase.from('task_dependencies').insert(dependencies);
      }

      return createApiResponse(task);
    })
  ),
  { maxRequests: 50, windowMs: 60000 }
);

export const OPTIONS = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};