#!/usr/bin/env ts-node

/**
 * Deploy the new unified payoff workflow (v2) to n8n
 * This script will deploy the new self-contained workflow and optionally remove the old one
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

interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
}

class PayoffWorkflowDeployer {
  private async readWorkflowFile(filename: string): Promise<any> {
    const filePath = path.join(__dirname, '../definitions', filename);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  }

  private async listN8nProjects(): Promise<any[]> {
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

  private async listN8nWorkflows(projectId?: string): Promise<N8nWorkflow[]> {
    try {
      let url = `${N8N_BASE_URL}/api/v1/workflows`;
      if (projectId) {
        url += `?projectId=${projectId}`;
      }

      const response = await fetch(url, {
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

  private async findWorkflowByName(name: string, projectId?: string): Promise<N8nWorkflow | null> {
    const workflows = await this.listN8nWorkflows(projectId);
    return workflows.find(w => w.name === name) || null;
  }

  private async deactivateWorkflow(workflowId: string): Promise<void> {
    try {
      const response = await fetch(`${N8N_BASE_URL}/api/v1/workflows/${workflowId}/deactivate`, {
        method: 'POST',
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to deactivate workflow: ${response.statusText}`);
      }

      console.log(`✅ Workflow ${workflowId} deactivated`);
    } catch (error) {
      console.warn(`⚠️  Could not deactivate workflow ${workflowId}:`, error.message);
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

      console.log(`✅ Workflow ${workflowId} deleted`);
    } catch (error) {
      console.error(`❌ Could not delete workflow ${workflowId}:`, error.message);
      throw error;
    }
  }

  private async deployWorkflow(workflowData: any, workflowName: string, projectId?: string): Promise<string> {
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

    console.log(`📤 Deploying workflow: ${workflowName}${projectId ? ` to project ${projectId}` : ''}...`);

    try {
      // Create workflow with project ID as URL parameter
      let createUrl = `${N8N_BASE_URL}/api/v1/workflows`;
      if (projectId) {
        createUrl += `?projectId=${projectId}`;
      }

      const createResponse = await fetch(createUrl, {
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

      // Activate workflow
      const activateResponse = await fetch(`${N8N_BASE_URL}/api/v1/workflows/${createResult.id}/activate`, {
        method: 'POST',
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        }
      });

      if (!activateResponse.ok) {
        const errorText = await activateResponse.text();
        console.warn(`⚠️  Failed to activate workflow: ${errorText}`);
      } else {
        console.log(`✅ Workflow activated successfully`);
      }

      return createResult.id;

    } catch (error) {
      console.error(`❌ Failed to deploy ${workflowName}:`, error.message);
      throw error;
    }
  }

  async deployPayoffV2() {
    console.log('🚀 Deploying Payoff Workflow V2 (Unified Architecture)\n');

    try {
      // 1. Find Rexera2 project
      console.log('🔍 Looking for Rexera2 project...');
      const projectId = await this.findProjectByName('Rexera2');
      
      if (!projectId) {
        console.log('⚠️  Rexera2 project not found. Available projects:');
        const projects = await this.listN8nProjects();
        projects.forEach(p => console.log(`   - ${p.name} (ID: ${p.id})`));
        console.log('📝 Will deploy to personal workspace instead.');
      } else {
        console.log(`✅ Found Rexera2 project (ID: ${projectId})`);
      }

      // 2. Check for existing payoff workflows
      console.log('🔍 Checking for existing payoff workflows...');
      const existingV1 = await this.findWorkflowByName('Payoff Request Workflow', projectId);
      const existingV2 = await this.findWorkflowByName('Payoff Request Workflow V2', projectId);

      if (existingV2) {
        console.log(`📋 Found existing V2 workflow (ID: ${existingV2.id})`);
        console.log('❓ Do you want to replace it? This will deactivate and delete the existing V2 workflow.');
        
        // For automation, we'll replace it. In interactive mode, you'd prompt user.
        console.log('🔄 Replacing existing V2 workflow...');
        await this.deactivateWorkflow(existingV2.id);
        await this.deleteWorkflow(existingV2.id);
      }

      // 3. Load and deploy new V2 workflow
      const payoffWorkflow = await this.readWorkflowFile('payoff-request.json');
      
      // Update name to indicate V2
      payoffWorkflow.name = 'Payoff Request Workflow V2';
      payoffWorkflow.id = 'payoff-request-workflow-v2';

      const newWorkflowId = await this.deployWorkflow(payoffWorkflow, 'Payoff Request Workflow V2', projectId);

      // 4. Handle existing V1 workflow
      if (existingV1) {
        console.log(`\n📋 Found existing V1 workflow (ID: ${existingV1.id})`);
        console.log('❓ What would you like to do with the old V1 workflow?');
        console.log('   Option 1: Keep both (V1 and V2) - V1 will be deactivated');
        console.log('   Option 2: Delete V1 workflow completely');
        
        // For this deployment, we'll keep V1 but deactivate it
        console.log('🔄 Keeping V1 but deactivating it...');
        await this.deactivateWorkflow(existingV1.id);
        
        // Optionally rename V1 to indicate it's legacy
        try {
          const renameResponse = await fetch(`${N8N_BASE_URL}/api/v1/workflows/${existingV1.id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${N8N_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              ...existingV1,
              name: 'Payoff Request Workflow V1 (Legacy)',
              active: false
            })
          });
          
          if (renameResponse.ok) {
            console.log('✅ V1 workflow renamed to "V1 (Legacy)"');
          }
        } catch (error) {
          console.warn('⚠️  Could not rename V1 workflow:', error.message);
        }
      }

      console.log('\n🎉 Deployment completed successfully!');
      console.log('\n📝 Summary:');
      console.log(`✅ New V2 workflow deployed (ID: ${newWorkflowId})`);
      console.log(`✅ Webhook URL: ${N8N_BASE_URL}/webhook/payoff-request`);
      
      if (existingV1) {
        console.log(`✅ V1 workflow deactivated and renamed to legacy`);
      }
      
      console.log('\n📋 Next steps:');
      console.log('1. Test the new V2 workflow with a sample request');
      console.log('2. Update any external systems to use the new workflow');
      console.log('3. Monitor the workflow execution in n8n dashboard');
      console.log('4. After confirming V2 works, you can delete V1 legacy workflow');

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
  const deployer = new PayoffWorkflowDeployer();
  deployer.deployPayoffV2().catch(console.error);
}

export { PayoffWorkflowDeployer };