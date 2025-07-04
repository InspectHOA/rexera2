import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@rexera/types';

// Simple GET handler for individual workflows without complex middleware
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { searchParams } = new URL(req.url);
    const include = searchParams.get('include')?.split(',') || [];

    let query = supabase.from('workflows').select(`
      *,
      client:clients(id, name, domain),
      created_by_user:user_profiles!workflows_created_by_fkey(id, full_name, email),
      assigned_user:user_profiles!workflows_assigned_to_fkey(id, full_name, email),
      ${include.includes('tasks') ? 'tasks(*, task_executions(*), task_dependencies(*)),' : ''}
      ${include.includes('documents') ? 'documents(*),' : ''}
      ${include.includes('communications') ? 'communications(*, email_metadata(*), phone_metadata(*)),' : ''}
      ${include.includes('counterparties') ? 'workflow_counterparties(*, counterparty:counterparties(*)),' : ''}
      ${include.includes('sla_tracking') ? 'sla_tracking(*, sla_definition:sla_definitions(*))' : ''}
    `.replace(/,\s*$/, ''));

    const { data: workflow, error } = await query
      .eq('id', params.id)
      .single();

    if (error || !workflow) {
      return NextResponse.json(
        { success: false, error: 'Not Found', message: 'Workflow not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: workflow });
  } catch (error) {
    console.error('Workflow GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error', message: 'Failed to fetch workflow' },
      { status: 500 }
    );
  }
}

// Simple PUT handler for updating workflows
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const body = await req.json();

    // Get existing workflow to check if it exists
    const { data: existingWorkflow, error: fetchError } = await supabase
      .from('workflows')
      .select('id')
      .eq('id', params.id)
      .single();

    if (fetchError || !existingWorkflow) {
      return NextResponse.json(
        { success: false, error: 'Not Found', message: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Prepare update data (only allow certain fields to be updated)
    const allowedUpdates = [
      'title', 'description', 'status', 'priority', 'assigned_to', 
      'metadata', 'due_date', 'completed_at'
    ];
    
    const updateData = Object.keys(body)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = body[key];
        return obj;
      }, {} as any);

    // Validate status transitions
    const validStatuses = ['PENDING', 'IN_PROGRESS', 'AWAITING_REVIEW', 'BLOCKED', 'COMPLETED'];
    if (updateData.status && !validStatuses.includes(updateData.status)) {
      return NextResponse.json(
        { success: false, error: 'Validation Error', message: 'Invalid workflow status' },
        { status: 400 }
      );
    }

    // Auto-set completed_at when status changes to COMPLETED
    if (updateData.status === 'COMPLETED' && !updateData.completed_at) {
      updateData.completed_at = new Date().toISOString();
    }

    const { data: updatedWorkflow, error } = await supabase
      .from('workflows')
      .update(updateData)
      .eq('id', params.id)
      .select(`
        *,
        client:clients(id, name),
        assigned_user:user_profiles!workflows_assigned_to_fkey(id, full_name, email)
      `)
      .single();

    if (error) {
      console.error('Workflow update error:', error);
      return NextResponse.json(
        { success: false, error: 'Database Error', message: 'Failed to update workflow' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: updatedWorkflow });
  } catch (error) {
    console.error('Workflow PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error', message: 'Failed to update workflow' },
      { status: 500 }
    );
  }
}

// Simple DELETE handler for deleting workflows
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if workflow exists
    const { data: workflow, error: fetchError } = await supabase
      .from('workflows')
      .select('id, status')
      .eq('id', params.id)
      .single();

    if (fetchError || !workflow) {
      return NextResponse.json(
        { success: false, error: 'Not Found', message: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Prevent deletion of active workflows
    if (['IN_PROGRESS', 'AWAITING_REVIEW'].includes(workflow.status)) {
      return NextResponse.json(
        { success: false, error: 'Validation Error', message: 'Cannot delete active workflows. Please cancel or complete first.' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Workflow deletion error:', error);
      return NextResponse.json(
        { success: false, error: 'Database Error', message: 'Failed to delete workflow' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: { message: 'Workflow deleted successfully' } });
  } catch (error) {
    console.error('Workflow DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error', message: 'Failed to delete workflow' },
      { status: 500 }
    );
  }
}