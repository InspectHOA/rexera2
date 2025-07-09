'use client';

import { notFound } from 'next/navigation';
import { EmailInterface } from '@/components/agents/mia/email-interface';
import { CounterpartySelector } from '@/components/agents/nina/counterparty-selector';
import { DocumentExtractor } from '@/components/agents/iris/document-extractor';

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

// Known agents - static params removed since this is a client component