'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { shouldBypassAuth } from '@/lib/auth/config';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auth bypass configuration comes from centralized config

  useEffect(() => {
    if (shouldBypassAuth) {
      // Automatically redirect to dashboard for localhost development
      router.push('/dashboard' as any);
    }
  }, [shouldBypassAuth, router]);

  // Don't render the login form if we're bypassing auth
  if (shouldBypassAuth) {
    return (
      <div className="bg-white py-8 px-6 shadow rounded-lg sm:px-10">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <img
                src="/rexera-logo.svg"
                alt="Rexera Logo"
                className="h-12 w-auto"
              />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900">
              Development Mode
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Redirecting to dashboard...
            </p>
            <div className="mt-4 animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);

      // Force localhost redirect for development
      const redirectTo = process.env.NODE_ENV === 'development'
        ? `${window.location.origin}/auth/callback`
        : `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback`;

      // OAuth configuration prepared

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      });

      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      // Error handled by setting error state
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-gray-200/50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="mb-8 flex justify-center">
            <img
              src="/rexera-logo.svg"
              alt="Rexera Logo"
              className="h-10 w-auto"
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">
            Making Real Estate Effortless
          </h2>
          <p className="mt-3 text-sm text-gray-600">
            Sign in with your Google account to continue
          </p>
        </div>

        <div className="mt-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-lg shadow-sm bg-black text-base font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}