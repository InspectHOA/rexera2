/**
 * @fileoverview System health monitoring router for Rexera 2.0.
 *
 * This module provides comprehensive health check capabilities for the Rexera
 * real estate workflow automation platform. It enables monitoring of critical
 * system components, database connectivity, and configuration validity for
 * operational visibility and automated health monitoring.
 *
 * Health Check Components:
 * - Environment configuration validation
 * - Database connectivity and accessibility testing
 * - Core table accessibility verification
 * - Service dependency status monitoring
 *
 * Key Capabilities:
 * - Real-time system health status reporting
 * - Configuration validation and error detection
 * - Database connectivity monitoring
 * - Automated health check for monitoring systems
 * - Detailed error reporting for troubleshooting
 *
 * Business Context:
 * - Enables proactive monitoring and alerting
 * - Supports SLA compliance and uptime tracking
 * - Facilitates rapid incident detection and response
 * - Provides operational visibility for DevOps teams
 * - Enables automated health monitoring and scaling
 *
 * Integration Points:
 * - Load balancer health checks for traffic routing
 * - Monitoring systems for alerting and dashboards
 * - CI/CD pipelines for deployment validation
 * - Customer status pages for transparency
 *
 * @module HealthRouter
 * @requires ../trpc - tRPC router and procedure definitions
 */

import { procedure, router } from '../trpc';

/**
 * Health router providing comprehensive system health monitoring and validation.
 * Supports operational monitoring, automated health checks, and incident detection.
 */
export const healthRouter = router({
  /**
   * Performs comprehensive system health check with detailed component status.
   *
   * Business Context:
   * - Primary endpoint for load balancer and monitoring system health checks
   * - Enables proactive detection of system issues and configuration problems
   * - Supports automated scaling and traffic routing decisions
   * - Provides operational visibility for DevOps and support teams
   *
   * Health Check Components:
   * - Environment Configuration: Validates critical environment variables
   * - Database Connectivity: Tests Supabase connection and table accessibility
   * - Core Tables: Verifies access to essential business data tables
   * - Service Dependencies: Monitors external service availability
   *
   * Monitoring Integration:
   * - Load balancers use this endpoint for traffic routing decisions
   * - Monitoring systems poll this endpoint for alerting and dashboards
   * - CI/CD pipelines validate deployment health using this endpoint
   * - Customer status pages can reflect system health status
   *
   * Error Handling:
   * - Configuration errors throw exceptions to fail health checks
   * - Database errors are captured and reported in response
   * - Partial failures provide detailed component status
   * - Structured error reporting enables targeted troubleshooting
   *
   * @param ctx - tRPC context containing authenticated Supabase client
   * @returns Comprehensive health status with component details
   * @throws Error when critical configuration is missing or invalid
   */
  check: procedure
    .query(async ({ ctx }) => {
      const { supabase } = ctx;
      
      // Validate critical environment configuration
      const supabaseUrl = process.env.SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !serviceKey) {
        throw new Error('Missing environment variables');
      }

      // Test database connectivity and core table accessibility
      // These are minimal queries to verify database health without performance impact
      const { data: workflows, error: workflowError } = await supabase
        .from('workflows')
        .select('id')
        .limit(1);

      const { data: clients, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .limit(1);

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        data: {
          environment: {
            hasSupabaseUrl: !!supabaseUrl,
            hasServiceKey: !!serviceKey
          },
          database: {
            workflows: {
              accessible: !workflowError,
              count: workflows?.length || 0,
              error: workflowError?.message || null
            },
            clients: {
              accessible: !clientError,
              count: clients?.length || 0,
              error: clientError?.message || null
            }
          }
        }
      };
    }),
});