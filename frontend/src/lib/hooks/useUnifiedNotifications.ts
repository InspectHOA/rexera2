'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/provider';
import { toast } from '@/hooks/useToast';

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
      return;
    }
    
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      // Get notifications from today (24 hours ago)
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error: fetchError } = await supabase
        .from('hil_notifications')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) {
        throw fetchError;
      }

      setNotifications(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load notifications';
      setError(errorMessage);
      } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
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

      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true, read_at: new Date().toISOString() }
            : notif
        )
      );
    } catch (err) {
      }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      
      if (unreadIds.length === 0) return;

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

  // Real-time subscription for new notifications
  useEffect(() => {
    if (!user) return;

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
    setSettings,
    refetch: fetchNotifications
  };
}