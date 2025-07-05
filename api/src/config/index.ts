/**
 * @fileoverview Central configuration management for Rexera 2.0 API backend.
 *
 * This module provides centralized configuration management for all aspects of
 * the Rexera platform, including database connections, external integrations,
 * security settings, and environment-specific configurations. It ensures
 * consistent configuration access across the entire application.
 *
 * Configuration Sources:
 * - Environment variables from deployment platforms (Vercel, Docker, etc.)
 * - .env.local files for local development overrides
 * - .env files for default development settings
 * - Hardcoded fallbacks for non-critical settings
 *
 * Security Features:
 * - Validates required environment variables at startup
 * - Separates sensitive configuration (API keys, secrets)
 * - Provides type-safe configuration access
 * - Prevents accidental exposure of sensitive data
 *
 * Business Context:
 * - Supports multi-environment deployments (dev, staging, production)
 * - Enables feature flags and environment-specific behavior
 * - Configures external service integrations (Supabase, n8n)
 * - Manages security policies and rate limiting
 *
 * @module Config
 * @requires dotenv - Environment variable loading and management
 */

import dotenv from 'dotenv';

/**
 * Environment variable loading with development override support.
 *
 * Loading Priority:
 * 1. .env.local - Local development overrides (gitignored)
 * 2. .env - Default development settings (committed)
 * 3. Process environment - Deployment platform variables
 *
 * This approach allows developers to override settings locally without
 * affecting team configurations or accidentally committing secrets.
 */
dotenv.config({ path: '.env.local' });
dotenv.config(); // Fallback to .env

/**
 * Centralized configuration object with all application settings.
 *
 * Configuration is organized by functional area for maintainability
 * and includes comprehensive defaults for development environments.
 */
export const config = {
  /**
   * Server Configuration
   * Controls HTTP server behavior and environment detection.
   */
  port: parseInt(process.env.PORT || '3002'),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  /**
   * CORS (Cross-Origin Resource Sharing) Configuration
   * Defines which frontend domains can access the API.
   *
   * Security: Restricts API access to authorized frontend applications
   * Development: Includes localhost for local development
   * Production: Should be limited to actual frontend domains
   */
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'https://rexera-frontend.vercel.app'
  ],
  
  /**
   * Supabase Database Configuration
   * PostgreSQL database connection and authentication settings.
   *
   * Service Role Key: Bypasses RLS for server-side operations
   * URL: Supabase project endpoint for database connections
   *
   * Security: Service role key provides full database access
   * Usage: Required for all database operations in the API
   */
  supabase: {
    url: process.env.SUPABASE_URL!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  },
  
  /**
   * Authentication Configuration
   * Internal API security and access control settings.
   *
   * Internal API Key: Shared secret for service-to-service communication
   * Used for: n8n webhooks, internal service calls, admin operations
   */
  auth: {
    internalApiKey: process.env.INTERNAL_API_KEY!,
  },
  
  /**
   * Rate Limiting Configuration
   * Protects API from abuse and ensures fair resource usage.
   *
   * Window: Time period for rate limit calculation (15 minutes default)
   * Max Requests: Maximum requests per window per client
   *
   * Business Impact: Prevents API abuse while allowing normal usage
   * Security: Protects against DoS attacks and resource exhaustion
   */
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },
  
  /**
   * Logging Configuration
   * Controls application logging verbosity and output.
   *
   * Levels: error, warn, info, debug, trace
   * Production: Should use 'warn' or 'error' for performance
   * Development: Can use 'debug' or 'info' for detailed output
   */
  logLevel: process.env.LOG_LEVEL || 'info',
  
  /**
   * Environment Detection Flags
   * Convenient boolean flags for environment-specific behavior.
   *
   * Usage: Conditional features, error handling, security policies
   * Development: Enables detailed errors, relaxed security
   * Production: Enforces strict security, minimal error exposure
   */
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  /**
   * API Configuration
   * Self-referential API settings for internal operations.
   *
   * Base URL: Used for webhook callbacks and internal API calls
   * Version: API versioning for backward compatibility
   */
  api: {
    baseUrl: process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3002}`,
    version: 'v1',
  },

  /**
   * n8n Cloud Integration Configuration
   * Settings for automated workflow orchestration platform.
   *
   * API Key: Authentication for n8n Cloud API calls
   * Base URL: n8n instance endpoint (cloud or self-hosted)
   * Webhook URL: Callback endpoint for n8n to send events
   * Webhook Secret: Shared secret for webhook authentication
   * Payoff Workflow ID: Specific workflow for loan payoff automation
   *
   * Business Context:
   * - Enables automated loan payoff processing
   * - Coordinates with AI agents for document processing
   * - Provides real-time workflow status updates
   * - Supports scalable automation without manual intervention
   *
   * Integration Pattern:
   * - Rexera triggers n8n workflows via API
   * - n8n sends status updates via webhooks
   * - Bidirectional synchronization maintains consistency
   */
  n8n: {
    apiKey: process.env.N8N_API_KEY || '',
    baseUrl: process.env.N8N_BASE_URL || 'http://localhost:5678',
    webhookUrl: process.env.N8N_WEBHOOK_URL || '',
    webhookSecret: process.env.N8N_WEBHOOK_SECRET || '',
    payoffWorkflowId: process.env.N8N_PAYOFF_WORKFLOW_ID || '',
  }
};

/**
 * Validates required environment variables to ensure proper application startup.
 *
 * Business Context:
 * - Prevents application startup with incomplete configuration
 * - Provides clear error messages for deployment issues
 * - Ensures critical services (database, authentication) are properly configured
 * - Supports rapid troubleshooting of configuration problems
 *
 * Validation Strategy:
 * - Checks only absolutely critical environment variables
 * - Fails fast with descriptive error messages
 * - Lists all missing variables for efficient debugging
 * - Prevents partial functionality that could cause data issues
 *
 * Required Variables:
 * - SUPABASE_URL: Database connection endpoint (critical for all operations)
 * - SUPABASE_SERVICE_ROLE_KEY: Database authentication (critical for data access)
 * - INTERNAL_API_KEY: Service authentication (critical for security)
 *
 * Optional Variables:
 * - n8n configuration: Gracefully degrades to manual processing
 * - Rate limiting: Uses sensible defaults
 * - CORS origins: Uses development defaults
 *
 * Error Handling:
 * - Throws immediately on missing critical variables
 * - Provides complete list of missing variables
 * - Enables rapid deployment issue resolution
 *
 * @throws Error when required environment variables are missing
 */
export function validateConfig() {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'INTERNAL_API_KEY'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Initialize configuration validation at module load time.
 *
 * This ensures that configuration issues are detected immediately
 * when the application starts, rather than failing later during
 * runtime when services attempt to use missing configuration.
 *
 * Startup Behavior:
 * - Validates configuration before any services initialize
 * - Provides immediate feedback for deployment issues
 * - Prevents partial application startup with broken functionality
 * - Enables rapid identification of configuration problems
 */
validateConfig();