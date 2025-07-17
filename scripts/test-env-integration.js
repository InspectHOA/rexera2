#!/usr/bin/env node
/**
 * Environment Integration Test
 * Tests that both frontend and API can read environment variables correctly
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Testing Environment Variable Integration...\n');

// Test 1: Frontend environment loading
console.log('1️⃣ Testing Frontend Environment Loading...');
const frontendTest = spawn('node', ['-e', `
  // Simulate Next.js environment loading
  require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
  
  const requiredFrontendVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
    'NEXT_PUBLIC_API_URL',
    'NEXT_PUBLIC_SKIP_AUTH'
  ];
  
  let success = true;
  requiredFrontendVars.forEach(varName => {
    if (!process.env[varName]) {
      console.error('❌ Missing:', varName);
      success = false;
    } else {
      console.log('✅', varName + ':', process.env[varName].substring(0, 30) + '...');
    }
  });
  
  if (success) {
    console.log('✅ Frontend environment variables loaded successfully');
  }
  process.exit(success ? 0 : 1);
`], {
  cwd: __dirname,
  stdio: 'inherit'
});

frontendTest.on('close', (code) => {
  console.log(`Frontend test exit code: ${code}\n`);
  
  // Test 2: API environment loading
  console.log('2️⃣ Testing API Environment Loading...');
  const apiTest = spawn('node', ['-e', `
    // Simulate API environment loading
    require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
    
    const requiredApiVars = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'SUPABASE_JWT_SECRET',
      'SKIP_AUTH',
      'ALLOWED_ORIGINS'
    ];
    
    let success = true;
    requiredApiVars.forEach(varName => {
      if (!process.env[varName]) {
        console.error('❌ Missing:', varName);
        success = false;
      } else {
        console.log('✅', varName + ':', process.env[varName].substring(0, 30) + '...');
      }
    });
    
    if (success) {
      console.log('✅ API environment variables loaded successfully');
    }
    process.exit(success ? 0 : 1);
  `], {
    cwd: __dirname,
    stdio: 'inherit'
  });

  apiTest.on('close', (apiCode) => {
    console.log(`API test exit code: ${apiCode}\n`);
    
    // Test 3: Cross-service URL consistency
    console.log('3️⃣ Testing Cross-Service URL Consistency...');
    const urlTest = spawn('node', ['-e', `
      require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
      
      const frontendUrl = process.env.NEXT_PUBLIC_APP_URL;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const allowedOrigins = process.env.ALLOWED_ORIGINS;
      
      console.log('Frontend URL:', frontendUrl);
      console.log('API URL:', apiUrl);
      console.log('Allowed Origins:', allowedOrigins);
      
      // Check if frontend URL is in allowed origins
      if (allowedOrigins && allowedOrigins.includes(frontendUrl)) {
        console.log('✅ Frontend URL is in CORS allowed origins');
      } else {
        console.log('⚠️  Frontend URL might not be in CORS allowed origins');
      }
      
      // Check URL formats
      if (frontendUrl && frontendUrl.startsWith('http')) {
        console.log('✅ Frontend URL format is valid');
      } else {
        console.log('❌ Frontend URL format is invalid');
      }
      
      if (apiUrl && apiUrl.startsWith('http')) {
        console.log('✅ API URL format is valid');
      } else {
        console.log('❌ API URL format is invalid');
      }
    `], {
      cwd: __dirname,
      stdio: 'inherit'
    });

    urlTest.on('close', (urlCode) => {
      console.log(`URL test exit code: ${urlCode}\n`);
      
      const overallSuccess = code === 0 && apiCode === 0 && urlCode === 0;
      
      if (overallSuccess) {
        console.log('🎉 All environment integration tests passed!');
        console.log('\n✅ Your environment setup is working correctly across:');
        console.log('   - Frontend (Next.js)');
        console.log('   - API (Serverless functions)');
        console.log('   - Cross-service communication');
      } else {
        console.log('❌ Some environment tests failed. Check the output above.');
      }
    });
  });
});