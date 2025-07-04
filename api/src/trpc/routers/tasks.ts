import { z } from 'zod';
import { procedure, router } from '../trpc';
import type { Database } from '@rexera/types';

const createTaskSchema = z.object({
  workflow_id: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  executor_type: z.enum(['AI', 'HIL']),
  assigned_to: z.string().uuid().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  metadata: z.record(z.any()).default({}),
  due_date: z.string().optional(),
});

const getTasksSchema = z.object({
  workflow_id: z.string().optional(),
  status: z.enum(['PENDING', 'AWAITING_REVIEW', 'COMPLETED', 'FAILED']).optional(),
  executor_type: z.enum(['AI', 'HIL']).optional(),
  assigned_to: z.string().uuid().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  include: z.array(z.enum(['assigned_user', 'executions', 'dependencies', 'workflow'])).default([]),
});

export const tasksRouter = router({
  list: procedure
    .input(getTasksSchema)
    .query(async ({ input, ctx }) => {
      const { supabase } = ctx;

      let selectQuery = '*';
      
      if (input.include.includes('workflow')) {
        selectQuery += ', workflow:workflows(id, title, workflow_type, client_id, status)';
      }
      if (input.include.includes('assigned_user')) {
        selectQuery += ', assigned_user:user_profiles!tasks_assigned_to_fkey(id, full_name, email)';
      }
      if (input.include.includes('executions')) {
        selectQuery += ', task_executions(*)';
      }
      if (input.include.includes('dependencies')) {
        selectQuery += ', task_dependencies(*)';
      }

      let query = supabase
        .from('tasks')
        .select(selectQuery);

      if (input.workflow_id) query = query.eq('workflow_id', input.workflow_id);
      if (input.status) query = query.eq('status', input.status);
      if (input.executor_type) query = query.eq('executor_type', input.executor_type);
      if (input.assigned_to) query = query.eq('assigned_to', input.assigned_to);
      if (input.priority) query = query.eq('priority', input.priority);

      const offset = (input.page - 1) * input.limit;
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + input.limit - 1);

      const { data: tasks, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch tasks: ${error.message}`);
      }

      const { count } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true });

      const totalPages = Math.ceil((count || 0) / input.limit);

      return {
        data: tasks || [],
        pagination: {
          page: input.page,
          limit: input.limit,
          total: count || 0,
          totalPages
        }
      };
    }),

  create: procedure
    .input(createTaskSchema)
    .mutation(async ({ input, ctx }) => {
      const { supabase } = ctx;

      const { data: workflow, error: workflowError } = await supabase
        .from('workflows')
        .select('id, client_id, status')
        .eq('id', input.workflow_id)
        .single();

      if (workflowError || !workflow) {
        throw new Error('Invalid workflow ID');
      }

      const { data: task, error } = await supabase
        .from('tasks')
        .insert({
          workflow_id: input.workflow_id,
          title: input.title,
          description: input.description,
          executor_type: input.executor_type,
          assigned_to: input.assigned_to,
          priority: input.priority,
          metadata: input.metadata,
          due_date: input.due_date,
        })
        .select(`
          *,
          workflow:workflows(id, title, workflow_type),
          assigned_user:user_profiles!tasks_assigned_to_fkey(id, full_name, email)
        `)
        .single();

      if (error) {
        throw new Error(`Failed to create task: ${error.message}`);
      }

      return task;
    }),
});