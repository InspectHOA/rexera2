'use client';

import { useNotifications } from '@/lib/hooks/useNotifications';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  // Initialize global notifications
  useNotifications();
  
  return <>{children}</>;
}