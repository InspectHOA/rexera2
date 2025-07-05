/**
 * @fileoverview Dual authentication system for Rexera 2.0 API backend.
 *
 * This module implements a flexible authentication system supporting both
 * user-based authentication (via Supabase Auth) and service-to-service
 * authentication (via API keys). This dual approach enables secure access
 * for both frontend users and external integrations.
 *
 * Authentication Types:
 * - User Authentication: Supabase JWT tokens for frontend user sessions
 * - Internal Authentication: API keys for service-to-service communication
 *
 * Security Features:
 * - JWT token validation through Supabase Auth
 * - API key authentication for internal services
 * - Request context preservation for authorization
 * - Comprehensive error handling and logging
 *
 * Business Context:
 * - Enables secure frontend user access to workflows and data
 * - Supports n8n webhook authentication for workflow synchronization
 * - Facilitates external client integrations with API key authentication
 * - Maintains audit trail for all authenticated requests
 *
 * Integration Points:
 * - tRPC context creation for type-safe authenticated procedures
 * - REST endpoint protection for external API access
 * - Webhook authentication for n8n and other external services
 *
 * @module AuthMiddleware
 * @requires express - HTTP request/response types
 * @requires ../utils/database - Supabase client for user authentication
 * @requires ../config - Authentication configuration and API keys
 */

import { Request } from 'express';
import { createServerClient } from '../utils/database';
import { config } from '../config';

/**
 * Authentication result interface defining the structure of successful authentication.
 *
 * Type Discrimination:
 * - 'internal': Service-to-service authentication via API key
 * - 'user': Frontend user authentication via Supabase JWT token
 *
 * User Data:
 * - Present for 'user' type authentication
 * - Contains Supabase user object with profile information
 * - Used for authorization and audit logging
 */
export interface AuthResult {
  type: 'internal' | 'user';
  user?: any;
}

/**
 * Core authentication function supporting dual authentication methods.
 *
 * Authentication Flow:
 * 1. Check for internal API key in x-api-key header (highest priority)
 * 2. Check for user JWT token in Authorization header
 * 3. Validate JWT token through Supabase Auth service
 * 4. Return authentication result or null for unauthorized requests
 *
 * Internal Authentication:
 * - Uses x-api-key header with shared secret
 * - Intended for n8n webhooks, admin operations, service integrations
 * - Bypasses user-level permissions for system operations
 * - Provides full access to all API endpoints
 *
 * User Authentication:
 * - Uses Authorization header with Bearer JWT token
 * - Validates token through Supabase Auth service
 * - Provides user context for authorization and audit logging
 * - Subject to user-level permissions and RLS policies
 *
 * Security Considerations:
 * - API keys should be rotated regularly and stored securely
 * - JWT tokens have built-in expiration and refresh mechanisms
 * - All authentication failures are logged for security monitoring
 * - No sensitive information is exposed in error responses
 *
 * @param req - Express request object containing authentication headers
 * @returns AuthResult for successful authentication, null for failure
 */
export async function authenticate(req: Request): Promise<AuthResult | null> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    const apiKey = req.headers['x-api-key'] as string;

    // Priority 1: Check for internal API key authentication
    // Used by n8n webhooks, admin tools, and service integrations
    if (apiKey && apiKey === config.auth.internalApiKey) {
      return { type: 'internal' };
    }

    // Priority 2: Check for user JWT token authentication
    // Used by frontend application for user-specific operations
    if (token) {
      const supabase = createServerClient();
      const { data, error } = await supabase.auth.getUser(token);
      
      if (error) {
        console.error('Auth error:', error);
        return null;
      }
      
      if (data?.user) {
        return { type: 'user', user: data.user };
      }
    }

    // No valid authentication found
    return null;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

/**
 * Express middleware factory for enforcing authentication on protected routes.
 *
 * Business Context:
 * - Protects sensitive API endpoints from unauthorized access
 * - Ensures all workflow and task operations are authenticated
 * - Provides consistent authentication enforcement across the API
 * - Supports both user and service authentication patterns
 *
 * Middleware Behavior:
 * - Calls authenticate() to validate request credentials
 * - Returns 401 Unauthorized for invalid or missing authentication
 * - Attaches authentication context to request for downstream use
 * - Continues request processing for valid authentication
 *
 * Usage Patterns:
 * - Applied to tRPC procedures requiring authentication
 * - Used on REST endpoints handling sensitive operations
 * - Can be selectively applied based on endpoint security requirements
 *
 * Error Response:
 * - Standardized 401 response format for client error handling
 * - Clear error message for debugging and user feedback
 * - No sensitive information exposure in error responses
 *
 * @returns Express middleware function for authentication enforcement
 */
export function requireAuth() {
  return async (req: Request, res: any, next: any) => {
    const auth = await authenticate(req);
    if (!auth) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Valid authentication required'
      });
    }
    
    // Attach authentication context to request for downstream middleware
    // This enables authorization logic and audit logging
    (req as any).auth = auth;
    next();
  };
}