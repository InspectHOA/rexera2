/**
 * Nina - Research & Data Discovery Specialist
 * Handles contact research, data gathering, and information validation
 */

import type { 
  AgentTaskRequest, 
  AgentTaskResponse, 
  AgentExecutionContext 
} from '@rexera/types';
import { BaseAgentSDK } from '../agent-sdk';

export interface NinaCapabilities {
  contactResearch: (params: ContactResearchParams) => Promise<ContactResearchResult>;
  companyResearch: (params: CompanyResearchParams) => Promise<CompanyResearchResult>;
  propertyResearch: (params: PropertyResearchParams) => Promise<PropertyResearchResult>;
  dataValidation: (params: DataValidationParams) => Promise<DataValidationResult>;
}

export interface ContactResearchParams {
  targetName: string;
  organization?: string;
  location?: string;
  contactType: 'email' | 'phone' | 'both';
  sources?: string[];
}

export interface ContactResearchResult {
  contacts: Array<{
    type: 'email' | 'phone';
    value: string;
    confidence: number;
    source: string;
    verified: boolean;
  }>;
  additionalInfo?: {
    title?: string;
    department?: string;
    socialProfiles?: string[];
  };
}

export interface CompanyResearchParams {
  companyName: string;
  location?: string;
  industry?: string;
  researchDepth: 'basic' | 'detailed' | 'comprehensive';
}

export interface CompanyResearchResult {
  basicInfo: {
    legalName: string;
    address: string;
    phone?: string;
    website?: string;
    industry: string;
  };
  keyPersonnel?: Array<{
    name: string;
    title: string;
    contact?: string;
  }>;
  financialInfo?: {
    revenue?: string;
    employees?: number;
    yearEstablished?: number;
  };
}

export interface PropertyResearchParams {
  address: string;
  parcelNumber?: string;
  researchType: 'ownership' | 'liens' | 'history' | 'comprehensive';
}

export interface PropertyResearchResult {
  propertyDetails: {
    address: string;
    parcelNumber: string;
    legalDescription?: string;
    propertyType: string;
  };
  ownershipInfo: {
    currentOwner: string;
    ownerAddress?: string;
    acquisitionDate?: string;
    purchasePrice?: number;
  };
  liens?: Array<{
    type: string;
    amount: number;
    recordDate: string;
    description: string;
  }>;
}

export interface DataValidationParams {
  data: Record<string, any>;
  validationRules: Array<{
    field: string;
    type: 'required' | 'format' | 'range' | 'custom';
    rule: string;
  }>;
  crossReferences?: string[];
}

export interface DataValidationResult {
  isValid: boolean;
  validatedFields: Array<{
    field: string;
    status: 'valid' | 'invalid' | 'warning';
    message?: string;
    confidence: number;
  }>;
  suggestions?: string[];
}

export class NinaAgent extends BaseAgentSDK implements NinaCapabilities {
  constructor() {
    super({
      userAgent: 'Rexera-Nina-Agent/1.0.0',
    });
  }

  async contactResearch(params: ContactResearchParams): Promise<ContactResearchResult> {
    const request: AgentTaskRequest = {
      agent_type: 'nina',
      task_id: crypto.randomUUID(),
      workflow_id: crypto.randomUUID(),
      task_type: 'contact_research',
      complexity: 'moderate',
      input_data: params,
      context: {},
      priority: 'normal',
    };

    const response = await this.executeTask('nina', request);
    return response.result_data as ContactResearchResult;
  }

  async companyResearch(params: CompanyResearchParams): Promise<CompanyResearchResult> {
    const request: AgentTaskRequest = {
      agent_type: 'nina',
      task_id: crypto.randomUUID(),
      workflow_id: crypto.randomUUID(),
      task_type: 'company_research',
      complexity: params.researchDepth === 'basic' ? 'simple' : 'complex',
      input_data: params,
      context: {},
      priority: 'normal',
    };

    const response = await this.executeTask('nina', request);
    return response.result_data as CompanyResearchResult;
  }

  async propertyResearch(params: PropertyResearchParams): Promise<PropertyResearchResult> {
    const request: AgentTaskRequest = {
      agent_type: 'nina',
      task_id: crypto.randomUUID(),
      workflow_id: crypto.randomUUID(),
      task_type: 'property_research',
      complexity: 'moderate',
      input_data: params,
      context: {},
      priority: 'normal',
    };

    const response = await this.executeTask('nina', request);
    return response.result_data as PropertyResearchResult;
  }

  async dataValidation(params: DataValidationParams): Promise<DataValidationResult> {
    const request: AgentTaskRequest = {
      agent_type: 'nina',
      task_id: crypto.randomUUID(),
      workflow_id: crypto.randomUUID(),
      task_type: 'data_validation',
      complexity: 'simple',
      input_data: params,
      context: {},
      priority: 'normal',
    };

    const response = await this.executeTask('nina', request);
    return response.result_data as DataValidationResult;
  }
}

// Export singleton instance
export const nina = new NinaAgent();