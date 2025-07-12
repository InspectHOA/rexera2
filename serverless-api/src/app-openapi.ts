/**
 * Rexera API with OpenAPI Documentation
 * 
 * Enhanced version of the API with comprehensive OpenAPI documentation
 */

import { OpenAPIHono } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui';
import { handle } from 'hono/vercel';
import {
  authMiddleware,
  rateLimitMiddleware,
  securityHeadersMiddleware,
  requestValidationMiddleware,
  errorHandlerMiddleware,
  corsMiddleware,
} from './middleware';

// Import OpenAPI route definitions
import {
  healthRoute,
  listWorkflowsRoute,
  createWorkflowRoute,
  getWorkflowRoute,
  listTaskExecutionsRoute,
  listAgentsRoute,
} from './docs/openapi-schema';

// Create OpenAPI-enabled Hono app
const app = new OpenAPIHono({
  defaultHook: (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: result.error.issues,
            timestamp: new Date().toISOString(),
          },
        },
        400
      );
    }
  },
});

// ============================================================================
// GLOBAL MIDDLEWARE
// ============================================================================

// Error handling should be first to catch all errors
app.use('*', errorHandlerMiddleware);

// Security middleware
app.use('*', corsMiddleware);
app.use('*', securityHeadersMiddleware);
app.use('*', requestValidationMiddleware);
app.use('*', rateLimitMiddleware());

// ============================================================================
// OPENAPI CONFIGURATION
// ============================================================================

// OpenAPI document configuration
app.doc('/api/openapi.json', {
  openapi: '3.0.0',
  info: {
    version: '2.0.0',
    title: 'Rexera API',
    description: `
# Rexera Real Estate Workflow Automation API

## Overview
Rexera is a dual-layer platform that combines:
- **PostgreSQL + Next.js**: Business visibility and workflow management
- **n8n Cloud**: Workflow orchestration and automation

## Architecture
- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **API**: Hono framework with Vercel serverless functions
- **Database**: Supabase PostgreSQL with real-time subscriptions
- **Orchestration**: n8n Cloud for workflow automation

## Authentication
All API endpoints (except health check) require JWT authentication via Supabase Auth.

Include the JWT token in the Authorization header:
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## Workflow Types
- **PAYOFF_REQUEST**: Mortgage payoff request processing
- **HOA_ACQUISITION**: HOA acquisition workflows  
- **MUNI_LIEN_SEARCH**: Municipal lien search processes

## Status Flow
Workflows and tasks follow this status progression:
\`PENDING\` → \`IN_PROGRESS\` → \`AWAITING_REVIEW\` (if needed) → \`COMPLETED\`

## Error Handling
All errors follow a consistent format:
\`\`\`json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {},
    "timestamp": "2024-01-01T00:00:00.000Z",
    "requestId": "optional-request-id"
  }
}
\`\`\`
    `,
    contact: {
      name: 'Rexera API Support',
      email: 'support@rexera.com',
    },
  },
  servers: [
    {
      url: process.env.NODE_ENV === 'production' 
        ? 'https://api.rexera.com' 
        : 'http://localhost:3001',
      description: process.env.NODE_ENV === 'production' ? 'Production' : 'Development',
    },
  ],
  security: [
    {
      bearerAuth: [],
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Supabase JWT token obtained from authentication',
      },
    },
  },
  tags: [
    {
      name: 'System',
      description: 'System health and information endpoints',
    },
    {
      name: 'Workflows', 
      description: 'Workflow management and tracking',
    },
    {
      name: 'Task Executions',
      description: 'Individual task execution within workflows',
    },
    {
      name: 'Agents',
      description: 'AI agent management and status',
    },
    {
      name: 'Activities',
      description: 'Activity logging and audit trails', 
    },
    {
      name: 'Communications',
      description: 'Email and communication management',
    },
    {
      name: 'Interrupts',
      description: 'Workflow interrupts and manual interventions',
    },
  ],
});

// ============================================================================
// PUBLIC ENDPOINTS (No Auth Required)
// ============================================================================

// Health check endpoint
app.openapi(healthRoute, (c) => {
  return c.json({
    success: true,
    message: 'Rexera API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0',
  });
});

// ============================================================================
// DOCUMENTATION ENDPOINTS
// ============================================================================

// Swagger UI
app.get('/api/docs', swaggerUI({ 
  url: '/api/openapi.json',
}));

// API information endpoint
app.get('/', (c) => c.json({ 
  message: 'Rexera API v2.0 - Real Estate Workflow Automation',
  description: 'Dual-layer architecture: PostgreSQL + Next.js (business visibility) + n8n Cloud (workflow orchestration)',
  documentation: '/api/docs',
  openapi: '/api/openapi.json',
  version: '2.0.0',
  endpoints: {
    health: '/api/health',
    agents: '/api/agents',
    workflows: '/api/workflows',
    taskExecutions: '/api/task-executions',
    activities: '/api/activities',
    communications: '/api/communications',
    interrupts: '/api/interrupts',
    incomingEmail: '/api/incoming-email',
  },
}));

// ============================================================================
// PROTECTED ENDPOINTS (Authentication Required)
// ============================================================================

// Apply authentication middleware to all protected routes
app.use('/api/workflows/*', authMiddleware);
app.use('/api/task-executions/*', authMiddleware);
app.use('/api/agents/*', authMiddleware);
app.use('/api/activities/*', authMiddleware);
app.use('/api/communications/*', authMiddleware);
app.use('/api/interrupts/*', authMiddleware);

// ============================================================================
// WORKFLOW ENDPOINTS
// ============================================================================

// Import workflow implementation handlers
import { createServerClient } from './utils/database';
import { clientDataMiddleware, getCompanyFilter, type AuthUser } from './middleware';
import { resolveWorkflowId, isUUID } from './utils/workflow-resolver';

// List workflows
app.openapi(listWorkflowsRoute, async (c) => {
  try {
    const supabase = createServerClient();
    const user = c.get('user') as AuthUser;
    const {
      workflow_type,
      status,
      client_id,
      assigned_to,
      priority,
      page,
      limit,
      include,
      sortBy,
      sortDirection,
    } = c.req.valid('query');

    // Build select string based on includes
    const includeArray = include ? include.split(',') : [];
    let selectString = `
      id,
      workflow_type,
      client_id,
      title,
      description,
      status,
      priority,
      metadata,
      created_by,
      assigned_to,
      due_date,
      completed_at,
      created_at,
      updated_at,
      human_readable_id
    `;

    if (includeArray.includes('client')) {
      selectString += ', clients(id, name, domain)';
    }

    if (includeArray.includes('assigned_user')) {
      selectString += ', assigned_user:user_profiles!assigned_to(id, full_name, email)';
    }

    // Build query
    let query = supabase
      .from('workflows')
      .select(selectString, { count: 'exact' });

    // Apply company filter for client users
    const companyFilter = getCompanyFilter(user);
    if (companyFilter) {
      query = query.eq('client_id', companyFilter);
    }

    // Apply filters
    if (workflow_type) query = query.eq('workflow_type', workflow_type);
    if (status) query = query.eq('status', status);
    if (client_id) query = query.eq('client_id', client_id);
    if (assigned_to) query = query.eq('assigned_to', assigned_to);
    if (priority) query = query.eq('priority', priority);

    // Apply sorting
    const validSortFields = ['created_at', 'updated_at', 'status', 'priority', 'due_date'];
    const sortField = validSortFields.includes(sortBy || '') ? sortBy : 'created_at';
    query = query.order(sortField!, { ascending: sortDirection === 'asc' });

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return c.json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch workflows',
          details: error,
          timestamp: new Date().toISOString(),
        },
      }, 500);
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return c.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
      },
    });
  } catch (error) {
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
      },
    }, 500);
  }
});

// Create workflow
app.openapi(createWorkflowRoute, async (c) => {
  try {
    const supabase = createServerClient();
    const user = c.get('user') as AuthUser;
    const workflowData = c.req.valid('json');

    // Validate client access for client users
    const companyFilter = getCompanyFilter(user);
    if (companyFilter && workflowData.client_id !== companyFilter) {
      return c.json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied to this client',
          timestamp: new Date().toISOString(),
        },
      }, 403);
    }

    const { data, error } = await supabase
      .from('workflows')
      .insert({
        ...workflowData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return c.json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to create workflow',
          details: error,
          timestamp: new Date().toISOString(),
        },
      }, 500);
    }

    return c.json({
      success: true,
      data,
    }, 201);
  } catch (error) {
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
      },
    }, 500);
  }
});

// Get workflow by ID
app.openapi(getWorkflowRoute, async (c) => {
  try {
    const supabase = createServerClient();
    const user = c.get('user') as AuthUser;
    const { id } = c.req.valid('param');
    const { include } = c.req.valid('query');

    // Resolve workflow ID (handle both UUID and human-readable IDs)
    const resolvedId = await resolveWorkflowId(supabase, id);
    if (!resolvedId) {
      return c.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Workflow with ID ${id} not found`,
          timestamp: new Date().toISOString(),
        },
      }, 404);
    }

    // Build select string based on includes
    const includeArray = include ? include.split(',') : [];
    let selectString = `
      id,
      workflow_type,
      client_id,
      title,
      description,
      status,
      priority,
      metadata,
      created_by,
      assigned_to,
      due_date,
      completed_at,
      created_at,
      updated_at,
      human_readable_id
    `;

    if (includeArray.includes('client')) {
      selectString += ', clients(id, name, domain)';
    }

    if (includeArray.includes('assigned_user')) {
      selectString += ', assigned_user:user_profiles!assigned_to(id, full_name, email)';
    }

    let query = supabase
      .from('workflows')
      .select(selectString)
      .eq('id', resolvedId);

    // Apply company filter for client users
    const companyFilter = getCompanyFilter(user);
    if (companyFilter) {
      query = query.eq('client_id', companyFilter);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Workflow with ID ${id} not found`,
            timestamp: new Date().toISOString(),
          },
        }, 404);
      }

      return c.json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch workflow',
          details: error,
          timestamp: new Date().toISOString(),
        },
      }, 500);
    }

    return c.json({
      success: true,
      data,
    });
  } catch (error) {
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
      },
    }, 500);
  }
});

// ============================================================================
// PLACEHOLDER ENDPOINTS (To be implemented)
// ============================================================================

// These would need full implementations from app-complete.ts
app.openapi(listTaskExecutionsRoute, async (c) => {
  return c.json({
    success: true,
    data: [],
    message: 'Task executions endpoint - implementation needed',
  });
});

app.openapi(listAgentsRoute, async (c) => {
  return c.json({
    success: true,
    data: [],
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    message: 'Agents endpoint - implementation needed',
  });
});

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
  }, 404);
});

// ============================================================================
// EXPORT
// ============================================================================

export { app };
export default handle(app);