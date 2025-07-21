'use client';

import { useUnifiedNotifications } from '@/lib/hooks/use-unified-notifications';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  // Initialize unified notification system
  useUnifiedNotifications();
  
  return <>{children}</>;
}