#!/usr/bin/env ts-node

/**
 * Deploy the unified workflow architecture to n8n
 * Deploys both main workflow and micro-workflows
 */

import { config } from 'dotenv';
import { promises as fs } from 'fs';
import path from 'path';
import fetch from 'node-fetch';

// Load environment variables
config({ path: '../../.env.local' });

const N8N_BASE_URL = process.env.N8N_BASE_URL;
const N8N_API_KEY = process.env.N8N_API_KEY;

class WorkflowDeployer {
  private async readWorkflowFile(filename: string): Promise<any> {
    const filePath = path.join(__dirname, '../definitions', filename);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  }

  private async deployWorkflow(workflowData: any): Promise<void> {
    // Remove fields that n8n doesn't accept during import
    const { id, createdAt, updatedAt, active, webhookId, versionId, tags, meta, ...importData } = workflowData;

    console.log(`Deploying workflow: ${workflowData.name}...`);

    try {
      // Import workflow
      const importResponse = await fetch(`${N8N_BASE_URL}/api/v1/workflows/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${N8N_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(importData)
      });

      if (!importResponse.ok) {
        const errorText = await importResponse.text();
        throw new Error(`Failed to import workflow: ${errorText}`);
      }

      const importResult = await importResponse.json();
      console.log(`✅ Workflow imported with ID: ${importResult.id}`);

      // Activate workflow
      const activateResponse = await fetch(`${N8N_BASE_URL}/api/v1/workflows/${importResult.id}/activate`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${N8N_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(workflowData)
      });

      if (!activateResponse.ok) {
        const errorText = await activateResponse.text();
        console.warn(`⚠️  Failed to activate workflow: ${errorText}`);
      } else {
        console.log(`✅ Workflow activated successfully`);
      }

    } catch (error) {
      console.error(`❌ Failed to deploy ${workflowData.name}:`, error.message);
      throw error;
    }
  }

  async deployAll() {
    console.log('🚀 Deploying Unified Workflow Architecture to n8n\n');

    try {
      // Deploy main workflow
      console.log('📋 Deploying main workflow...');
      const payoffWorkflow = await this.readWorkflowFile('payoff-request.json');
      await this.deployWorkflow(payoffWorkflow);

      console.log('\n📧 Deploying micro-workflows...');
      
      // Deploy micro-workflow
      const replyWorkflow = await this.readWorkflowFile('reply-to-lender.json');
      await this.deployWorkflow(replyWorkflow);

      console.log('\n🎉 All workflows deployed successfully!');
      console.log('\n📝 Next steps:');
      console.log('1. Test the integration with: npm run test:integration');
      console.log('2. Check workflow status in n8n dashboard');
      console.log('3. Verify webhook endpoints are accessible');

    } catch (error) {
      console.error('\n❌ Deployment failed:', error.message);
      process.exit(1);
    }
  }
}

// Run deployment
const deployer = new WorkflowDeployer();
deployer.deployAll().catch(console.error);