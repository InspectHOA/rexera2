#!/usr/bin/env node

/**
 * Simple test runner for Rexera 2.0 API
 * Can be run standalone or as part of CI/CD
 */

const { runAllTests } = require('../api.integration.test.js');

console.log('🧪 Rexera 2.0 API Test Runner');
console.log('=============================\n');

// Check if API server is running
async function checkApiServer() {
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
    console.error('❌ API server is not accessible:', error.message);
    console.log('💡 Make sure the API server is running on localhost:3001');
    return false;
  }
}

async function main() {
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