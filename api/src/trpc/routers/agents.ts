/**
 * @fileoverview AI Agent coordination and monitoring router for Rexera 2.0.
 *
 * This module manages the 10 specialized AI agents that power Rexera's real estate
 * workflow automation. It provides comprehensive agent monitoring, performance
 * tracking, and coordination capabilities for the distributed AI agent system.
 *
 * Agent Ecosystem:
 * - Document Processing Agents: Extract and validate property documents
 * - Communication Agents: Handle customer and vendor interactions
 * - Research Agents: Gather property and lien information
 * - Quality Assurance Agents: Validate outputs and ensure compliance
 * - Coordination Agents: Orchestrate multi-agent workflows
 *
 * Key Responsibilities:
 * - Real-time agent status monitoring (online, busy, offline)
 * - Task assignment and load balancing across agents
 * - Performance metrics collection and analysis
 * - Agent execution history and audit trails
 * - Capacity management and scaling decisions
 *
 * Business Context:
 * - Enables automated processing of complex real estate workflows
 * - Provides visibility into AI agent performance for optimization
 * - Supports SLA monitoring and customer service inquiries
 * - Facilitates debugging and troubleshooting of agent issues
 *
 * Integration Points:
 * - n8n workflows trigger agent task assignments
 * - Agent execution results update workflow progress
 * - Performance metrics drive scaling and optimization decisions
 * - Status monitoring supports operational dashboards
 *
 * @module AgentsRouter
 * @requires ../trpc - tRPC router and procedure definitions
 * @requires zod - Runtime type validation and schema definition
 */

import { procedure, router } from '../trpc';
import { z } from 'zod';

/**
 * Input validation schema for agent list queries with filtering and pagination.
 * Supports operational monitoring and agent management use cases.
 */
const GetAgentsInput = z.object({
  /** Filter by agent active status (true=active, false=inactive, undefined=all) */
  is_active: z.boolean().optional(),
  /** Filter by agent type (document, communication, research, qa, coordination) */
  type: z.string().optional(),
  /** Page number for pagination (1-based) */
  page: z.number().default(1),
  /** Number of agents per page */
  limit: z.number().default(10)
});

/**
 * Agents router providing comprehensive AI agent management and monitoring.
 * Supports real-time status tracking, performance analysis, and operational visibility.
 */
export const agentsRouter = router({
  /**
   * Retrieves paginated list of AI agents with real-time status and workload information.
   *
   * Business Context:
   * - Primary endpoint for operational dashboards showing agent health
   * - Enables load balancing decisions based on current agent capacity
   * - Supports troubleshooting and performance optimization
   * - Provides visibility for customer service and SLA monitoring
   *
   * Agent Status Calculation:
   * - offline: Agent is inactive or disabled
   * - online: Agent is active and available for new tasks
   * - busy: Agent is active but at or near capacity
   *
   * Performance Considerations:
   * - Executes parallel queries for each agent's status
   * - Optimized for dashboard refresh rates (typically 30-60 seconds)
   * - Includes pagination to handle large agent deployments
   *
   * @param input - Filtering, pagination, and selection parameters
   * @param ctx - tRPC context containing authenticated Supabase client
   * @returns Paginated agent list with real-time status and workload data
   * @throws Error when database query fails or access is unauthorized
   */
  list: procedure
    .input(GetAgentsInput)
    .query(async ({ input, ctx }) => {
      const { supabase } = ctx;
      
      // Build base query with comprehensive agent information
      let query = supabase
        .from('agents')
        .select(`
          id,
          name,
          type,
          description,
          capabilities,
          api_endpoint,
          configuration,
          is_active,
          created_at,
          updated_at
        `, { count: 'exact' });

      // Apply filtering based on operational needs
      if (input.is_active !== undefined) {
        query = query.eq('is_active', input.is_active);
      }
      if (input.type) {
        query = query.eq('type', input.type);
      }

      // Apply pagination and ordering for consistent results
      const offset = (input.page - 1) * input.limit;
      query = query
        .range(offset, offset + input.limit - 1)
        .order('name', { ascending: true });

      const { data: agents, error, count } = await query;

      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

      // Enhance each agent with real-time status and workload information
      // This provides operational visibility for monitoring and load balancing
      const agentsWithStatus = await Promise.all(
        (agents || []).map(async (agent: any) => {
          // Get current pending tasks to determine workload
          const { data: executions } = await supabase
            .from('agent_executions')
            .select('id, status')
            .eq('agent_id', agent.id)
            .eq('status', 'PENDING');

          const currentTasks = executions?.length || 0;
          
          // Get most recent execution for activity tracking
          const { data: recentExecution } = await supabase
            .from('agent_executions')
            .select('completed_at, status')
            .eq('agent_id', agent.id)
            .order('started_at', { ascending: false })
            .limit(1)
            .single();

          // Calculate agent status based on activity and workload
          let status = 'offline';
          let lastActivity = agent.updated_at;

          if (agent.is_active) {
            if (currentTasks > 0) {
              status = 'busy';
            } else {
              status = 'online';
            }
          }

          // Update last activity timestamp from recent execution
          if (recentExecution?.completed_at) {
            lastActivity = recentExecution.completed_at;
          }

          return {
            name: agent.name,
            type: agent.type,
            status,
            current_tasks: currentTasks,
            max_tasks: agent.configuration?.max_concurrent_tasks || 5,
            last_activity: lastActivity
          };
        })
      );

      const totalPages = Math.ceil((count || 0) / input.limit);

      return {
        data: agentsWithStatus,
        pagination: {
          page: input.page,
          limit: input.limit,
          total: count || 0,
          totalPages
        }
      };
    }),

  /**
   * Retrieves detailed information for a specific AI agent including execution history.
   *
   * Business Context:
   * - Primary endpoint for agent detail views and troubleshooting
   * - Provides comprehensive execution history for debugging workflows
   * - Enables deep-dive analysis of agent behavior and performance
   * - Supports capacity planning and optimization decisions
   *
   * Execution History Tracking:
   * - Recent 10 executions with timing and confidence metrics
   * - Status tracking for workflow coordination
   * - Performance data for optimization analysis
   *
   * Use Cases:
   * - Agent performance dashboards and reporting
   * - Troubleshooting workflow failures and bottlenecks
   * - Analyzing agent confidence scores and execution patterns
   * - Monitoring execution times for SLA compliance
   *
   * @param input - Object containing the agent ID to retrieve
   * @param ctx - tRPC context containing authenticated Supabase client
   * @returns Complete agent details with recent execution history
   * @throws Error when agent not found or database query fails
   */
  byId: procedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const { supabase } = ctx;
      
      // Retrieve complete agent configuration and metadata
      const { data: agent, error } = await supabase
        .from('agents')
        .select('*')
        .eq('id', input.id)
        .single();

      if (error) {
        throw new Error(`Failed to fetch agent: ${error.message}`);
      }

      if (!agent) {
        throw new Error('Agent not found');
      }

      // Get recent execution history for performance analysis and debugging
      // Limited to 10 most recent to balance detail with performance
      const { data: executions } = await supabase
        .from('agent_executions')
        .select(`
          id,
          workflow_id,
          task_id,
          status,
          started_at,
          completed_at,
          execution_time_ms,
          confidence_score
        `)
        .eq('agent_id', agent.id)
        .order('started_at', { ascending: false })
        .limit(10);

      return {
        ...agent,
        recent_executions: executions || []
      };
    }),

  /**
   * Retrieves historical performance metrics for AI agents with flexible filtering.
   *
   * Business Context:
   * - Enables performance trend analysis and capacity planning
   * - Supports SLA monitoring and compliance reporting
   * - Provides data for agent optimization and scaling decisions
   * - Facilitates troubleshooting performance degradation issues
   *
   * Metric Types Tracked:
   * - execution_time: Average task completion time
   * - success_rate: Percentage of successful task completions
   * - confidence_score: AI model confidence in outputs
   * - throughput: Tasks completed per time period
   * - error_rate: Frequency of task failures
   *
   * Filtering Capabilities:
   * - Time range filtering (default 7 days, configurable)
   * - Single agent or all agents analysis
   * - Specific metric type focus or comprehensive view
   *
   * Use Cases:
   * - Performance dashboards and executive reporting
   * - Identifying performance trends and anomalies
   * - Capacity planning and resource allocation
   * - SLA compliance monitoring and alerting
   * - Agent optimization and tuning decisions
   *
   * @param input - Filtering parameters for metrics query
   * @param ctx - tRPC context containing authenticated Supabase client
   * @returns Historical performance metrics with agent context
   * @throws Error when database query fails or access is unauthorized
   */
  performance: procedure
    .input(z.object({
      /** Optional agent ID to filter metrics for specific agent */
      agent_id: z.string().optional(),
      /** Optional metric type filter (execution_time, success_rate, etc.) */
      metric_type: z.string().optional(),
      /** Number of days to look back for metrics (default: 7) */
      days: z.number().default(7)
    }))
    .query(async ({ input, ctx }) => {
      const { supabase } = ctx;
      
      // Calculate date range for performance analysis
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      // Build query with agent context for comprehensive analysis
      let query = supabase
        .from('agent_performance_metrics')
        .select(`
          id,
          agent_id,
          metric_type,
          metric_value,
          measurement_date,
          agents!agent_performance_metrics_agent_id_fkey(
            name,
            type
          )
        `)
        .gte('measurement_date', startDate.toISOString());

      // Apply optional filters for targeted analysis
      if (input.agent_id) {
        query = query.eq('agent_id', input.agent_id);
      }
      if (input.metric_type) {
        query = query.eq('metric_type', input.metric_type);
      }

      // Order by most recent measurements for trend analysis
      query = query.order('measurement_date', { ascending: false });

      const { data: metrics, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch performance metrics: ${error.message}`);
      }

      return {
        metrics: metrics || []
      };
    })
});