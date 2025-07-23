'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/provider';
import { useUnifiedNotifications } from '@/lib/hooks/use-unified-notifications';
import { Bell, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkflowCreationModal } from '@/app/workflow/_components/workflow-creation-modal';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { RexeraLogo } from '@/components/ui/rexera-logo';

export function DashboardHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, loading, signOut } = useAuth();
  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    markAsRead,
    markAllAsRead,
    dismissNotification
  } = useUnifiedNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);

  // Handle mounting for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown when clicking outside (with small delay to prevent immediate closing)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        // Add a small delay to prevent immediate closing when opening the tray
        setTimeout(() => {
          setShowNotifications(false);
        }, 100);
      }
    }

    if (showNotifications) {
      // Add a small delay before adding the event listener to prevent immediate triggers
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 200);
      
      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showNotifications]);

  // Get user display name from Google OAuth data or profile
  const getDisplayName = () => {
    // Show loading state instead of fallback "User" while auth is loading
    if (loading) {
      return '...';
    }

    if (profile?.full_name) {
      return profile.full_name;
    }
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.user_metadata?.name) {
      return user.user_metadata.name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  // Get user initials for avatar
  const getInitials = () => {
    const name = getDisplayName();
    
    // Handle loading state
    if (loading || name === '...') {
      return '•';
    }
    
    if (name === 'User' || name.includes('@')) {
      return user?.email?.charAt(0).toUpperCase() || 'U';
    }
    return name
      .split(' ')
      .map((word: string) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get user avatar URL from Google OAuth
  const getAvatarUrl = () => {
    return user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  };

  const handleSignOut = async () => {
    await signOut();
  };


  const handleNotificationClick = (notification: any) => {
    // Mark as read when clicked
    markAsRead(notification.id);
    
    // Navigate to action URL if available
    if (notification.action_url) {
      if (notification.action_url.startsWith('/')) {
        // Internal navigation
        router.push(notification.action_url);
      } else {
        // External URL
        window.open(notification.action_url, '_blank');
      }
      setShowNotifications(false);
    }
  };

  return (
    <>
      <header className="bg-background/80 backdrop-blur-sm p-4 mb-5 flex justify-between items-center shadow-2xl rounded-lg border border-border/50">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/dashboard' as any)}
            className="transition-opacity hover:opacity-80"
            title="Go to Dashboard"
          >
            <RexeraLogo className="h-8 w-auto" />
          </button>
          
          {/* Navigation breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <button 
              onClick={() => router.push('/dashboard' as any)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Workflows
            </button>
            {pathname !== '/dashboard' && (
              <>
                <span className="text-muted-foreground">/</span>
                <span className="text-foreground font-medium">
                  {pathname === '/notifications' ? 'Notifications' : 
                   pathname === '/sla-breaches' ? 'SLA Breaches' :
                   pathname.split('/')[1]?.charAt(0).toUpperCase() + 
                   pathname.split('/')[1]?.slice(1) || 'Page'}
                </span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3 text-sm relative">
        <Button
          onClick={() => setShowWorkflowModal(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium px-4 py-2 rounded-md transition-colors"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          Create Workflow
        </Button>
        {/* Notification Bell */}
        <div className="relative" ref={notificationRef}>
          <button
            ref={bellRef}
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
            title="View notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold shadow-sm">
                {unreadCount}
              </div>
            )}
          </button>
        </div>
        
        {/* Notification Dropdown - Rendered as Portal */}
        {showNotifications && mounted && createPortal(
          <div className="fixed inset-0 z-[10000]">
            <div 
              className="absolute right-4 top-20 w-80 bg-popover border border-border rounded-lg shadow-xl animate-in fade-in-0 slide-in-from-top-2 duration-200"
              style={{ 
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' 
              }}
              ref={notificationRef}
            >
              <div className="p-3 border-b border-border flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-popover-foreground">Notifications</h3>
                  <p className="text-xs text-muted-foreground">{notifications.length} notifications • {unreadCount} unread</p>
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-primary hover:text-primary/80"
                      title="Mark all as read"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-muted-foreground hover:text-foreground text-sm"
                    title="Close notifications"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notificationsLoading && notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">Loading...</div>
                ) : notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">No notifications</div>
                ) : (
                  notifications.slice(0, 10).map((notification) => (
                    <div 
                      key={notification.id} 
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-3 border-b border-border hover:bg-muted/50 cursor-pointer ${
                        !notification.read ? 'bg-primary/10' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                          !notification.read ? 'bg-primary' : 'bg-muted-foreground'
                        }`}></div>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            !notification.read ? 'text-foreground' : 'text-muted-foreground'
                          }`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            dismissNotification(notification.id);
                          }}
                          className="text-muted-foreground hover:text-foreground text-xs p-1 flex-shrink-0"
                          title="Dismiss notification"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {notifications.length > 10 && (
                <div className="p-3 border-t border-border text-center">
                  <button 
                    onClick={() => {
                      router.push('/notifications' as any);
                      setShowNotifications(false);
                    }}
                    className="text-sm text-primary hover:text-primary/80"
                  >
                    View all {notifications.length} notifications
                  </button>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
        
        <ThemeSwitcher />
        <span className="text-foreground">{getDisplayName()}</span>
        <button
          onClick={handleSignOut}
          title="Click to sign out"
          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold cursor-pointer transition-opacity hover:opacity-80 ${
            getAvatarUrl() 
              ? 'bg-transparent bg-cover bg-center' 
              : 'bg-gradient-to-br from-secondary to-primary'
          }`}
          style={getAvatarUrl() ? { backgroundImage: `url(${getAvatarUrl()})` } : undefined}
        >
          {!getAvatarUrl() && getInitials()}
        </button>
      </div>
    </header>
    
    <WorkflowCreationModal
      isOpen={showWorkflowModal}
      onClose={() => setShowWorkflowModal(false)}
      onSuccess={() => {
        setShowWorkflowModal(false);
        // Optionally refresh the page or show a success message
      }}
    />
    </>
  );
}