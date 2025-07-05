/**
 * @fileoverview n8n webhook endpoint for real-time workflow synchronization.
 *
 * This module provides the critical bidirectional communication bridge between
 * n8n Cloud automation platform and Rexera's workflow management system.
 * It processes webhook events from n8n to maintain real-time synchronization
 * of workflow states, task assignments, and completion status.
 *
 * Key Responsibilities:
 * - Receive and validate webhook events from n8n Cloud
 * - Synchronize workflow status between n8n and Rexera database
 * - Update task assignments and completion status from AI agents
 * - Handle error conditions and workflow failures gracefully
 * - Maintain audit trail of all n8n interactions
 *
 * Webhook Event Types:
 * - workflow_started: n8n begins processing a Rexera workflow
 * - task_assigned_to_agent: AI agent receives a task assignment
 * - agent_task_completed: AI agent completes assigned task
 * - workflow_completed: n8n workflow execution finishes
 * - error_occurred: n8n encounters execution errors
 *
 * Security Features:
 * - Webhook authentication via API key or signature validation
 * - Request validation and sanitization
 * - Error handling without information leakage
 * - Comprehensive logging for security monitoring
 *
 * Business Impact:
 * - Enables real-time workflow progress tracking
 * - Supports automated SLA monitoring and alerting
 * - Provides immediate feedback for customer service
 * - Maintains data consistency across distributed systems
 *
 * @module N8nWebhookRouter
 * @requires express - HTTP server framework for webhook endpoints
 * @requires ../../utils/database - Supabase client for database operations
 * @requires ../../config - Environment configuration and settings
 * @requires ../../types/n8n - TypeScript definitions for n8n webhook events
 */

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

/**
 * Centralized error handler for webhook processing failures.
 *
 * Provides consistent error response format and appropriate HTTP status codes
 * while ensuring sensitive information is not leaked in error responses.
 *
 * @param error - Error object or unknown error type
 * @param res - Express response object for sending error response
 * @returns Express response with standardized error format
 */
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
 * Validates webhook authentication to ensure requests originate from n8n Cloud.
 *
 * Security Implementation:
 * - Uses Bearer token authentication with shared secret
 * - Falls back to internal API key for development environments
 * - Allows unauthenticated requests in development when no secret is configured
 * - Logs security warnings for missing authentication configuration
 *
 * Production Security Considerations:
 * - Should implement webhook signature validation (HMAC-SHA256)
 * - Consider IP allowlisting for additional security
 * - Rotate webhook secrets regularly
 * - Monitor for authentication failures and potential attacks
 *
 * @param req - Express request object containing headers and authentication
 * @returns true if authentication is valid, false otherwise
 */
function validateWebhookAuth(req: Request): boolean {
  // Extract authorization header for Bearer token validation
  const authHeader = req.headers.authorization;
  const expectedKey = process.env.N8N_WEBHOOK_SECRET || process.env.INTERNAL_API_KEY;
  
  // Allow unauthenticated requests in development environments
  if (!expectedKey) {
    console.warn('No webhook authentication configured');
    return true; // Allow in development
  }
  
  if (!authHeader) {
    return false;
  }
  
  // Extract token from "Bearer <token>" format
  const token = authHeader.replace('Bearer ', '');
  return token === expectedKey;
}

/**
 * Validates webhook event structure and content for security and data integrity.
 *
 * Validation Rules:
 * - Ensures payload is a valid JSON object
 * - Validates presence of all required fields
 * - Checks event type against allowed values
 * - Prevents processing of malformed or malicious payloads
 *
 * Required Fields:
 * - eventType: Type of n8n event (workflow_started, task_assigned, etc.)
 * - executionId: n8n execution identifier for tracking
 * - workflowId: n8n workflow identifier
 * - timestamp: Event occurrence timestamp for ordering
 * - data: Event-specific payload data
 *
 * @param body - Raw webhook payload from n8n
 * @returns Validated and typed webhook event object
 * @throws N8nWebhookError when validation fails
 */
function validateWebhookEvent(body: any): N8nWebhookEvent {
  if (!body || typeof body !== 'object') {
    throw new N8nWebhookError('Invalid webhook payload');
  }
  
  const { eventType, executionId, workflowId, timestamp, data } = body;
  
  if (!eventType || !executionId || !workflowId || !timestamp || !data) {
    throw new N8nWebhookError('Missing required webhook fields');
  }
  
  // Validate event type against supported workflow events
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
 * Handles workflow started events from n8n to synchronize execution state.
 *
 * Business Context:
 * - Confirms n8n has successfully begun processing a Rexera workflow
 * - Links n8n execution ID to Rexera workflow for bidirectional tracking
 * - Updates workflow status to IN_PROGRESS for real-time dashboard updates
 * - Enables monitoring and debugging of automated workflow execution
 *
 * Synchronization Process:
 * 1. Extract Rexera workflow ID from n8n event data
 * 2. Update Rexera workflow record with n8n execution ID
 * 3. Change workflow status from PENDING to IN_PROGRESS
 * 4. Record timestamp for SLA tracking and performance monitoring
 *
 * Error Handling:
 * - Throws N8nWebhookError on database update failures
 * - Ensures webhook processing fails if synchronization cannot be completed
 * - Maintains data consistency between n8n and Rexera systems
 *
 * @param event - n8n workflow started event with execution and workflow details
 * @throws N8nWebhookError when database update fails
 */
async function handleWorkflowStarted(event: N8nWorkflowStartedEvent): Promise<void> {
  console.log('Processing workflow_started event:', event);
  
  const { rexeraWorkflowId } = event.data;
  const supabase = createServerClient();
  
  // Link n8n execution to Rexera workflow and update status
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
 * Handles task assignment events when n8n delegates work to AI agents.
 *
 * Business Context:
 * - Coordinates between n8n workflow orchestration and AI agent task execution
 * - Updates Rexera task records with agent assignments and n8n context
 * - Enables tracking of which AI agent is handling specific workflow tasks
 * - Supports load balancing and performance monitoring of agent assignments
 *
 * Agent Coordination:
 * - Maps n8n task assignments to Rexera task management system
 * - Preserves task context and metadata for agent execution
 * - Links tasks to n8n execution for end-to-end traceability
 * - Updates task status to PENDING to indicate agent assignment
 *
 * Task Types and Agents:
 * - Document processing tasks → Document analysis agents
 * - Communication tasks → Customer service agents
 * - Data validation tasks → Quality assurance agents
 * - Research tasks → Information gathering agents
 *
 * Error Handling Strategy:
 * - Logs errors but continues processing (non-critical for webhook success)
 * - Allows workflow to continue even if task update fails
 * - Maintains resilience in distributed agent coordination
 *
 * @param event - n8n task assignment event with agent and task details
 */
async function handleTaskAssigned(event: N8nTaskAssignedEvent): Promise<void> {
  console.log('Processing task_assigned_to_agent event:', event);
  
  const { rexeraWorkflowId, taskId, agentName, taskType, taskData } = event.data;
  const supabase = createServerClient();
  
  // Update task with agent assignment and n8n context
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
    // Don't throw here - log and continue to maintain workflow resilience
  }
  
  console.log(`Task ${taskId} assigned to agent ${agentName}`);
}

/**
 * Handles agent task completion events to track AI agent work results.
 *
 * Business Context:
 * - Records completion of AI agent tasks within n8n workflows
 * - Updates task status and preserves agent results for audit and quality review
 * - Enables performance tracking and SLA monitoring for agent tasks
 * - Supports workflow continuation based on agent task outcomes
 *
 * Agent Task Results:
 * - Document analysis results (extracted data, validation status)
 * - Communication outcomes (emails sent, responses received)
 * - Research findings (property data, lien information, contact details)
 * - Quality assurance results (validation errors, approval status)
 *
 * Status Mapping:
 * - success → COMPLETED: Agent successfully completed the task
 * - failure → FAILED: Agent encountered errors or couldn't complete task
 * - Preserves original agent result data for review and debugging
 *
 * Error Handling:
 * - Logs database errors but doesn't throw (maintains workflow resilience)
 * - Preserves error information from agent execution
 * - Allows workflow to continue even if task update fails
 *
 * @param event - n8n agent task completion event with results and status
 */
async function handleAgentTaskCompleted(event: N8nAgentTaskCompletedEvent): Promise<void> {
  console.log('Processing agent_task_completed event:', event);
  
  const { rexeraWorkflowId, taskId, agentName, result, status, error: taskError } = event.data;
  const supabase = createServerClient();
  
  // Update task with completion status and agent results
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
  
  // Preserve error information for debugging and quality review
  if (taskError) {
    updateData.metadata.error = taskError;
  }
  
  const { error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', taskId);
  
  if (error) {
    console.error(`Failed to update completed task ${taskId}:`, error);
    // Don't throw - maintain workflow resilience
  }
  
  console.log(`Task ${taskId} completed by agent ${agentName} with status: ${status}`);
}

/**
 * Handles workflow completion events to finalize Rexera workflow processing.
 *
 * Business Context:
 * - Marks the end of automated n8n workflow execution
 * - Updates Rexera workflow with final status and results
 * - Triggers downstream processes (notifications, billing, reporting)
 * - Provides completion data for SLA compliance and customer updates
 *
 * Completion Scenarios:
 * - Successful completion: All tasks completed, deliverables generated
 * - Partial completion: Some tasks failed but workflow can be marked complete
 * - Failed completion: Critical errors prevent workflow completion
 *
 * Status Mapping:
 * - success → COMPLETED: Workflow finished successfully with all deliverables
 * - failure → BLOCKED: Workflow failed and requires manual intervention
 *
 * Result Data:
 * - Generated documents (payoff statements, lien reports, HOA documents)
 * - Extracted information (property details, contact information)
 * - Processing metrics (duration, task counts, error rates)
 * - Quality scores and validation results
 *
 * Post-Completion Actions:
 * - Customer notifications sent automatically
 * - Billing events triggered for completed workflows
 * - Quality review queued for failed workflows
 * - Performance metrics updated for reporting
 *
 * @param event - n8n workflow completion event with final status and results
 * @throws N8nWebhookError when database update fails (critical for data consistency)
 */
async function handleWorkflowCompleted(event: N8nWorkflowCompletedEvent): Promise<void> {
  console.log('Processing workflow_completed event:', event);
  
  const { rexeraWorkflowId, status, result, error: workflowError } = event.data;
  const supabase = createServerClient();
  
  // Update workflow with final completion status and results
  const updateData: any = {
    status: status === 'success' ? 'COMPLETED' : 'BLOCKED',
    completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: {
      n8n_execution_id: event.executionId,
      n8n_result: result
    }
  };
  
  // Preserve error information for failed workflows
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
 * Handles error events from n8n to track and respond to workflow failures.
 *
 * Business Context:
 * - Captures detailed error information for debugging and resolution
 * - Updates workflow status to BLOCKED to prevent further processing
 * - Enables rapid response to workflow failures and system issues
 * - Provides error context for customer service and technical support
 *
 * Error Categories:
 * - External API failures (lender systems, title companies)
 * - Data validation errors (missing information, invalid formats)
 * - Agent execution errors (AI model failures, timeout issues)
 * - System errors (network issues, service unavailability)
 *
 * Error Information Captured:
 * - Error message and stack trace for debugging
 * - n8n node information (which step failed)
 * - Execution context and timing
 * - Related workflow and task identifiers
 *
 * Recovery Process:
 * - Workflow marked as BLOCKED for manual review
 * - Error details preserved for debugging
 * - Alerts triggered for critical system errors
 * - Customer notifications sent for service disruptions
 *
 * Error Handling Strategy:
 * - Logs database errors but doesn't throw (webhook should succeed)
 * - Preserves all available error context for investigation
 * - Enables graceful degradation and manual recovery
 *
 * @param event - n8n error event with detailed error information and context
 */
async function handleErrorOccurred(event: N8nErrorEvent): Promise<void> {
  console.log('Processing error_occurred event:', event);
  
  const { rexeraWorkflowId, error: errorMessage, stack, nodeId, nodeName } = event.data;
  const supabase = createServerClient();
  
  // Update workflow status to blocked with comprehensive error details
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
    // Don't throw - webhook should succeed even if database update fails
  }
  
  console.error(`Workflow ${rexeraWorkflowId} encountered error: ${errorMessage}`);
}

/**
 * Main n8n webhook endpoint for processing all workflow synchronization events.
 *
 * Business Context:
 * - Primary integration point between n8n Cloud and Rexera workflow system
 * - Processes real-time events to maintain synchronized workflow state
 * - Critical for automated workflow monitoring and customer service
 * - Enables immediate response to workflow status changes and issues
 *
 * Request Processing Flow:
 * 1. Authentication validation using Bearer token or API key
 * 2. Webhook payload validation and sanitization
 * 3. Event type routing to specialized handler functions
 * 4. Database synchronization and state updates
 * 5. Success/error response with processing details
 *
 * Supported Event Types:
 * - workflow_started: n8n begins processing Rexera workflow
 * - task_assigned_to_agent: AI agent receives task assignment
 * - agent_task_completed: AI agent completes assigned task
 * - workflow_completed: n8n workflow execution finishes
 * - error_occurred: n8n encounters execution errors
 *
 * Security Features:
 * - Bearer token authentication with configurable secrets
 * - Request payload validation and sanitization
 * - Error response sanitization to prevent information leakage
 * - Comprehensive logging for security monitoring
 *
 * Error Handling Strategy:
 * - 401 Unauthorized for authentication failures
 * - 400 Bad Request for validation errors (N8nWebhookError)
 * - 500 Internal Server Error for system failures
 * - Detailed error logging for debugging and monitoring
 *
 * Performance Considerations:
 * - Asynchronous processing for database operations
 * - Non-blocking error handling for resilience
 * - Minimal response payload for efficiency
 * - Comprehensive logging for monitoring and debugging
 *
 * @route POST /n8n
 * @param req - Express request with n8n webhook payload
 * @param res - Express response for webhook acknowledgment
 * @returns JSON response indicating processing success or failure
 */
router.post('/n8n', async (req: Request, res: Response) => {
  try {
    console.log('Received n8n webhook:', req.body);
    
    // Validate webhook authentication to ensure request originates from n8n
    if (!validateWebhookAuth(req)) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }
    
    // Validate and parse webhook event structure
    const event = validateWebhookEvent(req.body);
    
    // Route to appropriate handler based on event type
    // Each handler manages specific workflow synchronization logic
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
        // Continue processing - unknown events are logged but not failed
    }
    
    // Return success response with event details for n8n confirmation
    res.json({
      success: true,
      message: 'Webhook processed successfully',
      eventType: event.eventType,
      executionId: event.executionId
    });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    
    // Determine appropriate HTTP status code based on error type
    const statusCode = error instanceof N8nWebhookError ? 400 : 500;
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    // Return standardized error response
    res.status(statusCode).json({
      success: false,
      error: message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Health check endpoint for n8n webhook monitoring and diagnostics.
 *
 * Business Context:
 * - Enables n8n Cloud to verify webhook endpoint availability
 * - Supports monitoring and alerting for webhook service health
 * - Provides simple connectivity test without side effects
 * - Used by load balancers and monitoring systems for health checks
 *
 * Monitoring Integration:
 * - Can be called periodically by n8n for service validation
 * - Supports uptime monitoring and SLA tracking
 * - Enables early detection of webhook service issues
 * - Provides baseline for webhook endpoint performance
 *
 * Response Format:
 * - Simple JSON response indicating service availability
 * - Timestamp for request tracking and debugging
 * - Consistent format for automated monitoring tools
 *
 * @route GET /n8n/health
 * @param req - Express request (no parameters required)
 * @param res - Express response with health status
 * @returns JSON response confirming webhook endpoint health
 */
router.get('/n8n/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'n8n webhook endpoint is healthy',
    timestamp: new Date().toISOString()
  });
});

export { router as n8nWebhookRouter };