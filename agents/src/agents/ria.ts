/**
 * Ria - Client Communication Specialist
 * Handles client relationship management and status updates
 */

import type { AgentTaskRequest } from '@rexera/types';
import { BaseAgentSDK } from '../agent-sdk';

export interface RiaCapabilities {
  clientUpdates: (params: ClientUpdateParams) => Promise<ClientUpdateResult>;
  escalationHandling: (params: EscalationParams) => Promise<EscalationResult>;
  reportGeneration: (params: ReportParams) => Promise<ReportResult>;
  relationshipManagement: (params: RelationshipParams) => Promise<RelationshipResult>;
}

export interface ClientUpdateParams {
  clientId: string;
  workflowId: string;
  updateType: 'progress' | 'completion' | 'delay' | 'issue' | 'milestone';
  content: {
    summary: string;
    details?: string;
    nextSteps?: string[];
    timeline?: {
      estimatedCompletion: string;
      milestones: Array<{
        name: string;
        status: 'completed' | 'in_progress' | 'pending';
        date: string;
      }>;
    };
  };
  deliveryMethod: 'email' | 'sms' | 'portal' | 'phone' | 'all';
  urgency: 'low' | 'normal' | 'high' | 'urgent';
}

export interface ClientUpdateResult {
  updateId: string;
  deliveryResults: Array<{
    method: string;
    status: 'sent' | 'delivered' | 'failed';
    timestamp: string;
    messageId?: string;
  }>;
  clientResponse?: {
    received: boolean;
    sentiment: 'positive' | 'neutral' | 'negative';
    followUpRequired: boolean;
  };
}

export interface EscalationParams {
  clientId: string;
  workflowId: string;
  escalationType: 'delay' | 'quality_issue' | 'cost_overrun' | 'client_complaint' | 'external_blocker';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  stakeholders: Array<{
    role: 'client' | 'manager' | 'specialist' | 'external';
    contact: string;
    notificationMethod: 'email' | 'phone' | 'both';
  }>;
  resolutionRequired: boolean;
}

export interface EscalationResult {
  escalationId: string;
  notifications: Array<{
    stakeholder: string;
    method: string;
    status: 'sent' | 'failed';
    timestamp: string;
  }>;
  assignedTo: string;
  expectedResolution: string;
  trackingNumber: string;
}

export interface ReportParams {
  reportType: 'workflow_summary' | 'client_portfolio' | 'performance_metrics' | 'custom';
  scope: {
    clientIds?: string[];
    workflowIds?: string[];
    dateRange: {
      from: string;
      to: string;
    };
    includeMetrics: boolean;
    includeFinancials: boolean;
  };
  format: 'pdf' | 'excel' | 'html' | 'json';
  customSections?: Array<{
    title: string;
    content: string;
    data?: any;
  }>;
}

export interface ReportResult {
  reportId: string;
  fileName: string;
  fileSize: number;
  sections: Array<{
    title: string;
    summary: string;
    keyMetrics: Record<string, any>;
  }>;
  generatedAt: string;
  expiresAt: string;
  downloadUrl: string;
}

export interface RelationshipParams {
  clientId: string;
  activityType: 'check_in' | 'satisfaction_survey' | 'renewal_discussion' | 'feedback_collection';
  context: {
    lastInteraction?: string;
    recentWorkflows?: string[];
    satisfactionScore?: number;
    concerns?: string[];
  };
  personalization: {
    tone: 'formal' | 'friendly' | 'professional';
    includePersonalDetails: boolean;
    referencePastWork: boolean;
  };
}

export interface RelationshipResult {
  activityId: string;
  outreachResults: Array<{
    method: string;
    status: 'successful' | 'failed' | 'pending';
    response?: string;
  }>;
  insights: {
    clientSentiment: 'positive' | 'neutral' | 'negative' | 'unknown';
    satisfactionTrend: 'improving' | 'stable' | 'declining';
    riskFactors: string[];
    opportunities: string[];
  };
  recommendations: Array<{
    action: string;
    priority: 'low' | 'medium' | 'high';
    timeline: string;
  }>;
}

export class RiaAgent extends BaseAgentSDK implements RiaCapabilities {
  constructor() {
    super({
      userAgent: 'Rexera-Ria-Agent/1.0.0',
    });
  }

  async clientUpdates(params: ClientUpdateParams): Promise<ClientUpdateResult> {
    const request: AgentTaskRequest = {
      agent_type: 'ria',
      task_id: crypto.randomUUID(),
      workflow_id: crypto.randomUUID(),
      task_type: 'client_updates',
      complexity: 'simple',
      input_data: params,
      context: {},
      priority: params.urgency === 'urgent' ? 'high' : 'normal',
    };

    const response = await this.executeTask('ria', request);
    return response.result_data as ClientUpdateResult;
  }

  async escalationHandling(params: EscalationParams): Promise<EscalationResult> {
    const request: AgentTaskRequest = {
      agent_type: 'ria',
      task_id: crypto.randomUUID(),
      workflow_id: crypto.randomUUID(),
      task_type: 'escalation_handling',
      complexity: 'moderate',
      input_data: params,
      context: {},
      priority: params.severity === 'critical' ? 'urgent' : 'high',
    };

    const response = await this.executeTask('ria', request);
    return response.result_data as EscalationResult;
  }

  async reportGeneration(params: ReportParams): Promise<ReportResult> {
    const request: AgentTaskRequest = {
      agent_type: 'ria',
      task_id: crypto.randomUUID(),
      workflow_id: crypto.randomUUID(),
      task_type: 'report_generation',
      complexity: 'moderate',
      input_data: params,
      context: {},
      priority: 'normal',
    };

    const response = await this.executeTask('ria', request);
    return response.result_data as ReportResult;
  }

  async relationshipManagement(params: RelationshipParams): Promise<RelationshipResult> {
    const request: AgentTaskRequest = {
      agent_type: 'ria',
      task_id: crypto.randomUUID(),
      workflow_id: crypto.randomUUID(),
      task_type: 'relationship_management',
      complexity: 'complex',
      input_data: params,
      context: {},
      priority: 'normal',
    };

    const response = await this.executeTask('ria', request);
    return response.result_data as RelationshipResult;
  }

  /**
   * High-level client management workflows
   */
  async sendWorkflowProgressUpdate(
    clientId: string,
    workflowId: string,
    progress: {
      percentage: number;
      currentStage: string;
      completedTasks: string[];
      nextMilestone: string;
      estimatedCompletion: string;
    }
  ): Promise<ClientUpdateResult> {
    return this.clientUpdates({
      clientId,
      workflowId,
      updateType: 'progress',
      content: {
        summary: `Your ${progress.currentStage} workflow is ${progress.percentage}% complete.`,
        details: `Completed tasks: ${progress.completedTasks.join(', ')}`,
        nextSteps: [`Continue with ${progress.nextMilestone}`],
        timeline: {
          estimatedCompletion: progress.estimatedCompletion,
          milestones: [
            {
              name: progress.currentStage,
              status: 'in_progress',
              date: new Date().toISOString(),
            },
            {
              name: progress.nextMilestone,
              status: 'pending',
              date: progress.estimatedCompletion,
            },
          ],
        },
      },
      deliveryMethod: 'email',
      urgency: 'normal',
    });
  }

  async handleClientConcern(
    clientId: string,
    workflowId: string,
    concern: {
      type: string;
      description: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
    }
  ): Promise<EscalationResult> {
    return this.escalationHandling({
      clientId,
      workflowId,
      escalationType: 'client_complaint',
      description: concern.description,
      severity: concern.severity,
      stakeholders: [
        {
          role: 'client',
          contact: clientId,
          notificationMethod: 'both',
        },
        {
          role: 'manager',
          contact: 'workflow.manager@rexera.com',
          notificationMethod: 'email',
        },
      ],
      resolutionRequired: true,
    });
  }
}

export const ria = new RiaAgent();