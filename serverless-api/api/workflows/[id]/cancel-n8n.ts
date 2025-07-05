/**
 * Cancel n8n execution endpoint for workflow management.
 */

import { NextApiRequest, NextApiResponse } from '../../types/next';
import { createServerClient } from '../../utils/database';
import { 
  cancelN8nExecution,
  isN8nEnabled 
} from '../../utils/n8n';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  const supabase = createServerClient();
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Invalid workflow ID'
    });
  }

  try {
    const { data: workflow, error } = await supabase
      .from('workflows')
      .select('id, workflow_type, status')
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

    if (!isN8nEnabled()) {
      return res.status(400).json({
        success: false,
        error: 'n8n integration is not enabled'
      });
    }

    // For now, return a placeholder response since n8n_execution_id column doesn't exist yet
    return res.json({
      success: true,
      data: {
        success: false,
        workflowId: workflow.id,
        message: 'n8n execution cancellation not yet implemented - database schema needs n8n_execution_id column'
      }
    });
  } catch (error: any) {
    console.error('Cancel n8n API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}