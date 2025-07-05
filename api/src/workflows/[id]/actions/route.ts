import { createClient } from '@supabase/supabase-js';
import { authenticate } from '../../../middleware/auth';

// POST /api/workflows/[id]/actions - Execute workflow actions
export async function POST(req: any, { params }: { params: { id: string } }) {
  try {
    const auth = await authenticate(req);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json();
    
    if (!body.action) {
      return new Response(JSON.stringify({ error: 'Action is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const validActions = ['start', 'pause', 'resume', 'complete', 'cancel', 'retry'];
    if (!validActions.includes(body.action)) {
      return new Response(JSON.stringify({ error: 'Invalid action type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get existing workflow
    const { data: workflow, error: fetchError } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError || !workflow) {
      return new Response(JSON.stringify({ error: 'Workflow not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate action based on current status
    const statusTransitions: Record<string, string[]> = {
      start: ['PENDING'],
      pause: ['IN_PROGRESS'],
      resume: ['BLOCKED'],
      complete: ['IN_PROGRESS', 'AWAITING_REVIEW'],
      cancel: ['PENDING', 'IN_PROGRESS', 'AWAITING_REVIEW', 'BLOCKED'],
      retry: ['FAILED', 'BLOCKED'],
    };

    if (!statusTransitions[body.action]?.includes(workflow.status)) {
      return new Response(JSON.stringify(
        { error: `Cannot ${body.action} workflow with status ${workflow.status}` }
      ), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Determine new status based on action
    const newStatusMap: Record<string, string> = {
      start: 'IN_PROGRESS',
      pause: 'BLOCKED',
      resume: 'IN_PROGRESS',
      complete: 'COMPLETED',
      cancel: 'BLOCKED',
      retry: 'PENDING',
    };

    const newStatus = newStatusMap[body.action];
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString(),
      ...(body.action === 'complete' && { completed_at: new Date().toISOString() }),
    };

    // Update workflow
    const { data: updatedWorkflow, error: updateError } = await supabase
      .from('workflows')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      console.error('Workflow action error:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to execute workflow action' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      ...updatedWorkflow,
      action_result: {
        action: body.action,
        success: true,
        message: `Workflow ${body.action} completed successfully`,
        timestamp: new Date().toISOString(),
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Workflow action error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}