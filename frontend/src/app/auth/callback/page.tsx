'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSupabase } from '@/lib/supabase/provider';

export default function AuthCallbackPage() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setDebugInfo('Starting auth callback...');
        
        // Get the current URL
        const currentUrl = window.location.href;
        setDebugInfo(`Processing URL: ${currentUrl}`);
        
        // Handle the OAuth callback
        const { data, error } = await supabase.auth.exchangeCodeForSession(currentUrl);
        
        if (error) {
          console.error('Auth callback error:', error);
          setError(`Authentication failed: ${error.message}`);
          setDebugInfo(`Error details: ${JSON.stringify(error)}`);
          return;
        }

        setDebugInfo('Code exchange successful');

        if (data.session?.user) {
          const user = data.session.user;
          console.log('User authenticated:', user.email);
          setDebugInfo(`User authenticated: ${user.email}`);
          
          // Simple redirect to dashboard without user profile creation for now
          router.push('/dashboard');
        } else {
          setDebugInfo('No session found, redirecting to login');
          router.push('/auth/login');
        }
      } catch (err) {
        console.error('Unexpected error during auth callback:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(`Unexpected error: ${errorMessage}`);
        setDebugInfo(`Unexpected error: ${JSON.stringify(err)}`);
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white py-8 px-6 shadow rounded-lg sm:px-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <h2 className="mt-4 text-lg font-medium text-gray-900">
                Completing sign in...
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Please wait while we authenticate you.
              </p>
              {debugInfo && (
                <p className="mt-4 text-xs text-gray-500 break-all">
                  {debugInfo}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white py-8 px-6 shadow rounded-lg sm:px-10">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="mt-4 text-lg font-medium text-gray-900">
                Authentication Error
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {error}
              </p>
              {debugInfo && (
                <details className="mt-4 text-left">
                  <summary className="text-xs text-gray-500 cursor-pointer">Debug Info</summary>
                  <pre className="mt-2 text-xs text-gray-400 break-all whitespace-pre-wrap">
                    {debugInfo}
                  </pre>
                </details>
              )}
              <button
                onClick={() => router.push('/auth/login')}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}