/**
 * @fileoverview Main Express server setup for Rexera 2.0 API backend.
 *
 * This module configures and initializes the Express.js server that powers
 * Rexera's real estate workflow automation platform. It provides a dual-protocol
 * API architecture supporting both tRPC (type-safe) and REST endpoints for
 * maximum flexibility and integration capabilities.
 *
 * Server Architecture:
 * - Express.js HTTP server with comprehensive middleware stack
 * - Dual API protocols: tRPC for frontend, REST for integrations
 * - CORS configuration for secure cross-origin requests
 * - Request logging and performance monitoring
 * - Centralized error handling and 404 responses
 *
 * API Endpoints:
 * - tRPC API (/api/trpc/*): Type-safe procedures for frontend communication
 * - REST API (/api/rest/*): Standard HTTP endpoints for external integrations
 * - Health checks (/health): Service monitoring and uptime validation
 * - n8n webhooks (/api/rest/webhooks/n8n): Workflow synchronization
 *
 * Security Features:
 * - CORS policy enforcement with configurable origins
 * - Request size limits to prevent DoS attacks
 * - Error message sanitization in production
 * - Comprehensive request logging for security monitoring
 *
 * Business Context:
 * - Serves Rexera frontend application with type-safe APIs
 * - Integrates with n8n Cloud for workflow automation
 * - Supports external client integrations via REST APIs
 * - Provides monitoring endpoints for operational visibility
 *
 * @module Server
 * @requires express - HTTP server framework
 * @requires cors - Cross-origin resource sharing middleware
 * @requires @trpc/server/adapters/express - tRPC Express integration
 * @requires ./trpc/router - Main tRPC router with all procedures
 * @requires ./trpc/context - tRPC context creation with authentication
 * @requires ./config - Environment configuration and settings
 * @requires ./rest - REST API router with all endpoints
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './trpc/router';
import { createTRPCContext } from './trpc/context';
import { config } from './config';
import { restRouter } from './rest';

const app = express();

/**
 * CORS (Cross-Origin Resource Sharing) configuration for secure frontend integration.
 *
 * Security Policy:
 * - Restricts origins to configured allowed domains (frontend, admin panels)
 * - Enables credentials for authenticated requests (cookies, auth headers)
 * - Limits HTTP methods to essential operations only
 * - Controls allowed headers to prevent header injection attacks
 *
 * Business Context:
 * - Allows Rexera frontend to access API from different domains/ports
 * - Supports development environments with localhost origins
 * - Enables secure authentication flow with credential sharing
 * - Prevents unauthorized cross-origin requests from malicious sites
 */
const corsOptions = {
  origin: config.allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

/**
 * Core middleware stack for request processing and security.
 *
 * Middleware Order (Critical for Security):
 * 1. CORS - Cross-origin policy enforcement
 * 2. JSON parser - Request body parsing with size limits
 * 3. URL encoder - Form data parsing with size limits
 * 4. Request logger - Performance and security monitoring
 */
app.use(cors(corsOptions));

// JSON and form data parsing with DoS protection via size limits
app.use(express.json({ limit: '10mb' })); // Supports large document uploads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Request logging middleware for performance monitoring and security auditing.
 *
 * Monitoring Features:
 * - Request method and path tracking
 * - Response status code logging
 * - Request duration measurement for performance analysis
 * - Security event logging for audit trails
 *
 * Business Value:
 * - Enables performance optimization and bottleneck identification
 * - Supports security monitoring and incident response
 * - Provides operational visibility for SLA monitoring
 * - Assists with debugging and troubleshooting
 */
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

/**
 * tRPC middleware for type-safe API procedures.
 *
 * tRPC Benefits:
 * - End-to-end type safety between frontend and backend
 * - Automatic TypeScript inference for API calls
 * - Built-in input validation and serialization
 * - Optimized for React Query integration
 *
 * Context Creation:
 * - Provides authenticated Supabase client for database operations
 * - Handles user authentication and authorization
 * - Manages request-scoped resources and cleanup
 *
 * Endpoint Structure:
 * - /api/trpc/workflows.* - Workflow management procedures
 * - /api/trpc/tasks.* - Task management procedures
 * - /api/trpc/agents.* - AI agent coordination procedures
 * - /api/trpc/health.* - System health monitoring procedures
 */
app.use(
  '/api/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext: createTRPCContext,
  })
);

/**
 * REST API endpoints for external integrations and webhooks.
 *
 * REST API Use Cases:
 * - n8n webhook processing for workflow synchronization
 * - External client integrations (third-party systems)
 * - Legacy system compatibility
 * - Simple HTTP-based integrations without TypeScript
 *
 * Key Endpoints:
 * - POST /api/rest/webhooks/n8n - n8n workflow event processing
 * - GET/POST /api/rest/workflows - Workflow CRUD operations
 * - GET/POST /api/rest/tasks - Task management operations
 * - GET /api/rest/health - Service health monitoring
 */
app.use('/api/rest', restRouter);

/**
 * Health check endpoint for service monitoring and uptime validation.
 *
 * Monitoring Integration:
 * - Used by load balancers for health checks and traffic routing
 * - Supports uptime monitoring services and alerting systems
 * - Provides baseline for API availability and response time metrics
 * - Enables automated deployment validation and rollback triggers
 *
 * Response Information:
 * - Service status confirmation for operational dashboards
 * - Timestamp for request tracking and latency measurement
 * - Environment information for deployment verification
 * - Consistent format for automated monitoring tools
 *
 * Business Value:
 * - Ensures high availability through proactive monitoring
 * - Supports SLA compliance and customer service commitments
 * - Enables rapid incident detection and response
 * - Provides operational visibility for business stakeholders
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'API server is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  });
});

/**
 * 404 Not Found handler for undefined routes and endpoints.
 *
 * Security Features:
 * - Prevents information leakage about internal server structure
 * - Logs potential reconnaissance attempts for security monitoring
 * - Provides consistent error format for client error handling
 * - Includes requested path for debugging legitimate routing issues
 *
 * Client Integration:
 * - Enables frontend to handle unknown routes gracefully
 * - Supports API versioning and deprecation strategies
 * - Provides clear feedback for integration debugging
 */
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

/**
 * Global error handler for unhandled exceptions and middleware errors.
 *
 * Error Handling Strategy:
 * - Logs all errors for debugging and monitoring
 * - Sanitizes error messages in production to prevent information leakage
 * - Provides consistent error response format for client handling
 * - Maintains service availability despite individual request failures
 *
 * Security Considerations:
 * - Prevents stack trace exposure in production environments
 * - Logs detailed error information for internal debugging
 * - Maintains audit trail for security incident investigation
 * - Protects sensitive system information from external exposure
 *
 * Business Continuity:
 * - Ensures service remains available despite individual errors
 * - Provides graceful degradation for client applications
 * - Supports rapid error identification and resolution
 * - Maintains customer experience during system issues
 */
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: config.isDevelopment ? error.message : 'Something went wrong'
  });
});

/**
 * Server startup and initialization with comprehensive endpoint documentation.
 *
 * Startup Process:
 * - Binds to configured port for HTTP request handling
 * - Displays comprehensive API documentation for development
 * - Lists all available endpoints and their purposes
 * - Provides immediate feedback for successful server initialization
 *
 * Development Support:
 * - Clear endpoint documentation for API consumers
 * - Direct links for testing and validation
 * - Router organization for code navigation
 * - Integration testing guidance
 *
 * Operational Visibility:
 * - Confirms successful server startup for deployment validation
 * - Provides port and endpoint information for service discovery
 * - Supports development workflow and debugging processes
 * - Enables rapid API exploration and testing
 */
app.listen(config.port, () => {
  console.log(`🚀 API Server running on http://localhost:${config.port}`);
  console.log(`📊 Health check: http://localhost:${config.port}/health`);
  console.log(`⚡ tRPC API: http://localhost:${config.port}/api/trpc`);
  console.log(`🔧 Available tRPC routers: workflows, tasks, health, interrupts, agents, activities`);
  console.log(`🌐 REST API: http://localhost:${config.port}/api/rest`);
  console.log(`📋 REST endpoints:`);
  console.log(`   GET    /api/rest/workflows - List workflows`);
  console.log(`   GET    /api/rest/workflows/:id - Get workflow by ID`);
  console.log(`   POST   /api/rest/workflows - Create workflow`);
  console.log(`   GET    /api/rest/tasks - List tasks`);
  console.log(`   POST   /api/rest/tasks - Create task`);
  console.log(`   GET    /api/rest/health - Health check`);
  console.log(`   POST   /api/rest/webhooks/n8n - n8n webhook endpoint`);
  console.log(`   GET    /api/rest/test-n8n - Test n8n integration`);
  console.log(`   GET    /api/rest/test-n8n/config - n8n configuration status`);
  console.log(`   GET    /api/rest/test-n8n/connection - Test n8n connection`);
});

export default app;