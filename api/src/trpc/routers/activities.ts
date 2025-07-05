/**
 * @fileoverview Activity tracking and audit trail router for Rexera 2.0.
 *
 * This module provides comprehensive activity tracking and audit trail functionality
 * for the Rexera real estate workflow automation platform. It enables visibility
 * into all system events, user actions, and workflow progress for compliance,
 * debugging, and operational monitoring.
 *
 * Activity Types Tracked:
 * - Workflow lifecycle events (created, started, completed, failed)
 * - AI agent task assignments and completions
 * - Human intervention requests and resolutions
 * - System events and error occurrences
 * - User actions and administrative changes
 *
 * Key Capabilities:
 * - Real-time activity feeds for workflow monitoring
 * - Comprehensive audit trails for compliance and security
 * - Activity filtering and search for troubleshooting
 * - Activity summaries and analytics for reporting
 * - Human-readable activity messages for user interfaces
 *
 * Business Context:
 * - Enables customer service teams to track workflow progress
 * - Provides audit trails for regulatory compliance
 * - Supports debugging and troubleshooting of workflow issues
 * - Facilitates performance monitoring and optimization
 * - Enables activity-based notifications and alerts
 *
 * Integration Points:
 * - Audit events table stores all system activities
 * - Workflow context provides business meaning to events
 * - Real-time subscriptions for live activity feeds
 * - Activity summaries support dashboard analytics
 *
 * @module ActivitiesRouter
 * @requires ../trpc - tRPC router and procedure definitions
 * @requires zod - Runtime type validation and schema definition
 */

import { procedure, router } from '../trpc';
import { z } from 'zod';

/**
 * Input validation schema for activity list queries with comprehensive filtering.
 * Supports operational monitoring, debugging, and compliance use cases.
 */
const GetActivitiesInput = z.object({
  /** Filter by specific workflow ID for workflow-focused activity views */
  workflow_id: z.string().optional(),
  /** Filter by event type (workflow_created, task_completed, etc.) */
  event_type: z.string().optional(),
  /** Filter by actor ID (user or system component that performed action) */
  actor_id: z.string().optional(),
  /** Page number for pagination (1-based) */
  page: z.number().default(1),
  /** Number of activities per page (default 20 for performance) */
  limit: z.number().default(20)
});

/**
 * Activities router providing comprehensive activity tracking and audit trail functionality.
 * Supports real-time activity feeds, audit compliance, and operational monitoring.
 */
export const activitiesRouter = router({
  /**
   * Retrieves paginated list of activities with human-readable messages.
   *
   * Business Context:
   * - Primary endpoint for activity feeds in customer and admin dashboards
   * - Provides real-time visibility into workflow progress and system events
   * - Supports customer service inquiries about workflow status
   * - Enables audit trails for compliance and security requirements
   *
   * Activity Message Generation:
   * - Transforms technical audit events into user-friendly messages
   * - Provides context with workflow titles and actor names
   * - Standardizes activity types for consistent UI presentation
   * - Supports internationalization and customization
   *
   * Filtering Capabilities:
   * - Workflow-specific activity feeds for focused monitoring
   * - Event type filtering for specific activity categories
   * - Actor-based filtering for user or system activity tracking
   * - Time-based pagination for performance optimization
   *
   * Use Cases:
   * - Real-time activity feeds in workflow dashboards
   * - Customer service workflow status inquiries
   * - Audit trail generation for compliance reporting
   * - Debugging and troubleshooting workflow issues
   * - Performance monitoring and analytics
   *
   * @param input - Filtering, pagination, and selection parameters
   * @param ctx - tRPC context containing authenticated Supabase client
   * @returns Paginated activity list with human-readable messages
   * @throws Error when database query fails or access is unauthorized
   */
  list: procedure
    .input(GetActivitiesInput)
    .query(async ({ input, ctx }) => {
      const { supabase } = ctx;
      
      // Build comprehensive query with workflow context for meaningful messages
      let query = supabase
        .from('audit_events')
        .select(`
          id,
          event_type,
          action,
          actor_id,
          actor_name,
          actor_type,
          workflow_id,
          resource_type,
          resource_id,
          event_data,
          created_at,
          workflows!audit_events_workflow_id_fkey(
            id,
            title,
            workflow_type
          )
        `, { count: 'exact' });

      // Apply filtering based on operational and debugging needs
      if (input.workflow_id) {
        query = query.eq('workflow_id', input.workflow_id);
      }
      if (input.event_type) {
        query = query.eq('event_type', input.event_type);
      }
      if (input.actor_id) {
        query = query.eq('actor_id', input.actor_id);
      }

      // Apply pagination and ordering for consistent, recent-first results
      const offset = (input.page - 1) * input.limit;
      query = query
        .range(offset, offset + input.limit - 1)
        .order('created_at', { ascending: false });

      const { data: events, error, count } = await query;

      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

      // Transform technical audit events into user-friendly activity messages
      // This provides meaningful context for dashboards and customer service
      const transformedActivities = (events || []).map((event: any) => {
        let message = '';
        let type = event.event_type;

        // Extract context for human-readable message generation
        const workflowTitle = event.workflows?.title || 'Unknown Workflow';
        const actorName = event.actor_name || 'System';

        // Generate contextual messages based on event type and business meaning
        switch (event.event_type) {
          case 'workflow_created':
            message = `${actorName} created workflow "${workflowTitle}"`;
            type = 'workflow_started';
            break;
          case 'workflow_completed':
            message = `Workflow "${workflowTitle}" was completed`;
            break;
          case 'task_completed':
            message = `${actorName} completed a task in "${workflowTitle}"`;
            type = 'agent_completed';
            break;
          case 'hil_assignment_created':
            message = `Human intervention required for "${workflowTitle}"`;
            type = 'hil_intervention';
            break;
          case 'agent_execution_started':
            message = `AI agent started processing in "${workflowTitle}"`;
            break;
          case 'agent_execution_completed':
            message = `AI agent completed processing in "${workflowTitle}"`;
            type = 'agent_completed';
            break;
          default:
            // Fallback for unknown event types with generic message
            message = `${actorName} performed ${event.action || event.event_type.replace(/_/g, ' ')} on ${event.resource_type || 'resource'}`;
        }

        return {
          id: event.id,
          type,
          message,
          timestamp: event.created_at,
          user: actorName,
          workflow_id: event.workflow_id
        };
      });

      const totalPages = Math.ceil((count || 0) / input.limit);

      return {
        activities: transformedActivities,
        pagination: {
          page: input.page,
          limit: input.limit,
          total: count || 0,
          totalPages
        }
      };
    }),

  /**
   * Retrieves detailed information for a specific activity/audit event.
   *
   * Business Context:
   * - Provides complete audit event details for compliance and debugging
   * - Enables deep-dive analysis of specific system events
   * - Supports forensic investigation of workflow issues
   * - Facilitates detailed activity reporting and documentation
   *
   * Event Details Include:
   * - Complete event metadata and context
   * - Actor information (who performed the action)
   * - Resource details (what was affected)
   * - Event data payload (specific action details)
   * - Workflow context for business meaning
   *
   * Use Cases:
   * - Detailed activity views in admin interfaces
   * - Audit trail investigation and compliance reporting
   * - Debugging specific workflow events and issues
   * - Forensic analysis of system behavior
   * - Customer service detailed event inquiry
   *
   * @param input - Object containing the activity ID to retrieve
   * @param ctx - tRPC context containing authenticated Supabase client
   * @returns Complete activity details with workflow context
   * @throws Error when activity not found or database query fails
   */
  byId: procedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const { supabase } = ctx;
      
      // Retrieve complete audit event with workflow context
      const { data: event, error } = await supabase
        .from('audit_events')
        .select(`
          *,
          workflows!audit_events_workflow_id_fkey(
            id,
            title,
            workflow_type,
            status
          )
        `)
        .eq('id', input.id)
        .single();

      if (error) {
        throw new Error(`Failed to fetch activity: ${error.message}`);
      }

      if (!event) {
        throw new Error('Activity not found');
      }

      return event;
    }),

  /**
   * Generates activity summary statistics for analytics and reporting.
   *
   * Business Context:
   * - Provides activity metrics for dashboard analytics
   * - Enables trend analysis and performance monitoring
   * - Supports operational reporting and KPI tracking
   * - Facilitates capacity planning and resource allocation
   *
   * Summary Metrics:
   * - Event type distribution (workflow events, agent tasks, etc.)
   * - Total activity volume for specified time period
   * - Activity patterns for performance optimization
   * - Workflow-specific or system-wide activity analysis
   *
   * Time Period Analysis:
   * - Configurable lookback period (default 7 days)
   * - Activity volume trends and patterns
   * - Peak activity identification for capacity planning
   * - Comparative analysis across different time periods
   *
   * Use Cases:
   * - Executive dashboards and operational reporting
   * - System performance monitoring and optimization
   * - Capacity planning and resource allocation
   * - Activity trend analysis and forecasting
   * - Workflow efficiency measurement and improvement
   *
   * @param input - Time period and optional workflow filter
   * @param ctx - tRPC context containing authenticated Supabase client
   * @returns Activity summary with event type distribution and totals
   * @throws Error when database query fails or access is unauthorized
   */
  summary: procedure
    .input(z.object({
      /** Number of days to look back for activity summary (default: 7) */
      days: z.number().default(7),
      /** Optional workflow ID to filter summary for specific workflow */
      workflow_id: z.string().optional()
    }))
    .query(async ({ input, ctx }) => {
      const { supabase } = ctx;
      
      // Calculate date range for activity analysis
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      // Build query for activity summary within time period
      let query = supabase
        .from('audit_events')
        .select('event_type, created_at')
        .gte('created_at', startDate.toISOString());

      // Apply optional workflow filter for focused analysis
      if (input.workflow_id) {
        query = query.eq('workflow_id', input.workflow_id);
      }

      const { data: events, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch activity summary: ${error.message}`);
      }

      // Aggregate events by type for distribution analysis
      const summary = (events || []).reduce((acc: any, event: any) => {
        const type = event.event_type;
        if (!acc[type]) {
          acc[type] = 0;
        }
        acc[type]++;
        return acc;
      }, {});

      return {
        summary,
        total_events: events?.length || 0,
        period_days: input.days
      };
    })
});