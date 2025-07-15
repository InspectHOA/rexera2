/**
 * Simplified Authentication Middleware for Rexera API
 * 
 * Two modes: SSO or SKIP_AUTH
 */

import { Context, Next } from 'hono';
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
 * Simplified auth middleware - SSO or SKIP_AUTH only
 */
export const authMiddleware = async (c: Context, next: Next) => {
  try {
    // Skip auth for OPTIONS requests (CORS preflight)
    if (c.req.method === 'OPTIONS') {
      await next();
      return;
    }
    
    // SKIP_AUTH mode - use hardcoded user
    if (process.env.SKIP_AUTH === 'true') {
      console.log('🔧 Using SKIP_AUTH mode');
      c.set('user', {
        id: '284219ff-3a1f-4e86-9ea4-3536f940451f',
        email: 'admin@rexera.com',
        user_type: 'hil_user' as const,
        role: 'HIL_ADMIN',
        company_id: undefined
      });
      
      await next();
      return;
    }
    
    console.log('🔐 Using SSO mode');
    
    // SSO mode - validate JWT token
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ success: false, error: { message: 'Missing or invalid Authorization header' } }, 401);
    }

    const token = authHeader.replace('Bearer ', '');

    // Handle special skip-auth-token from frontend
    if (token === 'skip-auth-token') {
      console.log('🔧 Frontend sent skip-auth-token, using hardcoded user');
      c.set('user', {
        id: '284219ff-3a1f-4e86-9ea4-3536f940451f',
        email: 'admin@rexera.com',
        user_type: 'hil_user' as const,
        role: 'HIL_ADMIN',
        company_id: undefined
      });
      
      await next();
      return;
    }

    // Verify the JWT token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return c.json({ success: false, error: { message: 'Invalid or expired token' } }, 401);
    }

    // Get user profile data from database
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_type, role, company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return c.json({ success: false, error: { message: 'User profile not found' } }, 403);
    }

    // Set user context
    c.set('user', {
      id: user.id,
      email: user.email!,
      user_type: profile.user_type,
      role: profile.role,
      company_id: profile.company_id
    });

    await next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    return c.json({ success: false, error: { message: 'Internal authentication error' } }, 500);
  }
};

/**
 * Simplified company filter for new auth system
 * In simplified auth, we don't restrict by company - return null (no filter)
 */
export const getCompanyFilter = (user: AuthUser): string | null => {
  // In simplified auth system, no company restrictions
  return null;
};

/**
 * Simplified client data middleware - no restrictions in simplified auth
 */
export const clientDataMiddleware = async (c: Context, next: Next) => {
  // In simplified auth, no client data restrictions
  await next();
};