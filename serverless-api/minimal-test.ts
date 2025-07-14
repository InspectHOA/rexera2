import 'dotenv/config';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { createServerClient } from './src/utils/database';

const app = new Hono();

app.get('/test', (c) => {
  return c.json({ message: 'Hello World', workflows: 50 });
});

app.get('/api/workflows', async (c) => {
  try {
    const supabase = createServerClient();
    
    const { data: workflows, error } = await supabase
      .from('workflows')
      .select(`
        *,
        clients(name),
        assigned_user:user_profiles!workflows_assigned_to_fkey(full_name),
        task_executions(*)
      `)
      .limit(20);

    if (error) {
      return c.json({ success: false, error: error.message }, 500);
    }

    return c.json({
      success: true,
      data: workflows || [],
      pagination: {
        page: 1,
        limit: 20,
        total: workflows?.length || 0,
        totalPages: 1
      }
    });
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'Database connection failed',
      details: String(error)
    }, 500);
  }
});

console.log('Starting minimal test server...');
serve({
  fetch: app.fetch,
  port: 3005,
}, () => {
  console.log('✅ Minimal server running on http://localhost:3005');
});