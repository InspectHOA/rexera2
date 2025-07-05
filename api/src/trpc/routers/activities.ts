import { procedure, router } from '../trpc';
import { z } from 'zod';

const GetActivitiesInput = z.object({
  workflow_id: z.string().optional(),
  event_type: z.string().optional(),
  actor_id: z.string().optional(),
  page: z.number().default(1),
  limit: z.number().default(20)
});

export const activitiesRouter = router({
  list: procedure
    .input(GetActivitiesInput)
    .query(async ({ input, ctx }) => {
      const { supabase } = ctx;
      
      let query = supabase
        .from('audit_events')
        .select(`
          id,
          event_type,
          action,
          actor_id,
          actor_name,
          actor_type,
          workflow_id,
          resource_type,
          resource_id,
          event_data,
          created_at,
          workflows!audit_events_workflow_id_fkey(
            id,
            title,
            workflow_type
          )
        `, { count: 'exact' });

      if (input.workflow_id) {
        query = query.eq('workflow_id', input.workflow_id);
      }
      if (input.event_type) {
        query = query.eq('event_type', input.event_type);
      }
      if (input.actor_id) {
        query = query.eq('actor_id', input.actor_id);
      }

      const offset = (input.page - 1) * input.limit;
      query = query
        .range(offset, offset + input.limit - 1)
        .order('created_at', { ascending: false });

      const { data: events, error, count } = await query;

      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

      const transformedActivities = (events || []).map((event: any) => {
        let message = '';
        let type = event.event_type;

        // Generate human-readable messages based on event type and action
        const workflowTitle = event.workflows?.title || 'Unknown Workflow';
        const actorName = event.actor_name || 'System';

        switch (event.event_type) {
          case 'workflow_created':
            message = `${actorName} created workflow "${workflowTitle}"`;
            type = 'workflow_started';
            break;
          case 'workflow_completed':
            message = `Workflow "${workflowTitle}" was completed`;
            break;
          case 'task_completed':
            message = `${actorName} completed a task in "${workflowTitle}"`;
            type = 'agent_completed';
            break;
          case 'hil_assignment_created':
            message = `Human intervention required for "${workflowTitle}"`;
            type = 'hil_intervention';
            break;
          case 'agent_execution_started':
            message = `AI agent started processing in "${workflowTitle}"`;
            break;
          case 'agent_execution_completed':
            message = `AI agent completed processing in "${workflowTitle}"`;
            type = 'agent_completed';
            break;
          default:
            message = `${actorName} performed ${event.action || event.event_type.replace(/_/g, ' ')} on ${event.resource_type || 'resource'}`;
        }

        return {
          id: event.id,
          type,
          message,
          timestamp: event.created_at,
          user: actorName,
          workflow_id: event.workflow_id
        };
      });

      const totalPages = Math.ceil((count || 0) / input.limit);

      return {
        activities: transformedActivities,
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
      
      const { data: event, error } = await supabase
        .from('audit_events')
        .select(`
          *,
          workflows!audit_events_workflow_id_fkey(
            id,
            title,
            workflow_type,
            status
          )
        `)
        .eq('id', input.id)
        .single();

      if (error) {
        throw new Error(`Failed to fetch activity: ${error.message}`);
      }

      if (!event) {
        throw new Error('Activity not found');
      }

      return event;
    }),

  summary: procedure
    .input(z.object({ 
      days: z.number().default(7),
      workflow_id: z.string().optional()
    }))
    .query(async ({ input, ctx }) => {
      const { supabase } = ctx;
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      let query = supabase
        .from('audit_events')
        .select('event_type, created_at')
        .gte('created_at', startDate.toISOString());

      if (input.workflow_id) {
        query = query.eq('workflow_id', input.workflow_id);
      }

      const { data: events, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch activity summary: ${error.message}`);
      }

      // Group events by type
      const summary = (events || []).reduce((acc: any, event: any) => {
        const type = event.event_type;
        if (!acc[type]) {
          acc[type] = 0;
        }
        acc[type]++;
        return acc;
      }, {});

      return {
        summary,
        total_events: events?.length || 0,
        period_days: input.days
      };
    })
});