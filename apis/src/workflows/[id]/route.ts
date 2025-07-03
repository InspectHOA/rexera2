import { NextRequest } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@rexera/database';
import { 
  withAuth, 
  withErrorHandling, 
  withRateLimit,
  parseJsonBody,
  createApiResponse,
  createErrorResponse,
  AuthenticatedRequest
} from '@/lib/api/middleware';

// GET /api/workflows/[id] - Get specific workflow
export const GET = withRateLimit(
  withAuth(
    withErrorHandling(async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
      const supabase = createServerComponentClient<Database>({ cookies });
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
        return createErrorResponse('Not Found', 'Workflow not found', 404);
      }

      // Check access permissions
      if (req.user.user_type === 'client_user' && workflow.client_id !== req.user.company_id) {
        return createErrorResponse('Forbidden', 'Access denied to this workflow', 403);
      }

      return createApiResponse(workflow);
    })
  )
);

// PUT /api/workflows/[id] - Update workflow
export const PUT = withRateLimit(
  withAuth(
    withErrorHandling(async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
      const supabase = createServerComponentClient<Database>({ cookies });
      const body = await parseJsonBody(req);

      // Get existing workflow to check permissions
      const { data: existingWorkflow, error: fetchError } = await supabase
        .from('workflows')
        .select('client_id, created_by')
        .eq('id', params.id)
        .single();

      if (fetchError || !existingWorkflow) {
        return createErrorResponse('Not Found', 'Workflow not found', 404);
      }

      // Check access permissions
      if (req.user.user_type === 'client_user' && existingWorkflow.client_id !== req.user.company_id) {
        return createErrorResponse('Forbidden', 'Access denied to this workflow', 403);
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
        return createErrorResponse('Validation Error', 'Invalid workflow status', 400);
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
        return createErrorResponse('Database Error', 'Failed to update workflow', 500);
      }

      return createApiResponse(updatedWorkflow);
    })
  )
);

// DELETE /api/workflows/[id] - Delete workflow (HIL only)
export const DELETE = withRateLimit(
  withAuth(
    withErrorHandling(async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
      // Only HIL users can delete workflows
      if (req.user.user_type !== 'hil_user') {
        return createErrorResponse('Forbidden', 'Only HIL users can delete workflows', 403);
      }

      const supabase = createServerComponentClient<Database>({ cookies });

      // Check if workflow exists
      const { data: workflow, error: fetchError } = await supabase
        .from('workflows')
        .select('id, status')
        .eq('id', params.id)
        .single();

      if (fetchError || !workflow) {
        return createErrorResponse('Not Found', 'Workflow not found', 404);
      }

      // Prevent deletion of active workflows
      if (['IN_PROGRESS', 'AWAITING_REVIEW'].includes(workflow.status)) {
        return createErrorResponse(
          'Validation Error', 
          'Cannot delete active workflows. Please cancel or complete first.', 
          400
        );
      }

      const { error } = await supabase
        .from('workflows')
        .delete()
        .eq('id', params.id);

      if (error) {
        console.error('Workflow deletion error:', error);
        return createErrorResponse('Database Error', 'Failed to delete workflow', 500);
      }

      return createApiResponse({ success: true, message: 'Workflow deleted successfully' });
    })
  ),
  { maxRequests: 10, windowMs: 60000 } // Restrictive rate limit for deletions
);

export const OPTIONS = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};