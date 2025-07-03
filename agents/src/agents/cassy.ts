/**
 * Cassy - Quality Assurance Specialist
 * Handles data validation, quality control, and accuracy verification
 */

import type { AgentTaskRequest } from '@rexera/types';
import { BaseAgentSDK } from '../agent-sdk';

export interface CassyCapabilities {
  dataValidation: (params: DataValidationParams) => Promise<DataValidationResult>;
  qualityScoring: (params: QualityScoringParams) => Promise<QualityScoringResult>;
  errorDetection: (params: ErrorDetectionParams) => Promise<ErrorDetectionResult>;
  complianceChecking: (params: ComplianceParams) => Promise<ComplianceResult>;
}

export interface DataValidationParams {
  dataSource: {
    type: 'workflow_output' | 'agent_result' | 'user_input' | 'external_data';
    data: Record<string, any>;
    metadata?: Record<string, any>;
  };
  validationRules: Array<{
    field: string;
    type: 'required' | 'format' | 'range' | 'uniqueness' | 'consistency' | 'custom';
    rule: string;
    severity: 'error' | 'warning' | 'info';
    message?: string;
  }>;
  crossValidation?: Array<{
    fields: string[];
    relationship: 'equal' | 'sum' | 'range' | 'dependency' | 'custom';
    rule: string;
  }>;
}

export interface DataValidationResult {
  validationId: string;
  overallStatus: 'passed' | 'failed' | 'warnings';
  score: number;
  fieldResults: Array<{
    field: string;
    status: 'valid' | 'invalid' | 'warning';
    message: string;
    severity: 'error' | 'warning' | 'info';
    suggestion?: string;
  }>;
  crossValidationResults: Array<{
    fields: string[];
    status: 'valid' | 'invalid';
    message: string;
  }>;
  summary: {
    totalFields: number;
    validFields: number;
    invalidFields: number;
    warningFields: number;
  };
}

export interface QualityScoringParams {
  workflowId: string;
  workflowType: string;
  completionData: {
    tasks: Array<{
      id: string;
      status: 'completed' | 'failed' | 'skipped';
      agentType?: string;
      confidence?: number;
      executionTime?: number;
    }>;
    outputs: Record<string, any>;
    metrics: {
      totalTime: number;
      cost: number;
      agentUtilization: Record<string, number>;
    };
  };
  qualityCriteria: Array<{
    category: 'completeness' | 'accuracy' | 'efficiency' | 'compliance' | 'client_satisfaction';
    weight: number;
    thresholds: {
      excellent: number;
      good: number;
      acceptable: number;
    };
  }>;
}

export interface QualityScoringResult {
  scoreId: string;
  overallScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  categoryScores: Array<{
    category: string;
    score: number;
    weight: number;
    performance: 'excellent' | 'good' | 'acceptable' | 'poor';
    details: string;
  }>;
  strengths: string[];
  improvements: Array<{
    area: string;
    impact: 'high' | 'medium' | 'low';
    recommendation: string;
  }>;
  benchmarks: {
    industryAverage?: number;
    historicalAverage?: number;
    bestPerformance?: number;
  };
}

export interface ErrorDetectionParams {
  scanScope: {
    workflowId?: string;
    agentOutputs?: Array<{
      agentType: string;
      output: any;
      confidence: number;
    }>;
    documents?: Array<{
      content: string;
      type: string;
      source: string;
    }>;
  };
  errorTypes: Array<'data_inconsistency' | 'missing_information' | 'format_error' | 'logic_error' | 'compliance_violation'>;
  sensitivity: 'low' | 'medium' | 'high';
  contextRules?: Array<{
    domain: string;
    rules: string[];
  }>;
}

export interface ErrorDetectionResult {
  scanId: string;
  errorsFound: Array<{
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    location: string;
    description: string;
    evidence: string;
    confidence: number;
    suggestedFix: string;
  }>;
  patterns: Array<{
    pattern: string;
    frequency: number;
    impact: string;
    recommendation: string;
  }>;
  riskAssessment: {
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
    riskFactors: string[];
    mitigation: string[];
  };
}

export interface ComplianceParams {
  complianceType: 'regulatory' | 'industry' | 'internal' | 'client_specific';
  standards: Array<{
    name: string;
    version: string;
    requirements: Array<{
      id: string;
      description: string;
      category: string;
      mandatory: boolean;
    }>;
  }>;
  auditScope: {
    workflowId?: string;
    processes?: string[];
    documents?: string[];
    timeframe?: {
      from: string;
      to: string;
    };
  };
}

export interface ComplianceResult {
  auditId: string;
  overallCompliance: number;
  status: 'compliant' | 'non_compliant' | 'partial_compliance';
  findings: Array<{
    standard: string;
    requirement: string;
    status: 'compliant' | 'non_compliant' | 'not_applicable';
    evidence?: string;
    gaps?: string[];
    recommendations?: string[];
  }>;
  riskAssessment: {
    complianceRisk: 'low' | 'medium' | 'high' | 'critical';
    penalties?: Array<{
      type: string;
      severity: string;
      likelihood: number;
    }>;
  };
  remediationPlan: Array<{
    finding: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    action: string;
    timeline: string;
    owner: string;
  }>;
}

export class CassyAgent extends BaseAgentSDK implements CassyCapabilities {
  constructor() {
    super({
      userAgent: 'Rexera-Cassy-Agent/1.0.0',
    });
  }

  async dataValidation(params: DataValidationParams): Promise<DataValidationResult> {
    const request: AgentTaskRequest = {
      agent_type: 'cassy',
      task_id: crypto.randomUUID(),
      workflow_id: crypto.randomUUID(),
      task_type: 'data_validation',
      complexity: 'moderate',
      input_data: params,
      context: {},
      priority: 'normal',
    };

    const response = await this.executeTask('cassy', request);
    return response.result_data as DataValidationResult;
  }

  async qualityScoring(params: QualityScoringParams): Promise<QualityScoringResult> {
    const request: AgentTaskRequest = {
      agent_type: 'cassy',
      task_id: crypto.randomUUID(),
      workflow_id: crypto.randomUUID(),
      task_type: 'quality_scoring',
      complexity: 'simple',
      input_data: params,
      context: {},
      priority: 'normal',
    };

    const response = await this.executeTask('cassy', request);
    return response.result_data as QualityScoringResult;
  }

  async errorDetection(params: ErrorDetectionParams): Promise<ErrorDetectionResult> {
    const request: AgentTaskRequest = {
      agent_type: 'cassy',
      task_id: crypto.randomUUID(),
      workflow_id: crypto.randomUUID(),
      task_type: 'error_detection',
      complexity: 'complex',
      input_data: params,
      context: {},
      priority: 'normal',
    };

    const response = await this.executeTask('cassy', request);
    return response.result_data as ErrorDetectionResult;
  }

  async complianceChecking(params: ComplianceParams): Promise<ComplianceResult> {
    const request: AgentTaskRequest = {
      agent_type: 'cassy',
      task_id: crypto.randomUUID(),
      workflow_id: crypto.randomUUID(),
      task_type: 'compliance_checking',
      complexity: 'complex',
      input_data: params,
      context: {},
      priority: 'normal',
    };

    const response = await this.executeTask('cassy', request);
    return response.result_data as ComplianceResult;
  }

  /**
   * High-level quality assurance workflows
   */
  async validateWorkflowOutput(
    workflowId: string,
    workflowType: string,
    outputData: Record<string, any>
  ): Promise<{
    validation: DataValidationResult;
    quality: QualityScoringResult;
    errors: ErrorDetectionResult;
  }> {
    // Data validation
    const validation = await this.dataValidation({
      dataSource: {
        type: 'workflow_output',
        data: outputData,
      },
      validationRules: this.getValidationRulesForWorkflow(workflowType),
    });

    // Quality scoring
    const quality = await this.qualityScoring({
      workflowId,
      workflowType,
      completionData: {
        tasks: [], // Would be populated with actual task data
        outputs: outputData,
        metrics: {
          totalTime: 0,
          cost: 0,
          agentUtilization: {},
        },
      },
      qualityCriteria: [
        {
          category: 'completeness',
          weight: 0.3,
          thresholds: { excellent: 95, good: 85, acceptable: 75 },
        },
        {
          category: 'accuracy',
          weight: 0.4,
          thresholds: { excellent: 98, good: 90, acceptable: 80 },
        },
        {
          category: 'efficiency',
          weight: 0.3,
          thresholds: { excellent: 90, good: 80, acceptable: 70 },
        },
      ],
    });

    // Error detection
    const errors = await this.errorDetection({
      scanScope: {
        workflowId,
      },
      errorTypes: ['data_inconsistency', 'missing_information', 'logic_error'],
      sensitivity: 'medium',
    });

    return { validation, quality, errors };
  }

  private getValidationRulesForWorkflow(workflowType: string) {
    const baseRules = [
      {
        field: 'completion_status',
        type: 'required' as const,
        rule: 'not_empty',
        severity: 'error' as const,
      },
      {
        field: 'timestamp',
        type: 'format' as const,
        rule: 'iso_date',
        severity: 'error' as const,
      },
    ];

    const workflowSpecificRules: Record<string, any[]> = {
      municipal_lien_search: [
        {
          field: 'property_address',
          type: 'required',
          rule: 'not_empty',
          severity: 'error',
        },
        {
          field: 'lien_records',
          type: 'required',
          rule: 'array_not_empty',
          severity: 'error',
        },
      ],
      hoa_acquisition: [
        {
          field: 'hoa_documents',
          type: 'required',
          rule: 'array_not_empty',
          severity: 'error',
        },
        {
          field: 'financial_analysis',
          type: 'required',
          rule: 'object_not_empty',
          severity: 'error',
        },
      ],
      payoff_request: [
        {
          field: 'lender_contact',
          type: 'required',
          rule: 'not_empty',
          severity: 'error',
        },
        {
          field: 'payoff_amount',
          type: 'format',
          rule: 'currency',
          severity: 'error',
        },
      ],
    };

    return [...baseRules, ...(workflowSpecificRules[workflowType] || [])];
  }
}

export const cassy = new CassyAgent();