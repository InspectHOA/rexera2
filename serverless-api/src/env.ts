/**
 * Environment Configuration Loader
 * This file MUST be imported before any other modules that use environment variables
 */

import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from parent directory's .env.local file
config({ path: join(__dirname, '../../.env.local') });

// Validate required environment variables
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars);
  console.error('Make sure .env.local file exists in the root directory with these variables');
  process.exit(1);
}

console.log('✅ Environment variables loaded successfully');