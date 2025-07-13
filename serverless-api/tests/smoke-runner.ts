/**
 * Smoke test runner - can be used standalone or by Jest
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';

interface ApiResponse<T = any> {
  response: Response | null;
  data: T | null;
  error: Error | null;
}

async function apiRequest<T = any>(endpoint: string): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url);
    const data = await response.json() as T;
    return { response, data, error: null };
  } catch (error) {
    return { response: null, data: null, error: error as Error };
  }
}

export async function smokeTests(): Promise<boolean> {
  console.log('💨 Running API Smoke Tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Health Check
  console.log('1. Testing health endpoint...');
  const { response: healthRes, data: healthData, error: healthError } = await apiRequest('/health');
  
  if (healthError || !healthRes || healthRes.status !== 200) {
    console.log('❌ Health check failed');
    failed++;
  } else {
    console.log('✅ Health check passed');
    passed++;
  }
  
  console.log('\n📊 Smoke Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All smoke tests passed! API is responding correctly.');
    return true;
  } else {
    console.log('\n⚠️  Some smoke tests failed. API may have issues.');
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  smokeTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Smoke tests failed:', error);
    process.exit(1);
  });
}