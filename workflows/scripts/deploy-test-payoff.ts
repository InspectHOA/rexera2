#!/usr/bin/env ts-node

/**
 * Deploy Test Payoff Request workflow to n8n for end-to-end testing
 * Uses dummy wait nodes instead of actual agent calls
 */

import { config } from 'dotenv';
import { promises as fs } from 'fs';
import path from 'path';
// @ts-ignore
import fetch from 'node-fetch';

// Load environment variables from API .env.local
config({ path: path.join(__dirname, '../../api/.env.local') });

const N8N_BASE_URL = process.env.N8N_BASE_URL;
const N8N_API_KEY = process.env.N8N_API_KEY;

// Validate environment variables
if (!N8N_BASE_URL) {
  console.error('❌ N8N_BASE_URL environment variable is not set');
  process.exit(1);
}

if (!N8N_API_KEY) {
  console.error('❌ N8N_API_KEY environment variable is not set');
  process.exit(1);
}

console.log(`📡 Using n8n instance: ${N8N_BASE_URL}`);

interface N8nProject {
  id: string;
  name: string;
  type: string;
}

interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
}

class TestPayoffDeployer {
  private async readWorkflowFile(filename: string): Promise<any> {
    const filePath = path.join(__dirname, '../definitions', filename);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  }

  private async listN8nProjects(): Promise<N8nProject[]> {
    try {
      const response = await fetch(`${N8N_BASE_URL}/api/v1/projects`, {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to list projects: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error: any) {
      console.error('Error listing projects:', error.message);
      return [];
    }
  }

  private async findProjectByName(name: string): Promise<string | null> {
    const projects = await this.listN8nProjects();
    const project = projects.find(p => p.name === name);
    return project ? project.id : null;
  }

  private async listWorkflows(): Promise<N8nWorkflow[]> {
    try {
      const response = await fetch(`${N8N_BASE_URL}/api/v1/workflows`, {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to list workflows: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error: any) {
      console.error('Error listing workflows:', error.message);
      return [];
    }
  }

  private async deleteWorkflow(workflowId: string): Promise<void> {
    try {
      const response = await fetch(`${N8N_BASE_URL}/api/v1/workflows/${workflowId}`, {
        method: 'DELETE',
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete workflow: ${response.statusText}`);
      }

      console.log(`✅ Existing workflow deleted`);
    } catch (error: any) {
      console.error(`❌ Could not delete workflow:`, error.message);
    }
  }

  private async createWorkflow(workflowData: any, projectId?: string): Promise<string> {
    // Remove fields that n8n doesn't accept during creation
    const { id, createdAt, updatedAt, active, webhookId, versionId, tags, meta, ...cleanData } = workflowData;

    // Create minimal payload for n8n API
    const createPayload = {
      name: cleanData.name,
      nodes: cleanData.nodes,
      connections: cleanData.connections,
      settings: cleanData.settings || {},
      staticData: cleanData.staticData || {}
    };

    console.log(`📤 Creating test workflow: ${cleanData.name}...`);

    try {
      const createResponse = await fetch(`${N8N_BASE_URL}/api/v1/workflows`, {
        method: 'POST',
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createPayload)
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(`Failed to create workflow: ${errorText}`);
      }

      const createResult = await createResponse.json();
      console.log(`✅ Test workflow created with ID: ${createResult.id}`);

      // Activate workflow
      const activateResponse = await fetch(`${N8N_BASE_URL}/api/v1/workflows/${createResult.id}/activate`, {
        method: 'POST',
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        }
      });

      if (activateResponse.ok) {
        console.log(`✅ Test workflow activated successfully`);
      } else {
        console.warn(`⚠️  Could not activate workflow automatically`);
      }

      return createResult.id;

    } catch (error: any) {
      console.error(`❌ Failed to create workflow:`, error.message);
      throw error;
    }
  }

  async deployTestPayoff() {
    console.log('🧪 Deploying Test Payoff Request workflow\\n');

    try {
      // 1. Find Rexera2 project
      console.log('🔍 Looking for Rexera2 project...');
      const projectId = await this.findProjectByName('Rexera2');
      
      if (projectId) {
        console.log(`✅ Found Rexera2 project (ID: ${projectId})`);
      } else {
        console.log('⚠️  Rexera2 project not found, will create in personal workspace');
      }

      // 2. Check if test workflow already exists and delete it
      console.log('🔍 Checking for existing test workflow...');
      const workflows = await this.listWorkflows();
      const existingTest = workflows.find(w => w.name === 'Test Payoff Request');

      if (existingTest) {
        console.log(`🗑️  Deleting existing test workflow (ID: ${existingTest.id})`);
        await this.deleteWorkflow(existingTest.id);
      }

      // 3. Load and deploy the test workflow
      console.log('📂 Loading test payoff workflow definition...');
      const testWorkflow = await this.readWorkflowFile('test-payoff-request.json');

      const newWorkflowId = await this.createWorkflow(testWorkflow, projectId || undefined);

      console.log('\\n🎉 Test deployment completed successfully!');
      console.log('\\n📝 Summary:');
      console.log(`✅ Test Payoff Request deployed (ID: ${newWorkflowId})`);
      console.log(`✅ Webhook URL: ${N8N_BASE_URL}/webhook/test-payoff-request`);
      
      console.log('\\n🧪 Test the workflow:');
      console.log(`curl -X POST "${N8N_BASE_URL}/webhook/test-payoff-request" \\\\`);
      console.log(`  -H "Content-Type: application/json" \\\\`);
      console.log(`  -d '{"workflow_id":"test-wf-$(date +%s)","metadata":{"property":{"address":"123 Test Street","city":"Test City","state":"CA"}}}'`);

      console.log('\\n📋 Test Features:');
      console.log('• Uses dummy wait nodes instead of real agent calls');
      console.log('• Completes full workflow in ~15 seconds');
      console.log('• Updates task status in real-time');
      console.log('• Generates realistic test data for each step');
      console.log('• Perfect for end-to-end testing');

      console.log('\\n🔗 Next Steps:');
      console.log('1. Test the webhook endpoint above');
      console.log('2. Watch task progress in your frontend dashboard');
      console.log('3. Verify all 6 tasks complete successfully');
      console.log('4. Check database for proper task tracking');

    } catch (error: any) {
      console.error('\\n❌ Deployment failed:', error.message);
      process.exit(1);
    }
  }
}

// Check if this is being run directly
if (require.main === module) {
  const deployer = new TestPayoffDeployer();
  deployer.deployTestPayoff().catch(console.error);
}

export { TestPayoffDeployer };