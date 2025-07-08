'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/provider';

interface PersistentNotification {
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

export function usePersistentNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<PersistentNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications function
  const fetchNotifications = async () => {
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
      console.error('Persistent notifications fetch error:', err);
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
      console.error('Error marking notification as read:', err);
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
      console.error('Error marking all notifications as read:', err);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [user]);

  // Real-time subscription for new notifications
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('user_notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'hil_notifications',
        filter: `user_id=eq.${user.id}`
      }, () => {
        // Refetch notifications when new ones are inserted
        fetchNotifications();
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
  }, [user]);

  // Get unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications
  };
}