#!/usr/bin/env node
/**
 * Environment Setup Verification Script
 * Verifies that the unified environment setup is working correctly
 */

require('dotenv').config({ path: '.env.local' });

console.log('🔍 Verifying Environment Setup...\n');

// Required variables for development
const requiredVars = {
  // Supabase
  'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY,
  
  // URLs
  'NEXT_PUBLIC_API_URL': process.env.NEXT_PUBLIC_API_URL,
  'NEXT_PUBLIC_APP_URL': process.env.NEXT_PUBLIC_APP_URL,
  
  // Auth
  'NEXT_PUBLIC_SKIP_AUTH': process.env.NEXT_PUBLIC_SKIP_AUTH,
  'SKIP_AUTH': process.env.SKIP_AUTH,
  
  // Environment
  'NODE_ENV': process.env.NODE_ENV
};

let allGood = true;

console.log('📋 Checking Required Variables:');
for (const [key, value] of Object.entries(requiredVars)) {
  const status = value ? '✅' : '❌';
  const displayValue = value ? (value.length > 50 ? `${value.substring(0, 50)}...` : value) : 'MISSING';
  console.log(`${status} ${key}: ${displayValue}`);
  
  if (!value) {
    allGood = false;
  }
}

console.log('\n🔗 URL Configuration:');
console.log(`Frontend URL: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}`);
console.log(`API URL: ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}`);
console.log(`N8N Webhook: ${process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'Not configured'}`);

console.log('\n🔒 Auth Configuration:');
const authMode = process.env.NEXT_PUBLIC_SKIP_AUTH === 'true' ? 'DEVELOPMENT (Auth Bypassed)' : 'PRODUCTION (SSO Enabled)';
console.log(`Auth Mode: ${authMode}`);

console.log('\n📦 Environment:');
console.log(`Node Environment: ${process.env.NODE_ENV || 'development'}`);

if (allGood) {
  console.log('\n🎉 Environment setup is complete and working!');
  console.log('\nNext steps:');
  console.log('1. Run `pnpm dev` to start development servers');
  console.log('2. Set production variables in Vercel dashboard for deployment');
  process.exit(0);
} else {
  console.log('\n❌ Environment setup has issues. Check missing variables above.');
  process.exit(1);
}