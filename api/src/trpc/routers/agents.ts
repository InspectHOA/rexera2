import { procedure, router } from '../trpc';
import { z } from 'zod';

const GetAgentsInput = z.object({
  is_active: z.boolean().optional(),
  type: z.string().optional(),
  page: z.number().default(1),
  limit: z.number().default(10)
});

export const agentsRouter = router({
  list: procedure
    .input(GetAgentsInput)
    .query(async ({ input, ctx }) => {
      const { supabase } = ctx;
      
      let query = supabase
        .from('agents')
        .select(`
          id,
          name,
          type,
          description,
          capabilities,
          api_endpoint,
          configuration,
          is_active,
          created_at,
          updated_at
        `, { count: 'exact' });

      if (input.is_active !== undefined) {
        query = query.eq('is_active', input.is_active);
      }
      if (input.type) {
        query = query.eq('type', input.type);
      }

      const offset = (input.page - 1) * input.limit;
      query = query
        .range(offset, offset + input.limit - 1)
        .order('name', { ascending: true });

      const { data: agents, error, count } = await query;

      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

      // Get current task counts for each agent
      const agentsWithStatus = await Promise.all(
        (agents || []).map(async (agent: any) => {
          // Get current executions for this agent
          const { data: executions } = await supabase
            .from('agent_executions')
            .select('id, status')
            .eq('agent_id', agent.id)
            .eq('status', 'PENDING');

          const currentTasks = executions?.length || 0;
          
          // Get recent execution to determine status
          const { data: recentExecution } = await supabase
            .from('agent_executions')
            .select('completed_at, status')
            .eq('agent_id', agent.id)
            .order('started_at', { ascending: false })
            .limit(1)
            .single();

          let status = 'offline';
          let lastActivity = agent.updated_at;

          if (agent.is_active) {
            if (currentTasks > 0) {
              status = 'busy';
            } else {
              status = 'online';
            }
          }

          if (recentExecution?.completed_at) {
            lastActivity = recentExecution.completed_at;
          }

          return {
            name: agent.name,
            type: agent.type,
            status,
            current_tasks: currentTasks,
            max_tasks: agent.configuration?.max_concurrent_tasks || 5,
            last_activity: lastActivity
          };
        })
      );

      const totalPages = Math.ceil((count || 0) / input.limit);

      return {
        data: agentsWithStatus,
        pagination: {
          page: input.page,
          limit: input.limit,
          total: count || 0,
          totalPages
        }
      };
    }),

  byId: procedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const { supabase } = ctx;
      
      const { data: agent, error } = await supabase
        .from('agents')
        .select('*')
        .eq('id', input.id)
        .single();

      if (error) {
        throw new Error(`Failed to fetch agent: ${error.message}`);
      }

      if (!agent) {
        throw new Error('Agent not found');
      }

      // Get recent executions
      const { data: executions } = await supabase
        .from('agent_executions')
        .select(`
          id,
          workflow_id,
          task_id,
          status,
          started_at,
          completed_at,
          execution_time_ms,
          confidence_score
        `)
        .eq('agent_id', agent.id)
        .order('started_at', { ascending: false })
        .limit(10);

      return {
        ...agent,
        recent_executions: executions || []
      };
    }),

  performance: procedure
    .input(z.object({ 
      agent_id: z.string().optional(),
      metric_type: z.string().optional(),
      days: z.number().default(7)
    }))
    .query(async ({ input, ctx }) => {
      const { supabase } = ctx;
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      let query = supabase
        .from('agent_performance_metrics')
        .select(`
          id,
          agent_id,
          metric_type,
          metric_value,
          measurement_date,
          agents!agent_performance_metrics_agent_id_fkey(
            name,
            type
          )
        `)
        .gte('measurement_date', startDate.toISOString());

      if (input.agent_id) {
        query = query.eq('agent_id', input.agent_id);
      }
      if (input.metric_type) {
        query = query.eq('metric_type', input.metric_type);
      }

      query = query.order('measurement_date', { ascending: false });

      const { data: metrics, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch performance metrics: ${error.message}`);
      }

      return {
        metrics: metrics || []
      };
    })
});