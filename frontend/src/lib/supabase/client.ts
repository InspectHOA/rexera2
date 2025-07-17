import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@rexera/shared';

// Get environment variables with fallbacks for development
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    `Missing Supabase environment variables. Please check that the following are set:
    - NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✓' : '✗'}
    - NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✓' : '✗'}
    
    Make sure .env.local exists in the root directory or frontend directory.`
  );
}

export const supabase = createBrowserClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);