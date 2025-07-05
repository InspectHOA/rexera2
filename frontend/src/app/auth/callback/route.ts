import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  console.log('Auth callback called:', {
    code: code ? 'present' : 'missing',
    next,
    origin,
    searchParams: Object.fromEntries(searchParams.entries())
  });

  if (code) {
    console.log('Processing auth code exchange...');
    
    // Create a response object to modify
    const response = NextResponse.redirect(`${origin}${next}`);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      }
    );

    console.log('Exchanging code for session...');
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      console.log('Auth exchange successful:', {
        userId: data?.user?.id,
        email: data?.user?.email
      });
      return response;
    } else {
      console.error('Auth exchange failed:', error);
    }
  } else {
    console.log('No auth code provided in callback');
  }

  // Return the user to an error page with instructions
  console.log('Redirecting to error page');
  return NextResponse.redirect(`${origin}/auth/error`);
}