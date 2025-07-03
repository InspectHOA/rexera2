/**
 * Corey - HOA Specialist
 * Handles HOA-specific document analysis and processing
 */

import type { AgentTaskRequest } from '@rexera/types';
import { BaseAgentSDK } from '../agent-sdk';

export interface CoreyCapabilities {
  hoaDocumentAnalysis: (params: HOADocumentAnalysisParams) => Promise<HOADocumentAnalysisResult>;
  bylawsInterpretation: (params: BylawsInterpretationParams) => Promise<BylawsInterpretationResult>;
  financialStatementReview: (params: FinancialReviewParams) => Promise<FinancialReviewResult>;
  complianceAssessment: (params: ComplianceAssessmentParams) => Promise<ComplianceAssessmentResult>;
}

export interface HOADocumentAnalysisParams {
  documents: Array<{
    type: 'ccr' | 'bylaws' | 'financial_statement' | 'meeting_minutes' | 'amendment' | 'budget' | 'assessment_notice';
    content: string;
    source: string;
    date?: string;
  }>;
  analysisGoals: Array<'governance_structure' | 'financial_health' | 'compliance_status' | 'risk_assessment' | 'ownership_transfer_requirements'>;
  propertyDetails?: {
    address: string;
    unitNumber?: string;
    lotNumber?: string;
    buildingType: 'condo' | 'townhouse' | 'single_family' | 'commercial';
  };
}

export interface HOADocumentAnalysisResult {
  analysisId: string;
  documentSummary: {
    totalDocuments: number;
    documentTypes: Record<string, number>;
    dateRange: {
      earliest: string;
      latest: string;
    };
    completeness: number;
  };
  keyFindings: Array<{
    category: 'governance' | 'financial' | 'compliance' | 'operational' | 'legal';
    finding: string;
    importance: 'critical' | 'high' | 'medium' | 'low';
    source: string;
    impact: string;
  }>;
  governanceStructure: {
    boardComposition: Array<{
      position: string;
      name?: string;
      term?: string;
    }>;
    managementCompany?: {
      name: string;
      contact: string;
      contractExpiry?: string;
    };
    meetingSchedule: string;
    votingRights: string;
  };
  riskFactors: Array<{
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    likelihood: number;
    mitigation?: string;
  }>;
}

export interface BylawsInterpretationParams {
  bylawsText: string;
  interpretationQueries: Array<{
    question: string;
    context?: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  propertyContext?: {
    propertyType: string;
    ownershipType: 'individual' | 'corporate' | 'trust' | 'llc';
    intendedUse: 'primary_residence' | 'rental' | 'commercial' | 'vacation';
  };
}

export interface BylawsInterpretationResult {
  interpretationId: string;
  responses: Array<{
    question: string;
    answer: string;
    confidence: number;
    relevantSections: Array<{
      section: string;
      text: string;
      article?: string;
    }>;
    caveats: string[];
  }>;
  restrictions: Array<{
    category: 'architectural' | 'use' | 'rental' | 'pet' | 'parking' | 'maintenance';
    restriction: string;
    enforcement: string;
    penalties?: string;
  }>;
  obligations: Array<{
    type: 'financial' | 'maintenance' | 'reporting' | 'participation';
    description: string;
    frequency: string;
    consequences: string;
  }>;
  transferRequirements: {
    approvalRequired: boolean;
    fees: Array<{
      type: string;
      amount: string;
      timing: string;
    }>;
    documentation: string[];
    timeline: string;
  };
}

export interface FinancialReviewParams {
  financialDocuments: Array<{
    type: 'budget' | 'income_statement' | 'balance_sheet' | 'assessment_schedule' | 'reserve_study' | 'audit_report';
    data: Record<string, any>;
    period: string;
    source: string;
  }>;
  reviewScope: Array<'financial_health' | 'cash_flow' | 'reserves' | 'assessments' | 'expenses' | 'debt' | 'compliance'>;
  benchmarks?: {
    industryAverages?: Record<string, number>;
    comparableHOAs?: Record<string, any>;
  };
}

export interface FinancialReviewResult {
  reviewId: string;
  financialHealth: {
    overallScore: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    strengths: string[];
    concerns: string[];
  };
  keyMetrics: {
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
    cashOnHand: number;
    totalReserves: number;
    delinquencyRate: number;
    debtToAssetRatio: number;
  };
  assessmentAnalysis: {
    currentAssessment: number;
    assessmentHistory: Array<{
      period: string;
      amount: number;
      change: number;
    }>;
    specialAssessments: Array<{
      purpose: string;
      amount: number;
      timeline: string;
      status: string;
    }>;
  };
  reserveAnalysis: {
    reserveBalance: number;
    reserveRatio: number;
    fundingStatus: 'adequate' | 'marginal' | 'insufficient';
    upcomingCapitalExpenses: Array<{
      item: string;
      estimatedCost: number;
      timeline: string;
      priority: string;
    }>;
  };
  recommendations: Array<{
    area: string;
    recommendation: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    impact: string;
  }>;
}

export interface ComplianceAssessmentParams {
  state: string;
  hoaType: 'condo' | 'homeowners' | 'commercial' | 'mixed_use';
  documents: Array<{
    type: string;
    content: string;
    lastUpdated?: string;
  }>;
  complianceAreas: Array<'state_law' | 'federal_law' | 'insurance' | 'tax' | 'disclosure' | 'reporting' | 'governance'>;
}

export interface ComplianceAssessmentResult {
  assessmentId: string;
  overallCompliance: number;
  complianceStatus: 'compliant' | 'minor_issues' | 'major_issues' | 'non_compliant';
  areaResults: Array<{
    area: string;
    status: 'compliant' | 'issues_found' | 'non_compliant' | 'not_assessed';
    score: number;
    findings: Array<{
      requirement: string;
      status: 'met' | 'partially_met' | 'not_met';
      description: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
    }>;
  }>;
  requiredActions: Array<{
    action: string;
    deadline?: string;
    priority: 'immediate' | 'urgent' | 'moderate' | 'low';
    consequences: string;
    resources: string[];
  }>;
  riskAssessment: {
    legalRisk: 'low' | 'medium' | 'high' | 'critical';
    financialRisk: 'low' | 'medium' | 'high' | 'critical';
    operationalRisk: 'low' | 'medium' | 'high' | 'critical';
    reputationalRisk: 'low' | 'medium' | 'high' | 'critical';
  };
}

export class CoreyAgent extends BaseAgentSDK implements CoreyCapabilities {
  constructor() {
    super({
      userAgent: 'Rexera-Corey-Agent/1.0.0',
    });
  }

  async hoaDocumentAnalysis(params: HOADocumentAnalysisParams): Promise<HOADocumentAnalysisResult> {
    const request: AgentTaskRequest = {
      agent_type: 'corey',
      task_id: crypto.randomUUID(),
      workflow_id: crypto.randomUUID(),
      task_type: 'hoa_document_analysis',
      complexity: 'complex',
      input_data: params,
      context: {},
      priority: 'normal',
    };

    const response = await this.executeTask('corey', request);
    return response.result_data as HOADocumentAnalysisResult;
  }

  async bylawsInterpretation(params: BylawsInterpretationParams): Promise<BylawsInterpretationResult> {
    const request: AgentTaskRequest = {
      agent_type: 'corey',
      task_id: crypto.randomUUID(),
      workflow_id: crypto.randomUUID(),
      task_type: 'bylaws_interpretation',
      complexity: 'complex',
      input_data: params,
      context: {},
      priority: 'normal',
    };

    const response = await this.executeTask('corey', request);
    return response.result_data as BylawsInterpretationResult;
  }

  async financialStatementReview(params: FinancialReviewParams): Promise<FinancialReviewResult> {
    const request: AgentTaskRequest = {
      agent_type: 'corey',
      task_id: crypto.randomUUID(),
      workflow_id: crypto.randomUUID(),
      task_type: 'financial_statement_review',
      complexity: 'complex',
      input_data: params,
      context: {},
      priority: 'normal',
    };

    const response = await this.executeTask('corey', request);
    return response.result_data as FinancialReviewResult;
  }

  async complianceAssessment(params: ComplianceAssessmentParams): Promise<ComplianceAssessmentResult> {
    const request: AgentTaskRequest = {
      agent_type: 'corey',
      task_id: crypto.randomUUID(),
      workflow_id: crypto.randomUUID(),
      task_type: 'compliance_assessment',
      complexity: 'complex',
      input_data: params,
      context: {},
      priority: 'normal',
    };

    const response = await this.executeTask('corey', request);
    return response.result_data as ComplianceAssessmentResult;
  }

  /**
   * High-level HOA analysis workflows
   */
  async performComprehensiveHOAAnalysis(
    hoaDocuments: Array<{
      type: string;
      content: string;
      source: string;
      date?: string;
    }>,
    propertyDetails: {
      address: string;
      state: string;
      buildingType: 'condo' | 'townhouse' | 'single_family' | 'commercial';
    }
  ): Promise<{
    documentAnalysis: HOADocumentAnalysisResult;
    bylawsInterpretation?: BylawsInterpretationResult;
    financialReview?: FinancialReviewResult;
    complianceAssessment: ComplianceAssessmentResult;
  }> {
    // Perform comprehensive document analysis
    const documentAnalysis = await this.hoaDocumentAnalysis({
      documents: hoaDocuments,
      analysisGoals: [
        'governance_structure',
        'financial_health',
        'compliance_status',
        'risk_assessment',
        'ownership_transfer_requirements',
      ],
      propertyDetails: propertyDetails,
    });

    const results: any = { documentAnalysis };

    // Interpret bylaws if available
    const bylawsDoc = hoaDocuments.find(doc => doc.type === 'bylaws');
    if (bylawsDoc) {
      results.bylawsInterpretation = await this.bylawsInterpretation({
        bylawsText: bylawsDoc.content,
        interpretationQueries: [
          {
            question: 'What are the ownership transfer requirements?',
            priority: 'high',
          },
          {
            question: 'What are the rental restrictions?',
            priority: 'high',
          },
          {
            question: 'What are the architectural restrictions?',
            priority: 'medium',
          },
          {
            question: 'What are the assessment and fee structures?',
            priority: 'high',
          },
        ],
        propertyContext: {
          propertyType: propertyDetails.buildingType,
          ownershipType: 'individual',
          intendedUse: 'primary_residence',
        },
      });
    }

    // Review financial statements if available
    const financialDocs = hoaDocuments.filter(doc => 
      ['financial_statement', 'budget', 'assessment_notice'].includes(doc.type)
    );
    if (financialDocs.length > 0) {
      results.financialReview = await this.financialStatementReview({
        financialDocuments: financialDocs.map(doc => ({
          type: doc.type as any,
          data: { content: doc.content },
          period: doc.date || new Date().getFullYear().toString(),
          source: doc.source,
        })),
        reviewScope: [
          'financial_health',
          'cash_flow',
          'reserves',
          'assessments',
          'expenses',
        ],
      });
    }

    // Perform compliance assessment
    results.complianceAssessment = await this.complianceAssessment({
      state: propertyDetails.state,
      hoaType: propertyDetails.buildingType === 'condo' ? 'condo' : 'homeowners',
      documents: hoaDocuments,
      complianceAreas: [
        'state_law',
        'federal_law',
        'disclosure',
        'reporting',
        'governance',
      ],
    });

    return results;
  }

  async assessHOAFinancialHealth(
    financialDocuments: Array<any>,
    benchmarkData?: Record<string, any>
  ): Promise<{
    healthScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    keyIssues: string[];
    recommendations: string[];
  }> {
    const review = await this.financialStatementReview({
      financialDocuments,
      reviewScope: ['financial_health', 'cash_flow', 'reserves', 'debt'],
      benchmarks: benchmarkData,
    });

    const healthScore = review.financialHealth.overallScore;
    
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (healthScore >= 80) riskLevel = 'low';
    else if (healthScore >= 60) riskLevel = 'medium';
    else if (healthScore >= 40) riskLevel = 'high';
    else riskLevel = 'critical';

    return {
      healthScore,
      riskLevel,
      keyIssues: review.financialHealth.concerns,
      recommendations: review.recommendations.map(r => r.recommendation),
    };
  }
}

export const corey = new CoreyAgent();