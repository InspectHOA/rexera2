#!/usr/bin/env node

/**
 * Simple test script to demonstrate REST API functionality
 * Run with: node test-rest-api.js
 */

const baseUrl = 'http://localhost:3002/api/rest';

async function testRestAPI() {
  console.log('🧪 Testing REST API Endpoints\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing Health Check...');
    const healthResponse = await fetch(`${baseUrl}/health`);
    const healthData = await healthResponse.json();
    console.log(`   ✅ Health: ${healthData.data.status}`);
    console.log(`   📊 Database accessible: ${healthData.data.data.database.workflows.accessible}\n`);

    // Test 2: List Workflows
    console.log('2. Testing List Workflows...');
    const workflowsResponse = await fetch(`${baseUrl}/workflows?page=1&limit=3`);
    const workflowsData = await workflowsResponse.json();
    console.log(`   ✅ Found ${workflowsData.data.length} workflows`);
    console.log(`   📄 Total: ${workflowsData.pagination.total}, Pages: ${workflowsData.pagination.totalPages}\n`);

    // Test 3: Get Specific Workflow
    if (workflowsData.data.length > 0) {
      const workflowId = workflowsData.data[0].id;
      console.log(`3. Testing Get Workflow by ID (${workflowId})...`);
      const workflowResponse = await fetch(`${baseUrl}/workflows/${workflowId}?include=client,tasks`);
      const workflowData = await workflowResponse.json();
      console.log(`   ✅ Workflow: ${workflowData.data.title}`);
      console.log(`   🏢 Client: ${workflowData.data.client?.name || 'N/A'}`);
      console.log(`   📋 Tasks: ${workflowData.data.tasks?.length || 0}\n`);
    }

    // Test 4: List Tasks
    console.log('4. Testing List Tasks...');
    const tasksResponse = await fetch(`${baseUrl}/tasks?page=1&limit=3`);
    const tasksData = await tasksResponse.json();
    console.log(`   ✅ Found ${tasksData.data.length} tasks`);
    console.log(`   📊 Total: ${tasksData.pagination.total}, Pages: ${tasksData.pagination.totalPages}\n`);

    // Test 5: Filter Tasks by Workflow
    if (workflowsData.data.length > 0) {
      const workflowId = workflowsData.data[0].id;
      console.log(`5. Testing Filter Tasks by Workflow (${workflowId})...`);
      const filteredTasksResponse = await fetch(`${baseUrl}/tasks?workflow_id=${workflowId}&limit=2`);
      const filteredTasksData = await filteredTasksResponse.json();
      console.log(`   ✅ Found ${filteredTasksData.data.length} tasks for this workflow\n`);
    }

    console.log('🎉 All REST API tests completed successfully!');
    console.log('\n📚 Available endpoints:');
    console.log('   GET    /api/rest/health');
    console.log('   GET    /api/rest/workflows');
    console.log('   GET    /api/rest/workflows/:id');
    console.log('   POST   /api/rest/workflows');
    console.log('   GET    /api/rest/tasks');
    console.log('   POST   /api/rest/tasks');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
testRestAPI();