import { createClient } from '@supabase/supabase-js';
import type { Database } from '@rexera/types';

// Test endpoint to verify database connectivity
export async function GET(req: any) {
  try {
    // Use service role key for direct database access
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Test workflows query
    const { data: workflows, error } = await supabase
      .from('workflows')
      .select('id, title, status, workflow_type')
      .limit(10);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Test clients query
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, name')
      .limit(5);

    if (clientsError) {
      return Response.json({ error: clientsError.message }, { status: 500 });
    }

    return Response.json({
      success: true,
      data: {
        workflows: workflows || [],
        clients: clients || [],
        workflowCount: workflows?.length || 0,
        clientCount: clients?.length || 0
      }
    });

  } catch (error) {
    return Response.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}