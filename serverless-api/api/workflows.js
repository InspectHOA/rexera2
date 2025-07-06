/**
 * Real workflows endpoint using Supabase database
 */

const { createServerClient } = require('../utils/database');
const { handleError, sendSuccess } = require('../utils/errors');

// Initialize Supabase client
const supabase = createServerClient();

module.exports = async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const { 
        workflow_type, 
        status, 
        client_id, 
        assigned_to, 
        priority, 
        page = 1, 
        limit = 20,
        include 
      } = req.query;

      let query = supabase
        .from('workflows')
        .select(`
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
          client:clients(id, name, domain)
        `, { count: 'exact' });

      // Apply filters
      if (workflow_type) {
        query = query.eq('workflow_type', workflow_type);
      }
      if (status) {
        query = query.eq('status', status);
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

      // Apply pagination
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const offset = (pageNum - 1) * limitNum;
      
      query = query
        .range(offset, offset + limitNum - 1)
        .order('created_at', { ascending: false });

      const { data: workflows, error, count } = await query;

      if (error) {
        console.error('Database query failed:', error);
        throw new Error(`Database query failed: ${error.message}`);
      }

      // Transform workflows for frontend compatibility
      const transformedWorkflows = workflows?.map(workflow => ({
        ...workflow,
        client: workflow.client
      })) || [];

      const totalPages = Math.ceil((count || 0) / limitNum);

      return sendSuccess(res, transformedWorkflows, {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages
      });

    } else if (req.method === 'POST') {
      // Create workflow
      const { 
        workflow_type, 
        client_id, 
        title, 
        description, 
        priority = 'NORMAL', 
        metadata = {}, 
        due_date, 
        created_by 
      } = req.body;

      const { data: workflow, error } = await supabase
        .from('workflows')
        .insert({
          workflow_type,
          client_id,
          title,
          description,
          priority,
          metadata,
          due_date,
          created_by
        })
        .select(`
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
          client:clients(id, name, domain)
        `)
        .single();

      if (error) {
        console.error('Failed to create workflow:', error);
        throw new Error(`Failed to create workflow: ${error.message}`);
      }

      return res.status(201).json({
        success: true,
        data: {
          ...workflow,
          client: workflow.client
        }
      });

    } else {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }
  } catch (error) {
    return handleError(error, res, 'Failed to process workflows request');
  }
};