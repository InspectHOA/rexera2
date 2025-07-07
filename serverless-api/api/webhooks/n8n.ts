/**
 * n8n webhook endpoint for workflow synchronization.
 * Handles updates from n8n Cloud to Rexera database.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { createServerClient } from '../../src/utils/database';
import { handleError } from '../../src/utils/errors';

const n8nWebhookSchema = z.object({
  eventType: z.enum([
    'workflow_completed',
    'workflow_failed', 
    'task_completed',
    'task_failed',
    'agent_task_completed',
    'agent_task_failed',
    'error_occurred'
  ]),
  data: z.record(z.any())
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  const supabase = createServerClient();

  try {
    const input = n8nWebhookSchema.parse(req.body);
    const { eventType, data } = input;

    console.log(`n8n webhook received: ${eventType}`, data);

    switch (eventType) {
      case 'workflow_completed':
        if (data.workflowId) {
          const { error } = await supabase
            .from('workflows')
            .update({
              status: 'COMPLETED',
              completed_at: new Date().toISOString(),
              metadata: {
                ...(data.metadata || {}),
                n8n_completed_at: new Date().toISOString(),
                n8n_result: data.result
              }
            })
            .eq('id', data.workflowId);

          if (error) {
            throw new Error(`Failed to update workflow: ${error.message}`);
          }
        }
        break;

      case 'workflow_failed':
        if (data.workflowId) {
          const { error } = await supabase
            .from('workflows')
            .update({
              status: 'BLOCKED',
              metadata: {
                ...(data.metadata || {}),
                n8n_error: data.error,
                n8n_failed_at: new Date().toISOString(),
                escalation_reason: 'n8n workflow execution failed'
              }
            })
            .eq('id', data.workflowId);

          if (error) {
            throw new Error(`Failed to update workflow: ${error.message}`);
          }
        }
        break;

      case 'task_completed':
        if (data.taskId) {
          const { error } = await supabase
            .from('task_executions')
            .update({
              status: 'COMPLETED',
              completed_at: new Date().toISOString(),
              metadata: {
                ...(data.metadata || {}),
                n8n_result: data.result
              }
            })
            .eq('id', data.taskId);

          if (error) {
            throw new Error(`Failed to update task: ${error.message}`);
          }
        }
        break;

      case 'task_failed':
        if (data.taskId) {
          const { error } = await supabase
            .from('task_executions')
            .update({
              status: 'FAILED',
              metadata: {
                ...(data.metadata || {}),
                n8n_error: data.error,
                escalation_reason: 'Task execution failed in n8n'
              }
            })
            .eq('id', data.taskId);

          if (error) {
            throw new Error(`Failed to update task: ${error.message}`);
          }
        }
        break;

      case 'agent_task_completed':
      case 'agent_task_failed':
        // Handle agent-specific task updates
        if (data.taskId && data.agentName) {
          const status = eventType === 'agent_task_completed' ? 'COMPLETED' : 'FAILED';
          const updates: any = {
            status,
            metadata: {
              ...(data.metadata || {}),
              agent_name: data.agentName,
              agent_result: data.result,
              agent_execution_time: data.executionTime
            }
          };

          if (status === 'COMPLETED') {
            updates.completed_at = new Date().toISOString();
          }

          const { error } = await supabase
            .from('task_executions')
            .update(updates)
            .eq('id', data.taskId);

          if (error) {
            throw new Error(`Failed to update agent task: ${error.message}`);
          }
        }
        break;

      case 'error_occurred':
        // Log error and potentially create support ticket or alert
        console.error('n8n error occurred:', data);
        
        if (data.workflowId) {
          const { error } = await supabase
            .from('workflows')
            .update({
              status: 'BLOCKED',
              metadata: {
                ...(data.metadata || {}),
                n8n_error: data.error,
                n8n_error_node: data.nodeId,
                escalation_reason: 'Unhandled error in n8n workflow'
              }
            })
            .eq('id', data.workflowId);

          if (error) {
            console.error('Failed to update workflow after error:', error);
          }
        }
        break;

      default:
        console.warn(`Unknown n8n event type: ${eventType}`);
    }

    return res.json({
      success: true,
      message: `Processed ${eventType} event successfully`
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid webhook payload',
        details: error.errors
      });
    }

    return handleError(error as Error, res, 'Failed to process n8n webhook');
  }
}