#!/usr/bin/env node

/**
 * Simple test runner for Rexera 2.0 API
 * Can be run standalone or as part of CI/CD
 */

import { runIntegrationTests } from '../integration.test';
import { smokeTests } from '../smoke.test';

console.log('🧪 Rexera 2.0 API Test Runner');
console.log('=============================\n');

// Check if API server is running
async function checkApiServer(): Promise<boolean> {
  const API_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';
  
  try {
    const response = await fetch(`${API_URL}/health`);
    if (response.ok) {
      console.log('✅ API server is running');
      return true;
    } else {
      console.error(`❌ API server responded with status ${response.status}`);
      return false;
    }
  } catch (error) {
    const err = error as Error;
    console.error('❌ API server is not accessible:', err.message);
    console.log('💡 Make sure the API server is running on localhost:3001');
    return false;
  }
}

async function runAllTests(): Promise<void> {
  console.log('🚀 Running all tests...\n');
  
  try {
    // Run smoke tests first
    console.log('1️⃣ Running smoke tests...');
    const smokeSuccess = await smokeTests();
    
    if (!smokeSuccess) {
      throw new Error('Smoke tests failed');
    }
    
    console.log('\n2️⃣ Running integration tests...');
    await runIntegrationTests();
    
    console.log('\n🎉 All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    throw error;
  }
}

async function main(): Promise<void> {
  // Check API server first
  const isServerRunning = await checkApiServer();
  if (!isServerRunning) {
    console.log('\n🚨 Cannot run tests - API server is not accessible');
    process.exit(1);
  }
  
  // Run tests
  await runAllTests();
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

export { runAllTests, checkApiServer };