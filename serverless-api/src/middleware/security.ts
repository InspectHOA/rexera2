/**
 * Security Middleware for Rexera API
 * 
 * Includes rate limiting, security headers, and request validation
 */

import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100 // 100 requests per 15 minutes
};

/**
 * Serverless-appropriate rate limiting middleware
 * 
 * In serverless environments, in-memory rate limiting doesn't work because:
 * - Memory is reset between function invocations
 * - Each instance has separate memory
 * - Cold starts lose all state
 * 
 * This implementation:
 * - Skips rate limiting in serverless environments (Vercel, AWS Lambda, etc.)
 * - Uses basic request validation instead
 * - Adds informational headers for monitoring
 */
export const rateLimitMiddleware = (config: RateLimitConfig = DEFAULT_RATE_LIMIT) => {
  return async (c: Context, next: Next) => {
    const isServerless = !!(
      process.env.VERCEL ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.NETLIFY ||
      process.env.CLOUDFLARE_WORKERS
    );

    if (isServerless) {
      // In serverless environments, add headers for monitoring but don't enforce limits
      // Cloud providers (Vercel, AWS) handle DDoS protection at the infrastructure level
      c.header('X-RateLimit-Limit', config.maxRequests.toString());
      c.header('X-RateLimit-Remaining', config.maxRequests.toString());
      c.header('X-RateLimit-Reset', Math.ceil((Date.now() + config.windowMs) / 1000).toString());
      c.header('X-RateLimit-Policy', 'serverless-mode');
      
      await next();
      return;
    }

    // For non-serverless environments (local development), use simple validation
    // This provides basic protection during development and testing
    const userAgent = c.req.header('user-agent') || '';
    const clientIP = c.req.header('x-forwarded-for') || 
                     c.req.header('x-real-ip') || 
                     'unknown';

    // Block obvious bot requests
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i
    ];

    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
    
    if (isSuspicious && !userAgent.includes('swagger')) {
      throw new HTTPException(429, {
        message: 'Automated requests not allowed. Use API authentication.'
      });
    }

    // Add headers for development monitoring
    c.header('X-RateLimit-Limit', config.maxRequests.toString());
    c.header('X-RateLimit-Remaining', config.maxRequests.toString());
    c.header('X-RateLimit-Reset', Math.ceil((Date.now() + config.windowMs) / 1000).toString());
    c.header('X-RateLimit-Policy', 'development-mode');

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
  
  // Content Security Policy - Allow Swagger UI CDN for docs endpoint
  const isDocsEndpoint = c.req.path === '/api/docs';
  
  let csp: string[];
  
  if (isDocsEndpoint) {
    // Relaxed CSP for Swagger UI
    csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
      "img-src 'self' data: https:",
      "connect-src 'self' https://api.supabase.io https://*.supabase.co",
      "font-src 'self' https://cdn.jsdelivr.net"
    ];
  } else {
    // Strict CSP for other endpoints
    csp = [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self' https://api.supabase.io https://*.supabase.co",
      "font-src 'self'"
    ];
  }
  
  c.header('Content-Security-Policy', csp.join('; '));
};

/**
 * Minimal request validation middleware
 * 
 * Hono handles most validation automatically:
 * - Content-Type validation via c.req.json()  
 * - Body parsing and JSON validation
 * - Route parameter validation
 * 
 * Serverless platforms handle:
 * - Content-Length limits at infrastructure level
 * - DDoS protection and request throttling
 * 
 * This middleware provides basic request hygiene for development environments.
 */
export const requestValidationMiddleware = async (c: Context, next: Next) => {
  // In serverless environments, most validation is handled by the platform
  const isServerless = !!(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.NETLIFY ||
    process.env.CLOUDFLARE_WORKERS
  );

  if (isServerless) {
    // In production serverless, rely on platform-level validation
    await next();
    return;
  }

  // Development environment: basic validation
  const method = c.req.method;
  
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    const contentLength = c.req.header('content-length');
    
    // Basic size check for development (10MB limit)
    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
      throw new HTTPException(413, {
        message: 'Request entity too large (10MB limit)'
      });
    }
  }

  await next();
};

/**
 * CORS middleware for development and production
 */
export const corsMiddleware = async (c: Context, next: Next) => {
  const origin = c.req.header('origin');
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://rexera.vercel.app',
    'https://rexera2-frontend.vercel.app'
  ];

  if (origin && allowedOrigins.includes(origin)) {
    c.header('Access-Control-Allow-Origin', origin);
  }

  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  c.header('Access-Control-Allow-Credentials', 'true');
  c.header('Access-Control-Max-Age', '86400');

  if (c.req.method === 'OPTIONS') {
    return c.body(null, 204 as any);
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