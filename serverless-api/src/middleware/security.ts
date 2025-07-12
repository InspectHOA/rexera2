/**
 * Security Middleware for Rexera API
 * 
 * Includes rate limiting, security headers, and request validation
 */

import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';

// Simple in-memory rate limiter (for production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100 // 100 requests per 15 minutes
};

/**
 * Rate limiting middleware
 */
export const rateLimitMiddleware = (config: RateLimitConfig = DEFAULT_RATE_LIMIT) => {
  return async (c: Context, next: Next) => {
    const clientIP = c.req.header('x-forwarded-for') || 
                     c.req.header('x-real-ip') || 
                     'unknown';

    const now = Date.now();
    const key = `rate_limit:${clientIP}`;
    const record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      // Reset or create new record
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      });
    } else {
      // Increment existing record
      record.count++;
      
      if (record.count > config.maxRequests) {
        const resetIn = Math.ceil((record.resetTime - now) / 1000);
        
        throw new HTTPException(429, {
          message: `Rate limit exceeded. Try again in ${resetIn} seconds.`
        });
      }
    }

    // Add rate limit headers
    const remaining = Math.max(0, config.maxRequests - (record?.count || 1));
    const resetTime = record?.resetTime || (now + config.windowMs);
    
    c.header('X-RateLimit-Limit', config.maxRequests.toString());
    c.header('X-RateLimit-Remaining', remaining.toString());
    c.header('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString());

    await next();
  };
};

/**
 * Security headers middleware
 */
export const securityHeadersMiddleware = async (c: Context, next: Next) => {
  await next();

  // Security headers
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self' https://api.supabase.io https://*.supabase.co",
    "font-src 'self'"
  ].join('; ');
  
  c.header('Content-Security-Policy', csp);
};

/**
 * Request validation middleware
 */
export const requestValidationMiddleware = async (c: Context, next: Next) => {
  const contentType = c.req.header('content-type');
  const method = c.req.method;

  // Validate Content-Type for POST/PUT/PATCH requests
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    if (!contentType || !contentType.includes('application/json')) {
      throw new HTTPException(400, {
        message: 'Content-Type must be application/json'
      });
    }
  }

  // Validate request size (10MB limit)
  const contentLength = c.req.header('content-length');
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
    throw new HTTPException(413, {
      message: 'Request entity too large'
    });
  }

  await next();
};

/**
 * CORS middleware for development
 */
export const corsMiddleware = async (c: Context, next: Next) => {
  const origin = c.req.header('origin');
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://rexera.vercel.app'
  ];

  if (origin && allowedOrigins.includes(origin)) {
    c.header('Access-Control-Allow-Origin', origin);
  }

  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  c.header('Access-Control-Allow-Credentials', 'true');
  c.header('Access-Control-Max-Age', '86400');

  if (c.req.method === 'OPTIONS') {
    return c.text('', 204 as any);
  }

  await next();
};

/**
 * Enhanced rate limiting for different endpoint types
 */
export const getEndpointRateLimit = (endpoint: string): RateLimitConfig => {
  if (endpoint.includes('/auth/')) {
    return {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5 // 5 auth attempts per 15 minutes
    };
  }
  
  if (endpoint.includes('/webhooks/')) {
    return {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100 // 100 webhook calls per minute
    };
  }
  
  return DEFAULT_RATE_LIMIT;
};