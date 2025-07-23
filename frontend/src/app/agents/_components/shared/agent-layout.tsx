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
    <div className="h-full flex flex-col bg-background">
      {/* Agent Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{agentName}</h1>
            <p className="text-sm text-muted-foreground mt-1">{agentDescription}</p>
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* Agent Interface Content */}
      <div className="flex-1 overflow-hidden bg-background">
        {children}
      </div>
    </div>
  );
}