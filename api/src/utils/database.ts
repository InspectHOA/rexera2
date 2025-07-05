import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../supabase/types';
import { config } from '../config';

// Create Supabase client with service role for server-side operations
export function createServerClient() {
  return createClient<Database>(
    config.supabase.url,
    config.supabase.serviceRoleKey
  );
}

// Validate environment variables (now handled by config)
export function validateEnvironment() {
  // This is now handled by the config module
  return true;
}