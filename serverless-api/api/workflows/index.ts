/**
 * Workflows endpoint for Vercel serverless function.
 * Handles workflow listing and creation.
 */

import { NextApiRequest, NextApiResponse } from '../types/next';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { createServerClient } from '../utils/database';
import { 
  triggerN8nPayoffWorkflow,
  isN8nEnabled 
} from '../utils/n8n';

// Validation schemas
const GetWorkflowsInput = z.object({
  workflow_type: z.enum(['MUNI_LIEN_SEARCH', 'HOA_ACQUISITION', 'PAYOFF']).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'AWAITING_REVIEW', 'BLOCKED', 'COMPLETED']).optional(),
  client_id: z.string().optional(),
  assigned_to: z.string().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 10),
  include: z.string().optional().transform(val => val ? val.split(',').map(s => s.trim()) : [])
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServerClient();

  try {
    if (req.method === 'GET') {
      // List workflows
      const input = GetWorkflowsInput.parse(req.query);

      let query = supabase
        .from('workflows')
        .select('*', { count: 'exact' });

      // Apply filters
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

      // Apply pagination
      const offset = (input.page - 1) * input.limit;
      query = query
        .range(offset, offset + input.limit - 1)
        .order('created_at', { ascending: false });

      const { data: workflows, error, count } = await query;

      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

      // Transform workflows with optional relationship loading
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

      return res.json({
        success: true,
        data: transformedWorkflows,
        pagination: {
          page: input.page,
          limit: input.limit,
          total: count || 0,
          totalPages
        }
      });

    } else if (req.method === 'POST') {
      // Create workflow
      const input = CreateWorkflowInput.parse(req.body);

      const workflowData = {
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

      // Trigger n8n automation for PAYOFF workflows
      if (input.workflow_type === 'PAYOFF' && isN8nEnabled()) {
        try {
          console.log(`Triggering n8n for PAYOFF workflow: ${workflow.id}`);
          
          const n8nExecution = await triggerN8nPayoffWorkflow({
            workflowId: 'payoff-workflow',
            rexeraWorkflowId: workflow.id,
            workflowType: 'PAYOFF',
            clientId: input.client_id,
            metadata: input.metadata || {}
          });

          // TODO: Add n8n_execution_id column to workflows table
          // For now, just log the execution ID
          console.log(`n8n execution ID: ${n8nExecution.id} (not stored in DB yet)`);

          console.log(`n8n workflow triggered successfully: ${n8nExecution.id}`);
        } catch (n8nError) {
          console.error('Failed to trigger n8n workflow:', n8nError);
        }
      }

      return res.status(201).json({
        success: true,
        data: {
          ...workflow,
          client: workflow.clients
        }
      });

    } else {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }
  } catch (error: any) {
    console.error('Workflows API error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}