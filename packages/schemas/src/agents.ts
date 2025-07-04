import { z } from 'zod';

// =====================================================
// AGENT SCHEMAS
// =====================================================

// Agent execution request/response schemas
export const AgentTaskRequest = z.object({
  task_id: z.string(),
  agent_type: z.enum(['nina', 'mia', 'florian', 'rex', 'iris', 'ria', 'kosha', 'cassy', 'max', 'corey']),
  task_type: z.string(),
  context: z.record(z.any()),
  metadata: z.record(z.any()).optional()
});

export const AgentTaskResponse = z.object({
  success: z.boolean(),
  result: z.record(z.any()).optional(),
  error: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  execution_time_ms: z.number().optional()
});

// Agent health check schemas
export const AgentHealthCheck = z.object({
  agent_type: z.enum(['nina', 'mia', 'florian', 'rex', 'iris', 'ria', 'kosha', 'cassy', 'max', 'corey']),
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  response_time_ms: z.number(),
  last_check: z.string(),
  error_message: z.string().optional()
});

// Agent configuration schemas
export const AgentConfiguration = z.object({
  agent_type: z.enum(['nina', 'mia', 'florian', 'rex', 'iris', 'ria', 'kosha', 'cassy', 'max', 'corey']),
  enabled: z.boolean(),
  max_concurrent_tasks: z.number().min(1).max(10),
  timeout_ms: z.number().min(1000).max(300000),
  retry_attempts: z.number().min(0).max(5),
  settings: z.record(z.any()).optional()
});

// Agent coordination schemas
export const AgentCoordinationPlan = z.object({
  workflow_id: z.string(),
  agents: z.array(z.object({
    agent_type: z.enum(['nina', 'mia', 'florian', 'rex', 'iris', 'ria', 'kosha', 'cassy', 'max', 'corey']),
    task_type: z.string(),
    dependencies: z.array(z.string()).optional(),
    estimated_duration_ms: z.number().optional()
  })),
  execution_strategy: z.enum(['sequential', 'parallel', 'conditional']),
  fallback_strategy: z.enum(['retry', 'skip', 'escalate', 'reassign']).optional()
});

export const AgentHandoffRequest = z.object({
  from_agent: z.enum(['nina', 'mia', 'florian', 'rex', 'iris', 'ria', 'kosha', 'cassy', 'max', 'corey']),
  to_agent: z.enum(['nina', 'mia', 'florian', 'rex', 'iris', 'ria', 'kosha', 'cassy', 'max', 'corey']),
  task_id: z.string(),
  context: z.record(z.any()),
  reason: z.string(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL')
});

// Agent performance schemas
export const AgentPerformanceMetrics = z.object({
  agent_type: z.enum(['nina', 'mia', 'florian', 'rex', 'iris', 'ria', 'kosha', 'cassy', 'max', 'corey']),
  period_start: z.string(),
  period_end: z.string(),
  total_tasks: z.number(),
  successful_tasks: z.number(),
  failed_tasks: z.number(),
  average_execution_time_ms: z.number(),
  success_rate: z.number().min(0).max(1),
  availability: z.number().min(0).max(1)
});

// Type exports
export type AgentTaskRequest = z.infer<typeof AgentTaskRequest>;
export type AgentTaskResponse = z.infer<typeof AgentTaskResponse>;
export type AgentHealthCheck = z.infer<typeof AgentHealthCheck>;
export type AgentConfiguration = z.infer<typeof AgentConfiguration>;
export type AgentCoordinationPlan = z.infer<typeof AgentCoordinationPlan>;
export type AgentHandoffRequest = z.infer<typeof AgentHandoffRequest>;
export type AgentPerformanceMetrics = z.infer<typeof AgentPerformanceMetrics>;