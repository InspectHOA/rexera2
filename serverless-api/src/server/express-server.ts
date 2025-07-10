// Simple API server for testing frontend connectivity
import express from 'express';
import cors from 'cors';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { resolveWorkflowId } from '../utils/workflow-resolver';

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

const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Helper functions
interface ApiError extends Error {
  code?: string;
}

function handleError(res: express.Response, error: ApiError, statusCode: number = 500): void {
  console.error('API Error:', error);
  res.status(statusCode).json({
    success: false,
    error: {
      message: error.message || 'Internal server error',
      code: error.code || 'UNKNOWN_ERROR'
    }
  });
}

function sendSuccess(res: express.Response, data: any, statusCode: number = 200): void {
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
    const { 
      workflow_type, 
      status, 
      client_id, 
      assigned_to, 
      priority, 
      page = '1', 
      limit = '20',
      include,
      sortBy = 'created_at',
      sortDirection = 'desc'
    } = req.query as Record<string, string>;

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
      selectString += `, task_executions(
        id,
        title,
        description,
        status,
        task_type,
        executor_type,
        agent_id,
        sequence_order,
        priority,
        interrupt_type,
        error_message,
        input_data,
        output_data,
        started_at,
        completed_at,
        execution_time_ms,
        retry_count,
        created_at,
        workflow_id,
        agents(id, name, type)
      )`;
    }

    let query = supabase
      .from('workflows')
      .select(selectString, { count: 'exact' });

    // Apply filters
    if (workflow_type) {
      query = query.eq('workflow_type', workflow_type);
    }
    if (status) {
      // Handle multiple status values separated by comma
      const statusList = status.split(',').map(s => s.trim());
      if (statusList.length === 1) {
        query = query.eq('status', statusList[0]);
      } else {
        query = query.in('status', statusList);
      }
    }
    if (client_id) {
      query = query.eq('client_id', client_id);
    }
    if (assigned_to) {
      query = query.eq('assigned_to', assigned_to);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }

    // Apply sorting
    const validSortFields = ['created_at', 'updated_at', 'title', 'status', 'priority', 'due_date', 'workflow_type', 'human_readable_id', 'interrupts'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const ascending = sortDirection.toLowerCase() === 'asc';
    
    // Special handling for interrupt sorting
    if (sortBy === 'interrupts') {
      // We'll need to fetch all data first, calculate interrupt counts, then sort and paginate
      // This is less efficient but necessary for interrupt count sorting
    } else {
      query = query.order(sortField, { ascending });
    }

    // Parse pagination parameters once
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;
    
    let workflows, error, count;

    if (sortBy === 'interrupts') {
      // For interrupt sorting, we need to fetch all data, calculate counts, sort, then paginate
      const { data: allWorkflows, error: allError, count: totalCount } = await query;
      
      if (allError) {
        return handleError(res, allError);
      }

      // Calculate interrupt counts and sort
      const workflowsWithInterrupts = (allWorkflows || []).map((workflow: any) => ({
        ...workflow,
        interrupt_count: (workflow.task_executions || []).filter((task: any) => task.status === 'AWAITING_REVIEW').length
      })).sort((a: any, b: any) => {
        const diff = a.interrupt_count - b.interrupt_count;
        return ascending ? diff : -diff;
      });

      // Apply pagination to sorted results
      workflows = workflowsWithInterrupts.slice(offset, offset + limitNum);
      error = null;
      count = totalCount;
    } else {
      // Regular sorting with database-level ordering
      query = query.range(offset, offset + limitNum - 1);
      const result = await query;
      workflows = result.data;
      error = result.error;
      count = result.count;
    }

    if (error) {
      return handleError(res, error);
    }

    // Transform workflows for frontend compatibility
    const transformedWorkflows = workflows?.map((workflow: any) => ({
      ...workflow,
      clients: workflow.clients, // clients should already be from the joined query
      tasks: workflow.task_executions || [] // Add tasks alias for frontend compatibility
    })) || [];

    const totalPages = Math.ceil((count || 0) / limitNum);

    console.log('Express server - Pagination data:', { page: pageNum, limit: limitNum, total: count, totalPages });
    console.log('Express server - Workflow types returned:', transformedWorkflows.reduce((acc: any, w: any) => { acc[w.workflow_type] = (acc[w.workflow_type] || 0) + 1; return acc; }, {}));

    const response = {
      success: true,
      data: transformedWorkflows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages
      }
    };

    res.json(response);
  } catch (error) {
    handleError(res, error as ApiError);
  }
});

// Individual workflow endpoint (UUID only)
app.get('/api/workflows/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { include } = req.query as Record<string, string>;
    
    // Check if ID is a UUID or human-readable ID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let actualWorkflowId = id;
    
    if (!isUUID) {
      // Look up UUID by human_readable_id
      const { data: workflow, error: workflowError } = await supabase
        .from('workflows')
        .select('id')
        .eq('human_readable_id', id)
        .single();
        
      if (workflowError || !workflow) {
        return res.status(404).json({
          success: false,
          error: {
            message: `Workflow not found with ID: ${id}`,
            code: 'WORKFLOW_NOT_FOUND'
          }
        });
      }
      
      actualWorkflowId = workflow.id;
    }
    
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
    
    const { data, error } = await supabase
      .from('workflows')
      .select(selectString)
      .eq('id', actualWorkflowId)
      .single();
    
    if (error) {
      return handleError(res, error, error.code === 'PGRST116' ? 404 : 500);
    }
    
    sendSuccess(res, data);
  } catch (error) {
    handleError(res, error as ApiError);
  }
});

// Task executions GET endpoint
app.get('/api/task-executions', async (req, res) => {
  try {
    const { workflowId, include, limit = '50', offset = '0' } = req.query as Record<string, string>;
    
    const limitNum = parseInt(limit, 10);
    const offsetNum = parseInt(offset, 10);
    
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
      // Check if workflowId is a UUID or human-readable ID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(workflowId);
      
      if (isUUID) {
        // Use UUID directly
        query = query.eq('workflow_id', workflowId);
      } else {
        // Look up UUID by human_readable_id
        const { data: workflow, error: workflowError } = await supabase
          .from('workflows')
          .select('id')
          .eq('human_readable_id', workflowId)
          .single();
          
        if (workflowError || !workflow) {
          return res.status(404).json({
            success: false,
            error: `Workflow not found with ID: ${workflowId}`
          });
        }
        
        query = query.eq('workflow_id', workflow.id);
      }
    }
    
    query = query
      .range(offsetNum, offsetNum + limitNum - 1)
      .order('sequence_order', { ascending: true });
    
    const { data, error } = await query;
    
    if (error) {
      return handleError(res, error);
    }
    
    sendSuccess(res, data);
  } catch (error) {
    handleError(res, error as ApiError);
  }
});

// Task executions POST endpoint (bulk create)
app.post('/api/task-executions', async (req, res) => {
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
    handleError(res, error as ApiError);
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
    handleError(res, error as ApiError);
  }
});

// Communications endpoint for email interface
app.get('/api/communications', async (req, res) => {
  try {
    const { workflow_id, type, direction, limit = '50' } = req.query as Record<string, string>;
    
    let query = supabase
      .from('communications')
      .select(`
        id,
        workflow_id,
        thread_id,
        sender_id,
        recipient_email,
        subject,
        body,
        communication_type,
        direction,
        status,
        metadata,
        created_at,
        updated_at,
        email_metadata(
          message_id,
          in_reply_to,
          email_references,
          attachments,
          headers
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (workflow_id) {
      // Check if workflow_id is a UUID or human-readable ID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(workflow_id);
      
      if (isUUID) {
        // Use UUID directly
        query = query.eq('workflow_id', workflow_id);
      } else {
        // Look up UUID by human_readable_id
        const { data: workflow, error: workflowError } = await supabase
          .from('workflows')
          .select('id')
          .eq('human_readable_id', workflow_id)
          .single();
          
        if (workflowError || !workflow) {
          return res.status(404).json({
            success: false,
            error: `Workflow not found with ID: ${workflow_id}`
          });
        }
        
        query = query.eq('workflow_id', workflow.id);
      }
    }
    
    if (type) {
      query = query.eq('communication_type', type);
    }
    
    if (direction) {
      query = query.eq('direction', direction);
    }
    
    query = query.limit(parseInt(limit, 10));

    const { data, error } = await query;

    if (error) {
      return handleError(res, error);
    }

    sendSuccess(res, data || []);
  } catch (error) {
    handleError(res, error as ApiError);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple API server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📋 Workflows: http://localhost:${PORT}/api/workflows`);
  console.log(`⚡ Task Executions: http://localhost:${PORT}/api/task-executions`);
  console.log(`🤖 Agents: http://localhost:${PORT}/api/agents`);
  console.log(`📧 Communications: http://localhost:${PORT}/api/communications`);
});