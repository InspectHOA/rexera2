#!/usr/bin/env ts-node

/**
 * Integration test for the new unified workflow architecture
 * Tests the complete flow: workflow trigger → task creation → agent execution → task completion
 */

import { config } from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
config({ path: '../../.env.local' });

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3002';
const N8N_BASE_URL = process.env.N8N_BASE_URL;
const N8N_API_KEY = process.env.N8N_API_KEY;

interface TestResult {
  step: string;
  success: boolean;
  data?: any;
  error?: string;
}

class IntegrationTester {
  private results: TestResult[] = [];
  private testWorkflowId: string = '';

  async run() {
    console.log('🚀 Starting Unified Workflow Architecture Integration Test\n');

    try {
      await this.step1_CreateWorkflow();
      await this.step2_TriggerPayoffWorkflow();
      await this.step3_CheckTaskCreation();
      await this.step4_SimulateIncomingEmail();
      await this.step5_CheckDynamicTask();
      
      this.printResults();
    } catch (error) {
      console.error('❌ Test failed:', error);
      this.printResults();
      process.exit(1);
    }
  }

  private async step1_CreateWorkflow() {
    console.log('Step 1: Creating test workflow...');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/trpc/workflows.create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow_type: 'PAYOFF',
          client_id: 'test-client-123',
          title: 'Test Payoff Request - Integration Test',
          metadata: {
            property: { address: '123 Test St', loanNumber: 'TEST-2024-001' },
            borrower: { name: 'Test User', email: 'test@example.com' }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create workflow: ${response.statusText}`);
      }

      const data = await response.json();
      this.testWorkflowId = data.result.data.id;
      
      this.results.push({
        step: 'Create Workflow',
        success: true,
        data: { workflow_id: this.testWorkflowId }
      });
      
      console.log('✅ Workflow created:', this.testWorkflowId);
    } catch (error) {
      this.results.push({
        step: 'Create Workflow', 
        success: false,
        error: error.message
      });
      throw error;
    }
  }

  private async step2_TriggerPayoffWorkflow() {
    console.log('Step 2: Triggering payoff workflow in n8n...');
    
    try {
      const response = await fetch(`${N8N_BASE_URL}/webhook/payoff-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow_id: this.testWorkflowId,
          metadata: {
            property: { address: '123 Test St', loanNumber: 'TEST-2024-001' },
            borrower: { name: 'Test User', email: 'test@example.com' }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to trigger n8n workflow: ${response.statusText}`);
      }

      // Wait a bit for workflow to process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      this.results.push({
        step: 'Trigger n8n Workflow',
        success: true
      });
      
      console.log('✅ n8n workflow triggered');
    } catch (error) {
      this.results.push({
        step: 'Trigger n8n Workflow',
        success: false,
        error: error.message
      });
      throw error;
    }
  }

  private async step3_CheckTaskCreation() {
    console.log('Step 3: Checking if tasks were created...');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/rest/tasks?workflow_id=${this.testWorkflowId}`, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.statusText}`);
      }

      const data = await response.json();
      const tasks = data.tasks || [];
      
      const expectedTasks = [
        'Research Lender Contact',
        'Submit Payoff Request', 
        'Process Lender Response',
        'Generate Invoice',
        'Update CRM Records',
        'Notify Client'
      ];

      const foundTasks = tasks.map(t => t.title);
      const allTasksFound = expectedTasks.every(title => foundTasks.includes(title));

      if (!allTasksFound) {
        throw new Error(`Missing tasks. Expected: ${expectedTasks.join(', ')}. Found: ${foundTasks.join(', ')}`);
      }
      
      this.results.push({
        step: 'Check Task Creation',
        success: true,
        data: { tasks_created: tasks.length, task_titles: foundTasks }
      });
      
      console.log(`✅ All ${tasks.length} tasks created successfully`);
    } catch (error) {
      this.results.push({
        step: 'Check Task Creation',
        success: false,
        error: error.message
      });
      throw error;
    }
  }

  private async step4_SimulateIncomingEmail() {
    console.log('Step 4: Simulating incoming email...');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/rest/incoming-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow_id: this.testWorkflowId,
          email_data: {
            from: 'lender@testbank.com',
            subject: 'RE: Payoff Request - TEST-2024-001',
            body: 'Here is your payoff statement. Amount due: $284,567.89. Please contact us for wire instructions.',
            received_at: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to process incoming email: ${response.statusText}`);
      }

      // Wait for micro-workflow to process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      this.results.push({
        step: 'Simulate Incoming Email',
        success: true
      });
      
      console.log('✅ Incoming email processed');
    } catch (error) {
      this.results.push({
        step: 'Simulate Incoming Email',
        success: false,
        error: error.message
      });
      throw error;
    }
  }

  private async step5_CheckDynamicTask() {
    console.log('Step 5: Checking if dynamic task was created...');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/rest/tasks?workflow_id=${this.testWorkflowId}`, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.statusText}`);
      }

      const data = await response.json();
      const tasks = data.tasks || [];
      
      const dynamicTask = tasks.find(t => t.title === 'Reply to Lender Email');
      
      if (!dynamicTask) {
        throw new Error('Dynamic task "Reply to Lender Email" was not created');
      }
      
      this.results.push({
        step: 'Check Dynamic Task',
        success: true,
        data: { dynamic_task_id: dynamicTask.id, status: dynamicTask.status }
      });
      
      console.log('✅ Dynamic task created successfully');
    } catch (error) {
      this.results.push({
        step: 'Check Dynamic Task',
        success: false,
        error: error.message
      });
      throw error;
    }
  }

  private printResults() {
    console.log('\n📊 Test Results:');
    console.log('================');
    
    this.results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.step}`);
      
      if (result.data) {
        console.log(`   Data: ${JSON.stringify(result.data, null, 2)}`);
      }
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    const successCount = this.results.filter(r => r.success).length;
    const totalCount = this.results.length;
    
    console.log(`\nOverall: ${successCount}/${totalCount} tests passed`);
    
    if (successCount === totalCount) {
      console.log('🎉 All tests passed! Unified workflow architecture is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Please check the errors above.');
    }
  }
}

// Run the test
const tester = new IntegrationTester();
tester.run().catch(console.error);