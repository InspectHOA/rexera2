/**
 * @fileoverview Workflow orchestration router for Rexera 2.0 real estate automation platform.
 *
 * This module serves as the central hub for managing the three core real estate workflows:
 * - Municipal Lien Search (MUNI_LIEN_SEARCH): Automated property lien research and documentation
 * - HOA Acquisition (HOA_ACQUISITION): Homeowners association document collection and analysis
 * - Payoff Request (PAYOFF): Loan payoff statement generation and processing
 *
 * Key responsibilities:
 * - Workflow CRUD operations with advanced filtering and pagination
 * - n8n Cloud integration for automated workflow execution
 * - Real-time status synchronization between Rexera and n8n systems
 * - Database relationship management (clients, tasks, user assignments)
 * - Error handling and recovery for hybrid orchestration (database + n8n)
 *
 * Architecture:
 * - Uses tRPC for type-safe API endpoints
 * - Integrates with Supabase PostgreSQL for persistence
 * - Coordinates with n8n Cloud for workflow automation
 * - Supports both manual and automated workflow execution modes
 *
 * @module WorkflowsRouter
 * @requires ../trpc - tRPC router and procedure definitions
 * @requires zod - Runtime type validation and schema definition
 * @requires crypto - UUID generation for workflow identifiers
 * @requires @rexera/types - Shared TypeScript types and database schema
 * @requires ../../utils/n8n - n8n Cloud API integration utilities
 * @requires ../../types/n8n - n8n-specific type definitions
 */

import { procedure, router } from '../trpc';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import {
  WorkflowResponse as Workflow,
  WorkflowListResponse,
  WorkflowType,
  WorkflowStatus,
  PriorityLevel,
  Database
} from '@rexera/types';
import {
  triggerN8nPayoffWorkflow,
  getN8nExecution,
  cancelN8nExecution,
  isN8nEnabled
} from '../../utils/n8n';
import { N8nError } from '../../types/n8n';

/**
 * Input validation schema for retrieving a single workflow by ID.
 * Supports optional relationship inclusion for performance optimization.
 */
const GetWorkflowInput = z.object({
  /** Unique workflow identifier (UUID) */
  id: z.string(),
  /**
   * Optional array of related entities to include in response:
   * - 'client': Include client information (name, domain)
   * - 'tasks': Include all workflow tasks with status and assignments
   * - 'assigned_user': Include assigned user profile details
   */
  include: z.array(z.string()).optional().default([])
});

/**
 * Input validation schema for workflow list queries with comprehensive filtering.
 * Supports pagination, filtering by business criteria, and relationship inclusion.
 */
const GetWorkflowsInput = z.object({
  /** Filter by specific real estate workflow type */
  workflow_type: z.enum(['MUNI_LIEN_SEARCH', 'HOA_ACQUISITION', 'PAYOFF']).optional(),
  /** Filter by current workflow execution status */
  status: z.enum(['PENDING', 'IN_PROGRESS', 'AWAITING_REVIEW', 'BLOCKED', 'COMPLETED']).optional(),
  /** Filter by client organization identifier */
  client_id: z.string().optional(),
  /** Filter by assigned user/agent identifier */
  assigned_to: z.string().optional(),
  /** Filter by business priority level */
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  /** Page number for pagination (1-based) */
  page: z.number().default(1),
  /** Number of workflows per page (max recommended: 50) */
  limit: z.number().default(10),
  /** Related entities to include (same options as GetWorkflowInput) */
  include: z.array(z.string()).optional().default([])
});

/**
 * Input validation schema for creating new workflows.
 * Initiates workflow creation and optional n8n automation trigger.
 */
const CreateWorkflowInput = z.object({
  /** Type of real estate workflow to create */
  workflow_type: z.enum(['MUNI_LIEN_SEARCH', 'HOA_ACQUISITION', 'PAYOFF']),
  /** Client organization this workflow belongs to */
  client_id: z.string(),
  /** Human-readable workflow title for identification */
  title: z.string(),
  /** Optional detailed description of workflow requirements */
  description: z.string().optional(),
  /** Business priority level affecting agent assignment and SLA */
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  /**
   * Workflow-specific configuration and parameters.
   * Structure varies by workflow_type:
   * - PAYOFF: loan details, property info, contact preferences
   * - MUNI_LIEN_SEARCH: property address, search scope, jurisdiction
   * - HOA_ACQUISITION: property details, document requirements
   */
  metadata: z.record(z.any()).optional(),
  /** Optional deadline for workflow completion (ISO 8601 string) */
  due_date: z.string().optional(),
  /** User ID of the workflow creator */
  created_by: z.string()
});

/**
 * Workflows router providing comprehensive workflow management capabilities.
 * Handles the complete lifecycle of real estate automation workflows from creation
 * through completion, with integrated n8n Cloud orchestration.
 */
export const workflowsRouter = router({
  /**
   * Retrieve paginated list of workflows with advanced filtering and relationship loading.
   *
   * Business Context:
   * - Supports dashboard views showing workflow status across all clients
   * - Enables filtering by workflow type for specialized agent assignments
   * - Provides pagination for performance with large workflow datasets
   * - Includes relationship loading to minimize additional API calls
   *
   * Performance Considerations:
   * - Uses Supabase count for accurate pagination without full table scan
   * - Relationship loading is optional and performed in parallel
   * - Results ordered by creation date (newest first) for relevance
   *
   * @param input - Filtering, pagination, and inclusion parameters
   * @param ctx - tRPC context containing authenticated Supabase client
   * @returns Paginated workflow list with optional related entities
   * @throws Error when database query fails or access is unauthorized
   */
  list: procedure
    .input(GetWorkflowsInput)
    .query(async ({ input, ctx }) => {
      const { supabase } = ctx;
      
      // Build base query with exact count for pagination
      let query = supabase
        .from('workflows')
        .select('*', { count: 'exact' });

      // Apply business logic filters
      // Each filter corresponds to common dashboard and reporting needs
      if (input.workflow_type) {
        query = query.eq('workflow_type', input.workflow_type);
      }
      if (input.status) {
        query = query.eq('status', input.status);
      }
      if (input.client_id) {
        query = query.eq('client_id', input.client_id);
      }
      if (input.assigned_to) {
        query = query.eq('assigned_to', input.assigned_to);
      }
      if (input.priority) {
        query = query.eq('priority', input.priority);
      }

      // Apply pagination and ordering
      // Offset-based pagination suitable for typical dashboard use cases
      const offset = (input.page - 1) * input.limit;
      query = query
        .range(offset, offset + input.limit - 1)
        .order('created_at', { ascending: false });

      const { data: workflows, error, count } = await query;

      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

      // Transform workflows with optional relationship loading
      // Performed in parallel for optimal performance
      const transformedWorkflows = await Promise.all(
        (workflows || []).map(async (workflow: any) => {
          const result: any = { ...workflow };

          // Load client information for workflow context
          if (input.include.includes('client')) {
            const { data: client } = await supabase
              .from('clients')
              .select('id, name, domain')
              .eq('id', workflow.client_id)
              .single();
            result.client = client;
          }

          // Load associated tasks for workflow progress tracking
          if (input.include.includes('tasks')) {
            const { data: tasks } = await supabase
              .from('tasks')
              .select('id, title, status, metadata, assigned_to, due_date')
              .eq('workflow_id', workflow.id);
            result.tasks = tasks || [];
          }

          // Load assigned user details for agent identification
          if (input.include.includes('assigned_user') && workflow.assigned_to) {
            const { data: assignedUser } = await supabase
              .from('user_profiles')
              .select('id, full_name, email')
              .eq('id', workflow.assigned_to)
              .single();
            result.assigned_user = assignedUser;
          }

          return result;
        })
      );

      // Calculate pagination metadata for frontend controls
      const totalPages = Math.ceil((count || 0) / input.limit);

      return {
        data: transformedWorkflows,
        pagination: {
          page: input.page,
          limit: input.limit,
          total: count || 0,
          totalPages
        }
      };
    }),

  /**
   * Retrieve a single workflow by ID with optional relationship loading.
   *
   * Business Context:
   * - Primary endpoint for workflow detail views and agent dashboards
   * - Supports deep relationship loading for comprehensive workflow context
   * - Used by frontend components to display full workflow information
   *
   * Security:
   * - Relies on RLS (Row Level Security) policies in Supabase for access control
   * - Users can only access workflows within their authorized client scope
   *
   * @param input - Workflow ID and optional relationship inclusions
   * @param ctx - tRPC context with authenticated Supabase client
   * @returns Complete workflow object with requested relationships
   * @throws Error when workflow not found or access denied
   */
  byId: procedure
    .input(GetWorkflowInput)
    .query(async ({ input, ctx }) => {
      const { supabase } = ctx;
      
      // Fetch base workflow data
      const { data: workflow, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', input.id)
        .single();

      if (error) {
        throw new Error(`Failed to fetch workflow: ${error.message}`);
      }

      if (!workflow) {
        throw new Error('Workflow not found');
      }

      const result: any = { ...workflow };

      // Load client relationship for workflow context
      if (input.include.includes('client')) {
        const { data: client } = await supabase
          .from('clients')
          .select('id, name, domain')
          .eq('id', workflow.client_id)
          .single();
        result.client = client;
      }

      // Load all tasks for complete workflow progress view
      if (input.include.includes('tasks')) {
        const { data: tasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('workflow_id', workflow.id);
        result.tasks = tasks || [];
      }

      // Load assigned user details for agent identification
      if (input.include.includes('assigned_user') && workflow.assigned_to) {
        const { data: assignedUser } = await supabase
          .from('user_profiles')
          .select('id, full_name, email')
          .eq('id', workflow.assigned_to)
          .single();
        result.assigned_user = assignedUser;
      }

      return result;
    }),

  /**
   * Create a new workflow and optionally trigger automated n8n execution.
   *
   * Business Context:
   * - Primary entry point for initiating real estate automation workflows
   * - Supports hybrid orchestration: database-driven + n8n Cloud automation
   * - PAYOFF workflows automatically trigger n8n for loan processing automation
   * - Other workflow types use database-driven task orchestration
   *
   * Workflow Creation Process:
   * 1. Validate input and create database record with PENDING status
   * 2. For PAYOFF workflows: attempt n8n Cloud trigger if enabled
   * 3. Update workflow status to IN_PROGRESS if n8n succeeds
   * 4. Return workflow with client relationship for immediate use
   *
   * Error Handling Strategy:
   * - Database creation failure: throw error (workflow not created)
   * - n8n trigger failure: log error but continue (fallback to manual processing)
   * - This ensures workflow creation never fails due to n8n issues
   *
   * @param input - Workflow creation parameters including type, client, and metadata
   * @param ctx - tRPC context with authenticated Supabase client
   * @returns Created workflow with client relationship and n8n execution ID (if applicable)
   * @throws Error when database creation fails or validation errors occur
   *
   * @example
   * // Create a PAYOFF workflow with automatic n8n trigger
   * const workflow = await workflowsRouter.create({
   *   workflow_type: 'PAYOFF',
   *   client_id: 'client-uuid',
   *   title: 'Loan Payoff - 123 Main St',
   *   metadata: {
   *     loanNumber: 'LN123456',
   *     propertyAddress: '123 Main St, City, State',
   *     requestedBy: 'john.doe@client.com'
   *   },
   *   created_by: 'user-uuid'
   * });
   */
  create: procedure
    .input(CreateWorkflowInput)
    .mutation(async ({ input, ctx }) => {
      const { supabase } = ctx;

      // Prepare workflow data with generated UUID and default status
      const workflowData: Database['public']['Tables']['workflows']['Insert'] = {
        id: randomUUID(),
        workflow_type: input.workflow_type,
        client_id: input.client_id,
        title: input.title,
        description: input.description,
        priority: input.priority,
        metadata: input.metadata,
        due_date: input.due_date,
        created_by: input.created_by
      };

      // Create workflow in database with client relationship
      const { data: workflow, error } = await supabase
        .from('workflows')
        .insert(workflowData)
        .select(`
          id,
          workflow_type,
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
          clients!workflows_client_id_fkey(id, name)
        `)
        .single();

      if (error) {
        throw new Error(`Failed to create workflow: ${error.message}`);
      }

      // Trigger n8n automation for PAYOFF workflows when enabled
      // This enables automated loan payoff processing through n8n Cloud
      if (input.workflow_type === 'PAYOFF' && isN8nEnabled()) {
        try {
          console.log(`Triggering n8n for PAYOFF workflow: ${workflow.id}`);
          
          // Trigger n8n workflow with Rexera context
          const n8nExecution = await triggerN8nPayoffWorkflow({
            workflowId: 'payoff-workflow', // This would be configurable
            rexeraWorkflowId: workflow.id,
            workflowType: 'PAYOFF',
            clientId: input.client_id,
            metadata: input.metadata || {}
          });

          // Link n8n execution to Rexera workflow for status synchronization
          const { error: updateError } = await supabase
            .from('workflows')
            .update({
              n8n_execution_id: n8nExecution.id,
              status: 'IN_PROGRESS'
            })
            .eq('id', workflow.id);

          if (updateError) {
            console.error('Failed to update workflow with n8n execution ID:', updateError);
            // Don't fail the workflow creation, just log the error
          } else {
            // Update local workflow object to reflect n8n integration
            // Note: n8n_execution_id will be available after migration is applied
            (workflow as any).n8n_execution_id = n8nExecution.id;
            workflow.status = 'IN_PROGRESS';
          }

          console.log(`n8n workflow triggered successfully: ${n8nExecution.id}`);
        } catch (n8nError) {
          console.error('Failed to trigger n8n workflow:', n8nError);
          // Don't fail the workflow creation - n8n is optional
          // The workflow will continue with database-driven orchestration
          // This ensures business continuity even when n8n is unavailable
        }
      }

      return {
        ...workflow,
        client: workflow.clients
      };
    }),

  /**
   * Retrieve real-time n8n execution status for workflow monitoring and debugging.
   *
   * Business Context:
   * - Enables real-time monitoring of automated workflow progress
   * - Critical for debugging failed or stalled n8n executions
   * - Supports hybrid status display (Rexera + n8n status)
   * - Used by dashboard components to show automation health
   *
   * Status Synchronization:
   * - Returns both Rexera workflow status and n8n execution status
   * - Handles cases where n8n is disabled or execution doesn't exist
   * - Provides error information when n8n API calls fail
   *
   * @param input - Workflow ID to check n8n status for
   * @param ctx - tRPC context with authenticated Supabase client
   * @returns Combined workflow and n8n status information
   * @throws Error when workflow not found or database access fails
   */
  getN8nStatus: procedure
    .input(z.object({
      /** Workflow ID to retrieve n8n execution status for */
      id: z.string()
    }))
    .query(async ({ input, ctx }) => {
      const { supabase } = ctx;
      
      // Fetch workflow with n8n execution reference
      const { data: workflow, error } = await supabase
        .from('workflows')
        .select('id, n8n_execution_id, workflow_type, status')
        .eq('id', input.id)
        .single();

      if (error) {
        throw new Error(`Failed to fetch workflow: ${error.message}`);
      }

      if (!workflow) {
        throw new Error('Workflow not found');
      }

      // Handle workflows without n8n integration (manual/database-driven)
      if (!workflow.n8n_execution_id) {
        return {
          workflowId: workflow.id,
          workflowStatus: workflow.status,
          n8nEnabled: false,
          n8nStatus: null
        };
      }

      // Handle case where n8n is disabled but execution ID exists
      if (!isN8nEnabled()) {
        return {
          workflowId: workflow.id,
          workflowStatus: workflow.status,
          n8nEnabled: false,
          n8nExecutionId: workflow.n8n_execution_id,
          n8nStatus: null
        };
      }

      // Fetch live n8n execution status
      try {
        const n8nStatus = await getN8nExecution(workflow.n8n_execution_id);
        
        return {
          workflowId: workflow.id,
          workflowStatus: workflow.status,
          n8nEnabled: true,
          n8nExecutionId: workflow.n8n_execution_id,
          n8nStatus
        };
      } catch (n8nError) {
        console.error('Failed to get n8n status:', n8nError);
        
        // Return partial status with error information for debugging
        return {
          workflowId: workflow.id,
          workflowStatus: workflow.status,
          n8nEnabled: true,
          n8nExecutionId: workflow.n8n_execution_id,
          n8nStatus: null,
          error: n8nError instanceof Error ? n8nError.message : 'Unknown n8n error'
        };
      }
    }),

  /**
   * Cancel a running n8n execution and update workflow status accordingly.
   *
   * Business Context:
   * - Enables manual intervention when automated workflows encounter issues
   * - Critical for stopping runaway or incorrect automation processes
   * - Updates Rexera workflow status to reflect cancellation
   * - Used by supervisors and agents to regain manual control
   *
   * Cancellation Process:
   * 1. Validate workflow exists and has active n8n execution
   * 2. Send cancellation request to n8n Cloud API
   * 3. Update Rexera workflow status to BLOCKED if successful
   * 4. Return operation result for user feedback
   *
   * Error Handling:
   * - Validates n8n integration is enabled before attempting cancellation
   * - Logs but doesn't fail on status update errors (n8n cancellation succeeded)
   * - Provides detailed error messages for troubleshooting
   *
   * @param input - Workflow ID to cancel n8n execution for
   * @param ctx - tRPC context with authenticated Supabase client
   * @returns Cancellation result with success status and execution details
   * @throws Error when workflow not found, no execution exists, or cancellation fails
   */
  cancelN8nExecution: procedure
    .input(z.object({
      /** Workflow ID to cancel n8n execution for */
      id: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      const { supabase } = ctx;
      
      // Fetch workflow with n8n execution reference
      const { data: workflow, error } = await supabase
        .from('workflows')
        .select('id, n8n_execution_id, workflow_type, status')
        .eq('id', input.id)
        .single();

      if (error) {
        throw new Error(`Failed to fetch workflow: ${error.message}`);
      }

      if (!workflow) {
        throw new Error('Workflow not found');
      }

      if (!workflow.n8n_execution_id) {
        throw new Error('Workflow has no n8n execution to cancel');
      }

      if (!isN8nEnabled()) {
        throw new Error('n8n integration is not enabled');
      }

      try {
        // Attempt to cancel n8n execution
        const success = await cancelN8nExecution(workflow.n8n_execution_id);
        
        if (success) {
          // Update Rexera workflow status to reflect cancellation
          // BLOCKED status indicates manual intervention required
          const { error: updateError } = await supabase
            .from('workflows')
            .update({
              status: 'BLOCKED',
              updated_at: new Date().toISOString()
            })
            .eq('id', workflow.id);

          if (updateError) {
            console.error('Failed to update workflow status after cancellation:', updateError);
            // Don't fail the operation - n8n cancellation succeeded
          }
        }
        
        return {
          success,
          workflowId: workflow.id,
          n8nExecutionId: workflow.n8n_execution_id,
          message: success ? 'n8n execution cancelled successfully' : 'Failed to cancel n8n execution'
        };
      } catch (n8nError) {
        console.error('Failed to cancel n8n execution:', n8nError);
        throw new Error(`Failed to cancel n8n execution: ${n8nError instanceof Error ? n8nError.message : 'Unknown error'}`);
      }
    }),
});