/**
 * Test version of Rexera API Application
 * 
 * Same as main app but without authentication for testing
 */

import { Hono } from 'hono';
import { swaggerUI } from '@hono/swagger-ui';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { handle } from 'hono/vercel';
import {
  rateLimitMiddleware,
  securityHeadersMiddleware,
  requestValidationMiddleware,
  errorHandlerMiddleware,
  corsMiddleware,
} from './middleware';
import { agents, workflows, taskExecutions } from './routes';

const app = new Hono();

// ============================================================================
// MINIMAL MIDDLEWARE FOR DEVELOPMENT
// ============================================================================

// Basic middleware only
app.use('*', prettyJSON());
app.use('*', corsMiddleware);

// Add error handling back
app.use('*', errorHandlerMiddleware);

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

// OpenAPI specification (serve generated spec)
app.get('/api/openapi.json', async (c) => {
  try {
    // Try to read the generated OpenAPI spec
    const fs = await import('fs/promises');
    const path = await import('path');
    const specPath = path.join(process.cwd(), 'generated', 'openapi.json');
    const specContent = await fs.readFile(specPath, 'utf-8');
    const spec = JSON.parse(specContent);
    
    // Update server URL to match current environment
    spec.servers = [{
      url: process.env.NODE_ENV === 'production' 
        ? 'https://api.rexera.com' 
        : 'http://localhost:3001',
      description: process.env.NODE_ENV === 'production' ? 'Production' : 'Development'
    }];
    
    return c.json(spec);
  } catch (error) {
    // Fallback to basic spec if generated one doesn't exist
    console.log('⚠️ Could not load generated OpenAPI spec, using fallback');
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
      },
    });
  }
});

// ============================================================================
// TEST ENDPOINTS (No Authentication Required for Testing)
// ============================================================================

// Note: All routes mounted without problematic middleware to avoid hanging issues

// Test endpoint to debug user authentication
app.get('/api/debug/auth', async (c) => {
  const authHeader = c.req.header('Authorization');
  const user = c.get('user');
  
  return c.json({
    success: true,
    debug: {
      hasAuthHeader: !!authHeader,
      authHeader: authHeader?.substring(0, 20) + '...',
      user: user || 'No user in context',
      environment: process.env.NODE_ENV
    }
  });
});

// Simple workflows endpoint without middleware issues
app.get('/api/workflows', async (c) => {
  console.log('🔍 Workflows API called at:', new Date().toISOString());
  
  // Parse query parameters
  const sortBy = c.req.query('sortBy') || 'created_at';
  const sortDirection = c.req.query('sortDirection') || 'desc';
  const page = parseInt(c.req.query('page') || '1', 10);
  const limit = parseInt(c.req.query('limit') || '20', 10);
  const workflow_type = c.req.query('workflow_type');
  const status = c.req.query('status');
  const client_id = c.req.query('client_id');
  const assigned_to = c.req.query('assigned_to');
  const priority = c.req.query('priority');
  const include = c.req.query('include');
  
  console.log('🔍 Query params:', { sortBy, sortDirection, page, limit, workflow_type, status, client_id, include });
  
  try {
    const { createServerClient } = await import('./utils/database');
    const supabase = createServerClient();
    
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
      created_at,
      updated_at,
      completed_at,
      due_date,
      human_readable_id
    `;
    
    if (includeArray.includes('client')) {
      selectString += `, clients(id, name, domain)`;
    }
    
    if (includeArray.includes('tasks')) {
      selectString += `, task_executions(*, agents!agent_id(id, name, type))`;
    }

    let query = supabase
      .from('workflows')
      .select(selectString, { count: 'exact' });

    // Apply filters
    if (workflow_type) query = query.eq('workflow_type', workflow_type);
    if (status) query = query.eq('status', status);
    if (client_id) query = query.eq('client_id', client_id);
    if (assigned_to) query = query.eq('assigned_to', assigned_to);
    if (priority) query = query.eq('priority', priority);

    // Apply sorting
    const ascending = sortDirection === 'asc';
    
    // Handle special sorting for interrupt_count
    if (sortBy === 'interrupt_count') {
      // For interrupt count, we need to get all data first and sort client-side
      // This is a temporary solution for the simplified endpoint
      query = query.order('created_at', { ascending: false });
    } else {
      query = query.order(sortBy, { ascending });
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: workflows, error, count } = await query;

    if (error) {
      console.log('❌ Database error:', error.message);
      return c.json({ success: false, error: error.message }, 500);
    }

    console.log('✅ Found workflows:', workflows?.length || 0, 'Total:', count);
    
    const totalPages = Math.ceil((count || 0) / limit);
    
    return c.json({
      success: true,
      data: workflows || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      }
    });
  } catch (error) {
    console.log('❌ Server error:', error);
    return c.json({ 
      success: false, 
      error: 'Database connection failed',
      details: String(error)
    }, 500);
  }
});

// GET /api/workflows/:id - Get single workflow
app.get('/api/workflows/:id', async (c) => {
  console.log('🔍 Single workflow API called');
  const id = c.req.param('id');
  const include = c.req.query('include');
  
  console.log('🔍 Workflow ID:', id, 'Include:', include);
  
  try {
    const { createServerClient } = await import('./utils/database');
    const { isUUID, getWorkflowByHumanId } = await import('./utils/workflow-resolver');
    const supabase = createServerClient();
    
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
      created_at,
      updated_at,
      completed_at,
      due_date,
      human_readable_id
    `;
    
    if (includeArray.includes('client')) {
      selectString += `, clients(id, name, domain)`;
    }
    
    if (includeArray.includes('tasks')) {
      selectString += `, task_executions(*, agents!agent_id(id, name, type))`;
    }

    let workflow: any = null;
    
    // If it's a UUID, query directly by ID
    if (isUUID(id)) {
      const { data, error } = await supabase
        .from('workflows')
        .select(selectString)
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return c.json({
            success: false,
            error: 'Workflow not found',
          }, 404);
        }
        throw new Error(`Failed to fetch workflow: ${error.message}`);
      }
      workflow = data;
    } else {
      // Otherwise, look up by human-readable ID
      workflow = await getWorkflowByHumanId(supabase, id, selectString);
      
      if (!workflow) {
        return c.json({
          success: false,
          error: 'Workflow not found',
        }, 404);
      }
    }

    console.log('✅ Found workflow:', workflow?.id);
    return c.json({
      success: true,
      data: workflow,
    });

  } catch (error) {
    console.log('❌ Server error:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to fetch workflow',
      details: String(error)
    }, 500);
  }
});

// GET /api/taskExecutions - List task executions
app.get('/api/taskExecutions', async (c) => {
  console.log('🔍 Task executions API called');
  
  // Parse query parameters
  const workflow_id = c.req.query('workflow_id');
  const agent_id = c.req.query('agent_id');
  const status = c.req.query('status');
  const executor_type = c.req.query('executor_type');
  const page = parseInt(c.req.query('page') || '1', 10);
  const limit = parseInt(c.req.query('limit') || '20', 10);
  
  console.log('🔍 Task query params:', { workflow_id, agent_id, status, executor_type, page, limit });
  
  try {
    const { createServerClient } = await import('./utils/database');
    const supabase = createServerClient();
    
    let query = supabase
      .from('task_executions')
      .select(`
        *,
        workflows!workflow_id(id, title, client_id),
        agents!agent_id(id, name, type)
      `, { count: 'exact' });

    // Apply filters
    if (workflow_id) query = query.eq('workflow_id', workflow_id);
    if (agent_id) query = query.eq('agent_id', agent_id);
    if (status) query = query.eq('status', status);
    if (executor_type) query = query.eq('executor_type', executor_type);

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: tasks, error, count } = await query;

    if (error) {
      console.log('❌ Database error:', error.message);
      return c.json({ success: false, error: error.message }, 500);
    }

    console.log('✅ Found tasks:', tasks?.length || 0, 'Total:', count);
    
    const totalPages = Math.ceil((count || 0) / limit);
    
    return c.json({
      success: true,
      data: tasks || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      }
    });
  } catch (error) {
    console.log('❌ Server error:', error);
    return c.json({ 
      success: false, 
      error: 'Database connection failed',
      details: String(error)
    }, 500);
  }
});

// GET /api/agents - List agents
app.get('/api/agents', async (c) => {
  console.log('🔍 Agents API called');
  
  // Parse query parameters
  const type = c.req.query('type');
  const is_active = c.req.query('is_active');
  const status = c.req.query('status');
  const page = parseInt(c.req.query('page') || '1', 10);
  const limit = parseInt(c.req.query('limit') || '20', 10);
  
  console.log('🔍 Agents query params:', { type, is_active, status, page, limit });
  
  try {
    const { createServerClient } = await import('./utils/database');
    const supabase = createServerClient();
    
    let query = supabase
      .from('agents')
      .select('*', { count: 'exact' });

    // Apply filters
    if (type) query = query.eq('type', type);
    if (is_active !== undefined) query = query.eq('is_active', is_active === 'true');

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: agents, error, count } = await query;

    if (error) {
      console.log('❌ Database error:', error.message);
      return c.json({ success: false, error: error.message }, 500);
    }

    console.log('✅ Found agents:', agents?.length || 0, 'Total:', count);
    
    const totalPages = Math.ceil((count || 0) / limit);
    
    return c.json({
      success: true,
      data: agents || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      }
    });
  } catch (error) {
    console.log('❌ Server error:', error);
    return c.json({ 
      success: false, 
      error: 'Database connection failed',
      details: String(error)
    }, 500);
  }
});

// n8n integration endpoints (basic stubs for compatibility)
app.get('/api/workflows/:id/n8n-status', async (c) => {
  const id = c.req.param('id');
  
  // Return a stub response since we're in test mode
  return c.json({
    success: true,
    data: {
      workflow_id: id,
      n8n_execution_id: null,
      status: 'not_running',
      last_execution: null
    }
  });
});

app.post('/api/workflows/:id/cancel-n8n', async (c) => {
  const id = c.req.param('id');
  
  // Return a stub response since we're in test mode
  return c.json({
    success: true,
    message: 'N8N execution cancellation requested',
    workflow_id: id
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
  }, 404 as any);
});

// ============================================================================
// ROUTE MODULES
// ============================================================================

// Mount route modules for testing (no auth required in test app)
app.route('/api/agents', agents);
app.route('/api/workflows', workflows);
app.route('/api/taskExecutions', taskExecutions);

// ============================================================================
// EXPORT
// ============================================================================

// Vercel serverless function handler
export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
export const OPTIONS = handle(app);

// Export the app for testing
export const testApp = app;
export default app;