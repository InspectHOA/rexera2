/**
 * Authentication Middleware for Rexera API
 * 
 * Validates Supabase JWT tokens and extracts user context
 */

import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface AuthUser {
  id: string;
  email: string;
  user_type: 'client_user' | 'hil_user';
  role: string;
  company_id?: string;
}

declare module 'hono' {
  interface ContextVariableMap {
    user: AuthUser;
  }
}

/**
 * Middleware to validate JWT tokens and extract user context
 */
export const authMiddleware = async (c: Context, next: Next) => {
  try {
    // Skip auth for OPTIONS requests (CORS preflight)
    if (c.req.method === 'OPTIONS') {
      await next();
      return;
    }
    
    // Development bypass - skip auth for localhost only
    if (process.env.NODE_ENV === 'development') {
      // Set a default test user for development
      c.set('user', {
        id: '82a7d984-485b-4a47-ac28-615a1b448473', // Seeded test user ID
        email: 'test@example.com',
        user_type: 'hil_user' as const,
        role: 'HIL',
        company_id: undefined
      });
      
      await next();
      return;
    }
    
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader) {
      return c.json({
        success: false,
        error: {
          code: 'HTTP_401',
          message: 'Missing Authorization header',
          timestamp: new Date().toISOString()
        }
      }, 401);
    }

    if (!authHeader.startsWith('Bearer ')) {
      return c.json({
        success: false,
        error: {
          code: 'HTTP_401',
          message: 'Invalid Authorization header format. Expected: Bearer <token>',
          timestamp: new Date().toISOString()
        }
      }, 401);
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify the JWT token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return c.json({
        success: false,
        error: {
          code: 'HTTP_401',
          message: 'Invalid or expired token',
          timestamp: new Date().toISOString()
        }
      }, 401);
    }

    // Get user profile data from database
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_type, role, company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return c.json({
        success: false,
        error: {
          code: 'HTTP_403',
          message: 'User profile not found or incomplete',
          timestamp: new Date().toISOString()
        }
      }, 403);
    }

    // Set user context in Hono context
    const authUser: AuthUser = {
      id: user.id,
      email: user.email!,
      user_type: profile.user_type,
      role: profile.role,
      company_id: profile.company_id
    };

    c.set('user', authUser);
    await next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    return c.json({
      success: false,
      error: {
        code: 'HTTP_500',
        message: 'Internal authentication error',
        timestamp: new Date().toISOString()
      }
    }, 500);
  }
};

/**
 * Middleware for HIL-only endpoints
 */
export const hilOnlyMiddleware = async (c: Context, next: Next) => {
  const user = c.get('user');
  
  if (!user || user.user_type !== 'hil_user') {
    return c.json({
      success: false,
      error: {
        code: 'HTTP_403',
        message: 'Access denied. HIL users only.',
        timestamp: new Date().toISOString()
      }
    }, 403);
  }
  
  await next();
};

/**
 * Middleware for client-specific data access
 * Ensures clients can only access their own company data
 */
export const clientDataMiddleware = async (c: Context, next: Next) => {
  const user = c.get('user');
  
  if (user.user_type === 'client_user' && !user.company_id) {
    return c.json({
      success: false,
      error: {
        code: 'HTTP_403',
        message: 'Client user missing company association',
        timestamp: new Date().toISOString()
      }
    }, 403);
  }
  
  await next();
};

/**
 * Utility to check if user has admin privileges
 */
export const isAdmin = (user: AuthUser): boolean => {
  return user.role === 'HIL_ADMIN' || user.role === 'CLIENT_ADMIN';
};

/**
 * Utility to get company filter for client users
 */
export const getCompanyFilter = (user: AuthUser): string | null => {
  if (user.user_type === 'hil_user') {
    return null; // HIL users can see all companies
  }
  return user.company_id || null;
};

// Alias for backwards compatibility
export const supabaseAuthMiddleware = authMiddleware;