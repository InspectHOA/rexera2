import { Request } from 'express';
import { createServerClient } from '../utils/database';
import { config } from '../config';

export interface AuthResult {
  type: 'internal' | 'user';
  user?: any;
}

export async function authenticate(req: Request): Promise<AuthResult | null> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    const apiKey = req.headers['x-api-key'] as string;

    // Check for internal API key
    if (apiKey && apiKey === config.auth.internalApiKey) {
      return { type: 'internal' };
    }

    // Check for user token
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

    return null;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

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
    
    // Attach auth info to request
    (req as any).auth = auth;
    next();
  };
}