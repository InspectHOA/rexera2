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

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8fafc', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontSize: '14px' }}>
      <div className="dashboard-container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px', minHeight: '100vh' }}>
        {children}
      </div>
    </div>
  );
}