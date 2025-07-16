/**
 * Rexera API Application
 * 
 * Modular, secure API with authentication and proper separation of concerns
 */

import { Hono } from 'hono';
import { swaggerUI } from '@hono/swagger-ui';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { buildOpenApiSpec } from './schemas/openapi/index';
import { handle } from 'hono/vercel';
import {
  authMiddleware,
  rateLimitMiddleware,
  securityHeadersMiddleware,
  requestValidationMiddleware,
  errorHandlerMiddleware,
  corsMiddleware,
} from './middleware';
import { agents, workflows, taskExecutions, communications } from './routes';

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

// OpenAPI specification
app.get('/api/openapi.json', (c) => {
  return c.json(buildOpenApiSpec());
});

// ============================================================================
// CONDITIONAL AUTHENTICATION (Production vs Development)
// ============================================================================

// Only apply authentication in production or when SKIP_AUTH is not set
const shouldSkipAuth = process.env.SKIP_AUTH === 'true';

if (!shouldSkipAuth) {
  console.log('🔐 Applying authentication middleware to protected routes');
  app.use('/api/agents/*', authMiddleware);
  app.use('/api/workflows/*', authMiddleware);
  app.use('/api/taskExecutions/*', authMiddleware);
  app.use('/api/communications/*', authMiddleware);
} else {
  console.log('⚠️ SKIP_AUTH mode enabled - authentication disabled for development');
}

// Mount route modules
app.route('/api/agents', agents);
app.route('/api/workflows', workflows);
app.route('/api/taskExecutions', taskExecutions);
app.route('/api/communications', communications);

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