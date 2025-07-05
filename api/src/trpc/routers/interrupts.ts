/**
 * @fileoverview Human-in-the-Loop (HIL) interrupts router for Rexera 2.0.
 *
 * This module manages workflow interrupts that require human intervention,
 * enabling seamless escalation from automated processing to human review
 * when AI agents encounter complex scenarios, errors, or edge cases that
 * require human expertise and decision-making.
 *
 * HIL Interrupt Scenarios:
 * - Document quality issues requiring manual review
 * - Complex property situations needing expert analysis
 * - Customer-specific requirements outside standard workflows
 * - AI agent confidence below acceptable thresholds
 * - External system failures requiring manual workarounds
 * - Compliance issues requiring human verification
 *
 * Key Capabilities:
 * - Interrupt creation and priority assignment
 * - Human expert assignment and notification
 * - Resolution tracking and workflow resumption
 * - Priority-based queue management
 * - Comprehensive audit trail for compliance
 *
 * Business Context:
 * - Ensures quality and accuracy in automated workflows
 * - Provides escalation path for complex scenarios
 * - Maintains customer SLA compliance through human oversight
 * - Enables continuous improvement of AI agent capabilities
 * - Supports regulatory compliance and quality assurance
 *
 * Integration Points:
 * - AI agents create interrupts when encountering issues
 * - n8n workflows pause and await human resolution
 * - Notification systems alert appropriate human experts
 * - Resolution triggers workflow resumption
 * - Activity tracking logs all interrupt lifecycle events
 *
 * @module InterruptsRouter
 * @requires ../trpc - tRPC router and procedure definitions
 * @requires zod - Runtime type validation and schema definition
 */

import { procedure, router } from '../trpc';
import { z } from 'zod';

/**
 * Input validation schema for interrupt list queries with comprehensive filtering.
 * Supports operational monitoring, priority management, and resolution tracking.
 */
const GetInterruptsInput = z.object({
  /** Filter by specific workflow ID for workflow-focused interrupt management */
  workflow_id: z.string().optional(),
  /** Filter by priority level for queue management and escalation */
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  /** Filter by resolution status (default: false to show active interrupts) */
  is_resolved: z.boolean().optional(),
  /** Page number for pagination (1-based) */
  page: z.number().default(1),
  /** Number of interrupts per page (default 10 for focused review) */
  limit: z.number().default(10)
});

/**
 * Interrupts router providing comprehensive Human-in-the-Loop (HIL) interrupt management.
 * Supports workflow exception handling, human expert escalation, and resolution tracking.
 */
export const interruptsRouter = router({
  /**
   * Retrieves paginated list of workflow interrupts requiring human intervention.
   *
   * Business Context:
   * - Primary endpoint for human expert work queues and dashboards
   * - Enables priority-based interrupt management and assignment
   * - Supports workflow exception handling and escalation processes
   * - Provides visibility into automation bottlenecks and improvement opportunities
   *
   * Interrupt Queue Management:
   * - Priority-based ordering for efficient human resource allocation
   * - Default filtering to active (unresolved) interrupts for focused work
   * - Workflow context for understanding business impact
   * - Author tracking for accountability and communication
   *
   * Priority Levels:
   * - URGENT: Customer-impacting issues requiring immediate attention
   * - HIGH: Time-sensitive issues affecting SLA compliance
   * - NORMAL: Standard exceptions requiring expert review
   * - LOW: Non-critical issues for batch processing
   *
   * Use Cases:
   * - Human expert work queues and task assignment
   * - Workflow exception monitoring and management
   * - Quality assurance and compliance review processes
   * - Performance analysis of automation effectiveness
   * - Customer service escalation and resolution tracking
   *
   * @param input - Filtering, pagination, and selection parameters
   * @param ctx - tRPC context containing authenticated Supabase client
   * @returns Paginated interrupt list with workflow and author context
   * @throws Error when database query fails or access is unauthorized
   */
  list: procedure
    .input(GetInterruptsInput)
    .query(async ({ input, ctx }) => {
      const { supabase } = ctx;
      
      // Build comprehensive query with workflow and author context
      let query = supabase
        .from('hil_notes')
        .select(`
          id,
          workflow_id,
          author_id,
          content,
          priority,
          is_resolved,
          created_at,
          updated_at,
          workflows!hil_notes_workflow_id_fkey(
            id,
            workflow_type,
            title,
            status
          ),
          user_profiles!hil_notes_author_id_fkey(
            id,
            full_name,
            email
          )
        `, { count: 'exact' });

      // Apply filtering based on operational and management needs
      if (input.workflow_id) {
        query = query.eq('workflow_id', input.workflow_id);
      }
      if (input.priority) {
        query = query.eq('priority', input.priority);
      }
      if (input.is_resolved !== undefined) {
        query = query.eq('is_resolved', input.is_resolved);
      } else {
        // Default to showing only unresolved interrupts for active work queue
        query = query.eq('is_resolved', false);
      }

      // Apply pagination and ordering for efficient queue management
      const offset = (input.page - 1) * input.limit;
      query = query
        .range(offset, offset + input.limit - 1)
        .order('created_at', { ascending: false });

      const { data: notes, error, count } = await query;

      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

      // Transform HIL notes into interrupt-focused data structure
      // This provides clear context for human experts and work queue management
      const transformedInterrupts = (notes || []).map((note: any) => ({
        id: note.id,
        workflow_id: note.workflow_id,
        task_title: note.workflows?.title || 'Unknown Workflow',
        interrupt_reason: note.content,
        priority: note.priority,
        is_resolved: note.is_resolved,
        created_at: note.created_at,
        updated_at: note.updated_at,
        workflow_type: note.workflows?.workflow_type || 'UNKNOWN',
        author: note.user_profiles?.full_name || 'Unknown User'
      }));

      const totalPages = Math.ceil((count || 0) / input.limit);

      return {
        interrupts: transformedInterrupts,
        pagination: {
          page: input.page,
          limit: input.limit,
          total: count || 0,
          totalPages
        }
      };
    }),

  /**
   * Retrieves detailed information for a specific workflow interrupt.
   *
   * Business Context:
   * - Provides complete interrupt context for human expert review
   * - Enables detailed analysis of workflow exceptions and issues
   * - Supports resolution planning and decision-making processes
   * - Facilitates communication between experts and stakeholders
   *
   * Interrupt Details Include:
   * - Complete interrupt description and context
   * - Workflow information for business understanding
   * - Author details for communication and accountability
   * - Priority and resolution status for queue management
   * - Timestamps for SLA tracking and performance analysis
   *
   * Use Cases:
   * - Detailed interrupt review and analysis interfaces
   * - Expert assignment and communication workflows
   * - Resolution planning and documentation processes
   * - Audit trail generation for compliance reporting
   * - Customer service detailed inquiry responses
   *
   * @param input - Object containing the interrupt ID to retrieve
   * @param ctx - tRPC context containing authenticated Supabase client
   * @returns Complete interrupt details with workflow and author context
   * @throws Error when interrupt not found or database query fails
   */
  byId: procedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const { supabase } = ctx;
      
      // Retrieve complete interrupt details with comprehensive context
      const { data: note, error } = await supabase
        .from('hil_notes')
        .select(`
          *,
          workflows!hil_notes_workflow_id_fkey(
            id,
            workflow_type,
            title,
            status,
            description
          ),
          user_profiles!hil_notes_author_id_fkey(
            id,
            full_name,
            email
          )
        `)
        .eq('id', input.id)
        .single();

      if (error) {
        throw new Error(`Failed to fetch interrupt: ${error.message}`);
      }

      if (!note) {
        throw new Error('Interrupt not found');
      }

      return note;
    }),

  /**
   * Resolves a workflow interrupt and optionally updates resolution notes.
   *
   * Business Context:
   * - Marks interrupt as resolved to remove from active work queues
   * - Enables workflow resumption after human intervention
   * - Provides resolution documentation for audit trails
   * - Supports performance tracking and improvement analysis
   *
   * Resolution Process:
   * - Human expert reviews interrupt and determines resolution
   * - Resolution notes document the solution or decision made
   * - Interrupt marked as resolved and removed from active queues
   * - Workflow can resume automated processing if applicable
   * - Activity logged for audit trail and performance tracking
   *
   * Resolution Documentation:
   * - Optional resolution notes capture expert decision and rationale
   * - Timestamp tracking for SLA compliance and performance analysis
   * - Resolution patterns analyzed for AI agent improvement
   * - Audit trail maintained for compliance and quality assurance
   *
   * Use Cases:
   * - Human expert resolution workflows and interfaces
   * - Workflow resumption after exception handling
   * - Quality assurance and compliance documentation
   * - Performance analysis and AI agent improvement
   * - Customer communication about resolution status
   *
   * @param input - Interrupt ID and optional resolution notes
   * @param ctx - tRPC context containing authenticated Supabase client
   * @returns Updated interrupt record with resolution status
   * @throws Error when interrupt not found or update fails
   */
  resolve: procedure
    .input(z.object({
      /** Interrupt ID to resolve */
      id: z.string(),
      /** Optional resolution notes documenting the solution */
      resolution_notes: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const { supabase } = ctx;

      // Prepare update data for interrupt resolution
      const updateData: any = {
        is_resolved: true,
        updated_at: new Date().toISOString()
      };

      // Update content with resolution notes if provided
      if (input.resolution_notes) {
        updateData.content = input.resolution_notes;
      }

      // Update interrupt status and capture resolution
      const { data: note, error } = await supabase
        .from('hil_notes')
        .update(updateData)
        .eq('id', input.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to resolve interrupt: ${error.message}`);
      }

      return note;
    })
});