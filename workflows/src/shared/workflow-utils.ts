/**
 * Workflow Utilities
 * Helper functions for workflow management, deployment, and monitoring
 */

import type { N8nWorkflow, N8nNode } from './workflow-nodes';
import type { 
  MunicipalLienSearchResult,
  HOAAcquisitionResult,
  PayoffRequestResult 
} from '../workflows';

export interface WorkflowDeployment {
  workflowId: string;
  name: string;
  version: string;
  deployedAt: string;
  active: boolean;
  environment: 'development' | 'staging' | 'production';
  n8nInstanceUrl: string;
}

export interface WorkflowExecution {
  executionId: string;
  workflowId: string;
  status: 'new' | 'running' | 'success' | 'error' | 'waiting' | 'cancelled';
  startedAt: string;
  finishedAt?: string;
  duration?: number;
  nodeExecutions: Array<{
    nodeId: string;
    nodeName: string;
    status: 'success' | 'error' | 'skipped';
    executionTime: number;
    inputData?: any;
    outputData?: any;
    error?: string;
  }>;
  totalCost: number;
  triggeredBy: string;
}

export interface WorkflowMetrics {
  workflowId: string;
  timeRange: {
    from: string;
    to: string;
  };
  executions: {
    total: number;
    successful: number;
    failed: number;
    cancelled: number;
    averageDuration: number;
  };
  performance: {
    successRate: number;
    averageResponseTime: number;
    throughputPerHour: number;
    costEfficiency: number;
  };
  nodeMetrics: Array<{
    nodeId: string;
    nodeName: string;
    executionCount: number;
    averageExecutionTime: number;
    errorRate: number;
    costContribution: number;
  }>;
  alerts: Array<{
    type: 'performance' | 'error' | 'cost';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: string;
  }>;
}

/**
 * Workflow Management Functions
 */

export class WorkflowManager {
  private n8nApiUrl: string;
  private apiKey: string;

  constructor(n8nApiUrl: string, apiKey: string) {
    this.n8nApiUrl = n8nApiUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
  }

  /**
   * Deploy workflow to n8n instance
   */
  async deployWorkflow(
    workflow: N8nWorkflow,
    environment: 'development' | 'staging' | 'production' = 'development'
  ): Promise<WorkflowDeployment> {
    try {
      const response = await fetch(`${this.n8nApiUrl}/api/v1/workflows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-N8N-API-KEY': this.apiKey,
        },
        body: JSON.stringify({
          name: `${workflow.name}_${environment}`,
          nodes: workflow.nodes,
          connections: workflow.connections,
          active: workflow.active,
          settings: workflow.settings,
          staticData: {
            ...workflow.staticData,
            environment,
            deployedAt: new Date().toISOString(),
          },
          tags: [...workflow.tags, environment],
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to deploy workflow: ${response.statusText}`);
      }

      const deployedWorkflow = await response.json();

      return {
        workflowId: deployedWorkflow.id,
        name: deployedWorkflow.name,
        version: workflow.versionId,
        deployedAt: new Date().toISOString(),
        active: deployedWorkflow.active,
        environment,
        n8nInstanceUrl: this.n8nApiUrl,
      };
    } catch (error) {
      throw new Error(`Workflow deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update existing workflow
   */
  async updateWorkflow(
    workflowId: string,
    workflow: Partial<N8nWorkflow>
  ): Promise<WorkflowDeployment> {
    try {
      const response = await fetch(`${this.n8nApiUrl}/api/v1/workflows/${workflowId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-N8N-API-KEY': this.apiKey,
        },
        body: JSON.stringify({
          ...workflow,
          staticData: {
            ...workflow.staticData,
            updatedAt: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update workflow: ${response.statusText}`);
      }

      const updatedWorkflow = await response.json();

      return {
        workflowId: updatedWorkflow.id,
        name: updatedWorkflow.name,
        version: workflow.versionId || '1',
        deployedAt: new Date().toISOString(),
        active: updatedWorkflow.active,
        environment: updatedWorkflow.staticData?.environment || 'development',
        n8nInstanceUrl: this.n8nApiUrl,
      };
    } catch (error) {
      throw new Error(`Workflow update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute workflow manually
   */
  async executeWorkflow(
    workflowId: string,
    inputData: any,
    waitForCompletion: boolean = true
  ): Promise<WorkflowExecution> {
    try {
      const response = await fetch(`${this.n8nApiUrl}/api/v1/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-N8N-API-KEY': this.apiKey,
        },
        body: JSON.stringify({
          data: inputData,
          waitTill: waitForCompletion ? 'completion' : 'execution',
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to execute workflow: ${response.statusText}`);
      }

      const execution = await response.json();

      return this.mapExecutionResponse(execution);
    } catch (error) {
      throw new Error(`Workflow execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get workflow execution status
   */
  async getExecutionStatus(executionId: string): Promise<WorkflowExecution> {
    try {
      const response = await fetch(`${this.n8nApiUrl}/api/v1/executions/${executionId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-N8N-API-KEY': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get execution status: ${response.statusText}`);
      }

      const execution = await response.json();
      return this.mapExecutionResponse(execution);
    } catch (error) {
      throw new Error(`Failed to get execution status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get workflow metrics
   */
  async getWorkflowMetrics(
    workflowId: string,
    timeRange: { from: string; to: string }
  ): Promise<WorkflowMetrics> {
    try {
      const response = await fetch(
        `${this.n8nApiUrl}/api/v1/executions?workflowId=${workflowId}&limit=100&includeData=true`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'X-N8N-API-KEY': this.apiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get workflow metrics: ${response.statusText}`);
      }

      const executionsData = await response.json();
      return this.calculateMetrics(workflowId, executionsData.data, timeRange);
    } catch (error) {
      throw new Error(`Failed to get workflow metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Activate/Deactivate workflow
   */
  async setWorkflowActive(workflowId: string, active: boolean): Promise<boolean> {
    try {
      const response = await fetch(`${this.n8nApiUrl}/api/v1/workflows/${workflowId}/activate`, {
        method: active ? 'POST' : 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-N8N-API-KEY': this.apiKey,
        },
      });

      return response.ok;
    } catch (error) {
      console.error(`Failed to ${active ? 'activate' : 'deactivate'} workflow:`, error);
      return false;
    }
  }

  /**
   * Private helper methods
   */
  private mapExecutionResponse(execution: any): WorkflowExecution {
    const nodeExecutions = execution.data?.resultData?.runData || {};
    const mappedNodeExecutions = Object.entries(nodeExecutions).map(([nodeId, nodeData]: [string, any]) => ({
      nodeId,
      nodeName: nodeData[0]?.source?.[0]?.previousNode || nodeId,
      status: nodeData[0]?.error ? 'error' : 'success',
      executionTime: nodeData[0]?.executionTime || 0,
      inputData: nodeData[0]?.data?.main?.[0]?.[0]?.json,
      outputData: nodeData[0]?.data?.main?.[0]?.[0]?.json,
      error: nodeData[0]?.error?.message,
    }));

    return {
      executionId: execution.id,
      workflowId: execution.workflowId,
      status: execution.finished ? (execution.success ? 'success' : 'error') : 'running',
      startedAt: execution.startedAt,
      finishedAt: execution.stoppedAt,
      duration: execution.stoppedAt ? 
        new Date(execution.stoppedAt).getTime() - new Date(execution.startedAt).getTime() : undefined,
      nodeExecutions: mappedNodeExecutions,
      totalCost: this.calculateExecutionCost(mappedNodeExecutions),
      triggeredBy: execution.mode || 'manual',
    };
  }

  private calculateExecutionCost(nodeExecutions: any[]): number {
    // Simple cost calculation based on execution time and node type
    return nodeExecutions.reduce((total, node) => {
      const baseCost = node.nodeName.includes('Agent') ? 50 : 10; // cents
      const timeCost = Math.ceil(node.executionTime / 1000) * 2; // 2 cents per second
      return total + baseCost + timeCost;
    }, 0);
  }

  private calculateMetrics(
    workflowId: string,
    executions: any[],
    timeRange: { from: string; to: string }
  ): WorkflowMetrics {
    const filteredExecutions = executions.filter(exec => {
      const execTime = new Date(exec.startedAt).getTime();
      const fromTime = new Date(timeRange.from).getTime();
      const toTime = new Date(timeRange.to).getTime();
      return execTime >= fromTime && execTime <= toTime;
    });

    const successful = filteredExecutions.filter(exec => exec.finished && exec.mode !== 'error').length;
    const failed = filteredExecutions.filter(exec => exec.finished && exec.mode === 'error').length;
    const cancelled = filteredExecutions.filter(exec => exec.mode === 'cancelled').length;

    const durations = filteredExecutions
      .filter(exec => exec.stoppedAt)
      .map(exec => new Date(exec.stoppedAt).getTime() - new Date(exec.startedAt).getTime());

    const averageDuration = durations.length > 0 ? 
      durations.reduce((sum, duration) => sum + duration, 0) / durations.length : 0;

    return {
      workflowId,
      timeRange,
      executions: {
        total: filteredExecutions.length,
        successful,
        failed,
        cancelled,
        averageDuration,
      },
      performance: {
        successRate: filteredExecutions.length > 0 ? successful / filteredExecutions.length : 0,
        averageResponseTime: averageDuration,
        throughputPerHour: this.calculateThroughput(filteredExecutions, timeRange),
        costEfficiency: this.calculateCostEfficiency(filteredExecutions),
      },
      nodeMetrics: [], // Would be calculated from execution data
      alerts: this.generateAlerts(filteredExecutions),
    };
  }

  private calculateThroughput(executions: any[], timeRange: { from: string; to: string }): number {
    const hours = (new Date(timeRange.to).getTime() - new Date(timeRange.from).getTime()) / (1000 * 60 * 60);
    return hours > 0 ? executions.length / hours : 0;
  }

  private calculateCostEfficiency(executions: any[]): number {
    // Simple efficiency metric: successful executions per dollar spent
    const totalCost = executions.reduce((sum, exec) => sum + (exec.cost || 100), 0) / 100; // Convert cents to dollars
    const successfulExecutions = executions.filter(exec => exec.finished && exec.mode !== 'error').length;
    return totalCost > 0 ? successfulExecutions / totalCost : 0;
  }

  private generateAlerts(executions: any[]): WorkflowMetrics['alerts'] {
    const alerts: WorkflowMetrics['alerts'] = [];

    // Check for high error rate
    const errorRate = executions.filter(exec => exec.mode === 'error').length / Math.max(executions.length, 1);
    if (errorRate > 0.1) {
      alerts.push({
        type: 'error',
        severity: errorRate > 0.25 ? 'high' : 'medium',
        message: `High error rate detected: ${(errorRate * 100).toFixed(1)}%`,
        timestamp: new Date().toISOString(),
      });
    }

    // Check for performance issues
    const avgDuration = executions.reduce((sum, exec) => {
      if (exec.stoppedAt) {
        return sum + (new Date(exec.stoppedAt).getTime() - new Date(exec.startedAt).getTime());
      }
      return sum;
    }, 0) / Math.max(executions.length, 1);

    if (avgDuration > 30 * 60 * 1000) { // 30 minutes
      alerts.push({
        type: 'performance',
        severity: 'medium',
        message: `Workflows taking longer than expected: avg ${(avgDuration / 60000).toFixed(1)} minutes`,
        timestamp: new Date().toISOString(),
      });
    }

    return alerts;
  }
}

/**
 * Utility functions for workflow result processing
 */
export const processWorkflowResult = (
  workflowType: string,
  executionData: any
): MunicipalLienSearchResult | HOAAcquisitionResult | PayoffRequestResult => {
  switch (workflowType) {
    case 'municipal_lien_search':
      return processMunicipalLienSearchResult(executionData);
    case 'hoa_acquisition':
      return processHOAAcquisitionResult(executionData);
    case 'payoff_request':
      return processPayoffRequestResult(executionData);
    default:
      throw new Error(`Unknown workflow type: ${workflowType}`);
  }
};

const processMunicipalLienSearchResult = (data: any): MunicipalLienSearchResult => {
  // Extract and transform n8n execution data into structured result
  return {
    workflow_id: data.workflowId,
    status: data.status === 'success' ? 'completed' : 'failed',
    property_details: data.property_details || {},
    ownership_info: data.ownership_info || {},
    lien_records: data.lien_records || [],
    search_coverage: data.search_coverage || {},
    execution_metrics: data.execution_metrics || {},
    documents: data.documents || [],
    requires_follow_up: data.requires_follow_up || false,
    recommendations: data.recommendations || [],
  };
};

const processHOAAcquisitionResult = (data: any): HOAAcquisitionResult => {
  return {
    workflow_id: data.workflowId,
    status: data.status === 'success' ? 'completed' : 'failed',
    hoa_profile: data.hoa_profile || {},
    financial_analysis: data.financial_analysis || {},
    governance_analysis: data.governance_analysis || {},
    compliance_status: data.compliance_status || {},
    risk_assessment: data.risk_assessment || {},
    documents_analyzed: data.documents_analyzed || [],
    recommendations: data.recommendations || [],
    execution_metrics: data.execution_metrics || {},
  };
};

const processPayoffRequestResult = (data: any): PayoffRequestResult => {
  return {
    workflow_id: data.workflowId,
    status: data.status === 'success' ? 'completed' : 'failed',
    lender_information: data.lender_information || {},
    payoff_quote: data.payoff_quote || {},
    wire_instructions: data.wire_instructions || {},
    communication_log: data.communication_log || [],
    processing_timeline: data.processing_timeline || {},
    quality_metrics: data.quality_metrics || {},
    execution_metrics: data.execution_metrics || {},
    next_steps: data.next_steps || [],
    alerts: data.alerts || [],
  };
};

/**
 * Export utility functions and classes
 */
export { WorkflowManager as default };
export * from './workflow-nodes';
export * from './webhook-handlers';