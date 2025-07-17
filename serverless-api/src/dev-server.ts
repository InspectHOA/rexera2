/**
 * Development server for the Hono API
 * This runs the same Hono app that will be deployed to Vercel
 */

// Load environment variables first - this MUST be imported before anything else
import './env';

import { serve } from '@hono/node-server';
import app from './app';

const port = parseInt(process.env.PORT || '3001', 10);

console.log('🚀 Starting Rexera API development server...');
console.log(`📍 Server will be available at: http://localhost:${port}`);
console.log(`📋 API Documentation: http://localhost:${port}/api/docs`);
console.log(`🔍 Health Check: http://localhost:${port}/api/health`);

// Single app now handles both development and production via SKIP_AUTH env var
const selectedApp = app;

serve({
  fetch: selectedApp.fetch,
  port,
}, (info) => {
  console.log(`✅ Server is running on http://localhost:${info.port}`);
  if (process.env.NODE_ENV === 'test') {
    console.log('🧪 Running in TEST mode (no authentication required)');
  }
});