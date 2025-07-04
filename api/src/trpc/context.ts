import { createClient } from '@supabase/supabase-js';
import type { Database } from '@rexera/types';
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';

export function createServerClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function createTRPCContext(opts: CreateExpressContextOptions) {
  const { req, res } = opts;
  
  return {
    req,
    res,
    supabase: createServerClient(),
  };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;