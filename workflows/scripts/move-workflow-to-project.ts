#!/usr/bin/env ts-node

/**
 * Move the V2 workflow from personal to Rexera2 project
 * First delete the personal one, then create in the project
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
if (!N8N_BASE_URL || !N8N_API_KEY) {
  console.error('❌ Missing N8N environment variables');
  process.exit(1);
}

interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  nodes: any[];
  connections: any;
  settings?: any;
  staticData?: any;
}

class WorkflowMover {
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
    } catch (error) {
      console.error('Error listing workflows:', error.message);
      return [];
    }
  }

  private async getWorkflow(workflowId: string): Promise<N8nWorkflow | null> {
    try {
      const response = await fetch(`${N8N_BASE_URL}/api/v1/workflows/${workflowId}`, {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get workflow: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting workflow:', error.message);
      return null;
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

  private async createWorkflow(workflowData: N8nWorkflow): Promise<string> {
    // Create minimal payload for n8n API
    const createPayload = {
      name: workflowData.name,
      nodes: workflowData.nodes,
      connections: workflowData.connections,
      settings: workflowData.settings || {},
      staticData: workflowData.staticData || {}
    };

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
      console.log(`✅ Workflow created with ID: ${createResult.id}`);

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
      }

      return createResult.id;
    } catch (error) {
      console.error(`❌ Failed to create workflow:`, error.message);
      throw error;
    }
  }

  async cleanupAndRecreate() {
    console.log('🧹 Cleaning up and recreating V2 workflow in Rexera2 project\n');

    try {
      // 1. List all workflows to find V2
      console.log('🔍 Looking for existing V2 workflow...');
      const workflows = await this.listWorkflows();
      const v2Workflow = workflows.find(w => w.name === 'Payoff Request Workflow V2');

      if (!v2Workflow) {
        console.log('❌ V2 workflow not found');
        return;
      }

      console.log(`📋 Found V2 workflow (ID: ${v2Workflow.id})`);

      // 2. Get full workflow details
      console.log('📥 Downloading workflow details...');
      const fullWorkflow = await this.getWorkflow(v2Workflow.id);
      
      if (!fullWorkflow) {
        console.log('❌ Could not download workflow details');
        return;
      }

      // 3. Delete the existing V2 workflow
      console.log('🗑️  Deleting existing V2 workflow...');
      await this.deleteWorkflow(v2Workflow.id);

      // 4. Recreate the workflow (will go to default project)
      console.log('🆕 Recreating workflow...');
      const newWorkflowId = await this.createWorkflow(fullWorkflow);

      console.log('\n🎉 Workflow cleanup and recreation completed!');
      console.log(`✅ New workflow ID: ${newWorkflowId}`);
      console.log(`✅ Webhook URL: ${N8N_BASE_URL}/webhook/payoff-request`);
      
      console.log('\n📝 Note: The workflow has been recreated in the default project.');
      console.log('To move it to Rexera2 project, you may need to do this manually in the n8n UI.');

    } catch (error) {
      console.error('\n❌ Operation failed:', error.message);
      process.exit(1);
    }
  }
}

// Check if this is being run directly
if (require.main === module) {
  const mover = new WorkflowMover();
  mover.cleanupAndRecreate().catch(console.error);
}

export { WorkflowMover };