/**
 * Agent Type Definitions and Capabilities
 * Defines the specializations and capabilities of each AI agent
 */

import type { AgentType } from '@rexera/types';

export interface AgentCapability {
  name: string;
  description: string;
  complexity: 'simple' | 'moderate' | 'complex';
  estimatedCostCents: number;
  averageExecutionTimeMs: number;
}

export interface AgentSpecialization {
  agentType: AgentType;
  name: string;
  emoji: string;
  description: string;
  primaryRole: string;
  capabilities: AgentCapability[];
  workflowTypes: string[];
  dependencies: AgentType[];
  collaborators: AgentType[];
}

export const AGENT_SPECIALIZATIONS: Record<AgentType, AgentSpecialization> = {
  nina: {
    agentType: 'nina',
    name: 'Nina',
    emoji: '🔍',
    description: 'Research & Data Discovery Specialist',
    primaryRole: 'Contact research, data gathering, and information validation',
    capabilities: [
      {
        name: 'contact_research',
        description: 'Find contact information for individuals and organizations',
        complexity: 'moderate',
        estimatedCostCents: 50,
        averageExecutionTimeMs: 15000,
      },
      {
        name: 'company_research',
        description: 'Research company information, structure, and key personnel',
        complexity: 'complex',
        estimatedCostCents: 75,
        averageExecutionTimeMs: 25000,
      },
      {
        name: 'property_research',
        description: 'Gather property details, ownership, and public records',
        complexity: 'moderate',
        estimatedCostCents: 60,
        averageExecutionTimeMs: 20000,
      },
      {
        name: 'data_validation',
        description: 'Validate and cross-reference collected information',
        complexity: 'simple',
        estimatedCostCents: 25,
        averageExecutionTimeMs: 8000,
      },
    ],
    workflowTypes: ['municipal_lien_search', 'hoa_acquisition', 'payoff_request'],
    dependencies: [],
    collaborators: ['iris', 'cassy', 'rex'],
  },

  mia: {
    agentType: 'mia',
    name: 'Mia',
    emoji: '📧',
    description: 'Email Communication Specialist',
    primaryRole: 'Automated email composition, sending, and follow-up management',
    capabilities: [
      {
        name: 'email_composition',
        description: 'Compose professional emails based on context and templates',
        complexity: 'moderate',
        estimatedCostCents: 40,
        averageExecutionTimeMs: 10000,
      },
      {
        name: 'email_sending',
        description: 'Send emails with proper formatting and attachments',
        complexity: 'simple',
        estimatedCostCents: 15,
        averageExecutionTimeMs: 5000,
      },
      {
        name: 'follow_up_scheduling',
        description: 'Schedule and manage email follow-up sequences',
        complexity: 'moderate',
        estimatedCostCents: 30,
        averageExecutionTimeMs: 8000,
      },
      {
        name: 'response_parsing',
        description: 'Parse and extract key information from email responses',
        complexity: 'moderate',
        estimatedCostCents: 35,
        averageExecutionTimeMs: 12000,
      },
    ],
    workflowTypes: ['municipal_lien_search', 'hoa_acquisition', 'payoff_request'],
    dependencies: ['nina'],
    collaborators: ['florian', 'ria'],
  },

  florian: {
    agentType: 'florian',
    name: 'Florian',
    emoji: '🗣️',
    description: 'Phone Outreach Specialist',
    primaryRole: 'Voice calls, phone interactions, and verbal communication',
    capabilities: [
      {
        name: 'phone_calling',
        description: 'Make outbound phone calls with natural conversation',
        complexity: 'complex',
        estimatedCostCents: 120,
        averageExecutionTimeMs: 180000,
      },
      {
        name: 'voicemail_handling',
        description: 'Leave professional voicemails and handle responses',
        complexity: 'moderate',
        estimatedCostCents: 45,
        averageExecutionTimeMs: 30000,
      },
      {
        name: 'call_scheduling',
        description: 'Schedule callback appointments and meetings',
        complexity: 'simple',
        estimatedCostCents: 25,
        averageExecutionTimeMs: 8000,
      },
      {
        name: 'conversation_transcription',
        description: 'Transcribe and summarize phone conversations',
        complexity: 'moderate',
        estimatedCostCents: 40,
        averageExecutionTimeMs: 15000,
      },
    ],
    workflowTypes: ['municipal_lien_search', 'hoa_acquisition', 'payoff_request'],
    dependencies: ['nina', 'mia'],
    collaborators: ['max', 'ria'],
  },

  rex: {
    agentType: 'rex',
    name: 'Rex',
    emoji: '🌐',
    description: 'Web Portal Navigation Specialist',
    primaryRole: 'Automated portal access, form filling, and document retrieval',
    capabilities: [
      {
        name: 'portal_login',
        description: 'Access secured web portals with authentication',
        complexity: 'moderate',
        estimatedCostCents: 45,
        averageExecutionTimeMs: 15000,
      },
      {
        name: 'form_completion',
        description: 'Fill out complex web forms accurately',
        complexity: 'moderate',
        estimatedCostCents: 55,
        averageExecutionTimeMs: 20000,
      },
      {
        name: 'document_download',
        description: 'Locate and download documents from portals',
        complexity: 'simple',
        estimatedCostCents: 30,
        averageExecutionTimeMs: 10000,
      },
      {
        name: 'search_execution',
        description: 'Execute complex searches within portal systems',
        complexity: 'complex',
        estimatedCostCents: 80,
        averageExecutionTimeMs: 35000,
      },
    ],
    workflowTypes: ['municipal_lien_search', 'hoa_acquisition'],
    dependencies: ['nina'],
    collaborators: ['iris', 'cassy'],
  },

  iris: {
    agentType: 'iris',
    name: 'Iris',
    emoji: '📄',
    description: 'Document Processing Specialist',
    primaryRole: 'OCR, document extraction, and data analysis',
    capabilities: [
      {
        name: 'ocr_processing',
        description: 'Extract text from images and scanned documents',
        complexity: 'moderate',
        estimatedCostCents: 35,
        averageExecutionTimeMs: 12000,
      },
      {
        name: 'data_extraction',
        description: 'Extract structured data from documents',
        complexity: 'complex',
        estimatedCostCents: 70,
        averageExecutionTimeMs: 25000,
      },
      {
        name: 'document_classification',
        description: 'Classify and categorize document types',
        complexity: 'moderate',
        estimatedCostCents: 40,
        averageExecutionTimeMs: 10000,
      },
      {
        name: 'content_analysis',
        description: 'Analyze document content for key information',
        complexity: 'complex',
        estimatedCostCents: 85,
        averageExecutionTimeMs: 30000,
      },
    ],
    workflowTypes: ['municipal_lien_search', 'hoa_acquisition', 'payoff_request'],
    dependencies: ['rex'],
    collaborators: ['nina', 'cassy', 'corey'],
  },

  ria: {
    agentType: 'ria',
    name: 'Ria',
    emoji: '👩‍💼',
    description: 'Client Communication Specialist',
    primaryRole: 'Client relationship management and status updates',
    capabilities: [
      {
        name: 'client_updates',
        description: 'Send professional status updates to clients',
        complexity: 'simple',
        estimatedCostCents: 25,
        averageExecutionTimeMs: 8000,
      },
      {
        name: 'escalation_handling',
        description: 'Handle client escalations and urgent requests',
        complexity: 'moderate',
        estimatedCostCents: 60,
        averageExecutionTimeMs: 20000,
      },
      {
        name: 'report_generation',
        description: 'Generate comprehensive workflow reports',
        complexity: 'moderate',
        estimatedCostCents: 45,
        averageExecutionTimeMs: 15000,
      },
      {
        name: 'relationship_management',
        description: 'Maintain client relationships and satisfaction',
        complexity: 'complex',
        estimatedCostCents: 90,
        averageExecutionTimeMs: 35000,
      },
    ],
    workflowTypes: ['municipal_lien_search', 'hoa_acquisition', 'payoff_request'],
    dependencies: [],
    collaborators: ['mia', 'florian', 'kosha'],
  },

  kosha: {
    agentType: 'kosha',
    name: 'Kosha',
    emoji: '💰',
    description: 'Financial Tracking Specialist',
    primaryRole: 'Cost tracking, billing automation, and financial reporting',
    capabilities: [
      {
        name: 'cost_tracking',
        description: 'Track workflow costs and resource usage',
        complexity: 'simple',
        estimatedCostCents: 20,
        averageExecutionTimeMs: 5000,
      },
      {
        name: 'billing_automation',
        description: 'Generate invoices and billing statements',
        complexity: 'moderate',
        estimatedCostCents: 40,
        averageExecutionTimeMs: 12000,
      },
      {
        name: 'expense_analysis',
        description: 'Analyze expenses and identify cost optimization',
        complexity: 'complex',
        estimatedCostCents: 75,
        averageExecutionTimeMs: 25000,
      },
      {
        name: 'financial_reporting',
        description: 'Generate financial reports and dashboards',
        complexity: 'moderate',
        estimatedCostCents: 50,
        averageExecutionTimeMs: 18000,
      },
    ],
    workflowTypes: ['municipal_lien_search', 'hoa_acquisition', 'payoff_request'],
    dependencies: [],
    collaborators: ['ria', 'cassy'],
  },

  cassy: {
    agentType: 'cassy',
    name: 'Cassy',
    emoji: '✓',
    description: 'Quality Assurance Specialist',
    primaryRole: 'Data validation, quality control, and accuracy verification',
    capabilities: [
      {
        name: 'data_validation',
        description: 'Validate accuracy of collected data',
        complexity: 'moderate',
        estimatedCostCents: 35,
        averageExecutionTimeMs: 10000,
      },
      {
        name: 'quality_scoring',
        description: 'Score workflow quality and completeness',
        complexity: 'simple',
        estimatedCostCents: 20,
        averageExecutionTimeMs: 6000,
      },
      {
        name: 'error_detection',
        description: 'Detect and flag potential errors or inconsistencies',
        complexity: 'complex',
        estimatedCostCents: 65,
        averageExecutionTimeMs: 20000,
      },
      {
        name: 'compliance_checking',
        description: 'Verify compliance with regulations and standards',
        complexity: 'complex',
        estimatedCostCents: 80,
        averageExecutionTimeMs: 28000,
      },
    ],
    workflowTypes: ['municipal_lien_search', 'hoa_acquisition', 'payoff_request'],
    dependencies: [],
    collaborators: ['nina', 'iris', 'rex', 'kosha'],
  },

  max: {
    agentType: 'max',
    name: 'Max',
    emoji: '📞',
    description: 'IVR Navigation Specialist',
    primaryRole: 'Automated phone system navigation and menu traversal',
    capabilities: [
      {
        name: 'ivr_navigation',
        description: 'Navigate complex phone menu systems',
        complexity: 'moderate',
        estimatedCostCents: 45,
        averageExecutionTimeMs: 120000,
      },
      {
        name: 'queue_management',
        description: 'Handle phone queues and wait times',
        complexity: 'simple',
        estimatedCostCents: 25,
        averageExecutionTimeMs: 60000,
      },
      {
        name: 'dtmf_interaction',
        description: 'Input touch-tone responses to automated systems',
        complexity: 'simple',
        estimatedCostCents: 15,
        averageExecutionTimeMs: 5000,
      },
      {
        name: 'transfer_handling',
        description: 'Handle call transfers and departmental routing',
        complexity: 'moderate',
        estimatedCostCents: 35,
        averageExecutionTimeMs: 30000,
      },
    ],
    workflowTypes: ['municipal_lien_search', 'payoff_request'],
    dependencies: ['nina'],
    collaborators: ['florian'],
  },

  corey: {
    agentType: 'corey',
    name: 'Corey',
    emoji: '🏢',
    description: 'HOA Specialist',
    primaryRole: 'HOA-specific document analysis and processing',
    capabilities: [
      {
        name: 'hoa_document_analysis',
        description: 'Analyze HOA documents for key information',
        complexity: 'complex',
        estimatedCostCents: 95,
        averageExecutionTimeMs: 40000,
      },
      {
        name: 'bylaws_interpretation',
        description: 'Interpret HOA bylaws and regulations',
        complexity: 'complex',
        estimatedCostCents: 110,
        averageExecutionTimeMs: 45000,
      },
      {
        name: 'financial_statement_review',
        description: 'Review HOA financial statements and budgets',
        complexity: 'complex',
        estimatedCostCents: 85,
        averageExecutionTimeMs: 35000,
      },
      {
        name: 'compliance_assessment',
        description: 'Assess HOA compliance with state regulations',
        complexity: 'complex',
        estimatedCostCents: 120,
        averageExecutionTimeMs: 50000,
      },
    ],
    workflowTypes: ['hoa_acquisition'],
    dependencies: ['iris'],
    collaborators: ['cassy', 'ria'],
  },
};

/**
 * Get agent capabilities by workflow type
 */
export function getAgentCapabilitiesForWorkflow(workflowType: string): AgentSpecialization[] {
  return Object.values(AGENT_SPECIALIZATIONS).filter(agent =>
    agent.workflowTypes.includes(workflowType)
  );
}

/**
 * Get estimated cost for agent capability
 */
export function getEstimatedCost(agentType: AgentType, capabilityName: string): number {
  const agent = AGENT_SPECIALIZATIONS[agentType];
  const capability = agent.capabilities.find(cap => cap.name === capabilityName);
  return capability?.estimatedCostCents || 50;
}

/**
 * Get estimated execution time for agent capability
 */
export function getEstimatedExecutionTime(agentType: AgentType, capabilityName: string): number {
  const agent = AGENT_SPECIALIZATIONS[agentType];
  const capability = agent.capabilities.find(cap => cap.name === capabilityName);
  return capability?.averageExecutionTimeMs || 15000;
}

/**
 * Get agent dependencies
 */
export function getAgentDependencies(agentType: AgentType): AgentType[] {
  return AGENT_SPECIALIZATIONS[agentType].dependencies;
}

/**
 * Get agent collaborators
 */
export function getAgentCollaborators(agentType: AgentType): AgentType[] {
  return AGENT_SPECIALIZATIONS[agentType].collaborators;
}