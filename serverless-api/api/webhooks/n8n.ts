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

// Helper function to create notifications
async function createNotification(
  supabase: any,
  userId: string,
  type: string,
  priority: string,
  title: string,
  message: string,
  actionUrl?: string,
  metadata?: any
) {
  try {
    const { error } = await supabase
      .from('hil_notifications')
      .insert({
        user_id: userId,
        type,
        priority,
        title,
        message,
        action_url: actionUrl,
        metadata: metadata || {}
      });

    if (error) {
      console.error('Failed to create notification:', error);
    }
  } catch (err) {
    console.error('Error creating notification:', err);
  }
}

// Helper function to get assigned user for a workflow
async function getWorkflowAssignedUser(supabase: any, workflowId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('workflows')
      .select('assigned_to, human_readable_id')
      .eq('id', workflowId)
      .single();

    if (error || !data?.assigned_to) {
      // If no assigned user, try to get a default HIL user
      const { data: hilUser } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_type', 'hil_user')
        .limit(1)
        .single();
      
      return hilUser?.id || null;
    }

    return data.assigned_to;
  } catch (err) {
    console.error('Error getting workflow assigned user:', err);
    return null;
  }
}

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

          // Create notification for workflow completion
          const assignedUser = await getWorkflowAssignedUser(supabase, data.workflowId);
          if (assignedUser) {
            await createNotification(
              supabase,
              assignedUser,
              'WORKFLOW_UPDATE',
              'NORMAL',
              '🎉 Workflow Completed',
              `Workflow ${data.workflowId} has been completed successfully`,
              `/workflow/${data.workflowId}`,
              { workflow_id: data.workflowId, event_type: 'completed' }
            );
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

          // Create notification for workflow failure
          const assignedUser = await getWorkflowAssignedUser(supabase, data.workflowId);
          if (assignedUser) {
            await createNotification(
              supabase,
              assignedUser,
              'AGENT_FAILURE',
              'HIGH',
              '💥 Workflow Failed',
              `Workflow ${data.workflowId} encountered critical errors and is now blocked`,
              `/workflow/${data.workflowId}`,
              { workflow_id: data.workflowId, error: data.error, event_type: 'failed' }
            );
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
          // Update task status
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

          // Get task details for notification
          const { data: task } = await supabase
            .from('task_executions')
            .select('workflow_id, title, task_type')
            .eq('id', data.taskId)
            .single();

          if (task) {
            const assignedUser = await getWorkflowAssignedUser(supabase, task.workflow_id);
            if (assignedUser) {
              await createNotification(
                supabase,
                assignedUser,
                'TASK_INTERRUPT',
                'HIGH',
                '❌ Task Failed',
                `${task.title || task.task_type} failed and requires attention`,
                `/workflow/${task.workflow_id}`,
                { task_id: data.taskId, workflow_id: task.workflow_id, error: data.error }
              );
            }
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