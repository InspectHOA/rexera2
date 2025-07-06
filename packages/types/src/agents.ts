/**
 * Simplified agent types for Rexera 2.0
 * Basic types for agent status and metadata
 */

import type { AgentType } from './enums';

// =====================================================
// BASIC AGENT TYPES
// =====================================================

/**
 * Agent status for monitoring and coordination
 */
export type AgentStatus = 'online' | 'offline' | 'busy' | 'error' | 'maintenance';

/**
 * Basic agent instance - represents an agent in the system
 */
export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  description: string;
  status: AgentStatus;
  api_endpoint?: string;
  capabilities: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  last_health_check?: string;
}

/**
 * Agent task assignment
 */
export interface AgentTask {
  id: string;
  agent_name: string;
  task_type: string;
  workflow_id: string;
  status: AgentTaskStatus;
  input_data: Record<string, any>;
  output_data?: Record<string, any>;
  error_message?: string;
  started_at: string;
  completed_at?: string;
  execution_time_ms?: number;
}

/**
 * Agent task status
 */
export type AgentTaskStatus =
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'timeout';

// =====================================================
// AGENT METRICS & MONITORING
// =====================================================

/**
 * Basic agent performance metrics
 */
export interface AgentMetrics {
  agent_name: string;
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  average_execution_time_ms: number;
  success_rate: number;
  last_activity: string;
}

/**
 * Agent health check response
 */
export interface AgentHealthCheck {
  agent_name: string;
  status: AgentStatus;
  response_time_ms: number;
  version: string;
  timestamp: string;
  errors?: string[];
}