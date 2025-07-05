import { createClient } from '@supabase/supabase-js';
import type { Database } from '@rexera/types';

// GET /api/workflows/[id] - Get specific workflow
export async function GET(req: any, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { searchParams } = new URL(req.url);
    const include = searchParams.get('include')?.split(',') || [];

    // Build the select query with optional joins
    let selectQuery = `
      *,
      client:clients(id, name, domain)
    `;

    // Add optional includes
    if (include.includes('tasks')) {
      selectQuery += `, tasks(*)`;
    }
    if (include.includes('documents')) {
      selectQuery += `, documents(*)`;
    }
    if (include.includes('communications')) {
      selectQuery += `, communications(*, email_metadata(*), phone_metadata(*))`;
    }
    if (include.includes('counterparties')) {
      selectQuery += `, workflow_counterparties(*, counterparty:counterparties(*))`;
    }
    if (include.includes('sla_tracking')) {
      selectQuery += `, sla_tracking(*, sla_definition:sla_definitions(*))`;
    }

    const { data: workflow, error } = await supabase
      .from('workflows')
      .select(selectQuery)
      .eq('id', params.id)
      .single();

    if (error || !workflow) {
      return new Response(JSON.stringify(
        { success: false, error: 'Not Found', message: 'Workflow not found' }
      ), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, data: workflow }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify(
      { success: false, error: 'Internal Server Error', message: 'Failed to fetch workflow' }
    ), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// PUT /api/workflows/[id] - Update workflow
export async function PUT(req: any, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
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
      return new Response(JSON.stringify(
        { success: false, error: 'Not Found', message: 'Workflow not found' }
      ), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
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
      return new Response(JSON.stringify(
        { success: false, error: 'Validation Error', message: 'Invalid workflow status' }
      ), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
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
      return new Response(JSON.stringify(
        { success: false, error: 'Database Error', message: 'Failed to update workflow' }
      ), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, data: updatedWorkflow }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify(
      { success: false, error: 'Internal Server Error', message: 'Failed to update workflow' }
    ), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// DELETE /api/workflows/[id] - Delete workflow
export async function DELETE(req: any, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if workflow exists
    const { data: workflow, error: fetchError } = await supabase
      .from('workflows')
      .select('id, status')
      .eq('id', params.id)
      .single();

    if (fetchError || !workflow) {
      return new Response(JSON.stringify(
        { success: false, error: 'Not Found', message: 'Workflow not found' }
      ), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Prevent deletion of active workflows
    if (['IN_PROGRESS', 'AWAITING_REVIEW'].includes(workflow.status)) {
      return new Response(JSON.stringify(
        { success: false, error: 'Validation Error', message: 'Cannot delete active workflows. Please cancel or complete first.' }
      ), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', params.id);

    if (error) {
      return new Response(JSON.stringify(
        { success: false, error: 'Database Error', message: 'Failed to delete workflow' }
      ), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, data: { message: 'Workflow deleted successfully' } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify(
      { success: false, error: 'Internal Server Error', message: 'Failed to delete workflow' }
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
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}