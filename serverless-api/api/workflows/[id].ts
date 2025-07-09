/**
 * Real workflow details endpoint using Supabase database
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient } from '../../src/utils/database';
import { handleError } from '../../src/utils/errors';

interface WorkflowQueryParams {
  id: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabase = createServerClient();
  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Invalid workflow ID'
    });
  }

  try {
    if (req.method === 'GET') {
      // Only accept UUIDs now - much simpler
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      
      if (!isUUID) {
        return res.status(400).json({
          success: false,
          error: 'Invalid workflow ID. Please use a valid UUID.'
        });
      }
      
      console.log(`Workflow lookup: ${id}`);
      
      // Fetch workflow with related data using UUID only
      const { data: workflow, error: workflowError } = await supabase
        .from('workflows')
        .select(`
          id,
          workflow_type,
          client_id,
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
          clients(id, name, domain)
        `)
        .eq('id', id)
        .single();

      if (workflowError || !workflow) {
        if (workflowError?.code === 'PGRST116' || !workflow) {
          return res.status(404).json({
            success: false,
            error: 'Workflow not found'
          });
        }
        console.error('Failed to fetch workflow:', workflowError);
        throw new Error(`Failed to fetch workflow: ${workflowError?.message || 'Unknown error'}`);
      }

      // Fetch tasks for this workflow (using the actual workflow UUID)
      const { data: tasks, error: tasksError } = await supabase
        .from('task_executions')
        .select(`
          id,
          workflow_id,
          title,
          description,
          status,
          executor_type,
          priority,
          sequence_order,
          task_type,
          agent_id,
          input_data,
          output_data,
          error_message,
          started_at,
          completed_at,
          execution_time_ms,
          retry_count,
          created_at,
          agent:agents(id, name, type)
        `)
        .eq('workflow_id', workflow.id)
        .order('sequence_order', { ascending: true });

      if (tasksError) {
        console.error('Failed to fetch tasks:', tasksError);
        // Don't fail the whole request if tasks fail
      }

      // Transform the data for frontend compatibility
      const transformedWorkflow = {
        ...workflow,
        client: workflow.clients?.[0] || null,
        tasks: tasks || []
      };

      return res.json({
        success: true,
        data: transformedWorkflow
      });
      
    } else {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }
  } catch (error) {
    return handleError(error as Error, res, 'Failed to fetch workflow details');
  }
}