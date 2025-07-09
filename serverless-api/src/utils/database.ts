/**
 * Database client utilities for Rexera 2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Creates authenticated Supabase client for server-side database operations.
 */
export function createServerClient(): SupabaseClient {
  const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
  }
  
  return createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * Validates database environment configuration.
 */
export function validateEnvironment(): boolean {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}