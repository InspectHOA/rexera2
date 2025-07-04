import { createClient } from '@supabase/supabase-js';

export async function authenticate(req: Request) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  const apiKey = req.headers.get('x-api-key');

  if (apiKey === process.env.INTERNAL_API_KEY) return { type: 'internal' };

  if (token) {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data } = await supabase.auth.getUser(token);
    if (data?.user) return { type: 'user', user: data.user };
  }

  return null;
}