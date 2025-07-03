/**
 * Florian - Phone Outreach Specialist
 * Handles voice calls, phone interactions, and verbal communication
 */

import type { AgentTaskRequest } from '@rexera/types';
import { BaseAgentSDK } from '../agent-sdk';

export interface FlorianCapabilities {
  phoneCalling: (params: PhoneCallingParams) => Promise<PhoneCallingResult>;
  voicemailHandling: (params: VoicemailParams) => Promise<VoicemailResult>;
  callScheduling: (params: CallSchedulingParams) => Promise<CallSchedulingResult>;
  conversationTranscription: (params: TranscriptionParams) => Promise<TranscriptionResult>;
}

export interface PhoneCallingParams {
  phoneNumber: string;
  contactName: string;
  purpose: 'initial_contact' | 'follow_up' | 'information_request' | 'appointment_scheduling';
  script?: string;
  maxCallDuration: number;
  fallbackToVoicemail: boolean;
}

export interface PhoneCallingResult {
  callId: string;
  status: 'connected' | 'no_answer' | 'busy' | 'voicemail' | 'invalid_number';
  duration: number;
  transcript?: string;
  outcome: 'successful' | 'needs_follow_up' | 'unsuccessful';
  nextActions: string[];
}

export interface VoicemailParams {
  phoneNumber: string;
  contactName: string;
  message: string;
  tone: 'professional' | 'friendly' | 'urgent';
  callback: {
    number: string;
    preferredTimes: string[];
  };
}

export interface VoicemailResult {
  messageId: string;
  duration: number;
  status: 'delivered' | 'failed';
  followUpScheduled: boolean;
}

export interface CallSchedulingParams {
  contactInfo: {
    name: string;
    phone: string;
    email?: string;
  };
  purpose: string;
  preferredTimes: Array<{
    date: string;
    startTime: string;
    endTime: string;
  }>;
  duration: number;
  meetingType: 'phone' | 'video' | 'in_person';
}

export interface CallSchedulingResult {
  appointmentId: string;
  scheduledTime: string;
  confirmationSent: boolean;
  calendarEntry: {
    title: string;
    description: string;
    location?: string;
  };
}

export interface TranscriptionParams {
  audioFile: string;
  speakerIdentification: boolean;
  summaryRequired: boolean;
  keywordsToHighlight?: string[];
}

export interface TranscriptionResult {
  fullTranscript: string;
  speakers: Array<{
    id: string;
    role: 'agent' | 'contact' | 'unknown';
    segments: Array<{
      text: string;
      timestamp: string;
      confidence: number;
    }>;
  }>;
  summary: string;
  keyMoments: Array<{
    topic: string;
    timestamp: string;
    importance: 'low' | 'medium' | 'high';
  }>;
  actionItems: string[];
}

export class FlorianAgent extends BaseAgentSDK implements FlorianCapabilities {
  constructor() {
    super({
      userAgent: 'Rexera-Florian-Agent/1.0.0',
    });
  }

  async phoneCalling(params: PhoneCallingParams): Promise<PhoneCallingResult> {
    const request: AgentTaskRequest = {
      agent_type: 'florian',
      task_id: crypto.randomUUID(),
      workflow_id: crypto.randomUUID(),
      task_type: 'phone_calling',
      complexity: 'complex',
      input_data: params,
      context: {},
      priority: 'normal',
    };

    const response = await this.executeTask('florian', request);
    return response.result_data as PhoneCallingResult;
  }

  async voicemailHandling(params: VoicemailParams): Promise<VoicemailResult> {
    const request: AgentTaskRequest = {
      agent_type: 'florian',
      task_id: crypto.randomUUID(),
      workflow_id: crypto.randomUUID(),
      task_type: 'voicemail_handling',
      complexity: 'moderate',
      input_data: params,
      context: {},
      priority: 'normal',
    };

    const response = await this.executeTask('florian', request);
    return response.result_data as VoicemailResult;
  }

  async callScheduling(params: CallSchedulingParams): Promise<CallSchedulingResult> {
    const request: AgentTaskRequest = {
      agent_type: 'florian',
      task_id: crypto.randomUUID(),
      workflow_id: crypto.randomUUID(),
      task_type: 'call_scheduling',
      complexity: 'simple',
      input_data: params,
      context: {},
      priority: 'normal',
    };

    const response = await this.executeTask('florian', request);
    return response.result_data as CallSchedulingResult;
  }

  async conversationTranscription(params: TranscriptionParams): Promise<TranscriptionResult> {
    const request: AgentTaskRequest = {
      agent_type: 'florian',
      task_id: crypto.randomUUID(),
      workflow_id: crypto.randomUUID(),
      task_type: 'conversation_transcription',
      complexity: 'moderate',
      input_data: params,
      context: {},
      priority: 'normal',
    };

    const response = await this.executeTask('florian', request);
    return response.result_data as TranscriptionResult;
  }
}

export const florian = new FlorianAgent();