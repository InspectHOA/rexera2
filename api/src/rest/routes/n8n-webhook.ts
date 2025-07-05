// =====================================================
// n8n Webhook Endpoint
// Unified webhook for all n8n events
// =====================================================

import { Router, Request, Response } from 'express';
import { createServerClient } from '../../utils/database';
import { config } from '../../config';
import {
  N8nWebhookEvent,
  N8nWorkflowStartedEvent,
  N8nTaskAssignedEvent,
  N8nAgentTaskCompletedEvent,
  N8nWorkflowCompletedEvent,
  N8nErrorEvent,
  N8nWebhookError
} from '../../types/n8n';

const router = Router();

// Helper function to handle errors
function handleError(error: any, res: Response) {
  console.error('n8n Webhook Error:', error);
  
  const statusCode = error instanceof N8nWebhookError ? 400 : 500;
  const message = error instanceof Error ? error.message : 'Unknown error';
  
  return res.status(statusCode).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  });
}

/**
 * Validate webhook authentication
 * In production, this should verify webhook signatures or API keys
 */
function validateWebhookAuth(req: Request): boolean {
  // For now, we'll use a simple API key check
  const authHeader = req.headers.authorization;
  const expectedKey = process.env.N8N_WEBHOOK_SECRET || process.env.INTERNAL_API_KEY;
  
  if (!expectedKey) {
    console.warn('No webhook authentication configured');
    return true; // Allow in development
  }
  
  if (!authHeader) {
    return false;
  }
  
  const token = authHeader.replace('Bearer ', '');
  return token === expectedKey;
}

/**
 * Validate webhook event structure
 */
function validateWebhookEvent(body: any): N8nWebhookEvent {
  if (!body || typeof body !== 'object') {
    throw new N8nWebhookError('Invalid webhook payload');
  }
  
  const { eventType, executionId, workflowId, timestamp, data } = body;
  
  if (!eventType || !executionId || !workflowId || !timestamp || !data) {
    throw new N8nWebhookError('Missing required webhook fields');
  }
  
  const validEventTypes = [
    'workflow_started',
    'task_assigned_to_agent',
    'agent_task_completed',
    'workflow_completed',
    'error_occurred'
  ];
  
  if (!validEventTypes.includes(eventType)) {
    throw new N8nWebhookError(`Invalid event type: ${eventType}`);
  }
  
  return body as N8nWebhookEvent;
}

/**
 * Handle workflow started event
 */
async function handleWorkflowStarted(event: N8nWorkflowStartedEvent): Promise<void> {
  console.log('Processing workflow_started event:', event);
  
  const { rexeraWorkflowId } = event.data;
  const supabase = createServerClient();
  
  // Update workflow with n8n execution ID and status
  const { error } = await supabase
    .from('workflows')
    .update({
      n8n_execution_id: event.executionId,
      status: 'IN_PROGRESS',
      updated_at: new Date().toISOString()
    })
    .eq('id', rexeraWorkflowId);
  
  if (error) {
    throw new N8nWebhookError(`Failed to update workflow: ${error.message}`);
  }
  
  console.log(`Workflow ${rexeraWorkflowId} updated with n8n execution ${event.executionId}`);
}

/**
 * Handle task assigned to agent event
 */
async function handleTaskAssigned(event: N8nTaskAssignedEvent): Promise<void> {
  console.log('Processing task_assigned_to_agent event:', event);
  
  const { rexeraWorkflowId, taskId, agentName, taskType, taskData } = event.data;
  const supabase = createServerClient();
  
  // Update task status and metadata
  const { error } = await supabase
    .from('tasks')
    .update({
      status: 'PENDING',
      metadata: {
        ...taskData,
        n8n_execution_id: event.executionId,
        assigned_agent: agentName,
        task_type: taskType
      },
      updated_at: new Date().toISOString()
    })
    .eq('id', taskId);
  
  if (error) {
    console.error(`Failed to update task ${taskId}:`, error);
    // Don't throw here - log and continue
  }
  
  console.log(`Task ${taskId} assigned to agent ${agentName}`);
}

/**
 * Handle agent task completed event
 */
async function handleAgentTaskCompleted(event: N8nAgentTaskCompletedEvent): Promise<void> {
  console.log('Processing agent_task_completed event:', event);
  
  const { rexeraWorkflowId, taskId, agentName, result, status, error: taskError } = event.data;
  const supabase = createServerClient();
  
  // Update task with completion status
  const updateData: any = {
    status: status === 'success' ? 'COMPLETED' : 'FAILED',
    completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: {
      n8n_execution_id: event.executionId,
      agent_result: result,
      completed_by_agent: agentName
    }
  };
  
  if (taskError) {
    updateData.metadata.error = taskError;
  }
  
  const { error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', taskId);
  
  if (error) {
    console.error(`Failed to update completed task ${taskId}:`, error);
  }
  
  console.log(`Task ${taskId} completed by agent ${agentName} with status: ${status}`);
}

/**
 * Handle workflow completed event
 */
async function handleWorkflowCompleted(event: N8nWorkflowCompletedEvent): Promise<void> {
  console.log('Processing workflow_completed event:', event);
  
  const { rexeraWorkflowId, status, result, error: workflowError } = event.data;
  const supabase = createServerClient();
  
  // Update workflow with completion status
  const updateData: any = {
    status: status === 'success' ? 'COMPLETED' : 'BLOCKED',
    completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: {
      n8n_execution_id: event.executionId,
      n8n_result: result
    }
  };
  
  if (workflowError) {
    updateData.metadata.n8n_error = workflowError;
  }
  
  const { error } = await supabase
    .from('workflows')
    .update(updateData)
    .eq('id', rexeraWorkflowId);
  
  if (error) {
    throw new N8nWebhookError(`Failed to update completed workflow: ${error.message}`);
  }
  
  console.log(`Workflow ${rexeraWorkflowId} completed with status: ${status}`);
}

/**
 * Handle error occurred event
 */
async function handleErrorOccurred(event: N8nErrorEvent): Promise<void> {
  console.log('Processing error_occurred event:', event);
  
  const { rexeraWorkflowId, error: errorMessage, stack, nodeId, nodeName } = event.data;
  const supabase = createServerClient();
  
  // Update workflow status to blocked
  const { error } = await supabase
    .from('workflows')
    .update({
      status: 'BLOCKED',
      updated_at: new Date().toISOString(),
      metadata: {
        n8n_execution_id: event.executionId,
        n8n_error: errorMessage,
        n8n_error_stack: stack,
        n8n_error_node: nodeId,
        n8n_error_node_name: nodeName
      }
    })
    .eq('id', rexeraWorkflowId);
  
  if (error) {
    console.error(`Failed to update workflow with error status:`, error);
  }
  
  console.error(`Workflow ${rexeraWorkflowId} encountered error: ${errorMessage}`);
}

/**
 * Main webhook endpoint
 */
router.post('/n8n', async (req: Request, res: Response) => {
  try {
    console.log('Received n8n webhook:', req.body);
    
    // Validate authentication
    if (!validateWebhookAuth(req)) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }
    
    // Validate and parse event
    const event = validateWebhookEvent(req.body);
    
    // Route to appropriate handler based on event type
    switch (event.eventType) {
      case 'workflow_started':
        await handleWorkflowStarted(event as N8nWorkflowStartedEvent);
        break;
        
      case 'task_assigned_to_agent':
        await handleTaskAssigned(event as N8nTaskAssignedEvent);
        break;
        
      case 'agent_task_completed':
        await handleAgentTaskCompleted(event as N8nAgentTaskCompletedEvent);
        break;
        
      case 'workflow_completed':
        await handleWorkflowCompleted(event as N8nWorkflowCompletedEvent);
        break;
        
      case 'error_occurred':
        await handleErrorOccurred(event as N8nErrorEvent);
        break;
        
      default:
        console.warn(`Unhandled event type: ${event.eventType}`);
    }
    
    res.json({
      success: true,
      message: 'Webhook processed successfully',
      eventType: event.eventType,
      executionId: event.executionId
    });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    
    const statusCode = error instanceof N8nWebhookError ? 400 : 500;
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    res.status(statusCode).json({
      success: false,
      error: message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Health check endpoint for webhook
 */
router.get('/n8n/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'n8n webhook endpoint is healthy',
    timestamp: new Date().toISOString()
  });
});

export { router as n8nWebhookRouter };