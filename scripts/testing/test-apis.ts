#!/usr/bin/env tsx

/**
 * API Validation Script
 * 
 * Purpose: Quick validation script for human-readable ID support
 * Usage: tsx scripts/testing/test-apis.ts
 * Requirements: API server running on localhost:3001
 */

async function testAPIs(): Promise<void> {
  console.log('🧪 Testing Human-Readable ID Support\n');
  
  const tests = [
    'http://localhost:3001/api/workflows/1001',
    'http://localhost:3001/api/task-executions?workflowId=1001',
    'http://localhost:3001/api/communications?workflow_id=1001&type=email'
  ];
  
  for (const url of tests) {
    try {
      console.log(`Testing: ${url}`);
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log(`✅ SUCCESS\n`);
      } else {
        console.log(`❌ FAILED: ${data.error?.message || data.error}\n`);
      }
    } catch (error: any) {
      console.log(`❌ ERROR: ${error.message}\n`);
    }
  }
}

async function main() {
  try {
    await testAPIs();
    console.log('🎉 API testing completed');
  } catch (error) {
    console.error('❌ Testing failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}