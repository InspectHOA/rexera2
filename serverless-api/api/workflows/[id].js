/**
 * Real workflow details endpoint using Supabase database
 */

const { createServerClient } = require('../../utils/database');
const { handleError } = require('../../utils/errors');

module.exports = async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabase = createServerClient();

  const id = req.query?.id;

  try {
    
    if (req.method === 'GET') {
      // Fetch workflow with related data
      const { data: workflow, error: workflowError } = await supabase
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
          client:clients(id, name, domain),
          assigned_user:user_profiles!workflows_new_assigned_to_fkey(id, full_name, email),
          created_user:user_profiles!workflows_new_created_by_fkey(id, full_name, email)
        `)
        .eq('id', id)
        .single();

      if (workflowError) {
        if (workflowError.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            error: 'Workflow not found'
          });
        }
        console.error('Failed to fetch workflow:', workflowError);
        throw new Error(`Failed to fetch workflow: ${workflowError.message}`);
      }

      // Fetch tasks for this workflow
      const { data: tasks, error: tasksError } = await supabase
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
        `)
        .eq('workflow_id', id)
        .order('created_at', { ascending: true });

      if (tasksError) {
        console.error('Failed to fetch tasks:', tasksError);
        // Don't fail the whole request if tasks fail
      }

      // Transform the data for frontend compatibility
      const transformedWorkflow = {
        ...workflow,
        client: workflow.client,
        assigned_user: workflow.assigned_user,
        created_user: workflow.created_user,
        tasks: tasks || []
      };

      return res.json({
        success: true,
        data: transformedWorkflow
      });
      
    } else {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }
  } catch (error) {
    return handleError(error, res, 'Failed to fetch workflow details');
  }
};