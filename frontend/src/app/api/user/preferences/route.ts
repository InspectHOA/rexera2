import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { SKIP_AUTH, SKIP_AUTH_USER } from '@/lib/auth/config';
import type { Database } from '@/types/database';

function createClient() {
  const cookieStore = cookies();
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Ignore errors from Server Components
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Ignore errors from Server Components
          }
        },
      },
    }
  );
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  
  try {
    const { theme } = await req.json();

    // Validate theme value
    if (!theme || !['light', 'dark', 'system'].includes(theme)) {
      return NextResponse.json({ error: 'Invalid theme value' }, { status: 400 });
    }

    let userId: string;

    if (SKIP_AUTH) {
      userId = SKIP_AUTH_USER.id;
    } else {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
      }
      userId = user.id;
    }

    // Try to update existing preference
    const { error: updateError } = await supabase
      .from('user_preferences')
      .update({ theme, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (updateError) {
      // If no preference exists, create one
      if (updateError.code === 'PGRST116') {
        const { error: insertError } = await supabase
          .from('user_preferences')
          .insert({ user_id: userId, theme });

        if (insertError) {
          console.error('Failed to create user preference:', insertError);
          return NextResponse.json({ error: 'Failed to save preference' }, { status: 500 });
        }
      } else {
        console.error('Failed to update user preference:', updateError);
        return NextResponse.json({ error: 'Failed to save preference' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error in theme preference update:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  const supabase = createClient();
  
  try {
    let userId: string;

    if (SKIP_AUTH) {
      userId = SKIP_AUTH_USER.id;
    } else {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
      }
      userId = user.id;
    }

    const { data, error } = await supabase
      .from('user_preferences')
      .select('theme')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If no preference is found, create one with the default 'system' theme
      if (error.code === 'PGRST116') {
        const { error: insertError } = await supabase
          .from('user_preferences')
          .insert({ user_id: userId, theme: 'system' });

        if (insertError) {
          console.error('Failed to create default user preference:', insertError);
          // Return default theme even if creation fails
          return NextResponse.json({ theme: 'system' });
        }
        return NextResponse.json({ theme: 'system' });
      }
      console.error('Failed to fetch user preference:', error);
      // Return default theme on error
      return NextResponse.json({ theme: 'system' });
    }

    return NextResponse.json({ theme: data?.theme || 'system' });
  } catch (error) {
    console.error('Unexpected error in theme preference fetch:', error);
    return NextResponse.json({ theme: 'system' });
  }
}