import { procedure, router } from '../trpc';

export const healthRouter = router({
  check: procedure
    .query(async ({ ctx }) => {
      const { supabase } = ctx;
      
      const supabaseUrl = process.env.SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !serviceKey) {
        throw new Error('Missing environment variables');
      }

      const { data: workflows, error: workflowError } = await supabase
        .from('workflows')
        .select('id')
        .limit(1);

      const { data: clients, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .limit(1);

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        data: {
          environment: {
            hasSupabaseUrl: !!supabaseUrl,
            hasServiceKey: !!serviceKey
          },
          database: {
            workflows: {
              accessible: !workflowError,
              count: workflows?.length || 0,
              error: workflowError?.message || null
            },
            clients: {
              accessible: !clientError,
              count: clients?.length || 0,
              error: clientError?.message || null
            }
          }
        }
      };
    }),
});