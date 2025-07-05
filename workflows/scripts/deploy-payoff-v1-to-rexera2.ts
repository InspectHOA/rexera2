#!/usr/bin/env ts-node

/**
 * Deploy Payoff Request V1 directly to Rexera2 project
 * Creates a clean, new deployment specifically for the Rexera2 project
 */

import { config } from 'dotenv';
import { promises as fs } from 'fs';
import path from 'path';
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

class PayoffV1Deployer {
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
    } catch (error) {
      console.error('Error listing projects:', error.message);
      return [];
    }
  }

  private async findProjectByName(name: string): Promise<string | null> {
    const projects = await this.listN8nProjects();
    const project = projects.find(p => p.name === name);
    return project ? project.id : null;
  }

  private async listWorkflowsInProject(projectId: string): Promise<N8nWorkflow[]> {
    try {
      const response = await fetch(`${N8N_BASE_URL}/api/v1/workflows?projectId=${projectId}`, {
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
    } catch (error) {
      console.error('Error listing workflows:', error.message);
      return [];
    }
  }

  private async createWorkflowInProject(workflowData: any, projectId: string): Promise<string> {
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

    console.log(`📤 Creating workflow: ${cleanData.name} in Rexera2 project...`);

    try {
      // First create the workflow in personal workspace
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
      console.log(`✅ Workflow created with ID: ${createResult.id}`);

      // Try to move to project (this might not work via API, but we'll try)
      try {
        const moveResponse = await fetch(`${N8N_BASE_URL}/api/v1/workflows/${createResult.id}`, {
          method: 'PUT',
          headers: {
            'X-N8N-API-KEY': N8N_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...createResult,
            projectId: projectId
          })
        });

        if (moveResponse.ok) {
          console.log(`✅ Workflow moved to Rexera2 project`);
        } else {
          console.log(`⚠️  Could not move to project automatically - will need manual move`);
        }
      } catch (moveError) {
        console.log(`⚠️  Could not move to project automatically - will need manual move`);
      }

      // Activate workflow
      const activateResponse = await fetch(`${N8N_BASE_URL}/api/v1/workflows/${createResult.id}/activate`, {
        method: 'POST',
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        }
      });

      if (activateResponse.ok) {
        console.log(`✅ Workflow activated successfully`);
      } else {
        console.warn(`⚠️  Could not activate workflow automatically`);
      }

      return createResult.id;

    } catch (error) {
      console.error(`❌ Failed to create workflow:`, error.message);
      throw error;
    }
  }

  async deployPayoffV1() {
    console.log('🚀 Deploying Payoff Request V1 to Rexera2 Project\n');

    try {
      // 1. Find Rexera2 project
      console.log('🔍 Looking for Rexera2 project...');
      const projectId = await this.findProjectByName('Rexera2');
      
      if (!projectId) {
        console.log('❌ Rexera2 project not found. Available projects:');
        const projects = await this.listN8nProjects();
        projects.forEach(p => console.log(`   - ${p.name} (ID: ${p.id})`));
        throw new Error('Rexera2 project not found');
      }

      console.log(`✅ Found Rexera2 project (ID: ${projectId})`);

      // 2. Check if Payoff V1 already exists in the project
      console.log('🔍 Checking for existing Payoff V1 workflow in Rexera2 project...');
      const existingWorkflows = await this.listWorkflowsInProject(projectId);
      const existingV1 = existingWorkflows.find(w => w.name === 'Payoff Request V1');

      if (existingV1) {
        console.log(`⚠️  Payoff Request V1 already exists in Rexera2 project (ID: ${existingV1.id})`);
        console.log('❓ Please delete it manually first if you want to recreate it.');
        return;
      }

      // 3. Load and deploy the workflow
      console.log('📂 Loading payoff workflow definition...');
      const payoffWorkflow = await this.readWorkflowFile('payoff-request.json');
      
      // Ensure it has the V1 name and ID
      payoffWorkflow.name = 'Payoff Request V1';
      payoffWorkflow.id = 'payoff-request-v1';

      const newWorkflowId = await this.createWorkflowInProject(payoffWorkflow, projectId);

      console.log('\n🎉 Deployment completed successfully!');
      console.log('\n📝 Summary:');
      console.log(`✅ Payoff Request V1 deployed (ID: ${newWorkflowId})`);
      console.log(`✅ Webhook URL: ${N8N_BASE_URL}/webhook/payoff-request`);
      console.log(`📍 Target Project: Rexera2 (${projectId})`);
      
      console.log('\n📋 Next steps:');
      console.log('1. If the workflow is not in Rexera2 project, move it manually:');
      console.log(`   - Go to: ${N8N_BASE_URL}`);
      console.log(`   - Find "Payoff Request V1" workflow`);
      console.log(`   - Move it to "Rexera2" project via UI`);
      console.log('2. Test the workflow with a sample request');
      console.log('3. Verify all task creation and tracking works');

      console.log('\n🧪 Test the workflow:');
      console.log(`curl -X POST "${N8N_BASE_URL}/webhook/payoff-request" \\`);
      console.log(`  -H "Content-Type: application/json" \\`);
      console.log(`  -d '{"workflow_id":"test-workflow-123","metadata":{"property":{"address":"123 Test St"}}}'`);

    } catch (error) {
      console.error('\n❌ Deployment failed:', error.message);
      process.exit(1);
    }
  }
}

// Check if this is being run directly
if (require.main === module) {
  const deployer = new PayoffV1Deployer();
  deployer.deployPayoffV1().catch(console.error);
}

export { PayoffV1Deployer };