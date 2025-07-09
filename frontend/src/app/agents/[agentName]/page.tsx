'use client';

import { notFound } from 'next/navigation';
import { EmailInterface } from '@/components/agents/mia/EmailInterface';
import { CounterpartySelector } from '@/components/agents/nina/CounterpartySelector';
import { DocumentExtractor } from '@/components/agents/iris/DocumentExtractor';

interface AgentPageProps {
  params: {
    agentName: string;
  };
  searchParams: {
    workflowId?: string;
  };
}

export default function AgentPage({ params, searchParams }: AgentPageProps) {
  const { agentName } = params;
  const { workflowId } = searchParams;

  // Route to appropriate agent interface
  switch (agentName.toLowerCase()) {
    case 'mia':
      return (
        <EmailInterface 
          agentId="mia" 
          workflowId={workflowId}
        />
      );
    
    case 'nina':
      return (
        <CounterpartySelector 
          agentId="nina" 
          workflowId={workflowId}
        />
      );
    
    case 'iris':
      return (
        <DocumentExtractor 
          agentId="iris" 
          workflowId={workflowId}
        />
      );
    
    default:
      notFound();
  }
}

// Generate static params for known agents
export function generateStaticParams() {
  return [
    { agentName: 'mia' },
    { agentName: 'nina' },
    { agentName: 'iris' }
  ];
}