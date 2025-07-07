#!/usr/bin/env tsx
/**
 * Script Name: Import n8n Workflow
 * Purpose: Import the test workflow to n8n Cloud instance
 * Usage: tsx scripts/testing/import-workflow.ts
 * Requirements: N8N_BASE_URL and N8N_API_KEY environment variables
 */

import { readFileSync } from 'fs';
import { config } from 'dotenv';

config({ path: './serverless-api/.env' });

interface Config {
  n8nBaseUrl: string;
  n8nApiKey: string;
}

interface WorkflowData {
  name: string;
  nodes: any[];
  connections: any;
  settings?: any;
}

interface WorkflowResponse {
  id: string;
  name: string;
  active: boolean;
}

interface TestPayload {
  client_id: string;
  property_address: string;
  loan_number: string;
}

const apiConfig: Config = {
  n8nBaseUrl: process.env.N8N_BASE_URL!,
  n8nApiKey: process.env.N8N_API_KEY!
};

async function importWorkflow(): Promise<void> {
  try {
    console.log('🚀 Importing test workflow to n8n...');
    console.log(`📡 n8n URL: ${apiConfig.n8nBaseUrl}`);

    // Read the workflow JSON
    const workflowJson = readFileSync('./workflows/definitions/payoff-test.json', 'utf8');
    const workflow = JSON.parse(workflowJson);

    console.log(`📄 Loaded workflow: ${workflow.name}`);

    // Prepare the workflow for import
    const workflowData: WorkflowData = {
      name: workflow.name,
      nodes: workflow.nodes,
      connections: workflow.connections,
      settings: workflow.settings || {}
    };

    // Import the workflow
    const response = await fetch(`${apiConfig.n8nBaseUrl}/api/v1/workflows`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': apiConfig.n8nApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(workflowData)
    });

    const responseText = await response.text();
    console.log(`📥 Response Status: ${response.status} ${response.statusText}`);
    console.log(`📥 Response Body: ${responseText}`);

    if (response.ok) {
      const result = JSON.parse(responseText);
      console.log('\n✅ Workflow imported successfully!');
      console.log(`🆔 Workflow ID: ${result.id}`);
      console.log(`🌐 Webhook URL: ${apiConfig.n8nBaseUrl}/webhook/payoff-test`);
      
      // Test the webhook now
      console.log('\n🚀 Testing webhook...');
      await testWebhook();
      
    } else {
      console.log('\n❌ Failed to import workflow');
      
      if (response.status === 401) {
        console.log('🔐 Authentication failed - check N8N_API_KEY');
      } else if (response.status === 409) {
        console.log('⚠️  Workflow might already exist - checking existing workflows...');
        await listWorkflows();
      }
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function listWorkflows(): Promise<void> {
  try {
    const response = await fetch(`${apiConfig.n8nBaseUrl}/api/v1/workflows`, {
      headers: {
        'X-N8N-API-KEY': apiConfig.n8nApiKey,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const result = await response.json();
      console.log('\n📋 Existing workflows:');
      result.data.forEach((wf: WorkflowResponse) => {
        console.log(`   ${wf.name} (ID: ${wf.id}, Active: ${wf.active})`);
      });

      // Check if our test workflow exists
      const testWorkflow = result.data.find((wf: WorkflowResponse) => wf.name === 'Payoff Test Workflow');
      if (testWorkflow) {
        console.log('\n🎯 Found existing test workflow!');
        if (testWorkflow.active) {
          console.log('✅ Workflow is active - testing webhook...');
          await testWebhook();
        } else {
          console.log('⚠️  Workflow is inactive - need to activate it');
          await activateWorkflow(testWorkflow.id);
        }
      }
    }
  } catch (error) {
    console.error('Error listing workflows:', error instanceof Error ? error.message : error);
  }
}

async function activateWorkflow(workflowId: string): Promise<void> {
  try {
    const response = await fetch(`${apiConfig.n8nBaseUrl}/api/v1/workflows/${workflowId}/activate`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': apiConfig.n8nApiKey,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      console.log('✅ Workflow activated!');
      await testWebhook();
    } else {
      console.log('❌ Failed to activate workflow');
    }
  } catch (error) {
    console.error('Error activating workflow:', error instanceof Error ? error.message : error);
  }
}

async function testWebhook(): Promise<void> {
  const testPayload: TestPayload = {
    client_id: 'test-client-001',
    property_address: '123 Import Test St',
    loan_number: 'IMPORT-TEST-' + Date.now()
  };

  try {
    console.log('📤 Testing webhook with payload:', JSON.stringify(testPayload, null, 2));
    
    const response = await fetch(`${apiConfig.n8nBaseUrl}/webhook/payoff-test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });

    const responseText = await response.text();
    console.log(`📥 Webhook Response: ${response.status} ${response.statusText}`);
    console.log(`📥 Response Body: ${responseText}`);

    if (response.ok) {
      try {
        const jsonResponse = JSON.parse(responseText);
        console.log('\n🎉 END-TO-END TEST SUCCESSFUL!');
        console.log('✅ Workflow executed and returned results');
        console.log('📊 Results:', JSON.stringify(jsonResponse, null, 2));
      } catch (e) {
        console.log('\n✅ Webhook executed successfully (non-JSON response)');
      }
    } else {
      console.log('\n❌ Webhook test failed');
    }

  } catch (error) {
    console.error('Webhook test error:', error instanceof Error ? error.message : error);
  }
}

// Run script if called directly
if (require.main === module) {
  importWorkflow();
}