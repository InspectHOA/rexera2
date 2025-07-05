/**
 * @fileoverview REST API router orchestration for Rexera 2.0.
 *
 * This module organizes and mounts all REST API route handlers, providing
 * a traditional HTTP API alongside the tRPC interface. The REST API serves
 * specific use cases including webhook endpoints, third-party integrations,
 * and legacy system compatibility.
 *
 * Dual API Architecture:
 * - tRPC: Type-safe, modern API for frontend applications
 * - REST: Traditional HTTP API for webhooks and integrations
 * - Complementary approaches serving different use cases
 * - Consistent authentication and error handling across both
 *
 * REST API Use Cases:
 * - Webhook endpoints for external service callbacks (n8n, payment processors)
 * - Third-party integrations requiring standard HTTP APIs
 * - Legacy system compatibility and migration support
 * - Health checks and monitoring endpoints for infrastructure
 * - Testing and development utilities
 *
 * Route Organization:
 * - /workflows: Workflow management and status endpoints
 * - /tasks: Task execution and monitoring endpoints
 * - /health: System health and monitoring endpoints
 * - /webhooks: External service webhook handlers
 * - /test-n8n: Development and testing utilities for n8n integration
 *
 * Business Context:
 * - Enables integration with external services and systems
 * - Supports webhook-based real-time communication
 * - Provides monitoring and health check capabilities
 * - Facilitates development and testing workflows
 * - Maintains compatibility with existing integrations
 *
 * Security Considerations:
 * - Webhook endpoints validate signatures and authentication
 * - Rate limiting applied to prevent abuse
 * - CORS configuration for cross-origin requests
 * - Input validation and sanitization for all endpoints
 *
 * @module RESTRouter
 * @requires express - Express router for HTTP endpoint handling
 * @requires ./routes/* - Individual route handler modules
 */

import { Router } from 'express';
import { workflowsRestRouter } from './routes/workflows';
import { tasksRestRouter } from './routes/tasks';
import { healthRestRouter } from './routes/health';
import { n8nWebhookRouter } from './routes/n8n-webhook';
import { testN8nRouter } from './routes/test-n8n';

/**
 * Main REST API router combining all HTTP endpoint handlers.
 *
 * Business Context:
 * - Provides traditional HTTP API for external integrations
 * - Complements tRPC API with webhook and legacy support
 * - Enables third-party service integration and callbacks
 * - Supports monitoring and operational requirements
 *
 * Architecture Benefits:
 * - Modular organization by functional domain
 * - Consistent middleware and error handling
 * - Scalable routing structure for feature growth
 * - Clear separation of concerns and responsibilities
 */
const restRouter = Router();

/**
 * Mount REST route handlers with organized URL structure.
 *
 * Route Mapping:
 * - /workflows: Core workflow management and status operations
 * - /tasks: Task execution monitoring and control endpoints
 * - /health: System health checks and operational monitoring
 * - /webhooks: External service callback and notification handlers
 * - /test-n8n: Development utilities for n8n integration testing
 *
 * Integration Points:
 * - n8n Cloud sends webhook events to /webhooks endpoints
 * - Load balancers use /health endpoints for traffic routing
 * - Development tools use /test-n8n for integration validation
 * - Third-party services interact via /workflows and /tasks endpoints
 */

// Core business functionality endpoints
restRouter.use('/workflows', workflowsRestRouter);
restRouter.use('/tasks', tasksRestRouter);

// Operational and monitoring endpoints
restRouter.use('/health', healthRestRouter);

// External integration and webhook endpoints
restRouter.use('/webhooks', n8nWebhookRouter);

// Development and testing utilities
restRouter.use('/test-n8n', testN8nRouter);

export { restRouter };