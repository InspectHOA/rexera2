'use client';

import { useAuth } from '@/lib/auth/provider';
import { redirect } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, loading } = useAuth();

  // Skip auth check in development for easier testing
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (loading && !isDevelopment) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user && !isDevelopment) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-sm">
      <div className="max-w-full m-0 p-2 min-h-screen w-screen">
        {children}
      </div>
    </div>
  );
}