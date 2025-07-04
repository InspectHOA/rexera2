/**
 * Core SDK for AI Agent Integration
 * Provides standardized interface for all 10 specialized agents
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import retry from 'retry';
import { z } from 'zod';
import type {
  AgentType,
  AgentTaskRequest,
  AgentTaskResponse,
  AgentExecutionContext,
  AgentExecutionResult,
  AgentConfiguration,
  AgentHealthCheck
} from '@rexera/types';

// Validation schemas
const AgentTaskRequestSchema = z.object({
  agent_type: z.enum(['nina', 'mia', 'florian', 'rex', 'iris', 'ria', 'kosha', 'cassy', 'max', 'corey']),
  task_id: z.string(),
  workflow_id: z.string(),
  task_type: z.string(),
  complexity: z.enum(['simple', 'moderate', 'complex']),
  input_data: z.record(z.any()),
  context: z.object({
    workflow_context: z.record(z.any()).optional(),
    previous_results: z.record(z.any()).optional(),
    user_preferences: z.record(z.any()).optional(),
  }),
  constraints: z.object({
    max_execution_time: z.number().optional(),
    max_cost: z.number().optional(),
    retry_attempts: z.number().optional(),
  }).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  deadline: z.string().optional(),
});

const AgentTaskResponseSchema = z.object({
  agent_type: z.enum(['nina', 'mia', 'florian', 'rex', 'iris', 'ria', 'kosha', 'cassy', 'max', 'corey']),
  task_id: z.string().uuid(),
  execution_id: z.string().uuid(),
  status: z.enum(['success', 'partial_success', 'failure', 'timeout']),
  result_data: z.record(z.any()),
  confidence_score: z.number().min(0).max(1),
  execution_time_ms: z.number(),
  cost_cents: z.number(),
  error_message: z.string().optional(),
  warnings: z.array(z.string()).optional(),
  recommendations: z.array(z.string()).optional(),
  next_suggested_actions: z.array(z.string()).optional(),
  metadata: z.object({
    agent_version: z.string(),
    execution_timestamp: z.string(),
    resource_usage: z.record(z.any()).optional(),
  }),
});

export interface AgentSDKConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  enableLogging: boolean;
  enableMetrics: boolean;
  userAgent: string;
}

export class AgentSDKError extends Error {
  constructor(
    message: string,
    public code: string,
    public agentType?: AgentType,
    public taskId?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AgentSDKError';
  }
}

export class BaseAgentSDK {
  private client: AxiosInstance;
  private config: AgentSDKConfig;

  constructor(config: Partial<AgentSDKConfig> = {}) {
    this.config = {
      baseUrl: config.baseUrl || process.env.AGENTS_BASE_URL || 'https://api.rexera-agents.com',
      apiKey: config.apiKey || process.env.AGENTS_API_KEY || '',
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
      enableLogging: config.enableLogging ?? true,
      enableMetrics: config.enableMetrics ?? true,
      userAgent: config.userAgent || 'Rexera-Agent-SDK/1.0.0',
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': this.config.userAgent,
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        if (this.config.enableLogging) {
          console.log(`[Agent SDK] ${config.method?.toUpperCase()} ${config.url}`, {
            headers: config.headers,
            data: config.data,
          });
        }
        return config;
      },
      (error) => {
        console.error('[Agent SDK] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging and error handling
    this.client.interceptors.response.use(
      (response) => {
        if (this.config.enableLogging) {
          console.log(`[Agent SDK] Response ${response.status}`, {
            data: response.data,
          });
        }
        return response;
      },
      (error) => {
        console.error('[Agent SDK] Response error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Execute a task with the specified agent
   */
  async executeTask(
    agentType: AgentType,
    request: AgentTaskRequest,
    context?: AgentExecutionContext
  ): Promise<AgentTaskResponse> {
    try {
      // Validate request
      const validatedRequest = AgentTaskRequestSchema.parse(request);

      // Add execution context
      const enrichedRequest = {
        ...validatedRequest,
        context: {
          ...validatedRequest.context,
          execution_context: context,
          sdk_version: '1.0.0',
          timestamp: new Date().toISOString(),
        },
      };

      const operation = retry.operation({
        retries: this.config.retryAttempts,
        factor: 2,
        minTimeout: this.config.retryDelay,
        maxTimeout: this.config.retryDelay * 4,
      });

      return new Promise((resolve, reject) => {
        operation.attempt(async (currentAttempt) => {
          try {
            const startTime = Date.now();
            
            const response = await this.client.post(`/${agentType}/execute`, enrichedRequest);
            
            const executionTime = Date.now() - startTime;
            
            // Validate response
            const validatedResponse = AgentTaskResponseSchema.parse(response.data);

            // Record metrics if enabled
            if (this.config.enableMetrics) {
              await this.recordMetrics(agentType, validatedRequest, validatedResponse, executionTime);
            }

            resolve(validatedResponse);
          } catch (error: any) {
            if (operation.retry(error)) {
              console.warn(`[Agent SDK] Retry attempt ${currentAttempt} for ${agentType}:`, error.message);
              return;
            }

            const agentError = new AgentSDKError(
              `Agent execution failed: ${error.message}`,
              error.response?.data?.code || 'EXECUTION_FAILED',
              agentType,
              request.task_id,
              error.response?.status
            );

            reject(agentError);
          }
        });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new AgentSDKError(
          `Invalid request format: ${error.errors.map(e => e.message).join(', ')}`,
          'VALIDATION_ERROR',
          agentType,
          request.task_id
        );
      }
      throw error;
    }
  }

  /**
   * Check health status of an agent
   */
  async healthCheck(agentType: AgentType): Promise<AgentHealthCheck> {
    try {
      const startTime = Date.now();
      const response = await this.client.get(`/${agentType}/health`);
      const responseTime = Date.now() - startTime;

      return {
        agent_type: agentType,
        status: response.data.status || 'online',
        last_health_check: new Date().toISOString(),
        response_time_ms: responseTime,
        error_rate_24h: response.data.error_rate_24h || 0,
        current_load: response.data.current_load || 0,
        available_capacity: response.data.available_capacity || 100,
        alerts: response.data.alerts || [],
      };
    } catch (error: any) {
      return {
        agent_type: agentType,
        status: 'error',
        last_health_check: new Date().toISOString(),
        response_time_ms: 0,
        error_rate_24h: 1,
        current_load: 0,
        available_capacity: 0,
        alerts: [
          {
            level: 'critical',
            message: `Health check failed: ${error.message}`,
            timestamp: new Date().toISOString(),
          },
        ],
      };
    }
  }

  /**
   * Get agent configuration
   */
  async getConfiguration(agentType: AgentType): Promise<AgentConfiguration> {
    try {
      const response = await this.client.get(`/${agentType}/config`);
      return response.data;
    } catch (error: any) {
      throw new AgentSDKError(
        `Failed to get configuration: ${error.message}`,
        'CONFIG_ERROR',
        agentType
      );
    }
  }

  /**
   * Update agent configuration
   */
  async updateConfiguration(
    agentType: AgentType,
    config: Partial<AgentConfiguration>
  ): Promise<AgentConfiguration> {
    try {
      const response = await this.client.put(`/${agentType}/config`, config);
      return response.data;
    } catch (error: any) {
      throw new AgentSDKError(
        `Failed to update configuration: ${error.message}`,
        'CONFIG_UPDATE_ERROR',
        agentType
      );
    }
  }

  /**
   * Get agent performance metrics
   */
  async getMetrics(agentType: AgentType, timeRange?: string): Promise<any> {
    try {
      const params = timeRange ? { time_range: timeRange } : {};
      const response = await this.client.get(`/${agentType}/metrics`, { params });
      return response.data;
    } catch (error: any) {
      throw new AgentSDKError(
        `Failed to get metrics: ${error.message}`,
        'METRICS_ERROR',
        agentType
      );
    }
  }

  /**
   * Record execution metrics
   */
  private async recordMetrics(
    agentType: AgentType,
    request: AgentTaskRequest,
    response: AgentTaskResponse,
    executionTime: number
  ): Promise<void> {
    try {
      const metrics = {
        agent_type: agentType,
        task_id: request.task_id,
        workflow_id: request.workflow_id,
        execution_time_ms: executionTime,
        response_time_ms: response.execution_time_ms,
        cost_cents: response.cost_cents,
        confidence_score: response.confidence_score,
        status: response.status,
        timestamp: new Date().toISOString(),
      };

      // Send metrics to monitoring service (non-blocking)
      this.client.post('/metrics', metrics).catch(error => {
        console.warn('[Agent SDK] Failed to record metrics:', error.message);
      });
    } catch (error) {
      console.warn('[Agent SDK] Failed to record metrics:', error);
    }
  }

  /**
   * Batch execute multiple tasks
   */
  async batchExecute(
    requests: Array<{ agentType: AgentType; request: AgentTaskRequest }>
  ): Promise<AgentTaskResponse[]> {
    const promises = requests.map(({ agentType, request }) =>
      this.executeTask(agentType, request).catch(error => ({
        agent_type: agentType,
        task_id: request.task_id,
        execution_id: '',
        status: 'failure' as const,
        result_data: {},
        confidence_score: 0,
        execution_time_ms: 0,
        cost_cents: 0,
        error_message: error.message,
        warnings: [],
        recommendations: [],
        next_suggested_actions: [],
        metadata: {
          agent_version: '1.0.0',
          execution_timestamp: new Date().toISOString(),
        },
      }))
    );

    return Promise.all(promises);
  }
}

// Export singleton instance
export const agentSDK = new BaseAgentSDK();