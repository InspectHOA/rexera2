import { createClient } from '@supabase/supabase-js';
import type { Database } from '@rexera/types';

// GET /api/tasks - List tasks with filtering and pagination
export async function GET(req: any) {
  try {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Handle both full URLs (Next.js) and relative URLs (Express)
    let url = req.url.startsWith('http') ? req.url : `http://localhost:3002${req.url}`;
    // Clean up trailing ? that might cause URL parsing issues
    if (url.endsWith('?')) {
      url = url.slice(0, -1);
    }
    const { searchParams } = new URL(url);
    
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

    // Build the select query with optional joins
    let selectQuery = `
      *,
      workflow:workflows(id, title, workflow_type, client_id, status)
    `;

    // Add optional includes
    if (include.includes('assigned_user')) {
      selectQuery += `, assigned_user:user_profiles!tasks_assigned_to_fkey(id, full_name, email)`;
    }
    if (include.includes('executions')) {
      selectQuery += `, task_executions(*)`;
    }
    if (include.includes('dependencies')) {
      selectQuery += `, task_dependencies(*)`;
    }

    let query = supabase
      .from('tasks')
      .select(selectQuery);

    // Apply filters
    if (workflowId) query = query.eq('workflow_id', workflowId);
    if (status) query = query.eq('status', status as Database['public']['Enums']['task_status']);
    if (executorType) query = query.eq('executor_type', executorType as Database['public']['Enums']['executor_type']);
    if (assignedTo) query = query.eq('assigned_to', assignedTo);
    if (priority) query = query.eq('priority', priority as Database['public']['Enums']['priority_level']);

    // Apply sorting and pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: tasks, error } = await query;

    if (error) {
      return new Response(JSON.stringify(
        { success: false, error: 'Database Error', message: 'Failed to fetch tasks' }
      ), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true });

    const totalPages = Math.ceil((count || 0) / limit);

    return new Response(JSON.stringify({
      success: true,
      data: tasks || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify(
      { success: false, error: 'Internal Server Error', message: 'Failed to fetch tasks' }
    ), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// POST /api/tasks - Create new task
export async function POST(req: any) {
  try {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const body = await req.json();

    // Validate required fields
    if (!body.workflow_id || !body.title || !body.executor_type) {
      return new Response(JSON.stringify(
        { success: false, error: 'Validation Error', message: 'Missing required fields: workflow_id, title, executor_type' }
      ), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate executor type
    if (!['AI', 'HIL'].includes(body.executor_type)) {
      return new Response(JSON.stringify(
        { success: false, error: 'Validation Error', message: 'Invalid executor type' }
      ), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify workflow exists
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .select('id, client_id, status')
      .eq('id', body.workflow_id)
      .single();

    if (workflowError || !workflow) {
      return new Response(JSON.stringify(
        { success: false, error: 'Validation Error', message: 'Invalid workflow ID' }
      ), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
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
      return new Response(JSON.stringify(
        { success: false, error: 'Database Error', message: 'Failed to create task' }
      ), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, data: task }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify(
      { success: false, error: 'Internal Server Error', message: 'Failed to create task' }
    ), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}