'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/provider';
import { SKIP_AUTH } from '@/lib/auth/config';
import { toast } from '@/lib/hooks/use-toast';

interface UnifiedNotification {
  id: string;
  user_id: string;
  type: string;
  priority: string;
  title: string;
  message: string;
  action_url: string | null;
  metadata: any;
  read: boolean;
  read_at: string | null;
  created_at: string;
}

interface NotificationSettings {
  showPopupsForUrgent: boolean;
  showPopupsForHigh: boolean;
  showPopupsForNormal: boolean;
  showPopupsForLow: boolean;
  enableTaskInterrupts: boolean;
  enableWorkflowFailures: boolean;
  enableTaskCompletions: boolean;
  enableSlaWarnings: boolean;
}

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

export function useUnifiedNotifications() {
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<UnifiedNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);

  // Fetch notifications function
  const fetchNotifications = async () => {
    // Wait for auth to complete before fetching
    if (authLoading) {
      console.log('🔄 Auth still loading, waiting...');
      return;
    }
    
    if (!user) {
      console.log('❌ No user found, clearing notifications');
      setNotifications([]);
      setLoading(false);
      return;
    }

    console.log('🔍 Fetching notifications for user:', user.id, SKIP_AUTH ? '(using API endpoint)' : '(using Supabase client)');

    try {
      setError(null);
      
      if (SKIP_AUTH) {
        // Use API endpoint to bypass RLS in development
        const response = await fetch(`/api/notifications?user_id=${user.id}`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.error) {
          throw new Error(result.error);
        }
        
        console.log('✅ Notifications fetched via API:', result.notifications?.length || 0);
        setNotifications(result.notifications || []);
      } else {
        // Use direct Supabase client for production
        const { data, error: fetchError } = await supabase
          .from('hil_notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100);

        if (fetchError) {
          console.error('❌ Supabase fetch error:', fetchError);
          throw fetchError;
        }

        console.log('✅ Notifications fetched via Supabase:', data?.length || 0);
        setNotifications(data || []);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load notifications';
      console.error('❌ Notification fetch error:', err);
      setError(errorMessage);
      } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      if (SKIP_AUTH) {
        // Use API endpoint for skip_auth mode
        const response = await fetch(`/api/notifications/${notificationId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ read: true, read_at: new Date().toISOString() })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to mark as read: ${response.statusText}`);
        }
      } else {
        // Use Supabase client for production
        const { error } = await supabase
          .from('hil_notifications')
          .update({ 
            read: true, 
            read_at: new Date().toISOString() 
          })
          .eq('id', notificationId);

        if (error) {
          throw error;
        }
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true, read_at: new Date().toISOString() }
            : notif
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      
      if (unreadIds.length === 0) return;

      if (SKIP_AUTH) {
        // For now, mark all as read by calling markAsRead for each
        await Promise.all(unreadIds.map(id => markAsRead(id)));
        return;
      } else {
        const { error } = await supabase
          .from('hil_notifications')
          .update({ 
            read: true, 
            read_at: new Date().toISOString() 
          })
          .in('id', unreadIds);

        if (error) {
          throw error;
        }
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ 
          ...notif, 
          read: true, 
          read_at: new Date().toISOString() 
        }))
      );
    } catch (err) {
      }
  };

  // Dismiss notification (hide it permanently) - Currently disabled
  const dismissNotification = async (notificationId: string) => {
    try {
      // TODO: Implement when dismissed_at column is added to database
      console.log('Dismiss functionality disabled - database column missing');
      
      // For now, just mark as read
      await markAsRead(notificationId);
      
      // Optionally remove from local state for immediate UI feedback
      // setNotifications(prev => 
      //   prev.filter(notif => notif.id !== notificationId)
      // );
    } catch (err) {
      console.error('Error dismissing notification:', err);
    }
  };

  // Determine if notification should show popup
  const shouldShowPopup = (notification: UnifiedNotification): boolean => {
    // Check priority settings
    const priorityCheck = 
      (notification.priority === 'URGENT' && settings.showPopupsForUrgent) ||
      (notification.priority === 'HIGH' && settings.showPopupsForHigh) ||
      (notification.priority === 'NORMAL' && settings.showPopupsForNormal) ||
      (notification.priority === 'LOW' && settings.showPopupsForLow);

    if (!priorityCheck) return false;

    // Check type settings
    const typeCheck = 
      (notification.type === 'TASK_INTERRUPT' && settings.enableTaskInterrupts) ||
      (notification.type === 'WORKFLOW_UPDATE' && settings.enableWorkflowFailures) ||
      (notification.type === 'SLA_WARNING' && settings.enableSlaWarnings) ||
      (notification.type === 'AGENT_FAILURE' && settings.enableWorkflowFailures) ||
      (notification.type === 'HIL_MENTION') || // Always show mention notifications
      settings.enableTaskCompletions; // For task completions

    return typeCheck;
  };

  // Get toast variant based on priority
  const getToastVariant = (priority: string) => {
    switch (priority) {
      case 'URGENT':
      case 'HIGH':
        return 'destructive';
      default:
        return 'default';
    }
  };

  // Handle new notification
  const handleNewNotification = (notification: UnifiedNotification) => {
    // Add to state
    setNotifications(prev => [notification, ...prev]);

    // Show popup if settings allow
    if (shouldShowPopup(notification)) {
      toast({
        variant: getToastVariant(notification.priority),
        title: notification.title,
        description: notification.message,
      });
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [user, authLoading]);

  // Real-time subscription for new notifications (disabled in skip_auth mode)
  useEffect(() => {
    if (!user || SKIP_AUTH) return; // Skip real-time in development mode

    const subscription = supabase
      .channel('unified_notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'hil_notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        handleNewNotification(payload.new as UnifiedNotification);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'hil_notifications',
        filter: `user_id=eq.${user.id}`
      }, () => {
        // Refetch notifications when they're updated (e.g., marked as read)
        fetchNotifications();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, settings]);

  // Get unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Get interrupt notifications (for interrupt queue)
  const interruptNotifications = notifications.filter(notif => 
    notif.type === 'TASK_INTERRUPT' || notif.type === 'SLA_WARNING'
  );

  return {
    notifications,
    interruptNotifications,
    unreadCount,
    loading,
    error,
    settings,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    setSettings,
    refetch: fetchNotifications
  };
}