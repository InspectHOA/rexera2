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
import {
  triggerN8nPayoffWorkflow,
  getN8nExecution,
  cancelN8nExecution,
  isN8nEnabled
} from '../../utils/n8n';
import { N8nError } from '../../types/n8n';

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

      // For PAYOFF workflows, trigger n8n if enabled
      if (input.workflow_type === 'PAYOFF' && isN8nEnabled()) {
        try {
          console.log(`Triggering n8n for PAYOFF workflow: ${workflow.id}`);
          
          const n8nExecution = await triggerN8nPayoffWorkflow({
            workflowId: 'payoff-workflow', // This would be configurable
            rexeraWorkflowId: workflow.id,
            workflowType: 'PAYOFF',
            clientId: input.client_id,
            metadata: input.metadata || {}
          });

          // Update workflow with n8n execution ID
          const { error: updateError } = await supabase
            .from('workflows')
            .update({
              n8n_execution_id: n8nExecution.id,
              status: 'IN_PROGRESS'
            })
            .eq('id', workflow.id);

          if (updateError) {
            console.error('Failed to update workflow with n8n execution ID:', updateError);
            // Don't fail the workflow creation, just log the error
          } else {
            // Note: n8n_execution_id will be available after migration is applied
            (workflow as any).n8n_execution_id = n8nExecution.id;
            workflow.status = 'IN_PROGRESS';
          }

          console.log(`n8n workflow triggered successfully: ${n8nExecution.id}`);
        } catch (n8nError) {
          console.error('Failed to trigger n8n workflow:', n8nError);
          // Don't fail the workflow creation - n8n is optional
          // The workflow will continue with database-driven orchestration
        }
      }

      return {
        ...workflow,
        client: workflow.clients
      };
    }),

  // Get n8n execution status for a workflow
  getN8nStatus: procedure
    .input(z.object({
      id: z.string()
    }))
    .query(async ({ input, ctx }) => {
      const { supabase } = ctx;
      
      // Get workflow with n8n_execution_id
      const { data: workflow, error } = await supabase
        .from('workflows')
        .select('id, n8n_execution_id, workflow_type, status')
        .eq('id', input.id)
        .single();

      if (error) {
        throw new Error(`Failed to fetch workflow: ${error.message}`);
      }

      if (!workflow) {
        throw new Error('Workflow not found');
      }

      // If no n8n execution ID, return workflow status only
      if (!workflow.n8n_execution_id) {
        return {
          workflowId: workflow.id,
          workflowStatus: workflow.status,
          n8nEnabled: false,
          n8nStatus: null
        };
      }

      // Get n8n execution status if enabled
      if (!isN8nEnabled()) {
        return {
          workflowId: workflow.id,
          workflowStatus: workflow.status,
          n8nEnabled: false,
          n8nExecutionId: workflow.n8n_execution_id,
          n8nStatus: null
        };
      }

      try {
        const n8nStatus = await getN8nExecution(workflow.n8n_execution_id);
        
        return {
          workflowId: workflow.id,
          workflowStatus: workflow.status,
          n8nEnabled: true,
          n8nExecutionId: workflow.n8n_execution_id,
          n8nStatus
        };
      } catch (n8nError) {
        console.error('Failed to get n8n status:', n8nError);
        
        return {
          workflowId: workflow.id,
          workflowStatus: workflow.status,
          n8nEnabled: true,
          n8nExecutionId: workflow.n8n_execution_id,
          n8nStatus: null,
          error: n8nError instanceof Error ? n8nError.message : 'Unknown n8n error'
        };
      }
    }),

  // Cancel n8n execution for a workflow
  cancelN8nExecution: procedure
    .input(z.object({
      id: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      const { supabase } = ctx;
      
      // Get workflow with n8n_execution_id
      const { data: workflow, error } = await supabase
        .from('workflows')
        .select('id, n8n_execution_id, workflow_type, status')
        .eq('id', input.id)
        .single();

      if (error) {
        throw new Error(`Failed to fetch workflow: ${error.message}`);
      }

      if (!workflow) {
        throw new Error('Workflow not found');
      }

      if (!workflow.n8n_execution_id) {
        throw new Error('Workflow has no n8n execution to cancel');
      }

      if (!isN8nEnabled()) {
        throw new Error('n8n integration is not enabled');
      }

      try {
        const success = await cancelN8nExecution(workflow.n8n_execution_id);
        
        if (success) {
          // Update workflow status to blocked
          const { error: updateError } = await supabase
            .from('workflows')
            .update({
              status: 'BLOCKED',
              updated_at: new Date().toISOString()
            })
            .eq('id', workflow.id);

          if (updateError) {
            console.error('Failed to update workflow status after cancellation:', updateError);
          }
        }
        
        return {
          success,
          workflowId: workflow.id,
          n8nExecutionId: workflow.n8n_execution_id,
          message: success ? 'n8n execution cancelled successfully' : 'Failed to cancel n8n execution'
        };
      } catch (n8nError) {
        console.error('Failed to cancel n8n execution:', n8nError);
        throw new Error(`Failed to cancel n8n execution: ${n8nError instanceof Error ? n8nError.message : 'Unknown error'}`);
      }
    }),
});