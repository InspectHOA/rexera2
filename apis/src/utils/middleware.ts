import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@rexera/types';

export interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string;
    email: string;
    role: string;
    user_type: 'client_user' | 'hil_user';
    company_id?: string;
  };
}

export async function withAuth(
  handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any) => {
    try {
      // Skip auth check in development for easier testing
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      if (isDevelopment) {
        // Mock user for development
        (req as AuthenticatedRequest).user = {
          id: 'dev-user-123',
          email: 'dev@rexera.com',
          role: 'admin',
          user_type: 'hil_user',
          company_id: undefined,
        };
        return handler(req as AuthenticatedRequest, context);
      }

      const cookieStore = cookies();
      const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value;
            },
          },
        }
      );
      
      // Get the user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Invalid or missing authentication' },
          { status: 401 }
        );
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profile) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'User profile not found' },
          { status: 403 }
        );
      }

      // Attach user info to request
      (req as AuthenticatedRequest).user = {
        id: session.user.id,
        email: profile.email,
        role: profile.role,
        user_type: profile.user_type,
        company_id: profile.company_id || undefined,
      };

      return handler(req as AuthenticatedRequest, context);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Internal Server Error', message: 'Authentication failed' },
        { status: 500 }
      );
    }
  };
}

export function withRateLimit(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>,
  options: { maxRequests: number; windowMs: number } = { maxRequests: 100, windowMs: 60000 }
) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return async (req: NextRequest, context?: any) => {
    const clientId = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    'unknown';
    
    const now = Date.now();
    const clientData = requests.get(clientId);

    if (!clientData || now > clientData.resetTime) {
      requests.set(clientId, { count: 1, resetTime: now + options.windowMs });
      return handler(req, context);
    }

    if (clientData.count >= options.maxRequests) {
      return NextResponse.json(
        { error: 'Too Many Requests', message: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    clientData.count++;
    return handler(req, context);
  };
}

export function withErrorHandling(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any) => {
    try {
      return await handler(req, context);
    } catch (error) {
      console.error('API Error:', error);
      
      if (error instanceof Error) {
        // Handle known error types
        if (error.message.includes('not found')) {
          return NextResponse.json(
            { error: 'Not Found', message: error.message },
            { status: 404 }
          );
        }
        
        if (error.message.includes('duplicate') || error.message.includes('unique')) {
          return NextResponse.json(
            { error: 'Conflict', message: 'Resource already exists' },
            { status: 409 }
          );
        }
        
        if (error.message.includes('validation') || error.message.includes('invalid')) {
          return NextResponse.json(
            { error: 'Bad Request', message: error.message },
            { status: 400 }
          );
        }
      }

      return NextResponse.json(
        { error: 'Internal Server Error', message: 'An unexpected error occurred' },
        { status: 500 }
      );
    }
  };
}

export async function parseJsonBody<T = any>(req: NextRequest): Promise<T> {
  try {
    const body = await req.json();
    return body;
  } catch (error) {
    throw new Error('Invalid JSON body');
  }
}

export function validateRequiredFields<T extends Record<string, any>>(
  data: T,
  requiredFields: (keyof T)[]
): void {
  const missingFields = requiredFields.filter(field => 
    data[field] === undefined || data[field] === null || data[field] === ''
  );

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
}

export function createApiResponse<T>(
  data: T,
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  },
  links?: {
    first?: string;
    previous?: string;
    next?: string;
    last?: string;
  }
) {
  return NextResponse.json({
    success: true,
    data,
    ...(meta && { pagination: meta }),
    ...(links && { links }),
  });
}

export function createErrorResponse(
  error: string,
  message: string,
  status: number = 400,
  details?: any
) {
  return NextResponse.json(
    {
      success: false,
      error: {
        type: error,
        message,
        ...(details && { details }),
      }
    },
    { status }
  );
}