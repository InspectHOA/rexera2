const { createServerClient } = require('../src/utils/database');
const { handleError, sendSuccess } = require('../src/utils/errors');
const { z } = require('zod');
const { CreateTaskExecutionSchema, UpdateTaskExecutionSchema } = require('@rexera/schemas');

const supabase = createServerClient();

module.exports = async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { method, body, query } = req;

    switch (method) {
      case 'GET':
        // listByWorkflow
        if (query.workflowId) {
          const { data, error } = await supabase
            .from('task_executions')
            .select('*')
            .eq('workflow_id', query.workflowId)
            .order('sequence_order', { ascending: true });

          if (error) {
            console.error('Database query failed:', error);
            throw new Error(`Database query failed: ${error.message}`);
          }
          return sendSuccess(res, data);
        }
        break;

      case 'POST':
        // Differentiate between single and bulk creation
        if (req.url && req.url.endsWith('/bulk')) {
          // bulkCreate
          const validation = z.array(CreateTaskExecutionSchema).safeParse(body);
          if (!validation.success) {
            return res.status(400).json({ 
              success: false, 
              error: 'Validation failed',
              details: validation.error.issues 
            });
          }
          const { data, error } = await supabase
            .from('task_executions')
            .insert(body)
            .select();
          if (error) {
            console.error('Failed to bulk create task executions:', error);
            throw new Error(`Failed to bulk create task executions: ${error.message}`);
          }
          return res.status(201).json({
            success: true,
            data
          });
        } else {
          // create single
          const validation = CreateTaskExecutionSchema.safeParse(body);
          if (!validation.success) {
            return res.status(400).json({ 
              success: false, 
              error: 'Validation failed',
              details: validation.error.issues 
            });
          }
          const { data, error } = await supabase
            .from('task_executions')
            .insert(body)
            .select()
            .single();
          if (error) {
            console.error('Failed to create task execution:', error);
            throw new Error(`Failed to create task execution: ${error.message}`);
          }
          return res.status(201).json({
            success: true,
            data
          });
        }

      case 'PATCH':
        // update
        if (query.id) {
          const validation = UpdateTaskExecutionSchema.safeParse(body);
          if (!validation.success) {
            return res.status(400).json({ 
              success: false, 
              error: 'Validation failed',
              details: validation.error.issues 
            });
          }
          const { data, error } = await supabase
            .from('task_executions')
            .update(body)
            .eq('id', query.id)
            .select()
            .single();
          if (error) {
            console.error('Failed to update task execution:', error);
            throw new Error(`Failed to update task execution: ${error.message}`);
          }
          return sendSuccess(res, data);
        }
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PATCH']);
        return res.status(405).json({
          success: false,
          error: `Method ${method} Not Allowed`
        });
    }
  } catch (error) {
    return handleError(error, res, 'Failed to process task executions request');
  }
}