/**
 * Database client utilities for Rexera 2.0 (CommonJS version for API endpoints)
 */

const { createClient } = require('@supabase/supabase-js');

// Load configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Creates authenticated Supabase client for server-side database operations.
 */
function createServerClient() {
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
function validateEnvironment() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

module.exports = {
  createServerClient,
  validateEnvironment
};