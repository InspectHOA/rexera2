'use client';

import { ReactNode } from 'react';

interface AgentLayoutProps {
  agentName: string;
  agentDescription: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function AgentLayout({ 
  agentName, 
  agentDescription, 
  children, 
  actions 
}: AgentLayoutProps) {
  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Agent Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{agentName}</h1>
            <p className="text-sm text-gray-600 mt-1">{agentDescription}</p>
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* Agent Interface Content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}