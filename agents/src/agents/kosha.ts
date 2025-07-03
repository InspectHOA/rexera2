/**
 * Kosha - Financial Tracking Specialist
 * Handles cost tracking, billing automation, and financial reporting
 */

import type { AgentTaskRequest } from '@rexera/types';
import { BaseAgentSDK } from '../agent-sdk';

export interface KoshaCapabilities {
  costTracking: (params: CostTrackingParams) => Promise<CostTrackingResult>;
  billingAutomation: (params: BillingParams) => Promise<BillingResult>;
  expenseAnalysis: (params: ExpenseAnalysisParams) => Promise<ExpenseAnalysisResult>;
  financialReporting: (params: FinancialReportParams) => Promise<FinancialReportResult>;
}

export interface CostTrackingParams {
  workflowId: string;
  costItems: Array<{
    type: 'agent_execution' | 'external_service' | 'manual_labor' | 'third_party' | 'overhead';
    description: string;
    amount: number;
    currency: string;
    agentType?: string;
    executionId?: string;
    vendor?: string;
    category: string;
  }>;
  trackingPeriod: {
    from: string;
    to: string;
  };
}

export interface CostTrackingResult {
  trackingId: string;
  totalCost: number;
  costBreakdown: {
    byCategory: Record<string, number>;
    byAgent: Record<string, number>;
    byVendor: Record<string, number>;
  };
  budgetComparison?: {
    budgeted: number;
    actual: number;
    variance: number;
    variancePercentage: number;
  };
  costTrends: Array<{
    date: string;
    amount: number;
    category: string;
  }>;
}

export interface BillingParams {
  clientId: string;
  workflowIds: string[];
  billingPeriod: {
    from: string;
    to: string;
  };
  billingModel: 'fixed_fee' | 'time_and_materials' | 'success_fee' | 'hybrid';
  rateStructure: {
    baseRate?: number;
    agentRates?: Record<string, number>;
    markupPercentage?: number;
    discounts?: Array<{
      type: string;
      percentage: number;
      condition: string;
    }>;
  };
  includeExpenses: boolean;
}

export interface BillingResult {
  invoiceId: string;
  invoiceNumber: string;
  subtotal: number;
  taxes: number;
  discounts: number;
  total: number;
  lineItems: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
    category: string;
  }>;
  paymentTerms: string;
  dueDate: string;
  invoiceUrl: string;
}

export interface ExpenseAnalysisParams {
  scope: {
    clientIds?: string[];
    workflowTypes?: string[];
    agentTypes?: string[];
    dateRange: {
      from: string;
      to: string;
    };
  };
  analysisType: 'variance' | 'trend' | 'efficiency' | 'profitability' | 'comprehensive';
  benchmarks?: {
    industry?: Record<string, number>;
    historical?: Record<string, number>;
    target?: Record<string, number>;
  };
}

export interface ExpenseAnalysisResult {
  analysisId: string;
  totalExpenses: number;
  insights: Array<{
    category: string;
    finding: string;
    impact: 'positive' | 'negative' | 'neutral';
    severity: 'low' | 'medium' | 'high';
    recommendation: string;
  }>;
  efficiencyMetrics: {
    costPerWorkflow: number;
    costPerAgent: Record<string, number>;
    utilizationRates: Record<string, number>;
  };
  optimizationOpportunities: Array<{
    area: string;
    potentialSavings: number;
    effort: 'low' | 'medium' | 'high';
    timeline: string;
  }>;
}

export interface FinancialReportParams {
  reportType: 'p_and_l' | 'cost_analysis' | 'client_profitability' | 'agent_performance' | 'budget_variance';
  scope: {
    entityType: 'client' | 'workflow' | 'agent' | 'organization';
    entityIds?: string[];
    period: {
      from: string;
      to: string;
      comparison?: {
        from: string;
        to: string;
      };
    };
  };
  includeForecasting: boolean;
  detailLevel: 'summary' | 'detailed' | 'comprehensive';
}

export interface FinancialReportResult {
  reportId: string;
  generatedAt: string;
  reportData: {
    summary: {
      totalRevenue: number;
      totalCosts: number;
      grossProfit: number;
      netProfit: number;
      profitMargin: number;
    };
    breakdown: Array<{
      category: string;
      amount: number;
      percentage: number;
      trend: 'up' | 'down' | 'stable';
    }>;
    metrics: Record<string, number>;
    comparison?: {
      period: string;
      changes: Record<string, {
        value: number;
        percentage: number;
        trend: 'up' | 'down' | 'stable';
      }>;
    };
  };
  recommendations: Array<{
    area: string;
    action: string;
    priority: 'low' | 'medium' | 'high';
    expectedImpact: string;
  }>;
  chartData: Array<{
    type: 'line' | 'bar' | 'pie';
    title: string;
    data: any;
  }>;
}

export class KoshaAgent extends BaseAgentSDK implements KoshaCapabilities {
  constructor() {
    super({
      userAgent: 'Rexera-Kosha-Agent/1.0.0',
    });
  }

  async costTracking(params: CostTrackingParams): Promise<CostTrackingResult> {
    const request: AgentTaskRequest = {
      agent_type: 'kosha',
      task_id: crypto.randomUUID(),
      workflow_id: crypto.randomUUID(),
      task_type: 'cost_tracking',
      complexity: 'simple',
      input_data: params,
      context: {},
      priority: 'normal',
    };

    const response = await this.executeTask('kosha', request);
    return response.result_data as CostTrackingResult;
  }

  async billingAutomation(params: BillingParams): Promise<BillingResult> {
    const request: AgentTaskRequest = {
      agent_type: 'kosha',
      task_id: crypto.randomUUID(),
      workflow_id: crypto.randomUUID(),
      task_type: 'billing_automation',
      complexity: 'moderate',
      input_data: params,
      context: {},
      priority: 'normal',
    };

    const response = await this.executeTask('kosha', request);
    return response.result_data as BillingResult;
  }

  async expenseAnalysis(params: ExpenseAnalysisParams): Promise<ExpenseAnalysisResult> {
    const request: AgentTaskRequest = {
      agent_type: 'kosha',
      task_id: crypto.randomUUID(),
      workflow_id: crypto.randomUUID(),
      task_type: 'expense_analysis',
      complexity: 'complex',
      input_data: params,
      context: {},
      priority: 'normal',
    };

    const response = await this.executeTask('kosha', request);
    return response.result_data as ExpenseAnalysisResult;
  }

  async financialReporting(params: FinancialReportParams): Promise<FinancialReportResult> {
    const request: AgentTaskRequest = {
      agent_type: 'kosha',
      task_id: crypto.randomUUID(),
      workflow_id: crypto.randomUUID(),
      task_type: 'financial_reporting',
      complexity: 'moderate',
      input_data: params,
      context: {},
      priority: 'normal',
    };

    const response = await this.executeTask('kosha', request);
    return response.result_data as FinancialReportResult;
  }

  /**
   * High-level financial management workflows
   */
  async trackWorkflowCosts(
    workflowId: string,
    agentExecutions: Array<{
      agentType: string;
      executionId: string;
      cost: number;
    }>,
    externalCosts?: Array<{
      vendor: string;
      amount: number;
      description: string;
    }>
  ): Promise<CostTrackingResult> {
    const costItems = [
      ...agentExecutions.map(exec => ({
        type: 'agent_execution' as const,
        description: `${exec.agentType} execution`,
        amount: exec.cost,
        currency: 'USD',
        agentType: exec.agentType,
        executionId: exec.executionId,
        category: 'automation',
      })),
      ...(externalCosts?.map(cost => ({
        type: 'third_party' as const,
        description: cost.description,
        amount: cost.amount,
        currency: 'USD',
        vendor: cost.vendor,
        category: 'external_service',
      })) || []),
    ];

    return this.costTracking({
      workflowId,
      costItems,
      trackingPeriod: {
        from: new Date().toISOString(),
        to: new Date().toISOString(),
      },
    });
  }

  async generateClientInvoice(
    clientId: string,
    workflowIds: string[],
    billingPeriod: { from: string; to: string }
  ): Promise<BillingResult> {
    return this.billingAutomation({
      clientId,
      workflowIds,
      billingPeriod,
      billingModel: 'time_and_materials',
      rateStructure: {
        baseRate: 100,
        agentRates: {
          nina: 50,
          mia: 40,
          florian: 120,
          rex: 45,
          iris: 35,
          ria: 60,
          kosha: 50,
          cassy: 35,
          max: 45,
          corey: 95,
        },
        markupPercentage: 20,
      },
      includeExpenses: true,
    });
  }
}

export const kosha = new KoshaAgent();