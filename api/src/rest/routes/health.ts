/**
 * @fileoverview REST health check endpoints for Rexera 2.0.
 *
 * This module provides HTTP-based health check endpoints for infrastructure
 * monitoring, load balancer health checks, and operational visibility. The
 * REST interface enables standard HTTP monitoring tools to assess system
 * health without requiring tRPC client capabilities.
 *
 * Health Check Architecture:
 * - Delegates to tRPC health router for consistent logic
 * - Provides HTTP-compatible response formats
 * - Supports infrastructure monitoring and alerting
 * - Enables load balancer health check integration
 *
 * Key Capabilities:
 * - System health status reporting via HTTP
 * - Database connectivity validation
 * - Environment configuration verification
 * - Consistent error handling and response formats
 *
 * Business Context:
 * - Enables automated monitoring and alerting systems
 * - Supports load balancer traffic routing decisions
 * - Provides operational visibility for DevOps teams
 * - Facilitates incident detection and response
 *
 * Integration Points:
 * - Load balancers use these endpoints for health checks
 * - Monitoring systems poll for system status
 * - CI/CD pipelines validate deployment health
 * - Infrastructure automation uses health status
 *
 * @module HealthRestRouter
 * @requires express - Express router and HTTP handling
 * @requires ../../trpc/router - tRPC router for health logic
 * @requires ../../utils/database - Database client creation
 * @requires @trpc/server - tRPC error handling
 */

import { Router, Request, Response } from 'express';
import { appRouter } from '../../trpc/router';
import { createServerClient } from '../../utils/database';
import { TRPCError } from '@trpc/server';

const router = Router();

/**
 * Creates tRPC caller with proper context for health check execution.
 *
 * Business Context:
 * - Enables reuse of tRPC health check logic in REST endpoints
 * - Provides consistent context and authentication handling
 * - Maintains single source of truth for health check implementation
 * - Supports unified error handling and response formatting
 *
 * Context Creation:
 * - HTTP request and response objects for context
 * - Authenticated Supabase client for database checks
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
 * - Provides consistent error responses for monitoring systems
 * - Maps tRPC errors to appropriate HTTP status codes
 * - Enables proper error handling by infrastructure tools
 * - Supports debugging and troubleshooting workflows
 *
 * Error Mapping:
 * - NOT_FOUND: 404 for missing resources
 * - BAD_REQUEST: 400 for invalid input
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
 * GET /api/rest/health - System health check endpoint.
 *
 * Business Context:
 * - Primary endpoint for infrastructure health monitoring
 * - Used by load balancers for traffic routing decisions
 * - Enables automated monitoring and alerting systems
 * - Provides operational visibility for DevOps teams
 *
 * Health Check Components:
 * - Database connectivity and accessibility
 * - Environment configuration validation
 * - Core system component status
 * - Service dependency availability
 *
 * Response Format:
 * - Success flag for programmatic handling
 * - Detailed health data for debugging
 * - Consistent structure for monitoring tools
 * - Timestamp for health check correlation
 *
 * Monitoring Integration:
 * - Load balancers route traffic based on health status
 * - Monitoring systems alert on health check failures
 * - CI/CD pipelines validate deployment health
 * - Infrastructure automation uses health status
 *
 * @route GET /api/rest/health
 * @returns {Object} Health status with system component details
 * @throws {Error} When system health check fails
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const caller = await createCaller(req, res);
    
    const result = await caller.health.check();
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    handleError(error, res);
  }
});

export { router as healthRestRouter };