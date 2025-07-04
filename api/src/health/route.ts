import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@rexera/types';

// Health check endpoint to verify API and database connectivity
export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({
        success: false,
        status: 'error',
        message: 'Missing environment variables',
        details: {
          hasUrl: !!supabaseUrl,
          hasKey: !!serviceKey
        }
      }, { status: 500 });
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

    return NextResponse.json({
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
    });

  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({
      success: false,
      status: 'error',
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}