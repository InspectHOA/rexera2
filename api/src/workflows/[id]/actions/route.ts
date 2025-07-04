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
} from '../../../utils/middleware';

// POST /api/workflows/[id]/actions - Execute workflow actions
export const POST = withRateLimit(
  withAuth(
    withErrorHandling(async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
      const supabase = createServerComponentClient<Database>({ cookies });
      const body = await parseJsonBody(req);

      validateRequiredFields(body, ['action']);

      const validActions = ['start', 'pause', 'resume', 'complete', 'cancel', 'retry'];
      if (!validActions.includes(body.action)) {
        return createErrorResponse('Validation Error', 'Invalid action type', 400);
      }

      // Get existing workflow
      const { data: workflow, error: fetchError } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', params.id)
        .single();

      if (fetchError || !workflow) {
        return createErrorResponse('Not Found', 'Workflow not found', 404);
      }

      // Check access permissions
      if (req.user.user_type === 'client_user' && workflow.client_id !== req.user.company_id) {
        return createErrorResponse('Forbidden', 'Access denied to this workflow', 403);
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
        return createErrorResponse(
          'Validation Error', 
          `Cannot ${body.action} workflow with status ${workflow.status}`, 
          400
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
        ...(body.action === 'complete' && { completed_at: new Date().toISOString() }),
        ...(body.metadata && { metadata: { ...workflow.metadata, ...body.metadata } }),
      };

      // Update workflow
      const { data: updatedWorkflow, error: updateError } = await supabase
        .from('workflows')
        .update(updateData)
        .eq('id', params.id)
        .select(`
          *,
          client:clients(id, name),
          assigned_user:user_profiles!workflows_assigned_to_fkey(id, full_name, email)
        `)
        .single();

      if (updateError) {
        console.error('Workflow action error:', updateError);
        return createErrorResponse('Database Error', 'Failed to execute workflow action', 500);
      }

      // Log the action in audit trail
      await supabase.from('audit_events').insert({
        event_type: 'workflow_action',
        user_id: req.user.id,
        workflow_id: params.id,
        resource_type: 'workflow',
        resource_id: params.id,
        changes: {
          action: body.action,
          previous_status: workflow.status,
          new_status: newStatus,
          reason: body.reason,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          user_agent: req.headers.get('user-agent'),
        },
      });

      // Trigger n8n webhook if workflow is started
      if (body.action === 'start') {
        try {
          const n8nWebhookUrl = process.env.N8N_WORKFLOW_WEBHOOK_URL;
          if (n8nWebhookUrl) {
            await fetch(n8nWebhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                workflow_id: params.id,
                workflow_type: workflow.workflow_type,
                action: 'start',
                metadata: workflow.metadata,
              }),
            });
          }
        } catch (error) {
          console.error('Failed to trigger n8n webhook:', error);
          // Don't fail the API call if webhook fails
        }
      }

      return createApiResponse({
        ...updatedWorkflow,
        action_result: {
          action: body.action,
          success: true,
          message: `Workflow ${body.action} completed successfully`,
          timestamp: new Date().toISOString(),
        },
      });
    })
  ),
  { maxRequests: 30, windowMs: 60000 }
);

export const OPTIONS = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};