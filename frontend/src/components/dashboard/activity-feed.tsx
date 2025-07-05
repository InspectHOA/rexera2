'use client';

import { useState, useEffect } from 'react';

interface ActivityItem {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  user?: string;
  workflow_id?: string;
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use tRPC endpoint instead of REST
        const response = await fetch('/api/trpc/activities.list', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            json: { limit: 15 }
          })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch activities: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setActivities(data.result?.data?.activities || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load activities';
        setError(errorMessage);
        console.error('Activity feed error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'workflow_started':
        return '🚀';
      case 'agent_completed':
        return '✅';
      case 'hil_intervention':
        return '👤';
      case 'workflow_completed':
        return '🎉';
      default:
        return '📝';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'workflow_started':
        return 'text-blue-600';
      case 'agent_completed':
        return 'text-green-600';
      case 'hil_intervention':
        return 'text-yellow-600';
      case 'workflow_completed':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Recent Activity
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
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Recent Activity
          </h3>
          <div className="text-center h-32 flex items-center justify-center">
            <div className="text-red-600">
              <p className="text-sm font-medium">Unable to load activities</p>
              <p className="text-xs text-gray-500 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Recent Activity
        </h3>
        
        {activities.length === 0 ? (
          <div className="text-center h-32 flex items-center justify-center">
            <div className="text-gray-500">
              <p className="text-sm">No recent activity</p>
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
                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    />
                  ) : null}
                  <div className="relative flex space-x-3">
                    <div>
                      <span className="h-8 w-8 rounded-full flex items-center justify-center text-sm">
                        {getActivityIcon(activity.type)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className={`text-sm ${getActivityColor(activity.type)}`}>
                          {activity.message}
                        </p>
                        {activity.user && (
                          <p className="text-xs text-gray-500">
                            by {activity.user}
                          </p>
                        )}
                        {activity.workflow_id && (
                          <p className="text-xs text-gray-400">
                            {activity.workflow_id}
                          </p>
                        )}
                      </div>
                      <div className="text-right text-xs whitespace-nowrap text-gray-500">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="mt-4">
          <button className="w-full text-center text-sm text-blue-600 hover:text-blue-500">
            View all activity
          </button>
        </div>
      </div>
    </div>
  );
}