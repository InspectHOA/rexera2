/**
 * Error Handling Middleware for Rexera API
 * 
 * Provides standardized error responses and logging
 */

import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId?: string;
  };
}

export class APIError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Global error handling middleware
 */
export const errorHandlerMiddleware = async (c: Context, next: Next) => {
  try {
    await next();
  } catch (error) {
    console.error('API Error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      path: c.req.path,
      method: c.req.method,
      timestamp: new Date().toISOString()
    });

    const requestId = c.req.header('x-request-id') || 
                     Math.random().toString(36).substring(2, 15);

    let errorResponse: ErrorResponse;

    if (error instanceof HTTPException) {
      // Hono HTTP exceptions
      errorResponse = {
        success: false,
        error: {
          code: `HTTP_${error.status}`,
          message: error.message,
          timestamp: new Date().toISOString(),
          requestId
        }
      };
      return c.json(errorResponse, error.status as any);
    }

    if (error instanceof APIError) {
      // Custom API errors
      errorResponse = {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          timestamp: new Date().toISOString(),
          requestId
        }
      };
      return c.json(errorResponse, error.status as any);
    }

    if (error instanceof ZodError) {
      // Validation errors
      errorResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          })),
          timestamp: new Date().toISOString(),
          requestId
        }
      };
      return c.json(errorResponse, 400 as any);
    }

    if (error instanceof Error && error.message.includes('Database query failed')) {
      // Database errors
      errorResponse = {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Database operation failed',
          timestamp: new Date().toISOString(),
          requestId
        }
      };
      return c.json(errorResponse, 500 as any);
    }

    // Generic server error
    errorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
        requestId
      }
    };

    return c.json(errorResponse, 500 as any);
  }
};

/**
 * Common API error factories
 */
export const APIErrors = {
  notFound: (resource: string, id?: string) => new APIError(
    'NOT_FOUND',
    `${resource}${id ? ` with id ${id}` : ''} not found`,
    404
  ),

  unauthorized: (message = 'Authentication required') => new APIError(
    'UNAUTHORIZED',
    message,
    401
  ),

  forbidden: (message = 'Access denied') => new APIError(
    'FORBIDDEN',
    message,
    403
  ),

  badRequest: (message: string, details?: any) => new APIError(
    'BAD_REQUEST',
    message,
    400,
    details
  ),

  conflict: (message: string) => new APIError(
    'CONFLICT',
    message,
    409
  ),

  tooManyRequests: (message = 'Rate limit exceeded') => new APIError(
    'TOO_MANY_REQUESTS',
    message,
    429
  ),

  internalError: (message = 'Internal server error') => new APIError(
    'INTERNAL_ERROR',
    message,
    500
  ),

  serviceUnavailable: (service: string) => new APIError(
    'SERVICE_UNAVAILABLE',
    `${service} is currently unavailable`,
    503
  )
};