#!/usr/bin/env tsx
import { config } from 'dotenv';
import * as path from 'path';

// Test different ways of loading env
console.log('=== ENV LOADING TEST ===');

// Method 1: Load from serverless-api/.env
config({ path: path.join(__dirname, '../../serverless-api/.env') });
console.log('Method 1 - serverless-api/.env:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...');

// Method 2: Load from root .env
config({ path: path.join(__dirname, '../../.env') });
console.log('\nMethod 2 - root .env:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...');

// Method 3: Load from root .env.local
config({ path: path.join(__dirname, '../../.env.local') });
console.log('\nMethod 3 - root .env.local:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...');

// Print actual service role key for comparison (first 50 chars only)
console.log('\nService role key preview:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 50) + '...');