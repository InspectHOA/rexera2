/**
 * Rexera API Application
 * 
 * Modular, secure API with authentication and proper separation of concerns
 */

import { Hono } from 'hono';
import { swaggerUI } from '@hono/swagger-ui';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { handle } from 'hono/vercel';
import {
  authMiddleware,
  rateLimitMiddleware,
  securityHeadersMiddleware,
  requestValidationMiddleware,
  errorHandlerMiddleware,
  corsMiddleware,
} from './middleware';
import { agents, workflows, taskExecutions } from './routes';

const app = new Hono();

// ============================================================================
// GLOBAL MIDDLEWARE
// ============================================================================

// Error handling should be first to catch all errors
app.use('*', errorHandlerMiddleware);

// Request logging and formatting
app.use('*', logger());
app.use('*', prettyJSON());

// Security middleware
app.use('*', corsMiddleware);
app.use('*', securityHeadersMiddleware);
app.use('*', requestValidationMiddleware);
app.use('*', rateLimitMiddleware());

// ============================================================================
// PUBLIC ENDPOINTS (No Auth Required)
// ============================================================================

app.get('/api/health', (c) => {
  return c.json({
    success: true,
    message: 'Rexera API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0',
  });
});

// API Documentation
app.get('/api/docs', swaggerUI({ 
  url: '/api/openapi.json',
  version: '4.15.5',
}));

// OpenAPI specification (placeholder)
app.get('/api/openapi.json', (c) => {
  return c.json({
    openapi: '3.0.0',
    info: {
      title: 'Rexera API',
      version: '2.0.0',
      description: 'AI-powered real estate workflow automation platform API',
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api.rexera.com' 
          : 'http://localhost:3001',
      },
    ],
    paths: {
      '/api/health': {
        get: {
          summary: 'Health check',
          responses: {
            '200': {
              description: 'API is healthy',
            },
          },
        },
      },
      // TODO: Generate full OpenAPI spec from route definitions
    },
  });
});

// ============================================================================
// PROTECTED ENDPOINTS (Authentication Required)
// ============================================================================

// Apply authentication middleware to all protected routes
app.use('/api/agents/*', authMiddleware);
app.use('/api/workflows/*', authMiddleware);
app.use('/api/taskExecutions/*', authMiddleware);

// Mount route modules
app.route('/api/agents', agents);
app.route('/api/workflows', workflows);
app.route('/api/taskExecutions', taskExecutions);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler for unmatched routes
app.notFound((c) => {
  return c.json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested endpoint was not found',
      timestamp: new Date().toISOString(),
    },
  }, 404 as any);
});

// ============================================================================
// EXPORT
// ============================================================================

export default app;

// Vercel serverless function handler
export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
export const OPTIONS = handle(app);