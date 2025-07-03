'use client';

import { useState } from 'react';

interface ActivityItem {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  user?: string;
  workflow_id?: string;
}

export function ActivityFeed() {
  const [activities] = useState<ActivityItem[]>([
    {
      id: '1',
      type: 'workflow_started',
      message: 'New municipal lien search workflow created',
      timestamp: '2024-01-15T12:30:00Z',
      workflow_id: 'wf_123'
    },
    {
      id: '2',
      type: 'agent_completed',
      message: 'Nina completed property research task',
      timestamp: '2024-01-15T12:15:00Z',
      workflow_id: 'wf_456'
    },
    {
      id: '3',
      type: 'hil_intervention',
      message: 'HIL review requested for document verification',
      timestamp: '2024-01-15T11:45:00Z',
      user: 'Sarah Johnson',
      workflow_id: 'wf_789'
    },
    {
      id: '4',
      type: 'workflow_completed',
      message: 'HOA acquisition workflow completed successfully',
      timestamp: '2024-01-15T11:30:00Z',
      workflow_id: 'wf_321'
    }
  ]);

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

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Recent Activity
        </h3>
        
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
        
        <div className="mt-4">
          <button className="w-full text-center text-sm text-blue-600 hover:text-blue-500">
            View all activity
          </button>
        </div>
      </div>
    </div>
  );
}