// Simple API server for testing frontend connectivity
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-client-info', 'apikey'],
  credentials: true
}));

app.use(express.json());

// Initialize Supabase client - using remote instance since Docker isn't available
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wmgidablmqotriwlefhq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZ2lkYWJsbXFvdHJpd2xlZmhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTEzNzk2NywiZXhwIjoyMDY2NzEzOTY3fQ.viSjS9PV2aDSOIzayHv6zJG-rjmjOBOVMsHlm77h6ns';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Helper functions
function handleError(res, error, statusCode = 500) {
  console.error('API Error:', error);
  res.status(statusCode).json({
    success: false,
    error: {
      message: error.message || 'Internal server error',
      code: error.code || 'UNKNOWN_ERROR'
    }
  });
}

function sendSuccess(res, data, statusCode = 200) {
  res.status(statusCode).json({
    success: true,
    data
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Workflows endpoint
app.get('/api/workflows', async (req, res) => {
  try {
    const { include, limit = 50, offset = 0, status, client_id } = req.query;
    
    // Build select string based on include parameter
    let selectString = '*';
    if (include) {
      const includes = include.split(',');
      if (includes.includes('client')) {
        selectString = '*, clients(id, name, domain)';
      }
      if (includes.includes('tasks')) {
        selectString = '*, clients(id, name, domain), task_executions(*)';
      }
    }
    
    let query = supabase
      .from('workflows')
      .select(selectString);
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (client_id) {
      query = query.eq('client_id', client_id);
    }
    
    query = query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) {
      return handleError(res, error);
    }
    
    sendSuccess(res, data);
  } catch (error) {
    handleError(res, error);
  }
});

// Individual workflow endpoint (supports both UUID and human readable ID)
app.get('/api/workflows/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { include } = req.query;
    
    // Build select string based on include parameter
    let selectString = '*';
    if (include) {
      const includes = include.split(',');
      if (includes.includes('client')) {
        selectString = '*, clients(id, name, domain)';
      }
      if (includes.includes('tasks')) {
        selectString = '*, clients(id, name, domain), task_executions(*)';
      }
    }
    
    // Try to match by human_readable_id first, then by UUID
    let query = supabase
      .from('workflows')
      .select(selectString);
    
    // Check if it looks like a UUID (contains dashes in UUID format)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    if (isUUID) {
      query = query.eq('id', id);
    } else {
      query = query.eq('human_readable_id', id);
    }
    
    const { data, error } = await query.single();
    
    if (error) {
      return handleError(res, error, error.code === 'PGRST116' ? 404 : 500);
    }
    
    sendSuccess(res, data);
  } catch (error) {
    handleError(res, error);
  }
});

// Task executions GET endpoint
app.get('/api/taskExecutions', async (req, res) => {
  try {
    const { workflowId, include, limit = 50, offset = 0 } = req.query;
    
    // Build select string based on include parameter
    let selectString = '*';
    if (include) {
      const includes = include.split(',');
      if (includes.includes('assigned_user') || includes.includes('agent')) {
        selectString = '*, agents(id, name, type, description)';
      }
    }
    
    let query = supabase
      .from('task_executions')
      .select(selectString);
    
    if (workflowId) {
      query = query.eq('workflow_id', workflowId);
    }
    
    query = query
      .range(offset, offset + limit - 1)
      .order('sequence_order', { ascending: true });
    
    const { data, error } = await query;
    
    if (error) {
      return handleError(res, error);
    }
    
    sendSuccess(res, data);
  } catch (error) {
    handleError(res, error);
  }
});

// Task executions POST endpoint (bulk create)
app.post('/api/taskExecutions', async (req, res) => {
  try {
    const tasks = req.body;
    
    // Handle both single task and array of tasks
    const tasksArray = Array.isArray(tasks) ? tasks : [tasks];
    
    const { data, error } = await supabase
      .from('task_executions')
      .insert(tasksArray)
      .select();
    
    if (error) {
      return handleError(res, error);
    }
    
    sendSuccess(res, data, 201);
  } catch (error) {
    handleError(res, error);
  }
});

// Agents endpoint
app.get('/api/agents', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('name');
    
    if (error) {
      return handleError(res, error);
    }
    
    sendSuccess(res, data);
  } catch (error) {
    handleError(res, error);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple API server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📋 Workflows: http://localhost:${PORT}/api/workflows`);
  console.log(`⚡ Task Executions: http://localhost:${PORT}/api/taskExecutions`);
  console.log(`🤖 Agents: http://localhost:${PORT}/api/agents`);
});