import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const include = searchParams.get('include')?.split(',') || [];

    const { data: workflow, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: { message: 'Workflow not found' } },
          { status: 404 }
        );
      }
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: { message: 'Database query failed', details: error.message } },
        { status: 500 }
      );
    }

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
        .select('id, title, description, status, metadata, assigned_to, due_date, created_at, updated_at')
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

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const {
      title,
      description,
      status,
      priority,
      metadata,
      assigned_to,
      due_date
    } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (metadata !== undefined) updateData.metadata = metadata;
    if (assigned_to !== undefined) updateData.assigned_to = assigned_to;
    if (due_date !== undefined) updateData.due_date = due_date;

    // Add completed_at timestamp if status is being set to COMPLETED
    if (status === 'COMPLETED') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data: workflow, error } = await supabase
      .from('workflows')
      .update(updateData)
      .eq('id', params.id)
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
        clients!workflows_client_id_fkey(id, name, domain)
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: { message: 'Workflow not found' } },
          { status: 404 }
        );
      }
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: { message: 'Failed to update workflow', details: error.message } },
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();

    const { error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: { message: 'Failed to delete workflow', details: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Workflow deleted successfully'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}