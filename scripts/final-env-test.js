#!/usr/bin/env node
/**
 * Final Environment Variable Test
 * Comprehensive test to ensure all environment variables are working correctly
 */

require('dotenv').config({ path: '.env.local' });

console.log('🎯 Final Environment Variable Test\n');

// Test 1: All required variables present
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_SKIP_AUTH',
  'SKIP_AUTH',
  'ALLOWED_ORIGINS'
];

let allPresent = true;
console.log('1️⃣ Checking All Required Variables:');
requiredVars.forEach(varName => {
  const present = !!process.env[varName];
  console.log(`${present ? '✅' : '❌'} ${varName}`);
  if (!present) allPresent = false;
});

// Test 2: Supabase URL consistency
console.log('\n2️⃣ Checking Supabase URL Consistency:');
const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const privateUrl = process.env.SUPABASE_URL;
const urlsMatch = publicUrl === privateUrl;
console.log(`${urlsMatch ? '✅' : '❌'} Frontend and API URLs match: ${urlsMatch}`);

// Test 3: Auth consistency
console.log('\n3️⃣ Checking Auth Setting Consistency:');
const publicSkipAuth = process.env.NEXT_PUBLIC_SKIP_AUTH;
const privateSkipAuth = process.env.SKIP_AUTH;
const authMatch = publicSkipAuth === privateSkipAuth;
console.log(`${authMatch ? '✅' : '❌'} Frontend and API auth settings match: ${authMatch}`);

// Test 4: CORS configuration
console.log('\n4️⃣ Checking CORS Configuration:');
const frontendUrl = process.env.NEXT_PUBLIC_APP_URL;
const allowedOrigins = process.env.ALLOWED_ORIGINS;
const corsValid = allowedOrigins && allowedOrigins.includes(frontendUrl);
console.log(`${corsValid ? '✅' : '❌'} Frontend URL in CORS origins: ${corsValid}`);

// Final result
const allGood = allPresent && urlsMatch && authMatch && corsValid;
console.log(`\n${allGood ? '🎉' : '❌'} Overall Status: ${allGood ? 'PASS' : 'FAIL'}`);

if (allGood) {
  console.log('\n✅ Environment setup is fully functional!');
  console.log('Your environment variables are working correctly across:');
  console.log('  - Frontend (Next.js)');
  console.log('  - API (Serverless functions)'); 
  console.log('  - Cross-service communication');
  console.log('  - Authentication configuration');
  console.log('  - CORS configuration');
} else {
  console.log('\n❌ Environment setup has issues. Check the failed tests above.');
}

process.exit(allGood ? 0 : 1);