/**
 * @fileoverview n8n Cloud Integration Type Definitions for Rexera 2.0
 *
 * This module defines comprehensive TypeScript interfaces for n8n Cloud integration,
 * enabling type-safe communication between Rexera and n8n workflow automation.
 *
 * Integration Architecture:
 * - Bidirectional communication via REST API and webhooks
 * - Real-time workflow execution monitoring and status synchronization
 * - Event-driven architecture for workflow state management
 * - Type-safe data exchange for reliable automation
 *
 * Key Integration Points:
 * - Workflow triggering from Rexera to n8n Cloud
 * - Webhook events from n8n back to Rexera for status updates
 * - Agent task coordination and result processing
 * - Error handling and recovery mechanisms
 *
 * Business Context:
 * - Enables automated processing of PAYOFF workflows
 * - Provides real-time visibility into workflow execution
 * - Supports scalable document processing and AI agent coordination
 * - Facilitates compliance tracking and audit trails
 *
 * @module N8nTypes
 * @version 2.0
 * @since 2024
 */

/**
 * Core n8n execution response from the n8n Cloud API.
 *
 * Business Context:
 * - Primary interface for monitoring workflow execution status
 * - Enables real-time tracking of PAYOFF workflow progress
 * - Provides execution metadata for audit trails and debugging
 * - Supports retry logic and error recovery mechanisms
 *
 * Execution Modes:
 * - manual: User-initiated execution for testing
 * - trigger: Event-driven execution (webhooks, schedules)
 * - webhook: HTTP webhook triggered execution
 * - retry: Automatic retry of failed execution
 *
 * Status Lifecycle:
 * - new: Execution queued but not started
 * - running: Currently executing workflow nodes
 * - success: Completed successfully with results
 * - error: Failed with recoverable error
 * - canceled: Manually stopped by user
 * - crashed: System failure, requires investigation
 * - waiting: Paused for external input or approval
 */
export interface N8nExecutionResponse {
  /** Unique execution identifier from n8n Cloud */
  id: string;
  /** n8n workflow ID that was executed */
  workflowId: string;
  /** Execution trigger mode for audit and debugging */
  mode: 'manual' | 'trigger' | 'webhook' | 'retry';
  /** ISO timestamp when execution began */
  startedAt: string;
  /** ISO timestamp when execution completed (if finished) */
  stoppedAt?: string;
  /** Whether execution has completed (success or failure) */
  finished: boolean;
  /** Reference to original execution if this is a retry */
  retryOf?: string;
  /** Reference to successful retry execution */
  retrySuccessId?: string;
  /** Current execution status for workflow coordination */
  status: 'new' | 'running' | 'success' | 'error' | 'canceled' | 'crashed' | 'waiting';
  /** Execution results and error information */
  data?: {
    resultData?: {
      /** Node execution results for debugging */
      runData?: Record<string, any>;
      /** Last successfully executed node for error recovery */
      lastNodeExecuted?: string;
      /** Error details if execution failed */
      error?: {
        message: string;
        stack?: string;
        name?: string;
      };
    };
  };
}

/**
 * n8n workflow definition response from the n8n Cloud API.
 *
 * Business Context:
 * - Represents complete workflow configuration for PAYOFF automation
 * - Enables workflow validation and deployment verification
 * - Supports workflow versioning and change management
 * - Provides metadata for workflow monitoring and debugging
 *
 * Workflow Structure:
 * - Nodes: Individual processing steps (AI agents, API calls, logic)
 * - Connections: Data flow between nodes for orchestration
 * - Settings: Workflow-level configuration and behavior
 * - Static Data: Persistent data across workflow executions
 *
 * Use Cases:
 * - Workflow deployment validation and health checks
 * - Debugging workflow configuration issues
 * - Version control and change tracking
 * - Performance optimization and node analysis
 */
export interface N8nWorkflowResponse {
  /** Unique workflow identifier in n8n Cloud */
  id: string;
  /** Human-readable workflow name for identification */
  name: string;
  /** Whether workflow is active and can be triggered */
  active: boolean;
  /** Array of workflow nodes defining processing steps */
  nodes: Array<{
    /** Unique node identifier within workflow */
    id: string;
    /** Human-readable node name */
    name: string;
    /** Node type (webhook, agent, condition, etc.) */
    type: string;
    /** Visual position in workflow editor [x, y] */
    position: [number, number];
    /** Node-specific configuration parameters */
    parameters?: Record<string, any>;
  }>;
  /** Node connection definitions for data flow */
  connections: Record<string, any>;
  /** Workflow-level settings and configuration */
  settings?: Record<string, any>;
  /** Persistent data shared across executions */
  staticData?: Record<string, any>;
  /** Workflow categorization tags */
  tags?: string[];
  /** Version identifier for change tracking */
  versionId?: string;
  /** ISO timestamp of workflow creation */
  createdAt: string;
  /** ISO timestamp of last workflow modification */
  updatedAt: string;
}

/**
 * Webhook event types for real-time workflow synchronization.
 *
 * Event Flow:
 * 1. workflow_started: n8n begins processing Rexera workflow
 * 2. task_assigned_to_agent: Specific AI agent receives task
 * 3. agent_task_completed: Agent completes task with results
 * 4. workflow_completed: Entire workflow finishes successfully
 * 5. error_occurred: Any failure during workflow execution
 *
 * Business Impact:
 * - Enables real-time status updates in Rexera UI
 * - Supports customer notifications and SLA monitoring
 * - Facilitates immediate error handling and recovery
 * - Provides audit trail for compliance and debugging
 */
export type N8nWebhookEventType =
  | 'workflow_started'
  | 'task_assigned_to_agent'
  | 'agent_task_completed'
  | 'workflow_completed'
  | 'error_occurred';

/**
 * Base webhook event structure for all n8n notifications.
 *
 * Business Context:
 * - Foundation for real-time workflow synchronization
 * - Enables event-driven architecture between n8n and Rexera
 * - Supports reliable message delivery and processing
 * - Provides consistent event structure for all webhook types
 *
 * Processing Flow:
 * - n8n sends webhook to Rexera endpoint
 * - Rexera validates event structure and authentication
 * - Event data updates workflow status in database
 * - UI components receive real-time updates via subscriptions
 */
export interface N8nWebhookEvent {
  /** Type of workflow event for routing and processing */
  eventType: N8nWebhookEventType;
  /** n8n execution ID for correlation and debugging */
  executionId: string;
  /** n8n workflow ID that generated the event */
  workflowId: string;
  /** ISO timestamp when event occurred */
  timestamp: string;
  /** Event-specific payload data */
  data: Record<string, any>;
}

/**
 * Workflow started event - first notification when n8n begins processing.
 *
 * Business Context:
 * - Confirms successful workflow triggering from Rexera
 * - Updates workflow status from PENDING to IN_PROGRESS
 * - Enables customer notifications about processing start
 * - Provides correlation between Rexera and n8n workflow IDs
 *
 * Triggers:
 * - Customer submits PAYOFF request in Rexera
 * - Rexera creates workflow and triggers n8n execution
 * - n8n validates input and begins processing
 * - This event confirms successful handoff to n8n
 */
export interface N8nWorkflowStartedEvent extends N8nWebhookEvent {
  eventType: 'workflow_started';
  data: {
    /** Rexera workflow ID for database correlation */
    rexeraWorkflowId: string;
    /** Workflow type (currently only PAYOFF supported) */
    workflowType: 'PAYOFF';
    /** Client ID for customer context and permissions */
    clientId: string;
    /** Additional workflow metadata and configuration */
    metadata: Record<string, any>;
  };
}

/**
 * Task assigned to agent event - tracks AI agent task distribution.
 *
 * Business Context:
 * - Provides visibility into which AI agent is handling specific tasks
 * - Enables load balancing and capacity monitoring
 * - Supports debugging and performance optimization
 * - Facilitates customer service inquiries about processing status
 *
 * Agent Task Types:
 * - document_extraction: Extract data from uploaded documents
 * - property_research: Gather property information from external sources
 * - lien_verification: Validate lien information and requirements
 * - communication: Handle customer and vendor interactions
 * - quality_assurance: Review and validate processing results
 */
export interface N8nTaskAssignedEvent extends N8nWebhookEvent {
  eventType: 'task_assigned_to_agent';
  data: {
    /** Rexera workflow ID for correlation */
    rexeraWorkflowId: string;
    /** Unique task identifier within workflow */
    taskId: string;
    /** Name of AI agent assigned to task */
    agentName: string;
    /** Type of task for agent specialization */
    taskType: string;
    /** Task-specific data and parameters */
    taskData: Record<string, any>;
  };
}

/**
 * Agent task completed event - tracks individual AI agent task results.
 *
 * Business Context:
 * - Updates task status and stores agent results
 * - Enables workflow progress tracking and customer updates
 * - Provides data for agent performance monitoring
 * - Supports error handling and retry logic for failed tasks
 *
 * Result Processing:
 * - Success: Agent result stored and workflow continues
 * - Failed: Error logged, retry logic triggered if configured
 * - Results feed into subsequent workflow steps
 * - Performance metrics updated for agent optimization
 */
export interface N8nAgentTaskCompletedEvent extends N8nWebhookEvent {
  eventType: 'agent_task_completed';
  data: {
    /** Rexera workflow ID for correlation */
    rexeraWorkflowId: string;
    /** Task ID that was completed */
    taskId: string;
    /** Agent that completed the task */
    agentName: string;
    /** Task execution results and extracted data */
    result: Record<string, any>;
    /** Task completion status for workflow control */
    status: 'success' | 'failed';
    /** Error message if task failed */
    error?: string;
  };
}

/**
 * Workflow completed event - final notification when entire workflow finishes.
 *
 * Business Context:
 * - Updates workflow status to COMPLETED or FAILED
 * - Triggers customer notifications about completion
 * - Stores final workflow results for customer access
 * - Enables billing and SLA compliance tracking
 *
 * Completion Scenarios:
 * - Success: All tasks completed, results available to customer
 * - Failed: Critical error occurred, manual intervention required
 * - Results include all extracted data and generated documents
 * - Customer receives notification with access to results
 */
export interface N8nWorkflowCompletedEvent extends N8nWebhookEvent {
  eventType: 'workflow_completed';
  data: {
    /** Rexera workflow ID for final status update */
    rexeraWorkflowId: string;
    /** Overall workflow completion status */
    status: 'success' | 'failed';
    /** Complete workflow results and generated outputs */
    result: Record<string, any>;
    /** Error message if workflow failed */
    error?: string;
  };
}

/**
 * Error occurred event - handles workflow and system failures.
 *
 * Business Context:
 * - Enables immediate error detection and alerting
 * - Provides detailed error context for debugging
 * - Triggers error recovery and retry mechanisms
 * - Supports customer service and technical support
 *
 * Error Types:
 * - Node execution failures (agent errors, API timeouts)
 * - System errors (n8n infrastructure issues)
 * - Data validation errors (invalid input, missing data)
 * - Integration errors (external API failures)
 *
 * Error Handling:
 * - Critical errors stop workflow execution
 * - Recoverable errors trigger retry logic
 * - All errors logged for analysis and improvement
 * - Customer notifications sent for critical failures
 */
export interface N8nErrorEvent extends N8nWebhookEvent {
  eventType: 'error_occurred';
  data: {
    /** Rexera workflow ID for error correlation */
    rexeraWorkflowId: string;
    /** Error message for logging and display */
    error: string;
    /** Error stack trace for debugging */
    stack?: string;
    /** n8n node ID where error occurred */
    nodeId?: string;
    /** Human-readable node name for context */
    nodeName?: string;
  };
}

/**
 * n8n API client configuration for secure cloud integration.
 *
 * Business Context:
 * - Enables secure communication with n8n Cloud infrastructure
 * - Supports multiple environment configurations (dev, staging, prod)
 * - Provides webhook endpoint for bidirectional communication
 * - Ensures API key security and rotation capabilities
 *
 * Security Considerations:
 * - API keys stored in environment variables
 * - HTTPS required for all communications
 * - Webhook URL must be publicly accessible for n8n callbacks
 * - Rate limiting and authentication handled by n8n Cloud
 */
export interface N8nApiConfig {
  /** n8n Cloud API base URL (e.g., https://app.n8n.cloud/api/v1) */
  baseUrl: string;
  /** API key for authentication with n8n Cloud */
  apiKey: string;
  /** Public webhook URL for n8n to send events back to Rexera */
  webhookUrl: string;
}

/**
 * Parameters for triggering n8n workflow execution from Rexera.
 *
 * Business Context:
 * - Initiates automated PAYOFF workflow processing
 * - Provides workflow context and customer information
 * - Enables correlation between Rexera and n8n executions
 * - Supports workflow customization via metadata
 *
 * Workflow Triggering Flow:
 * 1. Customer submits PAYOFF request in Rexera
 * 2. Rexera creates workflow record in database
 * 3. These parameters sent to n8n to start automation
 * 4. n8n processes workflow and sends status updates via webhooks
 *
 * Metadata Examples:
 * - Property information (address, loan details)
 * - Document references and file locations
 * - Customer preferences and requirements
 * - Processing deadlines and priority levels
 */
export interface TriggerN8nWorkflowParams {
  /** n8n workflow ID to execute */
  workflowId: string;
  /** Rexera workflow ID for correlation and tracking */
  rexeraWorkflowId: string;
  /** Type of workflow (currently only PAYOFF supported) */
  workflowType: 'PAYOFF';
  /** Client ID for customer context and permissions */
  clientId: string;
  /** Workflow-specific data and configuration */
  metadata: Record<string, any>;
}

/**
 * Simplified execution status for workflow monitoring.
 *
 * Business Context:
 * - Provides real-time execution status for customer dashboards
 * - Enables workflow progress tracking and SLA monitoring
 * - Supports error detection and recovery mechanisms
 * - Facilitates customer service and support inquiries
 *
 * Status Monitoring:
 * - Polled periodically for long-running workflows
 * - Updated via webhook events for real-time accuracy
 * - Used to determine when to show results to customers
 * - Enables automatic retry logic for failed executions
 */
export interface N8nExecutionStatus {
  /** n8n execution ID for tracking */
  id: string;
  /** Current execution status */
  status: 'new' | 'running' | 'success' | 'error' | 'canceled' | 'crashed' | 'waiting';
  /** Whether execution has completed (success or failure) */
  finished: boolean;
  /** ISO timestamp when execution started */
  startedAt: string;
  /** ISO timestamp when execution completed */
  stoppedAt?: string;
  /** Error information if execution failed */
  error?: {
    message: string;
    stack?: string;
  };
}

/**
 * Enhanced workflow interface with n8n integration tracking.
 *
 * Business Context:
 * - Extends base workflow with n8n execution correlation
 * - Enables hybrid orchestration between Rexera and n8n
 * - Supports workflow status synchronization and monitoring
 * - Provides complete audit trail for compliance and debugging
 *
 * Workflow Types:
 * - MUNI_LIEN_SEARCH: Municipal lien research and validation
 * - HOA_ACQUISITION: HOA document acquisition and processing
 * - PAYOFF: Loan payoff request processing (n8n automated)
 *
 * Status Lifecycle:
 * - PENDING: Created but not yet started
 * - IN_PROGRESS: Active processing (may be in n8n)
 * - AWAITING_REVIEW: Requires human review or approval
 * - BLOCKED: Waiting for external input or resolution
 * - COMPLETED: Successfully finished with results
 *
 * n8n Integration:
 * - n8n_execution_id links to n8n Cloud execution
 * - Status updates synchronized via webhook events
 * - Metadata shared between Rexera and n8n workflows
 */
export interface WorkflowWithN8n {
  /** Unique Rexera workflow identifier */
  id: string;
  /** Type of real estate workflow being processed */
  workflow_type: 'MUNI_LIEN_SEARCH' | 'HOA_ACQUISITION' | 'PAYOFF';
  /** Client ID for customer association and permissions */
  client_id: string;
  /** Human-readable workflow title */
  title: string;
  /** Optional detailed description */
  description?: string;
  /** Current workflow processing status */
  status: 'PENDING' | 'IN_PROGRESS' | 'AWAITING_REVIEW' | 'BLOCKED' | 'COMPLETED';
  /** Processing priority for queue management */
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  /** Workflow-specific data and configuration */
  metadata: Record<string, any>;
  /** User ID who created the workflow */
  created_by: string;
  /** Optional user ID assigned to handle the workflow */
  assigned_to?: string;
  /** ISO timestamp of workflow creation */
  created_at: string;
  /** ISO timestamp of last workflow update */
  updated_at: string;
  /** ISO timestamp when workflow completed */
  completed_at?: string;
  /** Optional deadline for workflow completion */
  due_date?: string;
  /** n8n execution ID for correlation and monitoring */
  n8n_execution_id?: string;
}

/**
 * Base error class for all n8n integration failures.
 *
 * Business Context:
 * - Provides structured error handling for n8n operations
 * - Enables error categorization and appropriate responses
 * - Supports error logging and monitoring systems
 * - Facilitates debugging and troubleshooting workflows
 *
 * Error Handling Strategy:
 * - Specific error types for different failure scenarios
 * - Structured error codes for programmatic handling
 * - Optional details for debugging and context
 * - HTTP status codes for API error responses
 */
export class N8nError extends Error {
  constructor(
    message: string,
    /** Error code for programmatic handling */
    public code: string,
    /** HTTP status code if applicable */
    public statusCode?: number,
    /** Additional error context and details */
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'N8nError';
  }
}

/**
 * Error class for n8n API communication failures.
 *
 * Business Context:
 * - Handles failures in REST API calls to n8n Cloud
 * - Enables retry logic and graceful degradation
 * - Supports API rate limiting and authentication errors
 * - Facilitates monitoring of n8n service availability
 *
 * Common Scenarios:
 * - Network connectivity issues
 * - Authentication failures (invalid API key)
 * - Rate limiting by n8n Cloud
 * - n8n service outages or maintenance
 * - Invalid workflow IDs or parameters
 */
export class N8nApiError extends N8nError {
  constructor(message: string, statusCode: number, details?: Record<string, any>) {
    super(message, 'N8N_API_ERROR', statusCode, details);
    this.name = 'N8nApiError';
  }
}

/**
 * Error class for webhook processing failures.
 *
 * Business Context:
 * - Handles failures in processing webhook events from n8n
 * - Enables webhook retry and dead letter queue handling
 * - Supports webhook authentication and validation errors
 * - Facilitates debugging of event processing issues
 *
 * Common Scenarios:
 * - Invalid webhook payload structure
 * - Authentication failures (invalid webhook signature)
 * - Database update failures during event processing
 * - Workflow correlation errors (missing Rexera workflow)
 * - Event processing timeouts or system errors
 */
export class N8nWebhookError extends N8nError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'N8N_WEBHOOK_ERROR', undefined, details);
    this.name = 'N8nWebhookError';
  }
}