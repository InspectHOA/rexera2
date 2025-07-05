import { createClient } from '@supabase/supabase-js';
import type { Database } from '@rexera/types';

// Health check endpoint to verify API and database connectivity
export async function GET(request: any) {
  try {
    // Check environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({
        success: false,
        status: 'error',
        message: 'Missing environment variables',
        details: {
          hasUrl: !!supabaseUrl,
          hasKey: !!serviceKey
        }
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Test database connectivity
    const supabase = createClient<Database>(supabaseUrl, serviceKey);
    
    // Simple query to test connection
    const { data: workflows, error: workflowError } = await supabase
      .from('workflows')
      .select('id')
      .limit(1);

    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .limit(1);

    return new Response(JSON.stringify({
      success: true,
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
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      status: 'error',
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}