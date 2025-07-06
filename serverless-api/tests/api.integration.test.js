/**
 * Integration tests for Rexera 2.0 API endpoints
 * Tests all API routes with real database interactions
 */

const { createClient } = require('@supabase/supabase-js');

// Test configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wmgidablmqotriwlefhq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZ2lkYWJsbXFvdHJpd2xlZmhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTEzNzk2NywiZXhwIjoyMDY2NzEzOTY3fQ.viSjS9PV2aDSOIzayHv6zJG-rjmjOBOVMsHlm77h6ns';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Test data storage
let testData = {
  clients: [],
  agents: [],
  workflows: [],
  tasks: []
};

/**
 * API request helper
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
  
  const data = await response.json();
  return { response, data };
}

/**
 * Test helper functions
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(`❌ Assertion failed: ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`❌ ${message}\n   Expected: ${expected}\n   Actual: ${actual}`);
  }
}

function assertTrue(condition, message) {
  assert(condition === true, message);
}

function assertNotNull(value, message) {
  assert(value != null, message);
}

/**
 * Setup test data
 */
async function setupTestData() {
  console.log('🔧 Setting up test data...');
  
  try {
    // Create test clients
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .insert([
        { name: 'Test Client API 1', domain: 'test-api-1.com' },
        { name: 'Test Client API 2', domain: 'test-api-2.com' }
      ])
      .select();
    
    if (clientsError) throw clientsError;
    testData.clients = clients;
    console.log(`✅ Created ${clients.length} test clients`);

    // Create test agents
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .insert([
        { name: 'test-nina', type: 'research', description: 'Test Research Agent', capabilities: ['test_research'] },
        { name: 'test-mia', type: 'communication', description: 'Test Communication Agent', capabilities: ['test_email'] }
      ])
      .select();
    
    if (agentsError) throw agentsError;
    testData.agents = agents;
    console.log(`✅ Created ${agents.length} test agents`);

    // Get existing auth user
    const existingUserId = '82a7d984-485b-4a47-ac28-615a1b448473';

    // Create test workflows
    const { data: workflows, error: workflowsError } = await supabase
      .from('workflows')
      .insert([
        {
          workflow_type: 'PAYOFF',
          client_id: clients[0].id,
          title: 'Test API Workflow 1',
          description: 'Test payoff workflow for API testing',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          created_by: existingUserId,
          human_readable_id: 'TEST-API-001',
          metadata: {
            property_address: "123 Test API St",
            borrower_name: "Test Borrower",
            loan_number: "TEST123",
            estimated_balance: 100000.00
          }
        },
        {
          workflow_type: 'HOA_ACQUISITION',
          client_id: clients[1].id,
          title: 'Test API Workflow 2',
          description: 'Test HOA workflow for API testing',
          status: 'COMPLETED',
          priority: 'NORMAL',
          created_by: existingUserId,
          human_readable_id: 'TEST-API-002',
          metadata: {
            property_address: "456 Test API Ave",
            borrower_name: "Test Borrower 2",
            estimated_balance: 50000.00
          }
        }
      ])
      .select();
    
    if (workflowsError) throw workflowsError;
    testData.workflows = workflows;
    console.log(`✅ Created ${workflows.length} test workflows`);

    // Create test task executions
    const { data: tasks, error: tasksError } = await supabase
      .from('task_executions')
      .insert([
        {
          workflow_id: workflows[0].id,
          agent_id: agents[0].id,
          title: 'Test Task 1',
          description: 'Test task for API integration testing',
          sequence_order: 1,
          task_type: 'test_task_type',
          status: 'COMPLETED',
          executor_type: 'AI',
          priority: 'HIGH',
          input_data: { test: 'input' },
          output_data: { test: 'output' }
        },
        {
          workflow_id: workflows[0].id,
          agent_id: agents[1].id,
          title: 'Test Task 2',
          description: 'Second test task for API integration testing',
          sequence_order: 2,
          task_type: 'test_task_type_2',
          status: 'PENDING',
          executor_type: 'AI',
          priority: 'NORMAL',
          input_data: { test: 'input2' }
        }
      ])
      .select();
    
    if (tasksError) throw tasksError;
    testData.tasks = tasks;
    console.log(`✅ Created ${tasks.length} test tasks`);

    console.log('✅ Test data setup complete');
    return testData;

  } catch (error) {
    console.error('❌ Failed to setup test data:', error);
    throw error;
  }
}

/**
 * Cleanup test data
 */
async function cleanupTestData() {
  console.log('🧹 Cleaning up test data...');
  
  try {
    // Delete in reverse order due to foreign key constraints
    if (testData.tasks.length > 0) {
      await supabase.from('task_executions').delete().in('id', testData.tasks.map(t => t.id));
      console.log('✅ Cleaned up test tasks');
    }
    
    if (testData.workflows.length > 0) {
      await supabase.from('workflows').delete().in('id', testData.workflows.map(w => w.id));
      console.log('✅ Cleaned up test workflows');
    }
    
    if (testData.agents.length > 0) {
      await supabase.from('agents').delete().in('id', testData.agents.map(a => a.id));
      console.log('✅ Cleaned up test agents');
    }
    
    if (testData.clients.length > 0) {
      await supabase.from('clients').delete().in('id', testData.clients.map(c => c.id));
      console.log('✅ Cleaned up test clients');
    }

    console.log('✅ Cleanup complete');
  } catch (error) {
    console.error('❌ Failed to cleanup test data:', error);
  }
}

/**
 * Test Suites
 */

// Health Check Tests
async function testHealthEndpoint() {
  console.log('\n🏥 Testing Health Endpoint...');
  
  const { response, data } = await apiRequest('/health');
  
  assertEqual(response.status, 200, 'Health endpoint should return 200');
  assertEqual(data.status, 'ok', 'Health endpoint should return ok status');
  assertNotNull(data.timestamp, 'Health endpoint should return timestamp');
  
  console.log('✅ Health endpoint tests passed');
}

// Workflows List Tests
async function testWorkflowsList() {
  console.log('\n📋 Testing Workflows List Endpoint...');
  
  // Test basic list
  const { response, data } = await apiRequest('/workflows');
  
  assertEqual(response.status, 200, 'Workflows list should return 200');
  assertTrue(data.success, 'Workflows list should return success=true');
  assertTrue(Array.isArray(data.data), 'Workflows list should return array');
  assertTrue(data.data.length >= 2, 'Should return our test workflows');
  
  // Verify test workflows are present
  const testWorkflow = data.data.find(w => w.human_readable_id === 'TEST-API-001');
  assertNotNull(testWorkflow, 'Should find test workflow TEST-API-001');
  assertEqual(testWorkflow.title, 'Test API Workflow 1', 'Test workflow should have correct title');
  assertEqual(testWorkflow.status, 'IN_PROGRESS', 'Test workflow should have correct status');
  
  console.log('✅ Workflows list tests passed');
}

// Workflows List with Include Tests
async function testWorkflowsListWithInclude() {
  console.log('\n📋 Testing Workflows List with Include...');
  
  const { response, data } = await apiRequest('/workflows?include=client');
  
  assertEqual(response.status, 200, 'Workflows list with include should return 200');
  assertTrue(data.success, 'Should return success=true');
  
  // Check that client data is included
  const testWorkflow = data.data.find(w => w.human_readable_id === 'TEST-API-001');
  assertNotNull(testWorkflow, 'Should find test workflow');
  assertNotNull(testWorkflow.clients, 'Should include client data');
  assertEqual(testWorkflow.clients.name, 'Test Client API 1', 'Should include correct client name');
  
  console.log('✅ Workflows list with include tests passed');
}

// Individual Workflow Tests (UUID)
async function testIndividualWorkflowByUUID() {
  console.log('\n📄 Testing Individual Workflow by UUID...');
  
  const testWorkflow = testData.workflows[0];
  const { response, data } = await apiRequest(`/workflows/${testWorkflow.id}?include=client`);
  
  assertEqual(response.status, 200, 'Individual workflow should return 200');
  assertTrue(data.success, 'Should return success=true');
  assertEqual(data.data.id, testWorkflow.id, 'Should return correct workflow');
  assertEqual(data.data.title, 'Test API Workflow 1', 'Should return correct title');
  assertNotNull(data.data.clients, 'Should include client data');
  
  console.log('✅ Individual workflow by UUID tests passed');
}

// Individual Workflow Tests (Human Readable ID)
async function testIndividualWorkflowByHumanId() {
  console.log('\n📄 Testing Individual Workflow by Human Readable ID...');
  
  const { response, data } = await apiRequest('/workflows/TEST-API-001?include=client');
  
  assertEqual(response.status, 200, 'Individual workflow by human ID should return 200');
  assertTrue(data.success, 'Should return success=true');
  assertEqual(data.data.human_readable_id, 'TEST-API-001', 'Should return correct workflow');
  assertEqual(data.data.title, 'Test API Workflow 1', 'Should return correct title');
  assertNotNull(data.data.clients, 'Should include client data');
  
  console.log('✅ Individual workflow by human readable ID tests passed');
}

// Workflow Not Found Tests
async function testWorkflowNotFound() {
  console.log('\n🔍 Testing Workflow Not Found...');
  
  const { response, data } = await apiRequest('/workflows/nonexistent-id');
  
  assertEqual(response.status, 404, 'Nonexistent workflow should return 404');
  assertTrue(!data.success, 'Should return success=false');
  
  console.log('✅ Workflow not found tests passed');
}

// Task Executions Tests
async function testTaskExecutions() {
  console.log('\n⚡ Testing Task Executions Endpoint...');
  
  // Test all task executions
  const { response, data } = await apiRequest('/taskExecutions');
  
  assertEqual(response.status, 200, 'Task executions should return 200');
  assertTrue(data.success, 'Should return success=true');
  assertTrue(Array.isArray(data.data), 'Should return array');
  assertTrue(data.data.length >= 2, 'Should return our test tasks');
  
  // Verify test tasks are present
  const testTask = data.data.find(t => t.title === 'Test Task 1');
  assertNotNull(testTask, 'Should find test task');
  assertEqual(testTask.status, 'COMPLETED', 'Test task should have correct status');
  
  console.log('✅ Task executions tests passed');
}

// Task Executions by Workflow Tests
async function testTaskExecutionsByWorkflow() {
  console.log('\n⚡ Testing Task Executions by Workflow...');
  
  const testWorkflow = testData.workflows[0];
  const { response, data } = await apiRequest(`/taskExecutions?workflowId=${testWorkflow.id}`);
  
  assertEqual(response.status, 200, 'Task executions by workflow should return 200');
  assertTrue(data.success, 'Should return success=true');
  assertEqual(data.data.length, 2, 'Should return exactly 2 tasks for test workflow');
  
  // Verify tasks belong to the workflow
  data.data.forEach(task => {
    assertEqual(task.workflow_id, testWorkflow.id, 'All tasks should belong to the test workflow');
  });
  
  console.log('✅ Task executions by workflow tests passed');
}

// Task Executions with Include Tests
async function testTaskExecutionsWithInclude() {
  console.log('\n⚡ Testing Task Executions with Include...');
  
  const testWorkflow = testData.workflows[0];
  const { response, data } = await apiRequest(`/taskExecutions?workflowId=${testWorkflow.id}&include=agent`);
  
  assertEqual(response.status, 200, 'Task executions with include should return 200');
  assertTrue(data.success, 'Should return success=true');
  
  // Check that agent data is included
  const taskWithAgent = data.data.find(t => t.title === 'Test Task 1');
  assertNotNull(taskWithAgent, 'Should find test task');
  assertNotNull(taskWithAgent.agents, 'Should include agent data');
  assertEqual(taskWithAgent.agents.name, 'test-nina', 'Should include correct agent name');
  
  console.log('✅ Task executions with include tests passed');
}

// Agents Tests
async function testAgents() {
  console.log('\n🤖 Testing Agents Endpoint...');
  
  const { response, data } = await apiRequest('/agents');
  
  assertEqual(response.status, 200, 'Agents should return 200');
  assertTrue(data.success, 'Should return success=true');
  assertTrue(Array.isArray(data.data), 'Should return array');
  assertTrue(data.data.length >= 2, 'Should return our test agents');
  
  // Verify test agents are present
  const testAgent = data.data.find(a => a.name === 'test-nina');
  assertNotNull(testAgent, 'Should find test agent');
  assertEqual(testAgent.type, 'research', 'Test agent should have correct type');
  
  console.log('✅ Agents tests passed');
}

// Performance Tests
async function testPerformance() {
  console.log('\n⚡ Testing API Performance...');
  
  const start = Date.now();
  const { response } = await apiRequest('/workflows?include=client,tasks');
  const end = Date.now();
  
  const responseTime = end - start;
  
  assertEqual(response.status, 200, 'Performance test should return 200');
  assertTrue(responseTime < 5000, `Response time should be under 5 seconds (was ${responseTime}ms)`);
  
  console.log(`✅ Performance tests passed (${responseTime}ms)`);
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('🚀 Starting Rexera 2.0 API Integration Tests\n');
  
  let passed = 0;
  let failed = 0;
  const startTime = Date.now();
  
  try {
    // Setup
    await setupTestData();
    
    // Run all test suites
    const tests = [
      testHealthEndpoint,
      testWorkflowsList,
      testWorkflowsListWithInclude,
      testIndividualWorkflowByUUID,
      testIndividualWorkflowByHumanId,
      testWorkflowNotFound,
      testTaskExecutions,
      testTaskExecutionsByWorkflow,
      testTaskExecutionsWithInclude,
      testAgents,
      testPerformance
    ];
    
    for (const test of tests) {
      try {
        await test();
        passed++;
      } catch (error) {
        console.error(`❌ ${test.name} failed:`, error.message);
        failed++;
      }
    }
    
  } catch (error) {
    console.error('❌ Test setup failed:', error);
    failed++;
  } finally {
    // Cleanup
    await cleanupTestData();
  }
  
  const totalTime = Date.now() - startTime;
  
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏱️  Total time: ${totalTime}ms`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! API is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
    process.exit(1);
  }
}

// Export for programmatic use
module.exports = {
  runAllTests,
  setupTestData,
  cleanupTestData,
  testData
};

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}