import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@rexera/types';

type TaskStatus = Database['public']['Enums']['task_status'];
type PriorityLevel = Database['public']['Enums']['priority_level'];

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const workflow_id = searchParams.get('workflow_id');
    const status = searchParams.get('status') as TaskStatus | null;
    const assigned_to = searchParams.get('assigned_to');
    const priority = searchParams.get('priority') as PriorityLevel | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const include = searchParams.get('include')?.split(',') || [];

    // Build the base query
    let query = supabase
      .from('tasks')
      .select('*', { count: 'exact' });

    // Apply filters
    if (workflow_id) {
      query = query.eq('workflow_id', workflow_id);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (assigned_to) {
      query = query.eq('assigned_to', assigned_to);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Order by created_at desc
    query = query.order('created_at', { ascending: false });

    const { data: tasks, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: { message: 'Database query failed', details: error.message } },
        { status: 500 }
      );
    }

    // Fetch related data if requested
    const transformedTasks = await Promise.all(
      (tasks || []).map(async (task: any) => {
        const result: any = { ...task };

        // Fetch workflow data if requested
        if (include.includes('workflow')) {
          const { data: workflow } = await supabase
            .from('workflows')
            .select('id, title, workflow_type, status')
            .eq('id', task.workflow_id)
            .single();
          result.workflow = workflow;
        }

        // Fetch assigned user data if requested
        if (include.includes('assigned_user') && task.assigned_to) {
          const { data: assignedUser } = await supabase
            .from('user_profiles')
            .select('id, full_name, email')
            .eq('id', task.assigned_to)
            .single();
          result.assigned_user = assignedUser;
        }

        return result;
      })
    );

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      success: true,
      data: transformedTasks,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const {
      workflow_id,
      title,
      description,
      executor_type = 'AI',
      assigned_to,
      priority = 'NORMAL',
      metadata = {},
      due_date
    } = body;

    // Validate required fields
    if (!workflow_id || !title || !executor_type) {
      return NextResponse.json(
        { success: false, error: { message: 'Missing required fields: workflow_id, title, executor_type' } },
        { status: 400 }
      );
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        workflow_id,
        title,
        description,
        executor_type,
        assigned_to,
        priority,
        metadata,
        due_date
      })
      .select('*')
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: { message: 'Failed to create task', details: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: task
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
