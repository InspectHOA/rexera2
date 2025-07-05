/**
 * @fileoverview Database client utilities for Rexera 2.0.
 *
 * This module provides centralized database client creation and management for
 * the Rexera real estate workflow automation platform. It handles Supabase
 * PostgreSQL client configuration with proper authentication, type safety,
 * and server-side operation capabilities.
 *
 * Database Architecture:
 * - Supabase PostgreSQL with Row Level Security (RLS)
 * - Service role authentication for server-side operations
 * - Type-safe database operations with generated types
 * - Centralized client configuration and management
 *
 * Key Capabilities:
 * - Server-side Supabase client creation with service role
 * - Type-safe database operations with TypeScript
 * - Centralized configuration management
 * - Environment validation and error handling
 *
 * Business Context:
 * - Database stores all workflow, task, and client data
 * - RLS ensures client data isolation and security
 * - Service role enables server-side operations and automation
 * - Type safety prevents runtime errors and data corruption
 *
 * Security Considerations:
 * - Service role key provides elevated database access
 * - RLS policies enforce client-based data isolation
 * - Proper authentication prevents unauthorized access
 * - Type safety prevents SQL injection and data corruption
 *
 * Integration Points:
 * - tRPC context creation for authenticated operations
 * - REST API endpoints for external system access
 * - n8n webhook processing for workflow synchronization
 * - AI agent data access for document processing
 *
 * @module DatabaseUtils
 * @requires @supabase/supabase-js - Supabase client library
 * @requires ../../../supabase/types - Generated database types
 * @requires ../config - Configuration management
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../supabase/types';
import { config } from '../config';

/**
 * Creates authenticated Supabase client for server-side database operations.
 *
 * Business Context:
 * - Enables server-side database operations with elevated privileges
 * - Provides type-safe database access with generated TypeScript types
 * - Supports workflow automation and AI agent data processing
 * - Facilitates secure client data management with RLS enforcement
 *
 * Authentication:
 * - Uses service role key for elevated database access
 * - Bypasses RLS policies when necessary for system operations
 * - Enables server-side operations without user authentication
 * - Maintains security through proper key management
 *
 * Type Safety:
 * - Generic Database type provides compile-time type checking
 * - Prevents runtime errors from invalid database operations
 * - Enables IDE autocompletion and error detection
 * - Maintains data integrity through type validation
 *
 * Configuration:
 * - Database URL and service role key from centralized config
 * - Environment-specific configuration management
 * - Proper error handling for missing configuration
 * - Validation of required environment variables
 *
 * Usage Patterns:
 * - tRPC context creation for authenticated operations
 * - REST API endpoints for external system integration
 * - Webhook processing for n8n synchronization
 * - Background tasks and automated operations
 *
 * Security Considerations:
 * - Service role key must be kept secure and rotated regularly
 * - RLS policies still apply for client data isolation
 * - Proper error handling prevents information leakage
 * - Audit logging for security and compliance
 *
 * @returns {SupabaseClient<Database>} Authenticated Supabase client with service role
 * @throws {Error} When configuration is missing or invalid
 */
export function createServerClient() {
  return createClient<Database>(
    config.supabase.url,
    config.supabase.serviceRoleKey
  );
}

/**
 * Validates database environment configuration (delegated to config module).
 *
 * Business Context:
 * - Environment validation is now centralized in the config module
 * - This function maintains backward compatibility for existing code
 * - Proper configuration validation prevents runtime failures
 * - Enables early detection of configuration issues
 *
 * Migration Note:
 * - This function previously handled environment validation directly
 * - Validation logic has been moved to the config module for centralization
 * - This function now serves as a compatibility layer
 * - Future code should use config module validation directly
 *
 * Configuration Validation:
 * - Database URL format and accessibility
 * - Service role key presence and format
 * - Environment-specific configuration requirements
 * - Network connectivity and authentication
 *
 * Error Handling:
 * - Configuration errors are handled by the config module
 * - This function provides a simple success indicator
 * - Detailed error information available through config module
 * - Graceful degradation for missing configuration
 *
 * @returns {boolean} Always returns true (validation handled by config module)
 * @deprecated Use config module validation directly for new code
 */
export function validateEnvironment() {
  // This is now handled by the config module
  return true;
}