/**
 * Mia - Email Communication Specialist
 * Handles automated email composition, sending, and follow-up management
 */

import type { 
  AgentTaskRequest, 
  AgentTaskResponse, 
  AgentExecutionContext 
} from '@rexera/types';
import { BaseAgentSDK } from '../agent-sdk';

export interface MiaCapabilities {
  emailComposition: (params: EmailCompositionParams) => Promise<EmailCompositionResult>;
  emailSending: (params: EmailSendingParams) => Promise<EmailSendingResult>;
  followUpScheduling: (params: FollowUpParams) => Promise<FollowUpResult>;
  responseParsing: (params: ResponseParsingParams) => Promise<ResponseParsingResult>;
}

export interface EmailCompositionParams {
  purpose: 'initial_contact' | 'follow_up' | 'information_request' | 'status_update' | 'escalation';
  recipient: {
    name: string;
    email: string;
    title?: string;
    organization?: string;
  };
  context: {
    workflowType: string;
    propertyAddress?: string;
    caseNumber?: string;
    previousInteractions?: string[];
    urgency: 'low' | 'normal' | 'high' | 'urgent';
  };
  tone: 'formal' | 'professional' | 'friendly' | 'urgent';
  attachments?: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  customInstructions?: string;
}

export interface EmailCompositionResult {
  subject: string;
  body: string;
  attachmentNotes?: string[];
  tone: string;
  estimatedReadTime: number;
  compliance: {
    isCompliant: boolean;
    issues?: string[];
  };
}

export interface EmailSendingParams {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType: string;
  }>;
  priority: 'low' | 'normal' | 'high';
  deliveryConfirmation?: boolean;
  trackOpens?: boolean;
}

export interface EmailSendingResult {
  messageId: string;
  status: 'sent' | 'queued' | 'failed';
  recipientResults: Array<{
    email: string;
    status: 'delivered' | 'bounced' | 'rejected';
    timestamp: string;
  }>;
  trackingEnabled: boolean;
}

export interface FollowUpParams {
  originalMessageId: string;
  followUpType: 'reminder' | 'escalation' | 'information_request' | 'deadline_reminder';
  delay: {
    amount: number;
    unit: 'hours' | 'days' | 'weeks';
  };
  conditions?: Array<{
    type: 'no_response' | 'partial_response' | 'specific_date';
    value?: string;
  }>;
  maxFollowUps: number;
  escalationPath?: string[];
}

export interface FollowUpResult {
  followUpId: string;
  scheduledDate: string;
  sequence: Array<{
    step: number;
    type: string;
    scheduledFor: string;
    content: string;
  }>;
  escalationTriggers: string[];
}

export interface ResponseParsingParams {
  messageId: string;
  emailContent: string;
  originalContext: {
    purpose: string;
    informationRequested?: string[];
    expectedResponseType: 'documents' | 'information' | 'confirmation' | 'meeting';
  };
  parseGoals: string[];
}

export interface ResponseParsingResult {
  responseType: 'positive' | 'negative' | 'partial' | 'request_for_info' | 'out_of_office';
  extractedInformation: Record<string, any>;
  attachments?: Array<{
    filename: string;
    type: string;
    relevance: number;
  }>;
  nextActions: Array<{
    action: string;
    priority: 'low' | 'normal' | 'high';
    deadline?: string;
  }>;
  confidence: number;
  requiresHumanReview: boolean;
}

export class MiaAgent extends BaseAgentSDK implements MiaCapabilities {
  constructor() {
    super({
      userAgent: 'Rexera-Mia-Agent/1.0.0',
    });
  }

  async emailComposition(params: EmailCompositionParams): Promise<EmailCompositionResult> {
    const request: AgentTaskRequest = {
      agent_type: 'mia',
      task_id: crypto.randomUUID(),
      workflow_id: crypto.randomUUID(),
      task_type: 'email_composition',
      complexity: 'moderate',
      input_data: params,
      context: {
        workflow_context: {
          purpose: params.purpose,
          urgency: params.context.urgency,
        },
      },
      priority: params.context.urgency === 'urgent' ? 'high' : 'normal',
    };

    const response = await this.executeTask('mia', request);
    return response.result_data as EmailCompositionResult;
  }

  async emailSending(params: EmailSendingParams): Promise<EmailSendingResult> {
    const request: AgentTaskRequest = {
      agent_type: 'mia',
      task_id: crypto.randomUUID(),
      workflow_id: crypto.randomUUID(),
      task_type: 'email_sending',
      complexity: 'simple',
      input_data: params,
      context: {},
      priority: params.priority === 'high' ? 'high' : 'normal',
    };

    const response = await this.executeTask('mia', request);
    return response.result_data as EmailSendingResult;
  }

  async followUpScheduling(params: FollowUpParams): Promise<FollowUpResult> {
    const request: AgentTaskRequest = {
      agent_type: 'mia',
      task_id: crypto.randomUUID(),
      workflow_id: crypto.randomUUID(),
      task_type: 'follow_up_scheduling',
      complexity: 'moderate',
      input_data: params,
      context: {},
      priority: 'normal',
    };

    const response = await this.executeTask('mia', request);
    return response.result_data as FollowUpResult;
  }

  async responseParsing(params: ResponseParsingParams): Promise<ResponseParsingResult> {
    const request: AgentTaskRequest = {
      agent_type: 'mia',
      task_id: crypto.randomUUID(),
      workflow_id: crypto.randomUUID(),
      task_type: 'response_parsing',
      complexity: 'moderate',
      input_data: params,
      context: {},
      priority: 'normal',
    };

    const response = await this.executeTask('mia', request);
    return response.result_data as ResponseParsingResult;
  }

  /**
   * High-level workflow methods
   */
  async sendInitialContact(
    recipient: { name: string; email: string; title?: string; organization?: string },
    workflowContext: { type: string; propertyAddress?: string; caseNumber?: string },
    customMessage?: string
  ): Promise<{ messageId: string; followUpId: string }> {
    // Compose email
    const composition = await this.emailComposition({
      purpose: 'initial_contact',
      recipient,
      context: {
        workflowType: workflowContext.type,
        propertyAddress: workflowContext.propertyAddress,
        caseNumber: workflowContext.caseNumber,
        urgency: 'normal',
      },
      tone: 'professional',
      customInstructions: customMessage,
    });

    // Send email
    const sendingResult = await this.emailSending({
      to: [recipient.email],
      subject: composition.subject,
      body: composition.body,
      priority: 'normal',
      deliveryConfirmation: true,
      trackOpens: true,
    });

    // Schedule follow-up
    const followUpResult = await this.followUpScheduling({
      originalMessageId: sendingResult.messageId,
      followUpType: 'reminder',
      delay: { amount: 3, unit: 'days' },
      conditions: [{ type: 'no_response' }],
      maxFollowUps: 3,
    });

    return {
      messageId: sendingResult.messageId,
      followUpId: followUpResult.followUpId,
    };
  }
}

// Export singleton instance
export const mia = new MiaAgent();