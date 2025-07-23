'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/lib/supabase/provider';
import { useAuth } from '@/lib/auth/provider';
import { api } from '@/lib/api';
import { toast } from '@/lib/hooks/use-toast';
import type { 
  UnifiedNotification, 
  NotificationSettings, 
  UseUnifiedNotificationsReturn,
  PriorityLevel 
} from '@rexera/shared';

const DEFAULT_SETTINGS: NotificationSettings = {
  showPopupsForUrgent: true,
  showPopupsForHigh: true,
  showPopupsForNormal: false,
  showPopupsForLow: false,
  enableTaskInterrupts: true,
  enableWorkflowFailures: true,
  enableTaskCompletions: false,
  enableSlaWarnings: true,
};

export function useUnifiedNotifications(): UseUnifiedNotificationsReturn {
  const { user, loading: authLoading } = useAuth();
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);

  // Fetch notifications using React Query
  const {
    data: notificationsData,
    isLoading: loading,
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => api.notifications.list({ limit: 100 }),
    enabled: !!user && !authLoading,
    staleTime: 30000, // 30 seconds
    retry: 2,
    retryDelay: 1000,
  });

  const notifications = notificationsData?.data || [];
  const unreadCount = notifications.filter((n: any) => !n.read).length;
  const error = queryError ? (queryError as Error).message : null;

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => api.notifications.markAsRead(notificationId),
    onSuccess: (data, notificationId) => {
      // Optimistically update the cache
      queryClient.setQueryData(['notifications', user?.id], (previousNotificationsResult: any) => {
        if (!previousNotificationsResult) return previousNotificationsResult;
        
        return {
          ...previousNotificationsResult,
          data: previousNotificationsResult.data.map((notification: UnifiedNotification) =>
            notification.id === notificationId ? { ...notification, read: true, read_at: new Date().toISOString() } : notification
          ),
        };
      });
      
      // Show toast for urgent/high priority notifications when marked as read
      const notification = notifications.find((n: any) => n.id === notificationId);
      if (notification && (notification.priority === 'URGENT' || notification.priority === 'HIGH')) {
        toast({
          title: 'Notification marked as read',
          description: notification.title,
        });
      }
    },
    onError: (error) => {
      console.error('Failed to mark notification as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        variant: 'destructive',
      });
    },
  });

  // Mark all notifications as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => api.notifications.markAllAsRead(),
    onSuccess: (data) => {
      // Update the cache to mark all notifications as read
      queryClient.setQueryData(['notifications', user?.id], (previousNotificationsResult: any) => {
        if (!previousNotificationsResult) return previousNotificationsResult;
        
        const now = new Date().toISOString();
        return {
          ...previousNotificationsResult,
          data: previousNotificationsResult.data.map((notification: UnifiedNotification) => ({
            ...notification,
            read: true,
            read_at: notification.read_at || now,
          })),
        };
      });
      
      toast({
        title: 'All notifications marked as read',
        description: `Marked ${data.updated_count} notifications as read`,
      });
    },
    onError: (error) => {
      console.error('Failed to mark all notifications as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark all notifications as read',
        variant: 'destructive',
      });
    },
  });

  // Show toast for new urgent/high priority notifications
  const showNotificationToast = useCallback((notification: UnifiedNotification) => {
    const shouldShow = 
      (notification.priority === 'URGENT' && settings.showPopupsForUrgent) ||
      (notification.priority === 'HIGH' && settings.showPopupsForHigh) ||
      (notification.priority === 'NORMAL' && settings.showPopupsForNormal) ||
      (notification.priority === 'LOW' && settings.showPopupsForLow);

    if (shouldShow && !notification.read) {
      toast({
        title: notification.title,
        description: notification.message,
        duration: notification.priority === 'URGENT' ? 0 : 5000, // Urgent notifications stay until dismissed
        variant: notification.priority === 'URGENT' ? 'destructive' : 'default',
      });
    }
  }, [settings]);

  // Set up real-time subscription for new notifications
  const setupRealtimeSubscription = useCallback(() => {
    if (!user || !supabase) return;

    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'hil_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as UnifiedNotification;
          
          // Add to cache
          queryClient.setQueryData(['notifications', user?.id], (oldData: any) => {
            if (!oldData) return { notifications: [newNotification] };
            
            return {
              ...oldData,
              notifications: [newNotification, ...oldData.notifications],
            };
          });
          
          // Show toast notification
          showNotificationToast(newNotification);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, supabase, queryClient, showNotificationToast]);

  // API functions
  const markAsRead = useCallback(async (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  }, [markAsReadMutation]);

  const markAllAsRead = useCallback(async () => {
    markAllAsReadMutation.mutate();
  }, [markAllAsReadMutation]);

  const dismissNotification = useCallback(async (notificationId: string) => {
    // For now, dismissing is the same as marking as read
    // In the future, we could add a separate "dismissed" field
    markAsReadMutation.mutate(notificationId);
  }, [markAsReadMutation]);

  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    // In a real app, we'd save these settings to the backend
  }, []);

  return {
    notifications,
    unreadCount,
    loading: loading || authLoading,
    error,
    settings,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    updateSettings,
  };
}