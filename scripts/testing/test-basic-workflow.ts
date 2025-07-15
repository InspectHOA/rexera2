#!/usr/bin/env tsx

/**
 * ============================================================================
 * Basic n8n Workflow Integration Test for Rexera 2.0
 * ============================================================================
 *
 * This script provides a focused test of the core n8n Cloud integration,
 * specifically testing the Basic Test workflow webhook functionality and
 * API connectivity.
 *
 */

import { config } from 'dotenv';

// Load environment variables from serverless API configuration
config({ path: './serverless-api/.env' });

interface Config {
  n8nBaseUrl: string;
  n8nApiKey: string;
  rexeraApiUrl: string;
  workflowName: string;
}

interface HealthResponse {
  status: boolean;
  [key: string]: any;
}

interface WorkflowResponse {
  id: string;
  name: string;
  active: boolean;
}

interface WorkflowListResponse {
  data: WorkflowResponse[];
}

interface TestPayload {
  workflow_id: string;
  client_id: string;
  property_address: string;
  loan_number: string;
}

interface WorkflowResult {
  success: boolean;
  message?: string;
  [key: string]: any;
}

interface FetchOptions extends RequestInit {
  timeout?: number;
}

const apiConfig: Config = {
  n8nBaseUrl: process.env.N8N_BASE_URL!,
  n8nApiKey: process.env.N8N_API_KEY!,
  rexeraApiUrl: 'http://localhost:3001',
  workflowName: 'Basic Test Workflow'
};

async function main(): Promise<void> {
  try {
    console.log('🚀 Starting n8n Basic Test Workflow Integration Test');
    console.log('=================================================');
    console.log('🔧 Configuration:');
    console.log(`   N8N Base URL: ${apiConfig.n8nBaseUrl}`);
    console.log(`   N8N API Key: ${apiConfig.n8nApiKey ? '[SET]' : '[MISSING]'}`);
    console.log(`   Rexera API URL: ${apiConfig.rexeraApiUrl}`);

    // Step 1: Check if local API is running
    console.log('\n🔍 Step 1: Checking local API...');
    await checkLocalApi();

    // Step 2: Find the test workflow in n8n
    console.log('\n🔍 Step 2: Finding test workflow in n8n...');
    const workflow = await findTestWorkflow();

    // Step 3: Create a workflow to test
    console.log('\n📝 Step 3: Creating a test workflow in Rexera...');
    const testWorkflow = await createTestWorkflow();

    // Step 4: Trigger the workflow via webhook
    console.log('\n🚀 Step 4: Triggering test workflow...');
    const webhookUrl = `${apiConfig.n8nBaseUrl}/webhook/basic-test`;
    const result = await triggerWorkflow(webhookUrl, testWorkflow.id);

    // Step 5: Verify results
    console.log('\n✅ Step 5: Workflow completed successfully!');
    console.log('📊 Test Results:');
    console.log(JSON.stringify(result, null, 2));

    console.log('\n🎉 All tests passed! n8n integration is working correctly.');

  } catch (error) {
    console.error('\n❌ Test failed:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

async function checkLocalApi(): Promise<HealthResponse> {
  try {
    console.log(`Checking API at: ${apiConfig.rexeraApiUrl}/api/health`);
    const response = await fetch(`${apiConfig.rexeraApiUrl}/api/health`);
    const data = await response.json() as HealthResponse;
    
    console.log('Health response:', data);
    
    if (!response.ok || !data.status) {
      throw new Error('Local API health check failed');
    }
    
    console.log('✅ Local API is running');
    return data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log('Health check error:', errorMessage);
    throw new Error(`Cannot connect to local API at ${apiConfig.rexeraApiUrl}. Is the server running? Run: npm run dev`);
  }
}

async function findTestWorkflow(): Promise<WorkflowResponse> {
  try {
    const response = await fetch(`${apiConfig.n8nBaseUrl}/api/v1/workflows`, {
      headers: {
        'Authorization': `Bearer ${apiConfig.n8nApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`n8n API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as WorkflowListResponse;
    const workflow = data.data?.find(w => w.name === apiConfig.workflowName);

    if (!workflow) {
      throw new Error(`Test workflow "${apiConfig.workflowName}" not found in n8n. Please deploy it first.`);
    }

    if (!workflow.active) {
      console.log('⚠️  Workflow is inactive. You may need to activate it in n8n.');
    }

    console.log(`✅ Found workflow: ${workflow.name} (ID: ${workflow.id})`);
    return workflow;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to connect to n8n: ${errorMessage}. Check N8N_BASE_URL and N8N_API_KEY in .env`);
  }
}

async function createTestWorkflow(): Promise<{ id: string }> {
  try {
    const response = await fetch(`${apiConfig.rexeraApiUrl}/api/workflows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        workflow_type: 'BASIC_TEST',
        client_id: 'test-client-123',
        title: 'Basic Test Workflow - Integration Test',
        metadata: {
          property: { address: '456 Test Ave', loanNumber: 'TEST-2024-002' },
          borrower: { name: 'Test User 2', email: 'test2@example.com' }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create workflow: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Test workflow created:', data.data.id);
    return data.data;
  } catch (error) {
    throw new Error(`Failed to create test workflow in Rexera: ${error}`);
  }
}

async function triggerWorkflow(webhookUrl: string, workflowId: string): Promise<WorkflowResult> {
  const testPayload: TestPayload = {
    workflow_id: workflowId,
    client_id: 'test-client-001',
    property_address: '123 Test Integration St',
    loan_number: 'TEST-LOAN-' + Date.now()
  };

  console.log('📤 Sending test payload:', testPayload);
  console.log('🌐 Webhook URL:', webhookUrl);

  try {
    const response = await fetchWithTimeout(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload),
      timeout: 30000 // 30 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Webhook failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json() as WorkflowResult;
    
    if (!result.success) {
      throw new Error(`Workflow execution failed: ${result.message || 'Unknown error'}`);
    }

    return result;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Workflow execution timed out after 30 seconds');
    }
    throw error;
  }
}

// Add timeout support to fetch
async function fetchWithTimeout(url: string, options: FetchOptions = {}): Promise<Response> {
  if (options.timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout);
    options.signal = controller.signal;
    
    return fetch(url, options).finally(() => {
      clearTimeout(timeoutId);
    });
  }
  return fetch(url, options);
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