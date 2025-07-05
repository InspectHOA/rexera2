/**
 * Individual workflow endpoint for Vercel serverless function.
 * Handles getting workflow by ID and related operations.
 */

import { NextApiRequest, NextApiResponse } from '../../types/next';
import { z } from 'zod';
import { createServerClient } from '../../utils/database';
import { 
  getN8nExecution,
  cancelN8nExecution,
  isN8nEnabled 
} from '../../utils/n8n';

const GetWorkflowInput = z.object({
  include: z.string().optional().transform(val => val ? val.split(',').map(s => s.trim()) : [])
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServerClient();
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Invalid workflow ID'
    });
  }

  try {
    if (req.method === 'GET') {
      // Get workflow by ID
      const input = GetWorkflowInput.parse(req.query);

      const { data: workflow, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(`Failed to fetch workflow: ${error.message}`);
      }

      if (!workflow) {
        return res.status(404).json({
          success: false,
          error: 'Workflow not found'
        });
      }

      const result: any = { ...workflow };

      // Load relationships
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

      return res.json({
        success: true,
        data: result
      });

    } else {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }
  } catch (error: any) {
    console.error('Workflow API error:', error);
    
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