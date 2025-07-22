/**
 * Individual notification table row component
 */

import { useRouter } from 'next/navigation';
import { useUnifiedNotifications } from '@/lib/hooks/use-unified-notifications';

interface NotificationRowProps {
  notification: {
    id: string;
    type: string;
    priority: string;
    title: string;
    message: string;
    action_url: string | null;
    read: boolean;
    read_at: string | null;
    created_at: string;
    metadata?: any;
  };
  isEven: boolean;
}

export function NotificationRow({ notification, isEven }: NotificationRowProps) {
  const router = useRouter();
  const { markAsRead } = useUnifiedNotifications();

  const handleRowClick = async () => {
    // Mark as read if unread
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navigate to action URL if available
    if (notification.action_url) {
      if (notification.action_url.startsWith('/')) {
        // Internal navigation
        router.push(notification.action_url as any);
      } else {
        // External URL
        window.open(notification.action_url, '_blank');
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'NORMAL': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'LOW': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'TASK_INTERRUPT': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'SLA_WARNING': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'WORKFLOW_UPDATE': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'AGENT_FAILURE': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'HIL_MENTION': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <tr 
      onClick={handleRowClick}
      className={`hover:bg-muted/50 cursor-pointer transition-colors border-b border-border/50 ${
        isEven ? 'bg-background' : 'bg-muted/20'
      } ${!notification.read ? 'font-medium' : 'opacity-75'}`}
    >
      {/* Read Status Indicator */}
      <td className="px-4 py-3 w-4">
        <div className={`w-2 h-2 rounded-full ${
          notification.read ? 'bg-muted-foreground' : 'bg-primary'
        }`}></div>
      </td>

      {/* Priority */}
      <td className="px-3 py-3 w-20">
        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getPriorityColor(notification.priority)}`}>
          {notification.priority}
        </span>
      </td>

      {/* Type */}
      <td className="px-3 py-3 w-32">
        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getTypeColor(notification.type)}`}>
          {notification.type.replace('_', ' ')}
        </span>
      </td>

      {/* Title & Message */}
      <td className="px-3 py-3 max-w-0">
        <div className="truncate">
          <div className="text-sm font-medium text-foreground truncate">
            {notification.title}
          </div>
          <div className="text-xs text-muted-foreground mt-1 truncate">
            {notification.message}
          </div>
        </div>
      </td>

      {/* Workflow Info */}
      <td className="px-3 py-3 text-xs text-muted-foreground w-32">
        {notification.metadata?.workflow_id ? (
          <span className="font-mono">
            {notification.metadata.workflow_id.slice(0, 8)}...
          </span>
        ) : (
          '—'
        )}
      </td>

      {/* Created */}
      <td className="px-3 py-3 text-xs text-muted-foreground w-24">
        {formatDate(notification.created_at)}
      </td>

      {/* Read Status */}
      <td className="px-3 py-3 text-xs w-16">
        {notification.read ? (
          <span className="text-muted-foreground">Read</span>
        ) : (
          <span className="text-primary font-medium">Unread</span>
        )}
      </td>
    </tr>
  );
}