/**
 * Max - IVR Navigation Specialist
 * Handles automated phone system navigation and menu traversal
 */

import type { AgentTaskRequest } from '@rexera/types';
import { BaseAgentSDK } from '../agent-sdk';

export interface MaxCapabilities {
  ivrNavigation: (params: IVRNavigationParams) => Promise<IVRNavigationResult>;
  queueManagement: (params: QueueManagementParams) => Promise<QueueManagementResult>;
  dtmfInteraction: (params: DTMFInteractionParams) => Promise<DTMFInteractionResult>;
  transferHandling: (params: TransferHandlingParams) => Promise<TransferHandlingResult>;
}

export interface IVRNavigationParams {
  phoneNumber: string;
  targetDepartment: string;
  navigationPath?: Array<{
    step: number;
    action: 'press' | 'speak' | 'wait';
    value: string;
    expectedResponse?: string;
  }>;
  fallbackStrategy: 'operator' | 'voicemail' | 'hang_up' | 'retry';
  maxAttempts: number;
  timeout: number;
}

export interface IVRNavigationResult {
  navigationId: string;
  status: 'success' | 'failed' | 'timeout' | 'busy' | 'no_answer';
  actualPath: Array<{
    step: number;
    action: string;
    response: string;
    timestamp: string;
    duration: number;
  }>;
  finalDestination: string;
  totalDuration: number;
  transferInfo?: {
    department: string;
    extensionNumber?: string;
    agentName?: string;
  };
  recordingAvailable: boolean;
}

export interface QueueManagementParams {
  callId: string;
  queueType: 'customer_service' | 'technical_support' | 'billing' | 'sales' | 'general';
  maxWaitTime: number;
  positionAnnouncements: boolean;
  callbackOption: {
    enabled: boolean;
    number?: string;
    preferredTimes?: string[];
  };
  priorityLevel: 'low' | 'normal' | 'high' | 'urgent';
}

export interface QueueManagementResult {
  queueId: string;
  status: 'waiting' | 'connected' | 'callback_scheduled' | 'abandoned' | 'timeout';
  waitTime: number;
  queuePosition: number;
  estimatedWaitTime?: number;
  callbackScheduled?: {
    time: string;
    confirmationNumber: string;
  };
  agentInfo?: {
    name: string;
    id: string;
    department: string;
  };
}

export interface DTMFInteractionParams {
  callId: string;
  sequence: Array<{
    prompt: string;
    input: string;
    timing: number;
    validation?: string;
  }>;
  errorHandling: {
    retryAttempts: number;
    invalidInputAction: 'retry' | 'operator' | 'main_menu';
  };
}

export interface DTMFInteractionResult {
  interactionId: string;
  sequenceResults: Array<{
    prompt: string;
    input: string;
    response: string;
    success: boolean;
    retryCount: number;
  }>;
  overallSuccess: boolean;
  errorCount: number;
  finalResponse: string;
}

export interface TransferHandlingParams {
  callId: string;
  transferType: 'warm' | 'cold' | 'conference';
  targetInfo: {
    department: string;
    extension?: string;
    agentId?: string;
  };
  contextInfo: {
    reason: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    customerInfo?: Record<string, any>;
    caseNumber?: string;
  };
  timeoutSettings: {
    transferTimeout: number;
    agentPickupTimeout: number;
  };
}

export interface TransferHandlingResult {
  transferId: string;
  status: 'successful' | 'failed' | 'no_answer' | 'busy' | 'refused';
  transferTime: number;
  targetAgent?: {
    name: string;
    id: string;
    department: string;
  };
  contextTransferred: boolean;
  callContinuity: boolean;
  notes: string[];
}

export class MaxAgent extends BaseAgentSDK implements MaxCapabilities {
  constructor() {
    super({
      userAgent: 'Rexera-Max-Agent/1.0.0',
    });
  }

  async ivrNavigation(params: IVRNavigationParams): Promise<IVRNavigationResult> {
    const request: AgentTaskRequest = {
      agent_type: 'max',
      task_id: crypto.randomUUID(),
      workflow_id: crypto.randomUUID(),
      task_type: 'ivr_navigation',
      complexity: 'moderate',
      input_data: params,
      context: {},
      priority: 'normal',
    };

    const response = await this.executeTask('max', request);
    return response.result_data as IVRNavigationResult;
  }

  async queueManagement(params: QueueManagementParams): Promise<QueueManagementResult> {
    const request: AgentTaskRequest = {
      agent_type: 'max',
      task_id: crypto.randomUUID(),
      workflow_id: crypto.randomUUID(),
      task_type: 'queue_management',
      complexity: 'simple',
      input_data: params,
      context: {},
      priority: 'normal',
    };

    const response = await this.executeTask('max', request);
    return response.result_data as QueueManagementResult;
  }

  async dtmfInteraction(params: DTMFInteractionParams): Promise<DTMFInteractionResult> {
    const request: AgentTaskRequest = {
      agent_type: 'max',
      task_id: crypto.randomUUID(),
      workflow_id: crypto.randomUUID(),
      task_type: 'dtmf_interaction',
      complexity: 'simple',
      input_data: params,
      context: {},
      priority: 'normal',
    };

    const response = await this.executeTask('max', request);
    return response.result_data as DTMFInteractionResult;
  }

  async transferHandling(params: TransferHandlingParams): Promise<TransferHandlingResult> {
    const request: AgentTaskRequest = {
      agent_type: 'max',
      task_id: crypto.randomUUID(),
      workflow_id: crypto.randomUUID(),
      task_type: 'transfer_handling',
      complexity: 'moderate',
      input_data: params,
      context: {},
      priority: 'normal',
    };

    const response = await this.executeTask('max', request);
    return response.result_data as TransferHandlingResult;
  }

  /**
   * High-level IVR automation workflows
   */
  async navigateToCountyOffice(
    countyPhoneNumber: string,
    targetDepartment: 'records' | 'tax_assessor' | 'clerk' | 'planning'
  ): Promise<{
    navigation: IVRNavigationResult;
    queue?: QueueManagementResult;
  }> {
    // Common county office navigation patterns
    const navigationPaths: Record<string, Array<any>> = {
      records: [
        { step: 1, action: 'press', value: '2', expectedResponse: 'county records' },
        { step: 2, action: 'press', value: '1', expectedResponse: 'real estate records' },
      ],
      tax_assessor: [
        { step: 1, action: 'press', value: '3', expectedResponse: 'tax assessor' },
        { step: 2, action: 'press', value: '0', expectedResponse: 'representative' },
      ],
      clerk: [
        { step: 1, action: 'press', value: '1', expectedResponse: 'county clerk' },
      ],
      planning: [
        { step: 1, action: 'press', value: '4', expectedResponse: 'planning department' },
        { step: 2, action: 'press', value: '2', expectedResponse: 'permits and records' },
      ],
    };

    const navigation = await this.ivrNavigation({
      phoneNumber: countyPhoneNumber,
      targetDepartment,
      navigationPath: navigationPaths[targetDepartment],
      fallbackStrategy: 'operator',
      maxAttempts: 3,
      timeout: 300, // 5 minutes
    });

    const result: any = { navigation };

    // If successfully reached department, manage queue
    if (navigation.status === 'success' && navigation.finalDestination.includes('queue')) {
      const queue = await this.queueManagement({
        callId: navigation.navigationId,
        queueType: 'customer_service',
        maxWaitTime: 900, // 15 minutes
        positionAnnouncements: true,
        callbackOption: {
          enabled: true,
        },
        priorityLevel: 'normal',
      });
      result.queue = queue;
    }

    return result;
  }

  async handlePayoffRequestCall(
    lenderPhoneNumber: string,
    accountNumber: string,
    propertyAddress: string
  ): Promise<{
    navigation: IVRNavigationResult;
    interaction: DTMFInteractionResult;
    transfer?: TransferHandlingResult;
  }> {
    // Navigate to loan servicing department
    const navigation = await this.ivrNavigation({
      phoneNumber: lenderPhoneNumber,
      targetDepartment: 'loan_servicing',
      navigationPath: [
        { step: 1, action: 'press', value: '2', expectedResponse: 'existing customers' },
        { step: 2, action: 'press', value: '3', expectedResponse: 'loan servicing' },
        { step: 3, action: 'press', value: '4', expectedResponse: 'payoff requests' },
      ],
      fallbackStrategy: 'operator',
      maxAttempts: 2,
      timeout: 240,
    });

    // Input account information
    const interaction = await this.dtmfInteraction({
      callId: navigation.navigationId,
      sequence: [
        {
          prompt: 'Enter your account number',
          input: accountNumber,
          timing: 2000,
          validation: 'account_verified',
        },
        {
          prompt: 'Press 1 for payoff quote',
          input: '1',
          timing: 1000,
        },
      ],
      errorHandling: {
        retryAttempts: 2,
        invalidInputAction: 'retry',
      },
    });

    const result: any = { navigation, interaction };

    // If human intervention needed, transfer to specialist
    if (!interaction.overallSuccess) {
      const transfer = await this.transferHandling({
        callId: navigation.navigationId,
        transferType: 'warm',
        targetInfo: {
          department: 'loan_servicing',
        },
        contextInfo: {
          reason: 'payoff_request_assistance',
          priority: 'normal',
          customerInfo: {
            accountNumber,
            propertyAddress,
          },
        },
        timeoutSettings: {
          transferTimeout: 60,
          agentPickupTimeout: 120,
        },
      });
      result.transfer = transfer;
    }

    return result;
  }
}

export const max = new MaxAgent();