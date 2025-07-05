/**
 * @fileoverview REST workflow management endpoints for Rexera 2.0.
 *
 * This module provides HTTP-based workflow management capabilities for the Rexera
 * real estate automation platform. Workflows represent the three core business
 * processes: Municipal Lien Search, HOA Acquisition, and Payoff Request. The REST
 * interface enables external systems, client applications, and integrations to
 * interact with workflow management without requiring tRPC client capabilities.
 *
 * Workflow Management Architecture:
 * - Delegates to tRPC workflow router for consistent business logic
 * - Supports comprehensive workflow filtering and pagination
 * - Enables workflow creation with validation and n8n integration
 * - Provides HTTP-compatible response formats for external systems
 *
 * Key Capabilities:
 * - Workflow listing with advanced filtering and pagination
 * - Individual workflow retrieval with related data inclusion
 * - Workflow creation with automatic n8n triggering
 * - Client-scoped workflow management and access control
 * - Priority-based workflow organization and scheduling
 *
 * Business Context:
 * - Workflows drive the core Rexera business processes
 * - Each workflow type has specific automation patterns
 * - Client isolation ensures data security and access control
 * - Workflow completion delivers business value to clients
 *
 * Integration Points:
 * - Client applications create workflows via REST API
 * - n8n Cloud executes workflow automation logic
 * - AI agents process workflow tasks and documents
 * - External systems monitor workflow progress and status
 *
 * @module WorkflowsRestRouter
 * @requires express - Express router and HTTP handling
 * @requires ../../trpc/router - tRPC router for workflow logic
 * @requires ../../utils/database - Database client creation
 * @requires @trpc/server - tRPC error handling
 */

import { Router, Request, Response } from 'express';
import { appRouter } from '../../trpc/router';
import { createServerClient } from '../../utils/database';
import { TRPCError } from '@trpc/server';

const router = Router();

/**
 * Creates tRPC caller with proper context for workflow management operations.
 *
 * Business Context:
 * - Enables reuse of tRPC workflow management logic in REST endpoints
 * - Provides consistent context and authentication handling
 * - Maintains single source of truth for workflow business logic
 * - Supports unified error handling and response formatting
 *
 * Context Creation:
 * - HTTP request and response objects for context
 * - Authenticated Supabase client for database operations
 * - Consistent context structure with tRPC endpoints
 * - Proper error propagation and handling
 *
 * @param req - Express request object with headers and context
 * @param res - Express response object for response handling
 * @returns tRPC caller configured with proper context
 */
async function createCaller(req: Request, res: Response) {
  const context = {
    req,
    res,
    supabase: createServerClient(),
  };
  return appRouter.createCaller(context);
}

/**
 * Handles errors with appropriate HTTP status codes and response formatting.
 *
 * Business Context:
 * - Provides consistent error responses for external integrations
 * - Maps tRPC errors to appropriate HTTP status codes
 * - Enables proper error handling by client applications
 * - Supports debugging and troubleshooting workflows
 *
 * Error Mapping:
 * - NOT_FOUND: 404 for missing workflows or clients
 * - BAD_REQUEST: 400 for invalid workflow parameters
 * - UNAUTHORIZED: 401 for authentication failures
 * - FORBIDDEN: 403 for authorization failures
 * - Default: 500 for internal server errors
 *
 * Response Format:
 * - Consistent JSON structure for all errors
 * - Success flag for programmatic handling
 * - Error message for debugging and logging
 * - Error code for specific error identification
 *
 * @param error - Error object from tRPC or system
 * @param res - Express response object for error response
 */
function handleError(error: any, res: Response) {
  console.error('REST API Error:', error);
  
  if (error instanceof TRPCError) {
    const statusCode = error.code === 'NOT_FOUND' ? 404 :
                      error.code === 'BAD_REQUEST' ? 400 :
                      error.code === 'UNAUTHORIZED' ? 401 :
                      error.code === 'FORBIDDEN' ? 403 : 500;
    
    return res.status(statusCode).json({
      success: false,
      error: error.message,
      code: error.code
    });
  }
  
  return res.status(500).json({
    success: false,
    error: error.message || 'Internal server error'
  });
}

/**
 * GET /api/rest/workflows - List workflows with filtering and pagination.
 *
 * Business Context:
 * - Enables external systems to query workflows for monitoring and management
 * - Supports client applications displaying workflow dashboards
 * - Provides workflow progress tracking and reporting capabilities
 * - Enables business intelligence and analytics integration
 *
 * Query Parameters:
 * - workflow_type: Filter by type (MUNICIPAL_LIEN_SEARCH, HOA_ACQUISITION, PAYOFF_REQUEST)
 * - status: Filter by workflow status (pending, in_progress, completed, failed)
 * - client_id: Filter workflows by specific client (enforces data isolation)
 * - assigned_to: Filter by workflow assignee or responsible party
 * - priority: Filter by workflow priority level
 * - page: Pagination page number (default: 1)
 * - limit: Results per page (default: 10)
 * - include: Comma-separated list of related data to include
 *
 * Filtering Capabilities:
 * - Workflow type filtering for business process analysis
 * - Status-based filtering for progress tracking
 * - Client-scoped filtering for data isolation and security
 * - Priority-based filtering for workload management
 * - Assignee filtering for personal workflow management
 *
 * Response Format:
 * - Paginated workflow list with comprehensive metadata
 * - Related data inclusion based on include parameter
 * - Pagination information for client navigation
 * - Success flag for programmatic handling
 *
 * Integration Use Cases:
 * - Client dashboards displaying workflow progress
 * - External systems monitoring workflow completion
 * - Business intelligence systems analyzing workflow metrics
 * - Reporting systems generating client-specific reports
 *
 * @route GET /api/rest/workflows
 * @param {string} [workflow_type] - Filter by workflow type
 * @param {string} [status] - Filter by workflow status
 * @param {string} [client_id] - Filter by client ID
 * @param {string} [assigned_to] - Filter by assignee
 * @param {string} [priority] - Filter by priority level
 * @param {string} [page=1] - Page number for pagination
 * @param {string} [limit=10] - Results per page
 * @param {string} [include] - Comma-separated include list
 * @returns {Object} Paginated workflow list with metadata
 * @throws {Error} When workflow query fails or parameters are invalid
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const caller = await createCaller(req, res);
    
    // Extract query parameters with defaults for pagination
    const {
      workflow_type,
      status,
      client_id,
      assigned_to,
      priority,
      page = '1',
      limit = '10',
      include = ''
    } = req.query;

    // Parse include parameter for related data inclusion
    // Supports comma-separated values like "tasks,activities,client"
    const includeArray = typeof include === 'string' && include
      ? include.split(',').map(s => s.trim())
      : [];

    const input = {
      workflow_type: workflow_type as any,
      status: status as any,
      client_id: client_id as string,
      assigned_to: assigned_to as string,
      priority: priority as any,
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      include: includeArray
    };

    const result = await caller.workflows.list(input);
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    handleError(error, res);
  }
});

/**
 * GET /api/rest/workflows/:id - Get workflow by ID with related data.
 *
 * Business Context:
 * - Enables detailed workflow inspection and monitoring
 * - Supports client applications displaying workflow details
 * - Provides comprehensive workflow state and progress information
 * - Enables troubleshooting and workflow analysis
 *
 * Path Parameters:
 * - id: Unique workflow identifier for retrieval
 *
 * Query Parameters:
 * - include: Comma-separated list of related data to include
 *
 * Related Data Inclusion:
 * - tasks: Include all workflow tasks and their status
 * - activities: Include workflow activity history
 * - client: Include client information and metadata
 * - interrupts: Include human-in-the-loop interrupts
 * - agents: Include AI agent assignments and status
 *
 * Response Format:
 * - Complete workflow details with metadata
 * - Related data based on include parameter
 * - Workflow state and progress information
 * - Success flag for programmatic handling
 *
 * Security Considerations:
 * - Enforces client-based access control
 * - Validates user permissions for workflow access
 * - Protects sensitive workflow and client data
 * - Maintains audit trail for access logging
 *
 * Integration Use Cases:
 * - Client applications displaying workflow details
 * - External systems monitoring specific workflows
 * - Troubleshooting and debugging workflow issues
 * - Workflow analysis and performance monitoring
 *
 * @route GET /api/rest/workflows/:id
 * @param {string} id - Workflow ID (path parameter)
 * @param {string} [include] - Comma-separated include list
 * @returns {Object} Complete workflow details with related data
 * @throws {Error} When workflow not found or access denied
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const caller = await createCaller(req, res);
    
    const { id } = req.params;
    const { include = '' } = req.query;

    // Parse include parameter for related data inclusion
    // Supports comma-separated values like "tasks,activities,client"
    const includeArray = typeof include === 'string' && include
      ? include.split(',').map(s => s.trim())
      : [];

    const input = {
      id,
      include: includeArray
    };

    const result = await caller.workflows.byId(input);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    handleError(error, res);
  }
});

/**
 * POST /api/rest/workflows - Create new workflow with n8n integration.
 *
 * Business Context:
 * - Enables external systems to initiate Rexera workflows
 * - Supports client applications creating workflows on behalf of users
 * - Triggers automated workflow execution via n8n Cloud
 * - Facilitates business process automation and client service delivery
 *
 * Required Fields:
 * - workflow_type: Type of workflow (MUNICIPAL_LIEN_SEARCH, HOA_ACQUISITION, PAYOFF_REQUEST)
 * - client_id: Client identifier for workflow association and access control
 * - title: Human-readable workflow description
 * - created_by: User identifier for audit trail and accountability
 *
 * Optional Fields:
 * - description: Detailed workflow description and context
 * - priority: Workflow priority level for scheduling and resource allocation
 * - metadata: Workflow-specific data and configuration
 * - due_date: Workflow completion deadline for SLA management
 *
 * Workflow Creation Process:
 * - Validates required fields and client access permissions
 * - Creates workflow record with proper client association
 * - Triggers n8n workflow automation for PAYOFF_REQUEST types
 * - Sets initial status and tracking metadata
 * - Creates audit trail for workflow creation
 *
 * n8n Integration:
 * - PAYOFF_REQUEST workflows automatically trigger n8n execution
 * - Other workflow types may trigger based on configuration
 * - Workflow metadata passed to n8n for automation context
 * - Bidirectional synchronization via webhook callbacks
 *
 * Response Format:
 * - Created workflow with generated ID and metadata
 * - Success flag for programmatic handling
 * - HTTP 201 status for successful creation
 * - Comprehensive workflow details for client use
 *
 * Integration Use Cases:
 * - Client applications creating workflows for users
 * - External systems initiating business processes
 * - API integrations triggering workflow automation
 * - Bulk workflow creation for batch processing
 *
 * @route POST /api/rest/workflows
 * @param {string} workflow_type - Workflow type (required)
 * @param {string} client_id - Client ID (required)
 * @param {string} title - Workflow title (required)
 * @param {string} created_by - Creator user ID (required)
 * @param {string} [description] - Detailed description
 * @param {string} [priority] - Priority level
 * @param {Object} [metadata] - Workflow-specific metadata
 * @param {string} [due_date] - Completion deadline
 * @returns {Object} Created workflow with ID and metadata
 * @throws {Error} When workflow creation fails or validation errors occur
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const caller = await createCaller(req, res);
    
    const {
      workflow_type,
      client_id,
      title,
      description,
      priority,
      metadata,
      due_date,
      created_by
    } = req.body;

    // Validate required fields for workflow creation
    // These fields are essential for proper workflow management and execution
    if (!workflow_type || !client_id || !title || !created_by) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: workflow_type, client_id, title, created_by'
      });
    }

    const input = {
      workflow_type,
      client_id,
      title,
      description,
      priority,
      metadata,
      due_date,
      created_by
    };

    const result = await caller.workflows.create(input);
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    handleError(error, res);
  }
});

export { router as workflowsRestRouter };