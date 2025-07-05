import { procedure, router } from '../trpc';
import { z } from 'zod';

const GetInterruptsInput = z.object({
  workflow_id: z.string().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  is_resolved: z.boolean().optional(),
  page: z.number().default(1),
  limit: z.number().default(10)
});

export const interruptsRouter = router({
  list: procedure
    .input(GetInterruptsInput)
    .query(async ({ input, ctx }) => {
      const { supabase } = ctx;
      
      let query = supabase
        .from('hil_notes')
        .select(`
          id,
          workflow_id,
          author_id,
          content,
          priority,
          is_resolved,
          created_at,
          updated_at,
          workflows!hil_notes_workflow_id_fkey(
            id,
            workflow_type,
            title,
            status
          ),
          user_profiles!hil_notes_author_id_fkey(
            id,
            full_name,
            email
          )
        `, { count: 'exact' });

      if (input.workflow_id) {
        query = query.eq('workflow_id', input.workflow_id);
      }
      if (input.priority) {
        query = query.eq('priority', input.priority);
      }
      if (input.is_resolved !== undefined) {
        query = query.eq('is_resolved', input.is_resolved);
      } else {
        // Default to showing only unresolved interrupts
        query = query.eq('is_resolved', false);
      }

      const offset = (input.page - 1) * input.limit;
      query = query
        .range(offset, offset + input.limit - 1)
        .order('created_at', { ascending: false });

      const { data: notes, error, count } = await query;

      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

      const transformedInterrupts = (notes || []).map((note: any) => ({
        id: note.id,
        workflow_id: note.workflow_id,
        task_title: note.workflows?.title || 'Unknown Workflow',
        interrupt_reason: note.content,
        priority: note.priority,
        is_resolved: note.is_resolved,
        created_at: note.created_at,
        updated_at: note.updated_at,
        workflow_type: note.workflows?.workflow_type || 'UNKNOWN',
        author: note.user_profiles?.full_name || 'Unknown User'
      }));

      const totalPages = Math.ceil((count || 0) / input.limit);

      return {
        interrupts: transformedInterrupts,
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
      
      const { data: note, error } = await supabase
        .from('hil_notes')
        .select(`
          *,
          workflows!hil_notes_workflow_id_fkey(
            id,
            workflow_type,
            title,
            status,
            description
          ),
          user_profiles!hil_notes_author_id_fkey(
            id,
            full_name,
            email
          )
        `)
        .eq('id', input.id)
        .single();

      if (error) {
        throw new Error(`Failed to fetch interrupt: ${error.message}`);
      }

      if (!note) {
        throw new Error('Interrupt not found');
      }

      return note;
    }),

  resolve: procedure
    .input(z.object({
      id: z.string(),
      resolution_notes: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const { supabase } = ctx;

      const updateData: any = {
        is_resolved: true,
        updated_at: new Date().toISOString()
      };

      if (input.resolution_notes) {
        updateData.content = input.resolution_notes;
      }

      const { data: note, error } = await supabase
        .from('hil_notes')
        .update(updateData)
        .eq('id', input.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to resolve interrupt: ${error.message}`);
      }

      return note;
    })
});