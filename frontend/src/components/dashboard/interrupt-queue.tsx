'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, User, ArrowRight } from 'lucide-react';

interface InterruptItem {
  id: string;
  workflow_id: string;
  task_title: string;
  interrupt_reason: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  created_at: string;
  workflow_type: string;
}

export function InterruptQueue() {
  const [interrupts, setInterrupts] = useState<InterruptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInterrupts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use tRPC endpoint instead of REST
        const response = await fetch('/api/trpc/interrupts.list', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            json: { limit: 10 }
          })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch interrupts: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setInterrupts(data.result?.data?.interrupts || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load interrupt queue';
        setError(errorMessage);
        console.error('Interrupt queue error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInterrupts();
    
    // Set up polling for real-time updates
    const interval = setInterval(fetchInterrupts, 15000); // Poll every 15 seconds
    
    return () => clearInterval(interval);
  }, []);

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-50 border-red-200 text-red-800';
      case 'HIGH': return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'NORMAL': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'HIGH': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default: return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">HIL Interrupt Queue</h2>
                <p className="text-sm text-gray-500">Tasks requiring human review</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">HIL Interrupt Queue</h2>
                <p className="text-sm text-gray-500">Tasks requiring human review</p>
              </div>
            </div>
          </div>
          <div className="text-center h-32 flex items-center justify-center">
            <div className="text-red-600">
              <p className="text-sm font-medium">Unable to load interrupt queue</p>
              <p className="text-xs text-gray-500 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">HIL Interrupt Queue</h2>
              <p className="text-sm text-gray-500">Tasks requiring human review</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
              {interrupts.length} pending
            </span>
          </div>
        </div>
        
        <div className="space-y-4">
          {interrupts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="h-8 w-8 mx-auto text-gray-300 mb-2" />
              <p>No pending interrupts</p>
            </div>
          ) : (
            interrupts.map((interrupt) => (
              <div key={interrupt.id} className={`border-2 rounded-lg p-4 hover:shadow-md transition-all ${getPriorityStyle(interrupt.priority)}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    {getPriorityIcon(interrupt.priority)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{interrupt.task_title}</h3>
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                          {interrupt.workflow_type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{interrupt.interrupt_reason}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {interrupt.workflow_id}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {getTimeAgo(interrupt.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
                      <User className="h-4 w-4" />
                      Take Action
                    </button>
                    <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                      Assign to Team
                    </button>
                  </div>
                  <button className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
                    View Workflow
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}