'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/provider';
import { useInterrupts } from '@/lib/hooks/useInterrupts';
import { Bell } from 'lucide-react';

export function DashboardHeader() {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const { interrupts, loading: interruptsLoading } = useInterrupts();
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showNotifications]);

  // Get user display name from Google OAuth data or profile
  const getDisplayName = () => {
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

  const handleNotificationClick = (interrupt: any) => {
    setShowNotifications(false);
    // Navigate to workflow details page
    const workflowId = interrupt.workflow?.human_readable_id || interrupt.workflow_id;
    router.push(`/workflow/${workflowId}`);
  };

  return (
    <header className="bg-white border border-gray-200 p-3 mb-5 flex justify-between items-center shadow-sm">
      <div className="flex items-center gap-2">
        <img 
          src="https://rexera.com/wp-content/uploads/2025/03/Rexera_Logo.svg" 
          alt="Rexera Logo" 
          className="h-6 w-auto"
        />
      </div>
      
      <div className="flex items-center gap-3 text-sm relative">
        {/* Notification Bell */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
            title="View notifications"
          >
            <Bell className="w-5 h-5" />
            {interrupts.length > 0 && (
              <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold shadow-sm">
                {interrupts.length}
              </div>
            )}
          </button>
          
          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="p-3 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                <p className="text-xs text-gray-500">{interrupts.length} pending interrupts</p>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {interruptsLoading ? (
                  <div className="p-4 text-center text-gray-500">Loading...</div>
                ) : interrupts.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No pending notifications</div>
                ) : (
                  interrupts.slice(0, 5).map((interrupt) => (
                    <div 
                      key={interrupt.id} 
                      onClick={() => handleNotificationClick(interrupt)}
                      className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {interrupt.task_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} needs review
                          </p>
                          <p className="text-xs text-gray-500">
                            Workflow: {interrupt.workflow?.human_readable_id || interrupt.workflow_id}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(interrupt.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {interrupts.length > 5 && (
                <div className="p-3 border-t border-gray-200 text-center">
                  <button className="text-sm text-blue-600 hover:text-blue-800">
                    View all {interrupts.length} notifications
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        <span className="text-gray-700">{getDisplayName()}</span>
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
  );
}