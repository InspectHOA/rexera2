/**
 * Test server setup for Jest integration tests
 * Uses the main app with SKIP_AUTH enabled
 */

import 'dotenv/config';
import { serve } from '@hono/node-server';
import app from './app';

// Ensure SKIP_AUTH is enabled for tests
process.env.SKIP_AUTH = 'true';

let server: any = null;

export async function startTestServer(port: number = 3001): Promise<string> {
  if (server) {
    throw new Error('Test server is already running');
  }

  return new Promise((resolve, reject) => {
    server = serve({
      fetch: app.fetch,
      port,
    }, (info: any) => {
      if (info) {
        console.log(`🧪 Test server started on http://localhost:${info.port}`);
        resolve(`http://localhost:${info.port}`);
      } else {
        reject(new Error('Failed to start test server'));
      }
    });
  });
}

export async function stopTestServer(): Promise<void> {
  if (server) {
    return new Promise((resolve) => {
      server.close(() => {
        server = null;
        console.log('🧪 Test server stopped');
        resolve();
      });
    });
  }
}

// Auto-start server if this file is run directly
if (require.main === module) {
  const port = parseInt(process.env.PORT || '3001', 10);
  startTestServer(port).catch(console.error);
}