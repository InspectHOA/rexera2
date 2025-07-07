/**
 * Configuration for Rexera 2.0 API serverless functions.
 */

interface Config {
  supabase: {
    url: string;
    serviceRoleKey: string;
  };
  n8n: {
    enabled: boolean;
    apiKey: string;
    baseUrl: string;
    payoffWorkflowId: string;
  };
  allowedOrigins: string[];
  nodeEnv: string;
  isDevelopment: boolean;
}

const requiredEnvVars = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
} as const;

// Validate required environment variables
for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const config: Config = {
  supabase: {
    url: requiredEnvVars.SUPABASE_URL!,
    serviceRoleKey: requiredEnvVars.SUPABASE_SERVICE_ROLE_KEY!,
  },
  n8n: {
    enabled: process.env.N8N_ENABLED === 'true',
    apiKey: process.env.N8N_API_KEY || '',
    baseUrl: process.env.N8N_BASE_URL || '',
    payoffWorkflowId: process.env.N8N_PAYOFF_WORKFLOW_ID || '',
  },
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
};