/**
 * Rex - Web Portal Navigation Specialist
 * Handles automated portal access, form filling, and document retrieval
 */

import type { AgentTaskRequest } from '@rexera/types';
import { BaseAgentSDK } from '../agent-sdk';

export interface RexCapabilities {
  portalLogin: (params: PortalLoginParams) => Promise<PortalLoginResult>;
  formCompletion: (params: FormCompletionParams) => Promise<FormCompletionResult>;
  documentDownload: (params: DocumentDownloadParams) => Promise<DocumentDownloadResult>;
  searchExecution: (params: SearchExecutionParams) => Promise<SearchExecutionResult>;
}

export interface PortalLoginParams {
  portalUrl: string;
  credentials: {
    username: string;
    password: string;
    additionalFields?: Record<string, string>;
  };
  authMethod: 'form' | 'oauth' | 'saml' | 'multi_factor';
  sessionManagement: {
    keepAlive: boolean;
    timeout: number;
  };
}

export interface PortalLoginResult {
  sessionId: string;
  status: 'success' | 'failed' | 'requires_mfa' | 'captcha_required';
  sessionCookies: Record<string, string>;
  accessLevel: string;
  expiresAt: string;
  warnings?: string[];
}

export interface FormCompletionParams {
  sessionId: string;
  formUrl: string;
  formData: Record<string, any>;
  submitMethod: 'auto' | 'review_first';
  validationRules?: Array<{
    field: string;
    rule: string;
    message: string;
  }>;
}

export interface FormCompletionResult {
  formId: string;
  status: 'submitted' | 'validation_failed' | 'requires_review';
  submittedData: Record<string, any>;
  validationErrors?: Array<{
    field: string;
    error: string;
  }>;
  confirmationNumber?: string;
  nextSteps: string[];
}

export interface DocumentDownloadParams {
  sessionId: string;
  documentIdentifiers: Array<{
    type: 'url' | 'id' | 'search_result';
    value: string;
    description?: string;
  }>;
  downloadLocation: string;
  fileNaming: {
    prefix?: string;
    includeDate: boolean;
    includeType: boolean;
  };
}

export interface DocumentDownloadResult {
  downloads: Array<{
    originalName: string;
    savedAs: string;
    size: number;
    type: string;
    checksum: string;
    status: 'success' | 'failed' | 'not_found';
  }>;
  totalSize: number;
  failedDownloads: string[];
}

export interface SearchExecutionParams {
  sessionId: string;
  searchCriteria: {
    primaryFields: Record<string, string>;
    secondaryFields?: Record<string, string>;
    dateRange?: {
      from: string;
      to: string;
      field: string;
    };
    filters?: Array<{
      field: string;
      operator: 'equals' | 'contains' | 'starts_with' | 'greater_than' | 'less_than';
      value: string;
    }>;
  };
  resultProcessing: {
    maxResults: number;
    sortBy?: string;
    includeMetadata: boolean;
  };
}

export interface SearchExecutionResult {
  searchId: string;
  totalResults: number;
  results: Array<{
    id: string;
    relevanceScore: number;
    data: Record<string, any>;
    metadata?: Record<string, any>;
    documentLinks?: Array<{
      type: string;
      url: string;
      description: string;
    }>;
  }>;
  searchTime: number;
  hasMoreResults: boolean;
  nextPageToken?: string;
}

export class RexAgent extends BaseAgentSDK implements RexCapabilities {
  constructor() {
    super({
      userAgent: 'Rexera-Rex-Agent/1.0.0',
    });
  }

  async portalLogin(params: PortalLoginParams): Promise<PortalLoginResult> {
    const request: AgentTaskRequest = {
      agent_type: 'rex',
      task_id: crypto.randomUUID(),
      workflow_id: crypto.randomUUID(),
      task_type: 'portal_login',
      complexity: 'moderate',
      input_data: params,
      context: {},
      priority: 'normal',
    };

    const response = await this.executeTask('rex', request);
    return response.result_data as PortalLoginResult;
  }

  async formCompletion(params: FormCompletionParams): Promise<FormCompletionResult> {
    const request: AgentTaskRequest = {
      agent_type: 'rex',
      task_id: crypto.randomUUID(),
      workflow_id: crypto.randomUUID(),
      task_type: 'form_completion',
      complexity: 'moderate',
      input_data: params,
      context: {},
      priority: 'normal',
    };

    const response = await this.executeTask('rex', request);
    return response.result_data as FormCompletionResult;
  }

  async documentDownload(params: DocumentDownloadParams): Promise<DocumentDownloadResult> {
    const request: AgentTaskRequest = {
      agent_type: 'rex',
      task_id: crypto.randomUUID(),
      workflow_id: crypto.randomUUID(),
      task_type: 'document_download',
      complexity: 'simple',
      input_data: params,
      context: {},
      priority: 'normal',
    };

    const response = await this.executeTask('rex', request);
    return response.result_data as DocumentDownloadResult;
  }

  async searchExecution(params: SearchExecutionParams): Promise<SearchExecutionResult> {
    const request: AgentTaskRequest = {
      agent_type: 'rex',
      task_id: crypto.randomUUID(),
      workflow_id: crypto.randomUUID(),
      task_type: 'search_execution',
      complexity: 'complex',
      input_data: params,
      context: {},
      priority: 'normal',
    };

    const response = await this.executeTask('rex', request);
    return response.result_data as SearchExecutionResult;
  }

  /**
   * High-level portal automation workflows
   */
  async automatedPortalSearch(
    portalConfig: {
      url: string;
      credentials: { username: string; password: string };
    },
    searchParams: {
      propertyAddress: string;
      ownerName?: string;
      parcelNumber?: string;
    }
  ): Promise<{
    sessionId: string;
    searchResults: SearchExecutionResult;
    downloadedDocuments: DocumentDownloadResult;
  }> {
    // Login to portal
    const loginResult = await this.portalLogin({
      portalUrl: portalConfig.url,
      credentials: portalConfig.credentials,
      authMethod: 'form',
      sessionManagement: {
        keepAlive: true,
        timeout: 1800, // 30 minutes
      },
    });

    if (loginResult.status !== 'success') {
      throw new Error(`Portal login failed: ${loginResult.status}`);
    }

    // Execute search
    const searchResults = await this.searchExecution({
      sessionId: loginResult.sessionId,
      searchCriteria: {
        primaryFields: {
          address: searchParams.propertyAddress,
          ...(searchParams.ownerName && { owner: searchParams.ownerName }),
          ...(searchParams.parcelNumber && { parcel: searchParams.parcelNumber }),
        },
      },
      resultProcessing: {
        maxResults: 50,
        includeMetadata: true,
      },
    });

    // Download relevant documents
    const documentIdentifiers = searchResults.results.flatMap(result =>
      result.documentLinks?.map(link => ({
        type: 'url' as const,
        value: link.url,
        description: link.description,
      })) || []
    );

    const downloadResult = await this.documentDownload({
      sessionId: loginResult.sessionId,
      documentIdentifiers,
      downloadLocation: '/tmp/portal_documents',
      fileNaming: {
        prefix: 'portal_doc',
        includeDate: true,
        includeType: true,
      },
    });

    return {
      sessionId: loginResult.sessionId,
      searchResults,
      downloadedDocuments: downloadResult,
    };
  }
}

export const rex = new RexAgent();