import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { createServerClient } from '../utils/database';

export async function createTRPCContext(opts: CreateExpressContextOptions) {
  const { req, res } = opts;
  
  return {
    req,
    res,
    supabase: createServerClient(),
  };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;