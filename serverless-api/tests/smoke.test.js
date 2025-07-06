/**
 * Smoke tests for Rexera 2.0 API
 * Quick tests to verify API is working without creating test data
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';

async function apiRequest(endpoint) {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    return { response, data, error: null };
  } catch (error) {
    return { response: null, data: null, error };
  }
}

async function smokeTests() {
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
  
  // Test 2: Workflows List
  console.log('2. Testing workflows list...');
  const { response: workflowsRes, data: workflowsData, error: workflowsError } = await apiRequest('/workflows');
  
  if (workflowsError || !workflowsRes || workflowsRes.status !== 200 || !workflowsData.success) {
    console.log('❌ Workflows list failed');
    failed++;
  } else {
    console.log(`✅ Workflows list passed (${workflowsData.data.length} workflows)`);
    passed++;
  }
  
  // Test 3: Task Executions
  console.log('3. Testing task executions...');
  const { response: tasksRes, data: tasksData, error: tasksError } = await apiRequest('/taskExecutions');
  
  if (tasksError || !tasksRes || tasksRes.status !== 200 || !tasksData.success) {
    console.log('❌ Task executions failed');
    failed++;
  } else {
    console.log(`✅ Task executions passed (${tasksData.data.length} tasks)`);
    passed++;
  }
  
  // Test 4: Agents
  console.log('4. Testing agents...');
  const { response: agentsRes, data: agentsData, error: agentsError } = await apiRequest('/agents');
  
  if (agentsError || !agentsRes || agentsRes.status !== 200 || !agentsData.success) {
    console.log('❌ Agents failed');
    failed++;
  } else {
    console.log(`✅ Agents passed (${agentsData.data.length} agents)`);
    passed++;
  }
  
  // Test 5: Individual Workflow (if any exist)
  if (workflowsData && workflowsData.data.length > 0) {
    console.log('5. Testing individual workflow...');
    const firstWorkflow = workflowsData.data[0];
    const testId = firstWorkflow.human_readable_id || firstWorkflow.id;
    
    const { response: workflowRes, data: workflowData, error: workflowError } = await apiRequest(`/workflows/${testId}`);
    
    if (workflowError || !workflowRes || workflowRes.status !== 200 || !workflowData.success) {
      console.log('❌ Individual workflow failed');
      failed++;
    } else {
      console.log(`✅ Individual workflow passed (${workflowData.data.title})`);
      passed++;
    }
  } else {
    console.log('5. Skipping individual workflow test (no workflows found)');
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

// Export for programmatic use
module.exports = { smokeTests };

// Run if called directly
if (require.main === module) {
  smokeTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Smoke tests failed:', error);
    process.exit(1);
  });
}