#!/usr/bin/env node

/**
 * Quick script to get an auth token for testing Swagger API docs
 * Usage: node scripts/get-auth-token.js your-email@example.com your-password
 */

const fetch = require('node-fetch');

async function getAuthToken(email, password) {
  try {
    const response = await fetch('https://wmgidablmqotriwlefhq.supabase.co/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZ2lkYWJsbXFvdHJpd2xlZmhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzc5NjcsImV4cCI6MjA2NjcxMzk2N30.-a0ZOsgzuvApfxgsYIKQ0xduca5htQslPCNuUm7K2bw',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    if (data.access_token) {
      console.log('\n🎉 SUCCESS! Copy this token for Swagger:');
      console.log('\n' + '='.repeat(60));
      console.log(`Bearer ${data.access_token}`);
      console.log('='.repeat(60));
      console.log('\n📋 Instructions:');
      console.log('1. Go to your Swagger UI at /api/docs');
      console.log('2. Click "Authorize" button');
      console.log('3. Paste the token above (including "Bearer ")');
      console.log('4. Click "Authorize"');
      console.log('\n⏰ Token expires in 1 hour\n');
    } else {
      console.error('❌ Login failed:', data.error_description || data.msg || 'Unknown error');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Get command line arguments
const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.log('Usage: node scripts/get-auth-token.js <email> <password>');
  process.exit(1);
}

getAuthToken(email, password);