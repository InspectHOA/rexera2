import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticate } from '../../../middleware/auth';

// POST /api/workflows/[id]/actions - Execute workflow actions
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await authenticate(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    
    if (!body.action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    const validActions = ['start', 'pause', 'resume', 'complete', 'cancel', 'retry'];
    if (!validActions.includes(body.action)) {
      return NextResponse.json({ error: 'Invalid action type' }, { status: 400 });
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
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
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
      return NextResponse.json(
        { error: `Cannot ${body.action} workflow with status ${workflow.status}` }, 
        { status: 400 }
      );
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
      return NextResponse.json({ error: 'Failed to execute workflow action' }, { status: 500 });
    }

    return NextResponse.json({
      ...updatedWorkflow,
      action_result: {
        action: body.action,
        success: true,
        message: `Workflow ${body.action} completed successfully`,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Workflow action error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}