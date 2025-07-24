'use client';

import { notFound } from 'next/navigation';
import { EmailInterface } from '@/app/agents/_components/mia/email-interface';
import { CounterpartySelector } from '@/app/agents/_components/nina/counterparty-selector';
import { DocumentExtractor } from '@/app/agents/_components/iris/document-extractor';
import { ChatInterface } from '@/app/agents/_components/ria/chat-interface';

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
    
    case 'ria':
      return (
        <ChatInterface 
          agentId="ria" 
          workflowId={workflowId}
        />
      );
    
    default:
      notFound();
  }
}

// Known agents - static params removed since this is a client component