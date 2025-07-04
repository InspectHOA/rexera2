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

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient();
    const body = await request.json();
    const { action } = body;

    // Simple action handler
    if (action === 'assign') {
      const { assigned_to } = body;
      
      const { data, error } = await supabase
        .from('workflows')
        .update({ assigned_to, updated_at: new Date().toISOString() })
        .eq('id', params.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { success: false, error: { message: 'Failed to assign workflow' } },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data
      });
    }

    return NextResponse.json(
      { success: false, error: { message: 'Invalid action' } },
      { status: 400 }
    );

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}