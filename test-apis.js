#!/usr/bin/env node

/**
 * Quick API validation script for human-readable ID support
 */

async function testAPIs() {
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
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}\n`);
    }
  }
}

testAPIs().catch(console.error);