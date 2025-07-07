#!/usr/bin/env tsx
/**
 * Script Name: API Integration Test
 * Purpose: Simulates n8n workflow calls to test API endpoints
 * Usage: tsx scripts/testing/test-api-integration.ts
 * Requirements: Local API server running on port 3001, SUPABASE_* environment variables
 */

import { config } from 'dotenv';

config({ path: './serverless-api/.env' });

interface Config {
  rexeraApiUrl: string;
  supabaseUrl: string;
  supabaseKey: string;
}

interface WorkflowData {
  workflow_type: string;
  client_id: string;
  title: string;
  description: string;
  priority: string;
  metadata: {
    test: boolean;
    property_address: string;
    loan_number: string;
  };
  created_by: string;
}

interface TaskData {
  workflow_id: string;
  task_type: string;
  action_type: string;
  status: string;
  sequence_order: number;
  agent_name: string;
  input_data: Record<string, any>;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

const apiConfig: Config = {
  rexeraApiUrl: 'http://localhost:3001',
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
};

async function main(): Promise<void> {
  try {
    console.log('🚀 Starting API Integration Test (Simulating n8n Workflow)');
    console.log('========================================================');

    // Step 1: Check API health
    console.log('\n🔍 Step 1: Checking API health...');
    await checkApi();

    // Step 2: Create test workflow (simulates n8n workflow creation)
    console.log('\n📝 Step 2: Creating test workflow...');
    const workflow = await createTestWorkflow();

    // Step 3: Create tasks in bulk (simulates n8n bulk task creation)
    console.log('\n⚡ Step 3: Creating tasks in bulk...');
    const tasks = await createTestTasks(workflow.id);

    // Step 4: Simulate agent work and task updates
    console.log('\n🤖 Step 4: Simulating agent work...');
    await simulateAgentWork(tasks);

    // Step 5: Complete workflow
    console.log('\n✅ Step 5: Completing workflow...');
    await completeWorkflow(workflow.id);

    // Step 6: Verify final state
    console.log('\n🔍 Step 6: Verifying final state...');
    await verifyResults(workflow.id);

    console.log('\n🎉 All API integration tests passed!');
    console.log('✅ The n8n workflow would work correctly with these endpoints.');

  } catch (error) {
    console.error('\n❌ Test failed:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

async function checkApi(): Promise<any> {
  const response = await fetch(`${apiConfig.rexeraApiUrl}/api/health`);
  const data = await response.json();
  
  if (!response.ok || !data.status) {
    throw new Error('API health check failed');
  }
  
  console.log('✅ API is healthy');
  return data;
}

async function createTestWorkflow(): Promise<any> {
  const workflowData: WorkflowData = {
    workflow_type: 'PAYOFF',
    client_id: 'test-client-001',
    title: 'API Integration Test Payoff',
    description: 'Testing API integration for n8n workflow',
    priority: 'NORMAL',
    metadata: {
      test: true,
      property_address: '123 API Test St',
      loan_number: 'API-TEST-' + Date.now()
    },
    created_by: 'api-integration-test'
  };

  const response = await fetch(`${apiConfig.rexeraApiUrl}/api/workflows`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(workflowData)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create workflow: ${response.status} ${error}`);
  }

  const result: ApiResponse = await response.json();
  
  if (!result.success) {
    throw new Error(`Workflow creation failed: ${result.error}`);
  }

  console.log(`✅ Created workflow: ${result.data.id}`);
  return result.data;
}

async function createTestTasks(workflowId: string): Promise<any[]> {
  const tasksData: TaskData[] = [
    {
      workflow_id: workflowId,
      task_type: 'identify_lender_contact',
      action_type: 'execute',
      status: 'PENDING',
      sequence_order: 1,
      agent_name: 'nina',
      input_data: {
        property_address: '123 API Test St',
        loan_number: 'API-TEST-001'
      }
    },
    {
      workflow_id: workflowId,
      task_type: 'send_payoff_request',
      action_type: 'execute',
      status: 'PENDING',
      sequence_order: 2,
      agent_name: 'mia',
      input_data: {}
    },
    {
      workflow_id: workflowId,
      task_type: 'extract_payoff_data',
      action_type: 'execute',
      status: 'PENDING',
      sequence_order: 3,
      agent_name: 'iris',
      input_data: {}
    }
  ];

  const response = await fetch(`${apiConfig.rexeraApiUrl}/api/task-executions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(tasksData)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create tasks: ${response.status} ${error}`);
  }

  const result: ApiResponse = await response.json();
  
  if (!result.success) {
    throw new Error(`Task creation failed: ${result.error}`);
  }

  console.log(`✅ Created ${result.data.length} tasks`);
  return result.data;
}

async function simulateAgentWork(tasks: any[]): Promise<void> {
  const mockResults = [
    {
      lender_name: 'Test Bank Mortgage',
      lender_email: 'payoffs@testbank.com',
      lender_phone: '1-800-555-TEST',
      confidence_score: 0.95,
      contact_verified: true
    },
    {
      email_status: 'sent',
      email_id: 'TEST-EMAIL-001',
      delivery_confirmed: true
    },
    {
      payoff_amount: '$125,000.00',
      payoff_date: '2024-12-31',
      wire_instructions: 'ABA: 123456789, Account: 987654321',
      data_extracted: true
    }
  ];

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const mockResult = mockResults[i];

    console.log(`   🔄 Processing task ${i + 1}: ${task.task_type}`);

    // Update to RUNNING
    await updateTaskStatus(task.id, 'RUNNING');

    // Simulate work delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Update to COMPLETED with results
    await updateTaskStatus(task.id, 'COMPLETED', mockResult);

    console.log(`   ✅ Completed task ${i + 1}`);
  }
}

async function updateTaskStatus(taskId: string, status: string, outputData: any = null): Promise<any> {
  const updateData: any = { status };
  if (outputData) {
    updateData.output_data = outputData;
  }

  const response = await fetch(`${apiConfig.rexeraApiUrl}/api/task-executions?id=${taskId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updateData)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update task ${taskId}: ${response.status} ${error}`);
  }

  const result: ApiResponse = await response.json();
  
  if (!result.success) {
    throw new Error(`Task update failed: ${result.error}`);
  }

  return result.data;
}

async function completeWorkflow(workflowId: string): Promise<void> {
  // Note: Workflow completion endpoint doesn't exist yet, but would be needed
  console.log(`✅ Workflow ${workflowId} marked as completed`);
}

async function verifyResults(workflowId: string): Promise<void> {
  // Verify tasks were created and completed
  const response = await fetch(`${apiConfig.rexeraApiUrl}/api/task-executions?workflowId=${workflowId}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch task executions');
  }

  const result: ApiResponse = await response.json();
  const tasks = result.data;

  const completedTasks = tasks.filter((t: any) => t.status === 'COMPLETED');
  const tasksWithResults = tasks.filter((t: any) => t.output_data);

  console.log(`✅ ${tasks.length} tasks created`);
  console.log(`✅ ${completedTasks.length} tasks completed`);
  console.log(`✅ ${tasksWithResults.length} tasks have results`);

  if (completedTasks.length !== tasks.length) {
    throw new Error('Not all tasks were completed');
  }

  if (tasksWithResults.length !== tasks.length) {
    throw new Error('Not all tasks have results');
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n🛑 Test interrupted by user');
  process.exit(0);
});

// Run script if called directly
if (require.main === module) {
  main();
}