/**
 * AI Agent types for Rexera 2.0
 * Types for the 10 specialized AI agents and their coordination
 */

import type { AgentType } from './enums';

// =====================================================
// AGENT TYPES AND CAPABILITIES
// =====================================================

export type AgentStatus = 'online' | 'offline' | 'busy' | 'error' | 'maintenance';

export type TaskComplexity = 'simple' | 'moderate' | 'complex';

// =====================================================
// AGENT INTERFACES
// =====================================================

export interface BaseAgent {
  type: AgentType;
  name: string;
  description: string;
  capabilities: string[];
  supported_task_types: string[];
  max_concurrent_tasks: number;
  estimated_cost_per_task: number; // in cents
  api_endpoint: string;
  api_version: string;
}

// 🔍 Nina - Research & Data Discovery Agent
export interface NinaAgent extends BaseAgent {
  type: 'nina';
  capabilities: [
    'contact_research',
    'property_research',
    'company_research',
    'municipal_research',
    'web_search',
    'data_validation'
  ];
}

// 📧 Mia - Email Communication Agent  
export interface MiaAgent extends BaseAgent {
  type: 'mia';
  capabilities: [
    'email_composition',
    'email_sending',
    'email_parsing',
    'template_generation',
    'follow_up_scheduling',
    'sentiment_analysis'
  ];
}

// 🗣️ Florian - Phone Outreach Agent
export interface FlorianAgent extends BaseAgent {
  type: 'florian';
  capabilities: [
    'phone_calls',
    'voicemail_analysis',
    'call_scheduling',
    'conversation_transcription',
    'call_summarization',
    'phone_number_validation'
  ];
}

// 🌐 Rex - Web Portal Navigation Agent
export interface RexAgent extends BaseAgent {
  type: 'rex';
  capabilities: [
    'portal_login',
    'form_filling',
    'document_download',
    'status_checking',
    'data_extraction',
    'captcha_solving'
  ];
}

// 📄 Iris - Document Processing Agent
export interface IrisAgent extends BaseAgent {
  type: 'iris';
  capabilities: [
    'ocr_processing',
    'document_classification',
    'data_extraction',
    'document_validation',
    'format_conversion',
    'content_analysis'
  ];
}

// 👩‍💼 Ria - Client Communication Agent
export interface RiaAgent extends BaseAgent {
  type: 'ria';
  capabilities: [
    'client_updates',
    'status_reporting',
    'issue_escalation',
    'client_onboarding',
    'satisfaction_monitoring',
    'communication_routing'
  ];
}

// 💰 Kosha - Financial Tracking Agent
export interface KoshaAgent extends BaseAgent {
  type: 'kosha';
  capabilities: [
    'cost_tracking',
    'invoice_generation',
    'payment_processing',
    'budget_monitoring',
    'financial_reporting',
    'expense_categorization'
  ];
}

// ✓ Cassy - Quality Assurance Agent
export interface CassyAgent extends BaseAgent {
  type: 'cassy';
  capabilities: [
    'data_validation',
    'quality_scoring',
    'error_detection',
    'compliance_checking',
    'review_coordination',
    'audit_trail_analysis'
  ];
}

// 📞 Max - IVR Navigation Agent
export interface MaxAgent extends BaseAgent {
  type: 'max';
  capabilities: [
    'ivr_navigation',
    'automated_calling',
    'menu_option_selection',
    'hold_time_management',
    'call_transfer_handling',
    'dtmf_input'
  ];
}

// 🏢 Corey - HOA Specialist Agent
export interface CoreyAgent extends BaseAgent {
  type: 'corey';
  capabilities: [
    'hoa_document_analysis',
    'bylaw_interpretation',
    'fee_calculation',
    'compliance_checking',
    'hoa_contact_research',
    'governing_document_review'
  ];
}

// =====================================================
// AGENT EXECUTION TYPES
// =====================================================

export interface AgentTaskRequest {
  agent_type: AgentType;
  task_id: string;
  workflow_id: string;
  task_type: string;
  complexity: TaskComplexity;
  input_data: Record<string, any>;
  context: {
    workflow_context?: Record<string, any>;
    previous_results?: Record<string, any>;
    user_preferences?: Record<string, any>;
  };
  constraints?: {
    max_execution_time?: number; // milliseconds
    max_cost?: number; // cents
    retry_attempts?: number;
  };
  priority: 'low' | 'normal' | 'high' | 'urgent';
  deadline?: string;
}

export interface AgentTaskResponse {
  agent_type: AgentType;
  task_id: string;
  execution_id: string;
  status: 'success' | 'partial_success' | 'failure' | 'timeout';
  result_data: Record<string, any>;
  confidence_score: number; // 0-1
  execution_time_ms: number;
  cost_cents: number;
  error_message?: string;
  warnings?: string[];
  recommendations?: string[];
  next_suggested_actions?: string[];
  metadata: {
    agent_version: string;
    execution_timestamp: string;
    resource_usage?: Record<string, any>;
  };
}

// =====================================================
// AGENT COORDINATION TYPES
// =====================================================

export interface AgentCoordinationPlan {
  workflow_id: string;
  task_id: string;
  coordination_type: 'sequential' | 'parallel' | 'conditional' | 'feedback_loop';
  agents: {
    agent_type: AgentType;
    execution_order: number;
    dependencies: AgentType[];
    input_mapping: Record<string, string>; // Map output from previous agent to input
    conditions?: string[]; // Conditions for execution
  }[];
  fallback_strategy?: {
    trigger_conditions: string[];
    fallback_agents: AgentType[];
    escalation_rules: string[];
  };
}

export interface AgentHandoffRequest {
  from_agent: AgentType;
  to_agent: AgentType;
  task_id: string;
  workflow_id: string;
  handoff_data: Record<string, any>;
  handoff_reason: 'task_complete' | 'capability_limit' | 'error_recovery' | 'optimization';
  context_data: Record<string, any>;
}

export interface AgentCollaborationRequest {
  primary_agent: AgentType;
  supporting_agents: AgentType[];
  collaboration_type: 'review' | 'validation' | 'enhancement' | 'verification';
  task_id: string;
  workflow_id: string;
  collaboration_data: Record<string, any>;
}

// =====================================================
// AGENT PERFORMANCE TYPES
// =====================================================

export interface AgentPerformanceMetrics {
  agent_type: AgentType;
  time_period: {
    start: string;
    end: string;
  };
  execution_stats: {
    total_executions: number;
    successful_executions: number;
    failed_executions: number;
    average_execution_time_ms: number;
    average_confidence_score: number;
    total_cost_cents: number;
  };
  quality_metrics: {
    accuracy_rate: number;
    error_rate: number;
    retry_rate: number;
    escalation_rate: number;
  };
  efficiency_metrics: {
    tasks_per_hour: number;
    cost_per_task: number;
    resource_utilization: number;
  };
}

export interface AgentHealthCheck {
  agent_type: AgentType;
  status: AgentStatus;
  last_health_check: string;
  response_time_ms: number;
  error_rate_24h: number;
  current_load: number; // 0-1 scale
  available_capacity: number;
  alerts: {
    level: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    timestamp: string;
  }[];
}

// =====================================================
// AGENT CONFIGURATION TYPES
// =====================================================

export interface AgentConfiguration {
  agent_type: AgentType;
  config_version: string;
  parameters: {
    timeout_ms: number;
    max_retries: number;
    rate_limit_per_minute: number;
    cost_limit_per_task_cents: number;
    confidence_threshold: number;
  };
  model_settings?: {
    model_name: string;
    model_version: string;
    temperature: number;
    max_tokens: number;
    custom_prompts?: Record<string, string>;
  };
  integration_settings: {
    api_key_name: string;
    endpoint_overrides?: Record<string, string>;
    webhook_urls?: Record<string, string>;
  };
  feature_flags: Record<string, boolean>;
}

// =====================================================
// WORKFLOW-SPECIFIC AGENT TYPES
// =====================================================

// Municipal Lien Search specific types
export interface MunicipalLienAgentTask {
  property_address: string;
  county: string;
  state: string;
  parcel_id?: string;
  search_types: ('taxes' | 'liens' | 'assessments' | 'utilities')[];
  search_depth: 'surface' | 'standard' | 'comprehensive';
}

// HOA Acquisition specific types
export interface HoaAcquisitionAgentTask {
  property_address: string;
  hoa_name?: string;
  management_company?: string;
  document_types: ('bylaws' | 'ccrs' | 'budget' | 'financials' | 'minutes')[];
  urgency: 'standard' | 'rush' | 'emergency';
}

// Payoff Request specific types
export interface PayoffRequestAgentTask {
  loan_number: string;
  lender_name: string;
  borrower_info: {
    name: string;
    address: string;
    phone?: string;
    email?: string;
  };
  property_address: string;
  requested_payoff_date: string;
  contact_methods: ('portal' | 'phone' | 'email' | 'fax')[];
}

// =====================================================
// AGENT SDK TYPES
// =====================================================

export interface AgentSDKConfig {
  base_url: string;
  api_key: string;
  timeout_ms: number;
  retry_attempts: number;
  rate_limit_per_minute: number;
  enable_logging: boolean;
  enable_metrics: boolean;
}

export interface AgentExecutionContext {
  workflow_id: string;
  task_id: string;
  user_id: string;
  client_id: string;
  execution_environment: 'development' | 'staging' | 'production';
  feature_flags: Record<string, boolean>;
  debug_mode: boolean;
}

export interface AgentExecutionResult {
  success: boolean;
  result?: any;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  metrics: {
    execution_time_ms: number;
    cost_cents: number;
    confidence_score: number;
    resource_usage: Record<string, any>;
  };
  recommendations: string[];
  next_actions: string[];
}

// =====================================================
// UTILITY TYPES
// =====================================================

export type AnyAgent = 
  | NinaAgent 
  | MiaAgent 
  | FlorianAgent 
  | RexAgent 
  | IrisAgent 
  | RiaAgent 
  | KoshaAgent 
  | CassyAgent 
  | MaxAgent 
  | CoreyAgent;

export type AgentRegistry = {
  [K in AgentType]: AnyAgent;
}

export interface AgentCapabilityMap {
  [capability: string]: AgentType[];
}

export interface AgentLoadBalancer {
  get_available_agent(agent_type: AgentType): Promise<string>; // returns agent instance ID
  get_agent_load(agent_type: AgentType): Promise<number>;
  route_task(task: AgentTaskRequest): Promise<string>; // returns assigned agent instance ID
}