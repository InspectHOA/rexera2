/**
 * Development server for the Hono API
 * This runs the same Hono app that will be deployed to Vercel
 */

// Load environment variables from .env file
import 'dotenv/config';

import { serve } from '@hono/node-server';
import { app } from './app-complete';

const port = parseInt(process.env.PORT || '3001', 10);

console.log('🚀 Starting Rexera API development server...');
console.log(`📍 Server will be available at: http://localhost:${port}`);
console.log(`📋 API Documentation: http://localhost:${port}/api/docs`);
console.log(`🔍 Health Check: http://localhost:${port}/api/health`);

serve({
  fetch: app.fetch,
  port,
}, (info) => {
  console.log(`✅ Server is running on http://localhost:${info.port}`);
});