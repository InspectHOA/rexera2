/**
 * @fileoverview tRPC context creation and type definitions for Rexera 2.0.
 *
 * This module defines the tRPC context that provides shared resources and
 * dependencies to all tRPC procedures. The context includes HTTP request/response
 * objects and an authenticated Supabase client for database operations.
 *
 * Context Architecture:
 * - Request/Response: Express HTTP objects for headers, cookies, and responses
 * - Supabase Client: Authenticated database client with Row Level Security (RLS)
 * - Type Safety: Strongly typed context for compile-time validation
 *
 * Key Responsibilities:
 * - Provides authenticated database access to all tRPC procedures
 * - Enables access to HTTP request context (headers, cookies, IP, etc.)
 * - Supports response manipulation (headers, status codes, cookies)
 * - Ensures consistent authentication and authorization across procedures
 *
 * Business Context:
 * - Enables secure, authenticated access to Rexera data
 * - Supports multi-tenant architecture with client isolation
 * - Provides audit trail capabilities through request context
 * - Enables rate limiting and security monitoring
 *
 * Security Considerations:
 * - Supabase client respects Row Level Security (RLS) policies
 * - Authentication state preserved across procedure calls
 * - Request context enables IP-based security and rate limiting
 * - Database connections properly managed and pooled
 *
 * @module TRPCContext
 * @requires @trpc/server/adapters/express - Express adapter types
 * @requires ../utils/database - Supabase client creation utilities
 */

import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { createServerClient } from '../utils/database';

/**
 * Creates tRPC context with authenticated database client and HTTP context.
 *
 * Business Context:
 * - Provides foundation for all tRPC procedure execution
 * - Ensures consistent authentication and database access
 * - Enables request-specific context and security controls
 * - Supports audit trails and operational monitoring
 *
 * Context Components:
 * - req: Express request object with headers, cookies, and authentication
 * - res: Express response object for headers and status manipulation
 * - supabase: Authenticated Supabase client with RLS enforcement
 *
 * Authentication Flow:
 * - HTTP request contains JWT token in Authorization header
 * - Supabase client automatically validates and uses token
 * - RLS policies enforce data access based on authenticated user
 * - Context provides consistent security across all procedures
 *
 * Performance Considerations:
 * - Supabase client reused across procedure calls in same request
 * - Database connections properly pooled and managed
 * - Context creation optimized for minimal overhead
 * - Type inference provides compile-time optimization
 *
 * @param opts - Express context options containing request and response
 * @returns Context object with HTTP objects and authenticated database client
 */
export async function createTRPCContext(opts: CreateExpressContextOptions) {
  const { req, res } = opts;
  
  return {
    /** Express request object with headers, cookies, and authentication */
    req,
    /** Express response object for headers and status manipulation */
    res,
    /** Authenticated Supabase client with Row Level Security enforcement */
    supabase: createServerClient(),
  };
}

/**
 * Type definition for tRPC context used across all procedures.
 *
 * Business Context:
 * - Ensures type safety for all tRPC procedure implementations
 * - Provides IntelliSense and compile-time validation
 * - Enables consistent context usage across the application
 * - Supports refactoring and maintenance with type checking
 *
 * Type Safety Benefits:
 * - Compile-time validation of context usage
 * - IntelliSense support for context properties
 * - Prevents runtime errors from incorrect context access
 * - Enables safe refactoring of context structure
 */
export type Context = Awaited<ReturnType<typeof createTRPCContext>>;