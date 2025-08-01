'use client';

import { useState, useEffect } from 'react';
import { agentsApi } from '@/lib/api/client';
import type { Agent, AgentListResponse } from '@/types/api';

// Map Agent status to display status
function normalizeStatus(status: Agent['status']): 'online' | 'offline' | 'busy' | 'error' {
  switch (status) {
    case 'ONLINE': return 'online';
    case 'BUSY': return 'busy'; 
    case 'OFFLINE': return 'offline';
    case 'ERROR': return 'error';
    default: return 'offline';
  }
}

export function AgentStatus() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use API client for agents
        const response = await agentsApi.list({ is_active: true, limit: 20 }) as AgentListResponse;
        setAgents(response.data || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load agent status';
        setError(errorMessage);
        console.warn('Agents fetch failed, showing empty state:', errorMessage);
        setAgents([]); // Show empty state instead of error for non-critical component
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
    
    // Set up polling for real-time updates
    const interval = setInterval(fetchAgents, 30000); // Poll every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800';
      case 'busy': return 'bg-yellow-100 text-yellow-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-400';
      case 'busy': return 'bg-yellow-400';
      case 'offline': return 'bg-gray-400';
      case 'error': return 'bg-red-400';
      default: return 'bg-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            AI Agent Status
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
            AI Agent Status
          </h3>
          <div className="text-center h-32 flex items-center justify-center">
            <div className="text-red-600">
              <p className="text-sm font-medium">Unable to load agent status</p>
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
          AI Agent Status
        </h3>
        
        {agents.length === 0 ? (
          <div className="text-center h-32 flex items-center justify-center">
            <div className="text-gray-500">
              <p className="text-sm">No agents available</p>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {agents.map((agent) => (
            <div key={agent.name} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <span className={`h-2 w-2 rounded-full ${getStatusDot(normalizeStatus(agent.status))}`}></span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{agent.name}</p>
                  <p className="text-xs text-gray-500">{agent.type}</p>
                </div>
              </div>
              
              <div className="text-right">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(normalizeStatus(agent.status))}`}>
                  {normalizeStatus(agent.status)}
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  {agent.current_tasks || 0}/{agent.max_tasks || 0} tasks
                </p>
              </div>
            </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">System Load</span>
                <span className="font-medium text-gray-900">
                  {agents.reduce((sum, agent) => sum + (agent.current_tasks || 0), 0)} / {agents.reduce((sum, agent) => sum + (agent.max_tasks || 0), 0)} tasks
                </span>
              </div>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ 
                    width: `${Math.min((agents.reduce((sum, agent) => sum + (agent.current_tasks || 0), 0) / Math.max(agents.reduce((sum, agent) => sum + (agent.max_tasks || 0), 0), 1)) * 100, 100)}%` 
                  }}
                ></div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}