import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@rexera/types';

// Create Supabase client for API routes
function createServerClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey || anonKey
  );
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    const include = searchParams.get('include')?.split(',') || [];

    // Get the specific workflow
    let query = supabase
      .from('workflows')
      .select('*')
      .eq('id', params.id)
      .single();

    const { data: workflow, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: { message: 'Workflow not found', details: error.message } },
        { status: 404 }
      );
    }

    // Fetch related data if requested
    let result: any = { ...workflow };

    if (include.includes('client')) {
      const { data: client } = await supabase
        .from('clients')
        .select('id, name, domain')
        .eq('id', workflow.client_id)
        .single();
      result.client = client;
    }

    if (include.includes('tasks')) {
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('workflow_id', workflow.id);
      result.tasks = tasks || [];
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}