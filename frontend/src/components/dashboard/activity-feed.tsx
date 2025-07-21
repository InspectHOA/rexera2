'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

/**
 * Activity item representing an audit event in the feed
 * Maps audit event structure to display format
 */
interface ActivityItem {
  id: string;
  type: string;
  action: string;
  message: string;
  timestamp: string;
  actor_name?: string;
  actor_type: 'human' | 'agent' | 'system';
  workflow_id?: string;
  resource_type: string;
  event_data?: Record<string, any>;
}

/**
 * Props for activity feed configuration
 */
interface ActivityFeedProps {
  workflowId?: string; // If provided, show only activities for this workflow
  limit?: number; // Number of activities to show (default: 10)
  autoRefresh?: boolean; // Whether to auto-refresh (default: true)
  className?: string;
}

export function ActivityFeed({ 
  workflowId, 
  limit = 10, 
  autoRefresh = true,
  className = ""
}: ActivityFeedProps = {}) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch audit events from the API and transform them into activity items
   */
  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build API URL with query parameters
      const params = new URLSearchParams();
      if (workflowId) params.append('workflow_id', workflowId);
      params.append('per_page', limit.toString());
      params.append('page', '1');
      
      const response = await fetch(`/api/audit-events?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch activities: ${response.status}`);
      }

      const data = await response.json();
      const auditEvents = data.data || [];

      // Transform audit events into activity items
      const transformedActivities: ActivityItem[] = auditEvents.map((event: any) => ({
        id: event.id,
        type: event.event_type,
        action: event.action,
        message: formatActivityMessage(event),
        timestamp: event.created_at,
        actor_name: event.actor_name,
        actor_type: event.actor_type,
        workflow_id: event.workflow_id,
        resource_type: event.resource_type,
        event_data: event.event_data,
      }));

      setActivities(transformedActivities);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load activities';
      setError(errorMessage);
      console.error('Activities fetch failed:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Format an audit event into a human-readable message
   */
  const formatActivityMessage = (event: any): string => {
    const actorName = event.actor_name || event.actor_id;
    const resourceType = event.resource_type.replace('_', ' ');
    
    switch (event.event_type) {
      case 'workflow_management':
        return `${actorName} ${event.action}d a workflow`;
      
      case 'task_execution':
        if (event.actor_type === 'agent') {
          return `Agent ${actorName} ${event.action}d task`;
        }
        return `${actorName} ${event.action}d task execution`;
      
      case 'task_intervention':
        return `${actorName} ${event.action}d task (manual intervention)`;
      
      case 'sla_management':
        const slaData = event.event_data || {};
        if (slaData.new_value === 'BREACHED') {
          return `SLA breached for ${resourceType}`;
        }
        return `SLA status updated for ${resourceType}`;
      
      case 'user_authentication':
        return `${actorName} ${event.action === 'login' ? 'signed in' : 'signed out'}`;
      
      case 'document_management':
        return `${actorName} ${event.action}d document`;
      
      case 'communication':
        return `${actorName} ${event.action}d communication`;
      
      case 'system_operation':
        return `System ${event.action}d ${resourceType}`;
      
      default:
        return `${actorName} ${event.action}d ${resourceType}`;
    }
  };

  // Set up real-time subscription for audit events
  useEffect(() => {
    if (!autoRefresh) return;

    const subscription = supabase
      .channel('audit-events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_events',
          filter: workflowId ? `workflow_id=eq.${workflowId}` : undefined,
        },
        (payload: any) => {
          console.log('New audit event received:', payload);
          // Refresh activities when new audit events are created
          fetchActivities();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [workflowId, autoRefresh]);

  // Initial fetch and periodic refresh
  useEffect(() => {
    fetchActivities();

    if (autoRefresh) {
      const interval = setInterval(fetchActivities, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [workflowId, limit, autoRefresh]);

  /**
   * Get icon for activity based on event type and actor
   */
  const getActivityIcon = (activity: ActivityItem): string => {
    switch (activity.type) {
      case 'workflow_management':
        return activity.action === 'create' ? '🚀' : '📝';
      case 'task_execution':
        return activity.actor_type === 'agent' ? '🤖' : '✅';
      case 'task_intervention':
        return '👤';
      case 'sla_management':
        return '⏰';
      case 'user_authentication':
        return activity.action === 'login' ? '🔑' : '🚪';
      case 'document_management':
        return '📄';
      case 'communication':
        return '💬';
      case 'system_operation':
        return '⚙️';
      default:
        return '📝';
    }
  };

  /**
   * Get color class for activity based on event type and actor
   */
  const getActivityColor = (activity: ActivityItem): string => {
    switch (activity.type) {
      case 'workflow_management':
        return 'text-blue-600 dark:text-blue-400';
      case 'task_execution':
        return activity.actor_type === 'agent' ? 'text-purple-600 dark:text-purple-400' : 'text-green-600 dark:text-green-400';
      case 'task_intervention':
        return 'text-orange-600 dark:text-orange-400';
      case 'sla_management':
        return 'text-red-600 dark:text-red-400';
      case 'user_authentication':
        return 'text-indigo-600 dark:text-indigo-400';
      case 'document_management':
        return 'text-gray-600 dark:text-gray-400';
      case 'communication':
        return 'text-teal-600 dark:text-teal-400';
      case 'system_operation':
        return 'text-gray-500 dark:text-gray-500';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 shadow rounded-lg ${className}`}>
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
            {workflowId ? 'Workflow Activity' : 'Recent Activity'}
          </h3>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 shadow rounded-lg ${className}`}>
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
            {workflowId ? 'Workflow Activity' : 'Recent Activity'}
          </h3>
          <div className="text-center h-32 flex items-center justify-center">
            <div className="text-red-600 dark:text-red-400">
              <p className="text-sm font-medium">Unable to load activities</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{error}</p>
              <button 
                onClick={fetchActivities}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 shadow rounded-lg ${className}`}>
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            {workflowId ? 'Workflow Activity' : 'Recent Activity'}
          </h3>
          {autoRefresh && (
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
              Live
            </div>
          )}
        </div>
        
        {activities.length === 0 ? (
          <div className="text-center h-32 flex items-center justify-center">
            <div className="text-gray-500 dark:text-gray-400">
              <p className="text-sm">No recent activity</p>
              <p className="text-xs mt-1">Activity will appear here as actions are performed</p>
            </div>
          </div>
        ) : (
          <div className="flow-root">
            <ul className="-mb-8">
              {activities.map((activity, activityIdx) => (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {activityIdx !== activities.length - 1 ? (
                      <span
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-600"
                        aria-hidden="true"
                      />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm">
                          {getActivityIcon(activity)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className={`text-sm ${getActivityColor(activity)}`}>
                            {activity.message}
                          </p>
                          {activity.actor_name && activity.actor_type !== 'system' && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              by {activity.actor_name} ({activity.actor_type})
                            </p>
                          )}
                          {activity.workflow_id && !workflowId && (
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              Workflow: {activity.workflow_id.slice(0, 8)}...
                            </p>
                          )}
                        </div>
                        <div className="text-right text-xs whitespace-nowrap text-gray-500 dark:text-gray-400">
                          <div>{new Date(activity.timestamp).toLocaleTimeString()}</div>
                          <div className="text-xs opacity-75">
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {!workflowId && (
          <div className="mt-4">
            <button 
              onClick={() => window.location.href = '/audit-logs'}
              className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
            >
              View all activity
            </button>
          </div>
        )}
      </div>
    </div>
  );
}