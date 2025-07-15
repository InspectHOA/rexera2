import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  console.log('🔑 OAuth callback received:', { 
    code: !!code, 
    next,
    fullURL: request.url,
    origin 
  });

  if (code) {
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

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('❌ OAuth exchange error:', error);
        return NextResponse.redirect(`${origin}/auth/error`);
      }

      if (data.session && data.user) {
        console.log('✅ OAuth session created successfully!');
        console.log('👤 Session user:', data.user.email);
        console.log('🍪 Session expires at:', new Date(data.session.expires_at! * 1000).toISOString());
        
        // Add session indicator to URL so frontend knows to check for session
        const redirectUrl = `${origin}${next}?auth=success`;
        console.log('🚀 Redirecting to:', redirectUrl);
        
        const redirectResponse = NextResponse.redirect(redirectUrl);
        
        // Copy all cookies from the original response
        response.cookies.getAll().forEach(cookie => {
          redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
        });
        
        // Add a small delay to ensure session is properly set before redirect
        await new Promise(resolve => setTimeout(resolve, 100));
        return redirectResponse;
      } else {
        console.error('❌ No session created despite successful exchange');
        console.log('🔍 Exchange result:', { data, hasSession: !!data?.session, hasUser: !!data?.user });
        return NextResponse.redirect(`${origin}/auth/error`);
      }
    } catch (error) {
      console.error('❌ OAuth callback error:', error);
      return NextResponse.redirect(`${origin}/auth/error`);
    }
  }

  console.error('❌ No authorization code received');
  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/error`);
}