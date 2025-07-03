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
    <div className="min-h-screen" style={{ backgroundColor: '#f8fafc', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontSize: '14px' }}>
      <div className="dashboard-container" style={{ maxWidth: '100%', margin: '0', padding: '24px 32px', minHeight: '100vh', width: '100vw' }}>
        {children}
      </div>
    </div>
  );
}