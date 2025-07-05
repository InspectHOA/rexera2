import dotenv from 'dotenv';

// Load environment variables - prioritize .env.local for development
dotenv.config({ path: '.env.local' });
dotenv.config(); // Fallback to .env

export const config = {
  // Server Configuration
  port: parseInt(process.env.PORT || '3002'),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // CORS Configuration
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'https://rexera-frontend.vercel.app'
  ],
  
  // Supabase Configuration
  supabase: {
    url: process.env.SUPABASE_URL!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  },
  
  // Authentication
  auth: {
    internalApiKey: process.env.INTERNAL_API_KEY!,
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // Development flags
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  // API Configuration
  api: {
    baseUrl: process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3002}`,
    version: 'v1',
  },

  // n8n Integration Configuration
  n8n: {
    apiKey: process.env.N8N_API_KEY || '',
    baseUrl: process.env.N8N_BASE_URL || 'http://localhost:5678',
    webhookUrl: process.env.N8N_WEBHOOK_URL || '',
    webhookSecret: process.env.N8N_WEBHOOK_SECRET || '',
    payoffWorkflowId: process.env.N8N_PAYOFF_WORKFLOW_ID || '',
  }
};

// Validate required environment variables
export function validateConfig() {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'INTERNAL_API_KEY'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Initialize configuration validation
validateConfig();