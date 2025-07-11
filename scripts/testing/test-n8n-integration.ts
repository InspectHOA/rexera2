#!/usr/bin/env tsx

/**
 * ============================================================================
 * Basic n8n Integration Test for Rexera 2.0
 * ============================================================================
 * 
 * This script provides a focused test of the core n8n Cloud integration,
 * specifically testing the PAYOFF workflow webhook functionality and
 * API connectivity. This is a lighter-weight test compared to the full
 * end-to-end integration test.
 * 
 * PURPOSE:
 * -------
 * - Validate n8n Cloud API connectivity and authentication
 * - Test webhook endpoint accessibility and response
 * - Verify basic workflow triggering mechanism
 * - Provide quick smoke test for n8n integration
 * 
 * SCOPE:
 * -----
 * This test focuses specifically on the n8n layer without testing the
 * complete Rexera workflow lifecycle. It's designed for:
 * - Quick validation during development
 * - CI/CD pipeline smoke testing
 * - Troubleshooting n8n connectivity issues
 * - Verifying workflow deployment success
 * 
 * TEST FLOW:
 * ---------
 * 1. Health Check: Verify local Rexera API is running
 * 2. n8n Discovery: Find and validate test workflow in n8n Cloud
 * 3. Webhook Trigger: Send test payload to n8n webhook endpoint
 * 4. Response Validation: Verify successful workflow execution
 * 
 * COMPARED TO FULL INTEGRATION TEST:
 * ---------------------------------
 * - This test: n8n webhook → n8n response (simple)
 * - Full test: Rexera → n8n → tasks → agents → completion (comprehensive)
 * 
 * ENVIRONMENT REQUIREMENTS:
 * ------------------------
 * N8N_BASE_URL        - n8n Cloud instance URL
 * N8N_API_KEY         - n8n Cloud API authentication key
 * Local API Server    - Must be running on port 3001
 * 
 * EXPECTED WORKFLOW:
 * -----------------
 * The test expects to find a workflow named "Payoff Test Workflow" in n8n
 * Cloud that responds to webhook triggers at /webhook/payoff-test
 * 
 * USAGE:
 * -----
 * tsx scripts/testing/test-n8n-integration.ts
 * 
 * SUCCESS CRITERIA:
 * ----------------
 * ✅ Local API health check passes
 * ✅ n8n Cloud API connectivity confirmed
 * ✅ Test workflow found and active
 * ✅ Webhook trigger successful
 * ✅ Valid response received from n8n
 * 
 * FAILURE SCENARIOS:
 * -----------------
 * - Local API not running (port 3001)
 * - n8n Cloud connectivity issues
 * - Invalid API credentials
 * - Test workflow not deployed/active
 * - Webhook endpoint not accessible
 * 
 * @version 2.0
 * @since 2024-07-11
 * @author Rexera Development Team
 */

import { config } from 'dotenv';

// ============================================================================
// ENVIRONMENT CONFIGURATION
// ============================================================================

// Load environment variables from serverless API configuration
config({ path: './serverless-api/.env' });

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Test configuration structure
 * 
 * Centralizes all configuration values needed for the integration test,
 * making it easy to modify endpoints and parameters.
 */
interface Config {
  /** n8n Cloud instance base URL */
  n8nBaseUrl: string;
  /** API key for n8n Cloud authentication */
  n8nApiKey: string;
  /** Local Rexera API URL for health checks */
  rexeraApiUrl: string;
  /** Name of the workflow to test in n8n Cloud */
  workflowName: string;
}

/**
 * Response structure from Rexera API health endpoint
 * 
 * Used to verify that the local API server is running and responding
 * before attempting n8n integration tests.
 */
interface HealthResponse {
  /** Whether the API is healthy and operational */
  status: boolean;
  /** Additional health check metadata */
  [key: string]: any;
}

/**
 * n8n workflow information from API
 * 
 * Simplified workflow structure returned by n8n Cloud API
 * when listing or querying specific workflows.
 */
interface WorkflowResponse {
  /** Unique workflow identifier in n8n Cloud */
  id: string;
  /** Human-readable workflow name */
  name: string;
  /** Whether the workflow is currently active and triggerable */
  active: boolean;
}

/**
 * n8n API response structure for workflow lists
 * 
 * Standard wrapper format used by n8n Cloud API for
 * paginated and structured data responses.
 */
interface WorkflowListResponse {
  /** Array of workflow objects */
  data: WorkflowResponse[];
}

/**
 * Test payload sent to n8n webhook
 * 
 * Represents a minimal but valid PAYOFF request payload
 * that the n8n workflow can process successfully.
 */
interface TestPayload {
  /** Test client identifier */
  client_id: string;
  /** Test property address */
  property_address: string;
  /** Test loan number for tracking */
  loan_number: string;
}

/**
 * Expected response from n8n webhook execution
 * 
 * Structure returned by n8n when a workflow completes
 * processing a webhook trigger request.
 */
interface WorkflowResult {
  /** Whether the workflow execution was successful */
  success: boolean;
  /** Optional message with execution details */
  message?: string;
  /** Additional result data from workflow execution */
  [key: string]: any;
}

/**
 * Extended fetch options with timeout support
 * 
 * Adds timeout capability to standard fetch RequestInit
 * for better control over long-running requests.
 */
interface FetchOptions extends RequestInit {
  /** Optional timeout in milliseconds */
  timeout?: number;
}

const apiConfig: Config = {
  n8nBaseUrl: process.env.N8N_BASE_URL!,
  n8nApiKey: process.env.N8N_API_KEY!,
  rexeraApiUrl: 'http://localhost:3001',
  workflowName: 'Payoff Test Workflow'
};

async function main(): Promise<void> {
  try {
    console.log('🚀 Starting n8n Payoff Workflow Integration Test');
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

    // Step 3: Trigger the workflow via webhook
    console.log('\n🚀 Step 3: Triggering test workflow...');
    const webhookUrl = `${apiConfig.n8nBaseUrl}/webhook/payoff-test`;
    const result = await triggerWorkflow(webhookUrl);

    // Step 4: Verify results
    console.log('\n✅ Step 4: Workflow completed successfully!');
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
      throw new Error(`Test workflow "${apiConfig.workflowName}" not found in n8n. Please import payoff-test.json first.`);
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

async function triggerWorkflow(webhookUrl: string): Promise<WorkflowResult> {
  const testPayload: TestPayload = {
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