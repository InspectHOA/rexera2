/**
 * External service interface types for Rexera 2.0
 * Types for interfacing with third-party services like Supabase, Stripe, etc.
 */

// Re-export Supabase types
export * from './supabase';
export type { Database } from './supabase';

// =====================================================
// SUPABASE SPECIFIC TYPES
// =====================================================

export interface SupabaseAuthUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
  app_metadata?: Record<string, any>;
}

export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user: SupabaseAuthUser;
}

// =====================================================
// STRIPE TYPES (if needed)
// =====================================================

export interface StripeCustomer {
  id: string;
  email?: string;
  name?: string;
  metadata?: Record<string, string>;
}

export interface StripeSubscription {
  id: string;
  customer: string;
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid';
  current_period_start: number;
  current_period_end: number;
}

// =====================================================
// N8N WORKFLOW TYPES
// =====================================================

export interface N8nWorkflowExecution {
  id: string;
  workflowId: string;
  mode: 'manual' | 'trigger' | 'webhook';
  status: 'running' | 'success' | 'failed' | 'canceled';
  startedAt: string;
  finishedAt?: string;
  data?: Record<string, any>;
}

export interface N8nWebhookPayload {
  workflowId: string;
  executionId: string;
  data: Record<string, any>;
  metadata?: Record<string, any>;
}

// =====================================================
// EMAIL SERVICE TYPES
// =====================================================

export interface EmailServiceConfig {
  provider: 'sendgrid' | 'mailgun' | 'ses';
  apiKey: string;
  fromEmail: string;
  fromName: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables: string[];
}

// =====================================================
// PHONE SERVICE TYPES
// =====================================================

export interface PhoneServiceConfig {
  provider: 'twilio' | 'bandwidth';
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

export interface IvrFlow {
  id: string;
  name: string;
  steps: IvrStep[];
}

export interface IvrStep {
  id: string;
  type: 'menu' | 'collect' | 'say' | 'transfer';
  prompt: string;
  options?: Record<string, string>;
  nextStep?: string;
}