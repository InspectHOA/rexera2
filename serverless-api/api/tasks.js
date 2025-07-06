/**
 * Real tasks endpoint using Supabase database
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
        workflow_id, 
        status, 
        executor_type, 
        assigned_to, 
        priority, 
        page = 1, 
        limit = 20,
        include 
      } = req.query;
      
      let query = supabase
        .from('tasks')
        .select(`
          id,
          workflow_id,
          title,
          description,
          status,
          executor_type,
          assigned_to,
          priority,
          metadata,
          created_at,
          updated_at,
          completed_at,
          due_date,
          assigned_user:user_profiles!tasks_assigned_to_fkey(id, full_name, email)
        `, { count: 'exact' });

      // Apply filters
      if (workflow_id) {
        query = query.eq('workflow_id', workflow_id);
      }
      if (status) {
        query = query.eq('status', status);
      }
      if (executor_type) {
        query = query.eq('executor_type', executor_type);
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
        .order('created_at', { ascending: true });

      const { data: tasks, error, count } = await query;

      if (error) {
        console.error('Database query failed:', error);
        throw new Error(`Database query failed: ${error.message}`);
      }

      // Transform tasks for frontend compatibility
      const transformedTasks = tasks?.map(task => ({
        ...task,
        assigned_user: task.assigned_user
      })) || [];
      
      const totalPages = Math.ceil((count || 0) / limitNum);

      return sendSuccess(res, transformedTasks, {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages
      });
      
    } else if (req.method === 'POST') {
      // Create task
      const { 
        workflow_id, 
        title, 
        description, 
        executor_type = 'AI', 
        priority = 'NORMAL',
        assigned_to,
        metadata = {},
        due_date
      } = req.body;

      const { data: task, error } = await supabase
        .from('tasks')
        .insert({
          workflow_id,
          title,
          description,
          executor_type,
          priority,
          assigned_to,
          metadata,
          due_date
        })
        .select(`
          id,
          workflow_id,
          title,
          description,
          status,
          executor_type,
          assigned_to,
          priority,
          metadata,
          created_at,
          updated_at,
          completed_at,
          due_date,
          assigned_user:user_profiles!tasks_assigned_to_fkey(id, full_name, email)
        `)
        .single();

      if (error) {
        console.error('Failed to create task:', error);
        throw new Error(`Failed to create task: ${error.message}`);
      }
      
      return res.status(201).json({
        success: true,
        data: {
          ...task,
          assigned_user: task.assigned_user
        }
      });
      
    } else {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }
  } catch (error) {
    return handleError(error, res, 'Failed to process tasks request');
  }
};