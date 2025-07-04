import { procedure, router } from '../trpc';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { 
  WorkflowResponse as Workflow,
  WorkflowListResponse,
  WorkflowType,
  WorkflowStatus,
  PriorityLevel,
  Database
} from '@rexera/types';

const GetWorkflowInput = z.object({
  id: z.string(),
  include: z.array(z.string()).optional().default([])
});

const GetWorkflowsInput = z.object({
  workflow_type: z.enum(['MUNI_LIEN_SEARCH', 'HOA_ACQUISITION', 'PAYOFF']).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'AWAITING_REVIEW', 'BLOCKED', 'COMPLETED']).optional(),
  client_id: z.string().optional(),
  assigned_to: z.string().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  page: z.number().default(1),
  limit: z.number().default(10),
  include: z.array(z.string()).optional().default([])
});

const CreateWorkflowInput = z.object({
  workflow_type: z.enum(['MUNI_LIEN_SEARCH', 'HOA_ACQUISITION', 'PAYOFF']),
  client_id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  metadata: z.record(z.any()).optional(),
  due_date: z.string().optional(),
  created_by: z.string()
});

export const workflowsRouter = router({
  list: procedure
    .input(GetWorkflowsInput)
    .query(async ({ input, ctx }) => {
      const { supabase } = ctx;
      
      let query = supabase
        .from('workflows')
        .select('*', { count: 'exact' });

      if (input.workflow_type) {
        query = query.eq('workflow_type', input.workflow_type);
      }
      if (input.status) {
        query = query.eq('status', input.status);
      }
      if (input.client_id) {
        query = query.eq('client_id', input.client_id);
      }
      if (input.assigned_to) {
        query = query.eq('assigned_to', input.assigned_to);
      }
      if (input.priority) {
        query = query.eq('priority', input.priority);
      }

      const offset = (input.page - 1) * input.limit;
      query = query
        .range(offset, offset + input.limit - 1)
        .order('created_at', { ascending: false });

      const { data: workflows, error, count } = await query;

      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

      const transformedWorkflows = await Promise.all(
        (workflows || []).map(async (workflow: any) => {
          const result: any = { ...workflow };

          if (input.include.includes('client')) {
            const { data: client } = await supabase
              .from('clients')
              .select('id, name, domain')
              .eq('id', workflow.client_id)
              .single();
            result.client = client;
          }

          if (input.include.includes('tasks')) {
            const { data: tasks } = await supabase
              .from('tasks')
              .select('id, title, status, metadata, assigned_to, due_date')
              .eq('workflow_id', workflow.id);
            result.tasks = tasks || [];
          }

          if (input.include.includes('assigned_user') && workflow.assigned_to) {
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

      const totalPages = Math.ceil((count || 0) / input.limit);

      return {
        data: transformedWorkflows,
        pagination: {
          page: input.page,
          limit: input.limit,
          total: count || 0,
          totalPages
        }
      };
    }),

  byId: procedure
    .input(GetWorkflowInput)
    .query(async ({ input, ctx }) => {
      const { supabase } = ctx;
      
      const { data: workflow, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', input.id)
        .single();

      if (error) {
        throw new Error(`Failed to fetch workflow: ${error.message}`);
      }

      if (!workflow) {
        throw new Error('Workflow not found');
      }

      const result: any = { ...workflow };

      if (input.include.includes('client')) {
        const { data: client } = await supabase
          .from('clients')
          .select('id, name, domain')
          .eq('id', workflow.client_id)
          .single();
        result.client = client;
      }

      if (input.include.includes('tasks')) {
        const { data: tasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('workflow_id', workflow.id);
        result.tasks = tasks || [];
      }

      if (input.include.includes('assigned_user') && workflow.assigned_to) {
        const { data: assignedUser } = await supabase
          .from('user_profiles')
          .select('id, full_name, email')
          .eq('id', workflow.assigned_to)
          .single();
        result.assigned_user = assignedUser;
      }

      return result;
    }),

  create: procedure
    .input(CreateWorkflowInput)
    .mutation(async ({ input, ctx }) => {
      const { supabase } = ctx;

      const workflowData: Database['public']['Tables']['workflows']['Insert'] = {
        id: randomUUID(),
        workflow_type: input.workflow_type,
        client_id: input.client_id,
        title: input.title,
        description: input.description,
        priority: input.priority,
        metadata: input.metadata,
        due_date: input.due_date,
        created_by: input.created_by
      };

      const { data: workflow, error } = await supabase
        .from('workflows')
        .insert(workflowData)
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
        throw new Error(`Failed to create workflow: ${error.message}`);
      }

      return {
        ...workflow,
        client: workflow.clients
      };
    }),
});