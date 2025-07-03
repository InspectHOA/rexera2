import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@rexera/types';

type WorkflowType = Database['public']['Enums']['workflow_type'];
type WorkflowStatus = Database['public']['Enums']['workflow_status'];
type PriorityLevel = Database['public']['Enums']['priority_level'];

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const workflow_type = searchParams.get('workflow_type') as WorkflowType | null;
    const status = searchParams.get('status') as WorkflowStatus | null;
    const client_id = searchParams.get('client_id');
    const assigned_to = searchParams.get('assigned_to');
    const priority = searchParams.get('priority') as PriorityLevel | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const include = searchParams.get('include')?.split(',') || [];

    // Build the base query with simple select
    let query = supabase
      .from('workflows')
      .select('*', { count: 'exact' });

    // Apply filters
    if (workflow_type) {
      query = query.eq('workflow_type', workflow_type);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (client_id) {
      query = query.eq('client_id', client_id);
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

    const { data: workflows, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: { message: 'Database query failed', details: error.message } },
        { status: 500 }
      );
    }

    // Fetch related data if requested
    const transformedWorkflows = await Promise.all(
      (workflows || []).map(async (workflow: any) => {
        const result: any = { ...workflow };

        // Fetch client data if requested
        if (include.includes('client')) {
          const { data: client } = await supabase
            .from('clients')
            .select('id, name, domain')
            .eq('id', workflow.client_id)
            .single();
          result.client = client;
        }

        // Fetch tasks data if requested
        if (include.includes('tasks')) {
          const { data: tasks } = await supabase
            .from('tasks')
            .select('id, title, status, metadata, assigned_to, due_date')
            .eq('workflow_id', workflow.id);
          result.tasks = tasks || [];
        }

        // Fetch assigned user data if requested
        if (include.includes('assigned_user') && workflow.assigned_to) {
          const { data: assignedUser } = await supabase
            .from('user_profiles')
            .select('id, full_name, email')
            .eq('id', workflow.assigned_to)
            .single();
          result.assigned_user = assignedUser;
        }

        return result;
      })
    );

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      success: true,
      data: transformedWorkflows,
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
      workflow_type,
      client_id,
      title,
      description,
      priority = 'NORMAL',
      metadata = {},
      due_date,
      created_by
    } = body;

    // Validate required fields
    if (!workflow_type || !client_id || !title || !created_by) {
      return NextResponse.json(
        { success: false, error: { message: 'Missing required fields: workflow_type, client_id, title, created_by' } },
        { status: 400 }
      );
    }

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
        created_by
      })
      .select(`
        id,
        workflow_type,
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
        clients!workflows_client_id_fkey(id, name)
      `)
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: { message: 'Failed to create workflow', details: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...workflow,
        client: workflow.clients
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