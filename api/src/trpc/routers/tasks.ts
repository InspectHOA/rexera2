/**
 * @fileoverview Task management router for Rexera 2.0 workflow automation.
 *
 * This module manages individual tasks within workflows, supporting both AI agent
 * execution and Human-in-the-Loop (HIL) task assignment. Tasks represent discrete
 * units of work that can be executed independently while contributing to overall
 * workflow completion.
 *
 * Task Execution Types:
 * - AI: Automated execution by specialized AI agents
 * - HIL: Human-in-the-Loop tasks requiring human expertise
 *
 * Task Lifecycle:
 * - PENDING: Created and awaiting execution
 * - AWAITING_REVIEW: Completed but requires human review
 * - COMPLETED: Successfully finished with results
 * - FAILED: Execution failed, may require retry or escalation
 *
 * Key Capabilities:
 * - Task creation and assignment management
 * - Priority-based task queuing and execution
 * - Flexible task filtering and search
 * - Task dependency tracking and coordination
 * - Execution history and performance monitoring
 *
 * Business Context:
 * - Enables granular workflow control and monitoring
 * - Supports hybrid automation with human oversight
 * - Provides task-level SLA tracking and compliance
 * - Facilitates workload distribution and capacity planning
 * - Enables detailed performance analysis and optimization
 *
 * Integration Points:
 * - AI agents receive task assignments for automated execution
 * - Human experts receive HIL task assignments via notifications
 * - n8n workflows coordinate task execution and dependencies
 * - Activity tracking logs all task lifecycle events
 * - Performance metrics support optimization and scaling
 *
 * @module TasksRouter
 * @requires zod - Runtime type validation and schema definition
 * @requires ../trpc - tRPC router and procedure definitions
 * @requires @rexera/types - Shared type definitions
 */

import { z } from 'zod';
import { procedure, router } from '../trpc';
import type { Database } from '@rexera/types';

/**
 * Input validation schema for task creation with comprehensive configuration.
 * Supports both AI agent and human task assignment with flexible metadata.
 */
const createTaskSchema = z.object({
  /** Workflow ID that this task belongs to */
  workflow_id: z.string(),
  /** Human-readable task title for identification */
  title: z.string().min(1),
  /** Optional detailed task description */
  description: z.string().optional(),
  /** Execution type: AI agent or Human-in-the-Loop */
  executor_type: z.enum(['AI', 'HIL']),
  /** Optional user ID for HIL task assignment */
  assigned_to: z.string().uuid().optional(),
  /** Task priority for queue management */
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  /** Task-specific metadata and configuration */
  metadata: z.record(z.any()).default({}),
  /** Optional deadline for task completion */
  due_date: z.string().optional(),
});

/**
 * Input validation schema for task list queries with comprehensive filtering.
 * Supports operational monitoring, assignment management, and performance analysis.
 */
const getTasksSchema = z.object({
  /** Filter by specific workflow ID */
  workflow_id: z.string().optional(),
  /** Filter by task execution status */
  status: z.enum(['PENDING', 'AWAITING_REVIEW', 'COMPLETED', 'FAILED']).optional(),
  /** Filter by execution type (AI or HIL) */
  executor_type: z.enum(['AI', 'HIL']).optional(),
  /** Filter by assigned user ID */
  assigned_to: z.string().uuid().optional(),
  /** Filter by task priority level */
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  /** Page number for pagination (1-based) */
  page: z.number().min(1).default(1),
  /** Number of tasks per page (max 100 for performance) */
  limit: z.number().min(1).max(100).default(20),
  /** Optional related data to include in response */
  include: z.array(z.enum(['assigned_user', 'executions', 'dependencies', 'workflow'])).default([]),
});

/**
 * Tasks router providing comprehensive task management for workflow automation.
 * Supports both AI agent and human task execution with flexible filtering and monitoring.
 */
export const tasksRouter = router({
  /**
   * Retrieves paginated list of tasks with flexible filtering and optional related data.
   *
   * Business Context:
   * - Primary endpoint for task management dashboards and work queues
   * - Enables task assignment and workload distribution
   * - Supports operational monitoring and performance tracking
   * - Provides visibility into workflow progress and bottlenecks
   *
   * Task Management Features:
   * - Flexible filtering by workflow, status, executor type, and assignment
   * - Priority-based sorting for efficient queue management
   * - Optional inclusion of related data (workflow, user, executions, dependencies)
   * - Pagination for performance optimization with large task volumes
   *
   * Use Cases:
   * - AI agent work queues and task assignment
   * - Human expert task dashboards and assignment interfaces
   * - Workflow progress monitoring and status tracking
   * - Performance analysis and capacity planning
   * - Task dependency visualization and coordination
   *
   * Related Data Options:
   * - workflow: Parent workflow context and business information
   * - assigned_user: User details for HIL task assignment
   * - executions: Task execution history and performance data
   * - dependencies: Task dependency relationships and coordination
   *
   * @param input - Filtering, pagination, and inclusion parameters
   * @param ctx - tRPC context containing authenticated Supabase client
   * @returns Paginated task list with optional related data
   * @throws Error when database query fails or access is unauthorized
   */
  list: procedure
    .input(getTasksSchema)
    .query(async ({ input, ctx }) => {
      const { supabase } = ctx;

      // Build dynamic select query based on requested inclusions
      let selectQuery = '*';
      
      if (input.include.includes('workflow')) {
        selectQuery += ', workflow:workflows(id, title, workflow_type, client_id, status)';
      }
      if (input.include.includes('assigned_user')) {
        selectQuery += ', assigned_user:user_profiles!tasks_assigned_to_fkey(id, full_name, email)';
      }
      if (input.include.includes('executions')) {
        selectQuery += ', task_executions(*)';
      }
      if (input.include.includes('dependencies')) {
        selectQuery += ', task_dependencies(*)';
      }

      // Build base query with dynamic select
      let query = supabase
        .from('tasks')
        .select(selectQuery);

      // Apply filtering based on operational and management needs
      if (input.workflow_id) query = query.eq('workflow_id', input.workflow_id);
      if (input.status) query = query.eq('status', input.status);
      if (input.executor_type) query = query.eq('executor_type', input.executor_type);
      if (input.assigned_to) query = query.eq('assigned_to', input.assigned_to);
      if (input.priority) query = query.eq('priority', input.priority);

      // Apply pagination and ordering for consistent results
      const offset = (input.page - 1) * input.limit;
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + input.limit - 1);

      const { data: tasks, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch tasks: ${error.message}`);
      }

      // Get total count for pagination metadata
      const { count } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true });

      const totalPages = Math.ceil((count || 0) / input.limit);

      return {
        data: tasks || [],
        pagination: {
          page: input.page,
          limit: input.limit,
          total: count || 0,
          totalPages
        }
      };
    }),

  /**
   * Creates a new task within a workflow with validation and context enrichment.
   *
   * Business Context:
   * - Enables dynamic task creation during workflow execution
   * - Supports both automated task generation and manual task creation
   * - Provides task assignment for AI agents and human experts
   * - Facilitates workflow decomposition and parallel execution
   *
   * Task Creation Process:
   * - Validates workflow existence and accessibility
   * - Creates task with specified configuration and metadata
   * - Assigns task to appropriate executor (AI agent or human)
   * - Returns enriched task data with workflow and user context
   *
   * Executor Types:
   * - AI: Task assigned to AI agent for automated execution
   * - HIL: Task assigned to human expert for manual processing
   *
   * Priority Management:
   * - URGENT: Critical tasks requiring immediate attention
   * - HIGH: Important tasks affecting workflow completion
   * - NORMAL: Standard tasks for regular processing
   * - LOW: Non-critical tasks for batch processing
   *
   * Use Cases:
   * - Dynamic task creation during workflow execution
   * - Manual task assignment for complex scenarios
   * - Workflow decomposition and parallel processing
   * - Exception handling and escalation workflows
   * - Quality assurance and review task creation
   *
   * @param input - Task creation parameters and configuration
   * @param ctx - tRPC context containing authenticated Supabase client
   * @returns Created task with workflow and user context
   * @throws Error when workflow invalid or task creation fails
   */
  create: procedure
    .input(createTaskSchema)
    .mutation(async ({ input, ctx }) => {
      const { supabase } = ctx;

      // Validate workflow existence and accessibility
      const { data: workflow, error: workflowError } = await supabase
        .from('workflows')
        .select('id, client_id, status')
        .eq('id', input.workflow_id)
        .single();

      if (workflowError || !workflow) {
        throw new Error('Invalid workflow ID');
      }

      // Create task with comprehensive configuration
      const { data: task, error } = await supabase
        .from('tasks')
        .insert({
          workflow_id: input.workflow_id,
          title: input.title,
          description: input.description,
          executor_type: input.executor_type,
          assigned_to: input.assigned_to,
          priority: input.priority,
          metadata: input.metadata,
          due_date: input.due_date,
        })
        .select(`
          *,
          workflow:workflows(id, title, workflow_type),
          assigned_user:user_profiles!tasks_assigned_to_fkey(id, full_name, email)
        `)
        .single();

      if (error) {
        throw new Error(`Failed to create task: ${error.message}`);
      }

      return task;
    }),
});