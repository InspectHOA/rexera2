/**
 * @fileoverview REST task management endpoints for Rexera 2.0.
 *
 * This module provides HTTP-based task management capabilities for the Rexera
 * workflow automation platform. Tasks represent discrete units of work within
 * workflows that can be executed by AI agents, human operators, or automated
 * systems. The REST interface enables external systems to interact with task
 * management without requiring tRPC client capabilities.
 *
 * Task Management Architecture:
 * - Delegates to tRPC task router for consistent business logic
 * - Supports comprehensive task filtering and pagination
 * - Enables task creation with validation and metadata
 * - Provides HTTP-compatible response formats
 *
 * Key Capabilities:
 * - Task listing with advanced filtering options
 * - Task creation with validation and metadata support
 * - Executor type management (AI agents, humans, systems)
 * - Priority-based task organization
 * - Workflow-scoped task management
 *
 * Business Context:
 * - Tasks drive workflow execution and progress tracking
 * - AI agents receive task assignments for document processing
 * - Human operators handle complex decision-making tasks
 * - Task completion triggers workflow state transitions
 *
 * Integration Points:
 * - n8n workflows create tasks for agent execution
 * - AI agents poll for assigned tasks
 * - Human operators access tasks through UI
 * - External systems create tasks via REST API
 *
 * @module TasksRestRouter
 * @requires express - Express router and HTTP handling
 * @requires ../../trpc/router - tRPC router for task logic
 * @requires ../../utils/database - Database client creation
 * @requires @trpc/server - tRPC error handling
 */

import { Router, Request, Response } from 'express';
import { appRouter } from '../../trpc/router';
import { createServerClient } from '../../utils/database';
import { TRPCError } from '@trpc/server';

const router = Router();

/**
 * Creates tRPC caller with proper context for task management operations.
 *
 * Business Context:
 * - Enables reuse of tRPC task management logic in REST endpoints
 * - Provides consistent context and authentication handling
 * - Maintains single source of truth for task business logic
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
 * - NOT_FOUND: 404 for missing tasks or workflows
 * - BAD_REQUEST: 400 for invalid task parameters
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
 * GET /api/rest/tasks - List tasks with filtering and pagination.
 *
 * Business Context:
 * - Enables external systems to query tasks for monitoring and management
 * - Supports AI agents polling for assigned tasks
 * - Provides workflow progress tracking capabilities
 * - Enables task dashboard and reporting functionality
 *
 * Query Parameters:
 * - workflow_id: Filter tasks by specific workflow
 * - status: Filter by task status (pending, in_progress, completed, failed)
 * - executor_type: Filter by executor (ai_agent, human, system)
 * - assigned_to: Filter by specific assignee identifier
 * - priority: Filter by task priority level
 * - page: Pagination page number (default: 1)
 * - limit: Results per page (default: 20)
 * - include: Comma-separated list of related data to include
 *
 * Filtering Capabilities:
 * - Workflow-scoped task queries for progress tracking
 * - Status-based filtering for workflow state management
 * - Executor type filtering for agent task assignment
 * - Priority-based filtering for task prioritization
 * - Assignee filtering for personal task management
 *
 * Response Format:
 * - Paginated task list with metadata
 * - Comprehensive task details and relationships
 * - Pagination information for client navigation
 * - Success flag for programmatic handling
 *
 * Integration Use Cases:
 * - AI agents polling for new task assignments
 * - Dashboard displaying workflow progress
 * - External systems monitoring task completion
 * - Reporting systems analyzing task metrics
 *
 * @route GET /api/rest/tasks
 * @param {string} [workflow_id] - Filter by workflow ID
 * @param {string} [status] - Filter by task status
 * @param {string} [executor_type] - Filter by executor type
 * @param {string} [assigned_to] - Filter by assignee
 * @param {string} [priority] - Filter by priority level
 * @param {string} [page=1] - Page number for pagination
 * @param {string} [limit=20] - Results per page
 * @param {string} [include] - Comma-separated include list
 * @returns {Object} Paginated task list with metadata
 * @throws {Error} When task query fails or parameters are invalid
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const caller = await createCaller(req, res);
    
    // Extract query parameters with defaults for pagination
    const {
      workflow_id,
      status,
      executor_type,
      assigned_to,
      priority,
      page = '1',
      limit = '20',
      include = ''
    } = req.query;

    // Parse include parameter for related data inclusion
    // Supports comma-separated values like "workflow,assignee,metadata"
    const includeArray = typeof include === 'string' && include
      ? include.split(',').map(s => s.trim())
      : [];

    const input = {
      workflow_id: workflow_id as string,
      status: status as any,
      executor_type: executor_type as any,
      assigned_to: assigned_to as string,
      priority: priority as any,
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      include: includeArray as any
    };

    const result = await caller.tasks.list(input);
    
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
 * POST /api/rest/tasks - Create new task within workflow.
 *
 * Business Context:
 * - Enables external systems to create tasks for workflow execution
 * - Supports dynamic task creation based on workflow conditions
 * - Allows n8n workflows to create tasks for agent processing
 * - Facilitates human-in-the-loop task creation
 *
 * Required Fields:
 * - workflow_id: Parent workflow for task association
 * - title: Human-readable task description
 * - executor_type: Type of executor (ai_agent, human, system)
 *
 * Optional Fields:
 * - description: Detailed task instructions
 * - assigned_to: Specific assignee identifier
 * - priority: Task priority level for scheduling
 * - metadata: Additional task-specific data
 * - due_date: Task completion deadline
 *
 * Task Creation Process:
 * - Validates required fields and workflow existence
 * - Creates task with proper workflow association
 * - Sets initial status and tracking metadata
 * - Triggers task assignment notifications if applicable
 *
 * Executor Types:
 * - ai_agent: Tasks for AI agent processing
 * - human: Tasks requiring human intervention
 * - system: Automated system tasks
 *
 * Response Format:
 * - Created task with generated ID and metadata
 * - Success flag for programmatic handling
 * - HTTP 201 status for successful creation
 * - Comprehensive task details for client use
 *
 * Integration Use Cases:
 * - n8n workflows creating agent tasks
 * - External systems adding workflow tasks
 * - Human operators creating manual tasks
 * - Conditional task creation based on workflow state
 *
 * @route POST /api/rest/tasks
 * @param {string} workflow_id - Parent workflow ID (required)
 * @param {string} title - Task title (required)
 * @param {string} executor_type - Executor type (required)
 * @param {string} [description] - Detailed task description
 * @param {string} [assigned_to] - Specific assignee identifier
 * @param {string} [priority] - Task priority level
 * @param {Object} [metadata] - Additional task metadata
 * @param {string} [due_date] - Task completion deadline
 * @returns {Object} Created task with ID and metadata
 * @throws {Error} When task creation fails or validation errors occur
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const caller = await createCaller(req, res);
    
    const {
      workflow_id,
      title,
      description,
      executor_type,
      assigned_to,
      priority,
      metadata,
      due_date
    } = req.body;

    // Validate required fields for task creation
    // These fields are essential for proper task management and execution
    if (!workflow_id || !title || !executor_type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: workflow_id, title, executor_type'
      });
    }

    const input = {
      workflow_id,
      title,
      description,
      executor_type,
      assigned_to,
      priority,
      metadata,
      due_date
    };

    const result = await caller.tasks.create(input);
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    handleError(error, res);
  }
});

export { router as tasksRestRouter };