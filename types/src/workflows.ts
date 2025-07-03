/**
 * Workflow types for Rexera 2.0
 * Types for workflow definitions, execution, and coordination
 */

import { AgentType, AgentTaskRequest } from './agents';
import { WorkflowType, TaskStatus, PriorityLevel } from './database';

// =====================================================
// WORKFLOW DEFINITION TYPES
// =====================================================

export interface WorkflowDefinition {
  id: string;
  name: string;
  version: string;
  workflow_type: WorkflowType;
  description: string;
  estimated_duration_hours: number;
  estimated_cost_cents: number;
  
  // Task definitions
  tasks: WorkflowTaskDefinition[];
  
  // Flow control
  entry_point: string; // task ID
  exit_conditions: ExitCondition[];
  
  // SLA configuration
  sla_hours: number;
  alert_hours_before: number[];
  is_business_hours_only: boolean;
  
  // Agent coordination
  agent_coordination: AgentCoordinationStrategy;
  
  // Error handling
  error_handling: ErrorHandlingStrategy;
  
  metadata: {
    created_by: string;
    created_at: string;
    last_modified: string;
    tags: string[];
  };
}

export interface WorkflowTaskDefinition {
  id: string;
  name: string;
  description: string;
  task_type: TaskType;
  executor_type: 'AI' | 'HIL';
  estimated_duration_minutes: number;
  estimated_cost_cents: number;
  priority: PriorityLevel;
  
  // Agent assignment
  preferred_agents: AgentType[];
  fallback_agents: AgentType[];
  
  // Dependencies
  dependencies: TaskDependency[];
  
  // Input/Output specification
  input_schema: Record<string, any>;
  output_schema: Record<string, any>;
  
  // Execution configuration
  execution_config: TaskExecutionConfig;
  
  // Conditional logic
  conditions?: TaskCondition[];
  
  // HIL intervention points
  hil_intervention: HilInterventionConfig;
}

export type TaskType = 
  | 'research'
  | 'communication'
  | 'document_processing' 
  | 'portal_navigation'
  | 'data_validation'
  | 'quality_assurance'
  | 'financial_processing'
  | 'hil_review'
  | 'hil_approval'
  | 'automated_action';

export interface TaskDependency {
  task_id: string;
  dependency_type: 'blocking' | 'data' | 'conditional';
  condition?: string; // For conditional dependencies
  data_mapping?: Record<string, string>; // Map output to input
}

export interface TaskExecutionConfig {
  timeout_minutes: number;
  max_retries: number;
  retry_delay_minutes: number;
  auto_approve_threshold?: number; // confidence score threshold
  parallel_execution_allowed: boolean;
  resource_requirements?: {
    cpu_units?: number;
    memory_mb?: number;
    storage_mb?: number;
  };
}

export interface TaskCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'exists';
  value: any;
  action: 'skip' | 'branch' | 'retry' | 'escalate';
  target_task_id?: string; // For branch actions
}

export interface HilInterventionConfig {
  required: boolean;
  trigger_conditions: string[];
  intervention_type: 'review' | 'approval' | 'manual_execution' | 'decision';
  auto_assign_to?: string; // user ID or role
  escalation_minutes?: number;
}

export interface ExitCondition {
  condition: string;
  action: 'complete' | 'fail' | 'retry_workflow';
  reason?: string;
}

// =====================================================
// AGENT COORDINATION STRATEGIES
// =====================================================

export type CoordinationPattern = 
  | 'sequential'
  | 'parallel'
  | 'pipeline'
  | 'fan_out_fan_in'
  | 'conditional_branching'
  | 'feedback_loop'
  | 'hierarchical_review';

export interface AgentCoordinationStrategy {
  pattern: CoordinationPattern;
  configuration: {
    max_parallel_agents?: number;
    load_balancing_strategy?: 'round_robin' | 'least_loaded' | 'capability_based';
    failure_handling?: 'fail_fast' | 'retry_with_fallback' | 'continue_with_partial';
    quality_gates?: QualityGate[];
    coordination_timeouts?: Record<string, number>;
  };
}

export interface QualityGate {
  gate_id: string;
  trigger_after_tasks: string[];
  quality_checks: QualityCheck[];
  pass_threshold: number;
  fail_action: 'retry' | 'escalate' | 'manual_review';
}

export interface QualityCheck {
  check_type: 'confidence_score' | 'data_completeness' | 'format_validation' | 'business_rules';
  parameters: Record<string, any>;
  weight: number;
}

// =====================================================
// ERROR HANDLING STRATEGIES
// =====================================================

export interface ErrorHandlingStrategy {
  global_timeout_hours: number;
  max_workflow_retries: number;
  
  error_categories: ErrorCategory[];
  escalation_rules: EscalationRule[];
  
  fallback_strategies: FallbackStrategy[];
  
  notification_rules: NotificationRule[];
}

export interface ErrorCategory {
  category: string;
  error_patterns: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  auto_retry: boolean;
  max_retries: number;
  retry_delay_minutes: number;
  escalate_after_retries: boolean;
}

export interface EscalationRule {
  trigger_conditions: string[];
  escalation_type: 'automatic_retry' | 'agent_fallback' | 'hil_intervention' | 'workflow_restart';
  target?: string; // agent type or user ID
  delay_minutes: number;
}

export interface FallbackStrategy {
  trigger_conditions: string[];
  fallback_type: 'alternative_agent' | 'manual_execution' | 'simplified_workflow' | 'external_service';
  configuration: Record<string, any>;
}

export interface NotificationRule {
  trigger_events: string[];
  notification_channels: ('email' | 'slack' | 'webhook' | 'dashboard')[];
  recipients: string[];
  template_id?: string;
  delay_minutes?: number;
}

// =====================================================
// WORKFLOW EXECUTION TYPES
// =====================================================

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  workflow_definition_id: string;
  workflow_definition_version: string;
  status: WorkflowExecutionStatus;
  
  // Execution state
  current_tasks: string[];
  completed_tasks: string[];
  failed_tasks: string[];
  
  // Timing
  started_at: string;
  completed_at?: string;
  estimated_completion_at?: string;
  
  // Performance
  execution_metrics: WorkflowMetrics;
  
  // Context
  input_data: Record<string, any>;
  output_data?: Record<string, any>;
  context_data: Record<string, any>;
  
  // Error handling
  errors: WorkflowError[];
  recovery_attempts: RecoveryAttempt[];
  
  // HIL interventions
  hil_interventions: HilIntervention[];
}

export type WorkflowExecutionStatus = 
  | 'initializing'
  | 'running'
  | 'waiting_for_hil'
  | 'paused'
  | 'retrying'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface WorkflowMetrics {
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  execution_time_ms: number;
  total_cost_cents: number;
  agent_execution_time_ms: Record<AgentType, number>;
  agent_costs_cents: Record<AgentType, number>;
  quality_scores: Record<string, number>;
  sla_compliance: boolean;
  efficiency_score: number;
}

export interface WorkflowError {
  id: string;
  task_id?: string;
  agent_type?: AgentType;
  error_code: string;
  error_message: string;
  error_category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  context: Record<string, any>;
  stack_trace?: string;
  resolution_status: 'unresolved' | 'retrying' | 'escalated' | 'resolved';
}

export interface RecoveryAttempt {
  id: string;
  error_id: string;
  recovery_strategy: string;
  attempted_at: string;
  completed_at?: string;
  success: boolean;
  result?: Record<string, any>;
  notes?: string;
}

export interface HilIntervention {
  id: string;
  task_id: string;
  intervention_type: 'review' | 'approval' | 'manual_execution' | 'decision' | 'error_resolution';
  assigned_to: string;
  requested_at: string;
  responded_at?: string;
  response_data?: Record<string, any>;
  resolution: 'approved' | 'rejected' | 'modified' | 'escalated';
  notes?: string;
}

// =====================================================
// DUAL-LAYER ARCHITECTURE TYPES
// =====================================================

export interface TechnicalLayer {
  // n8n orchestration layer
  n8n_workflow_id: string;
  n8n_execution_id: string;
  n8n_status: 'waiting' | 'running' | 'success' | 'error' | 'canceled';
  
  // Node-level execution tracking
  current_nodes: string[];
  completed_nodes: string[];
  failed_nodes: string[];
  
  // Technical coordination
  webhook_endpoints: Record<string, string>;
  api_calls_made: number;
  data_transformations: Record<string, any>;
  
  // Error handling at technical level
  technical_errors: TechnicalError[];
  retry_attempts: number;
}

export interface BusinessLayer {
  // Business-level workflow tracking
  business_status: 'pending' | 'in_progress' | 'review_required' | 'completed' | 'escalated';
  
  // Business milestones
  milestones: BusinessMilestone[];
  deliverables: BusinessDeliverable[];
  
  // Client-facing information
  client_status: string;
  progress_percentage: number;
  next_expected_update: string;
  
  // Business metrics
  business_value_delivered: number;
  client_satisfaction_score?: number;
  business_impact_metrics: Record<string, number>;
}

export interface TechnicalError {
  node_id: string;
  error_type: 'timeout' | 'api_error' | 'data_error' | 'configuration_error';
  error_message: string;
  timestamp: string;
  retry_count: number;
}

export interface BusinessMilestone {
  id: string;
  name: string;
  description: string;
  target_date: string;
  completed_date?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'missed';
  dependencies: string[];
}

export interface BusinessDeliverable {
  id: string;
  name: string;
  type: 'document' | 'data' | 'report' | 'communication';
  status: 'pending' | 'in_progress' | 'review' | 'delivered';
  delivery_date?: string;
  client_approved?: boolean;
  location?: string; // file path or URL
}

// =====================================================
// WORKFLOW TEMPLATES
// =====================================================

export interface WorkflowTemplate {
  id: string;
  name: string;
  workflow_type: WorkflowType;
  description: string;
  version: string;
  
  // Template configuration
  is_active: boolean;
  is_default: boolean;
  client_restrictions?: string[]; // Client IDs that can use this template
  
  // Template data
  template_definition: WorkflowDefinition;
  default_values: Record<string, any>;
  variable_fields: TemplateVariable[];
  
  // Usage tracking
  usage_count: number;
  success_rate: number;
  average_completion_time_hours: number;
  
  metadata: {
    created_by: string;
    created_at: string;
    last_used: string;
    tags: string[];
  };
}

export interface TemplateVariable {
  field_name: string;
  field_type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  is_required: boolean;
  default_value?: any;
  validation_rules?: Record<string, any>;
  description: string;
  example_value?: any;
}

// =====================================================
// WORKFLOW MONITORING TYPES
// =====================================================

export interface WorkflowMonitoring {
  workflow_id: string;
  monitoring_rules: MonitoringRule[];
  alerts: WorkflowAlert[];
  performance_thresholds: PerformanceThreshold[];
}

export interface MonitoringRule {
  rule_id: string;
  rule_type: 'sla_breach' | 'cost_overrun' | 'quality_degradation' | 'agent_failure' | 'stuck_workflow';
  conditions: Record<string, any>;
  check_interval_minutes: number;
  alert_channels: string[];
  auto_actions?: string[];
}

export interface WorkflowAlert {
  id: string;
  alert_type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  details: Record<string, any>;
  created_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
  acknowledged_by?: string;
}

export interface PerformanceThreshold {
  metric_name: string;
  threshold_type: 'max' | 'min' | 'range';
  threshold_value: number;
  threshold_range?: [number, number];
  alert_on_breach: boolean;
  auto_scale_on_breach?: boolean;
}

// =====================================================
// UTILITY TYPES
// =====================================================

export interface WorkflowContext {
  workflow_id: string;
  client_id: string;
  user_id: string;
  environment: 'development' | 'staging' | 'production';
  feature_flags: Record<string, boolean>;
  global_variables: Record<string, any>;
}

export interface WorkflowState {
  current_step: string;
  completed_steps: string[];
  step_data: Record<string, any>;
  accumulated_results: Record<string, any>;
  intermediate_outputs: Record<string, any>;
}

export type WorkflowEventType = 
  | 'workflow_started'
  | 'workflow_completed'
  | 'workflow_failed'
  | 'task_started'
  | 'task_completed'
  | 'task_failed'
  | 'hil_intervention_required'
  | 'sla_warning'
  | 'sla_breach'
  | 'quality_gate_failed'
  | 'agent_error'
  | 'workflow_paused'
  | 'workflow_resumed';

export interface WorkflowEvent {
  event_type: WorkflowEventType;
  workflow_id: string;
  task_id?: string;
  agent_type?: AgentType;
  timestamp: string;
  event_data: Record<string, any>;
  correlation_id?: string;
}