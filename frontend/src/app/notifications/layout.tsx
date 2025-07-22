'use client';

import { useAuth } from '@/lib/auth/provider';
import { SKIP_AUTH } from '@/lib/auth/config';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  // Handle authentication redirect - same as dashboard
  useEffect(() => {
    if (!loading && !user && !SKIP_AUTH) {
      console.log('🔒 No authenticated user, redirecting to login');
      router.push('/auth/login' as any);
    }
  }, [loading, user, router]);

  // Show loading spinner while auth is being determined (only in SSO mode)
  if (loading && !SKIP_AUTH) {
    console.log('🔄 Notifications waiting for auth determination...');
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Show loading while redirecting to login
  if (!user && !SKIP_AUTH && !loading) {
    console.log('🔄 Redirecting to login...');
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  console.log('✅ Notifications page rendering for user:', user?.email || 'no user');

  return (
    <div className="min-h-screen bg-rexera-gradient relative overflow-hidden font-sans text-sm">
      <div className="absolute inset-0 z-0 bg-noise-texture opacity-20"></div>
      <div className="relative z-10 max-w-full m-0 p-2 min-h-screen w-screen">
        {children}
      </div>
    </div>
  );
}