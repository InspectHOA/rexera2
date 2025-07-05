/**
 * n8n status endpoint for workflow monitoring.
 */

import { NextApiRequest, NextApiResponse } from '../../types/next';
import { createServerClient } from '../../utils/database';
import { 
  getN8nExecution,
  isN8nEnabled 
} from '../../utils/n8n';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
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

    // For now, return basic status since n8n_execution_id column doesn't exist yet
    return res.json({
      success: true,
      data: {
        workflowId: workflow.id,
        workflowStatus: workflow.status,
        n8nEnabled: isN8nEnabled(),
        n8nStatus: null,
        message: 'n8n integration available but execution tracking not yet implemented'
      }
    });
  } catch (error: any) {
    console.error('n8n status API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}