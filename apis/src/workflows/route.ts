import { NextRequest } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@rexera/database';
import { 
  withAuth, 
  withErrorHandling, 
  withRateLimit,
  parseJsonBody,
  validateRequiredFields,
  createApiResponse,
  createErrorResponse,
  AuthenticatedRequest
} from '@/lib/api/middleware';

// GET /api/workflows - List workflows with filtering and pagination
export const GET = withRateLimit(
  withAuth(
    withErrorHandling(async (req: AuthenticatedRequest) => {
      const supabase = createServerComponentClient<Database>({ cookies });
      const { searchParams } = new URL(req.url);

      // Parse query parameters
      const page = parseInt(searchParams.get('page') || '1');
      const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
      const offset = (page - 1) * limit;
      
      const workflowType = searchParams.get('workflow_type');
      const status = searchParams.get('status');
      const clientId = searchParams.get('client_id');
      const assignedTo = searchParams.get('assigned_to');
      const priority = searchParams.get('priority');
      const include = searchParams.get('include')?.split(',') || [];
      const sort = searchParams.get('sort') || 'created_at';
      const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc';

      // Build base query
      let query = supabase.from('workflows').select(`
        *,
        ${include.includes('client') ? 'client:clients(id, name),' : ''}
        ${include.includes('assigned_user') ? 'assigned_user:user_profiles!workflows_assigned_to_fkey(id, full_name, email),' : ''}
        ${include.includes('tasks') ? 'tasks(id, title, status, priority, due_date),' : ''}
        ${include.includes('documents') ? 'documents(id, filename, document_type, created_at),' : ''}
        ${include.includes('communications') ? 'communications(id, subject, communication_type, created_at)' : ''}
      `.replace(/,\s*$/, ''));

      // Apply filters based on user permissions
      if (req.user.user_type === 'client_user' && req.user.company_id) {
        query = query.eq('client_id', req.user.company_id);
      }

      // Apply additional filters
      if (workflowType) query = query.eq('workflow_type', workflowType);
      if (status) query = query.eq('status', status);
      if (clientId && req.user.user_type === 'hil_user') query = query.eq('client_id', clientId);
      if (assignedTo) query = query.eq('assigned_to', assignedTo);
      if (priority) query = query.eq('priority', priority);

      // Apply sorting and pagination
      query = query.order(sort, { ascending: order === 'asc' });
      
      // Get total count for pagination
      const { count } = await supabase
        .from('workflows')
        .select('*', { count: 'exact', head: true });

      // Execute main query
      const { data: workflows, error } = await query
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Workflows query error:', error);
        return createErrorResponse('Database Error', 'Failed to fetch workflows', 500);
      }

      // Calculate pagination metadata
      const totalPages = Math.ceil((count || 0) / limit);
      const baseUrl = req.url.split('?')[0];

      return createApiResponse(
        workflows || [],
        {
          total: count || 0,
          page,
          limit,
          totalPages,
        },
        {
          ...(page > 1 && { previous: `${baseUrl}?page=${page - 1}&limit=${limit}` }),
          ...(page < totalPages && { next: `${baseUrl}?page=${page + 1}&limit=${limit}` }),
          first: `${baseUrl}?page=1&limit=${limit}`,
          last: `${baseUrl}?page=${totalPages}&limit=${limit}`,
        }
      );
    })
  )
);

// POST /api/workflows - Create new workflow
export const POST = withRateLimit(
  withAuth(
    withErrorHandling(async (req: AuthenticatedRequest) => {
      const supabase = createServerComponentClient<Database>({ cookies });
      const body = await parseJsonBody(req);

      // Validate required fields
      validateRequiredFields(body, ['workflow_type', 'client_id', 'title']);

      // Validate workflow type
      const validWorkflowTypes = ['MUNI_LIEN_SEARCH', 'HOA_ACQUISITION', 'PAYOFF'];
      if (!validWorkflowTypes.includes(body.workflow_type)) {
        return createErrorResponse(
          'Validation Error',
          'Invalid workflow type',
          400
        );
      }

      // Check client access permissions
      if (req.user.user_type === 'client_user') {
        if (body.client_id !== req.user.company_id) {
          return createErrorResponse(
            'Forbidden',
            'Cannot create workflow for different client',
            403
          );
        }
      }

      // Verify client exists
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('id', body.client_id)
        .single();

      if (clientError || !client) {
        return createErrorResponse('Validation Error', 'Invalid client ID', 400);
      }

      // Create workflow
      const workflowData = {
        workflow_type: body.workflow_type,
        client_id: body.client_id,
        title: body.title,
        description: body.description,
        priority: body.priority || 'NORMAL',
        metadata: body.metadata || {},
        created_by: req.user.id,
        assigned_to: body.assigned_to,
        due_date: body.due_date,
      };

      const { data: workflow, error } = await supabase
        .from('workflows')
        .insert(workflowData)
        .select(`
          *,
          client:clients(id, name),
          assigned_user:user_profiles!workflows_assigned_to_fkey(id, full_name, email)
        `)
        .single();

      if (error) {
        console.error('Workflow creation error:', error);
        return createErrorResponse('Database Error', 'Failed to create workflow', 500);
      }

      return createApiResponse(workflow);
    })
  ),
  { maxRequests: 20, windowMs: 60000 } // More restrictive rate limit for creation
);

export const OPTIONS = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};