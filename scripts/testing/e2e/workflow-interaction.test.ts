#!/usr/bin/env tsx

/**
 * Stagehand E2E Tests for Rexera Dashboard
 * 
 * Tests the complete workflow: login → view workflows → click workflow → verify details
 * 
 * Usage:
 *   pnpm e2e              # Run all e2e tests  
 *   pnpm e2e:workflow     # Test workflow interaction only
 */

import { Stagehand } from '@browserbasehq/stagehand';
import { z } from 'zod';

// Configuration
const CONFIG = {
  frontend_url: process.env.FRONTEND_URL || 'http://localhost:3000',
  api_url: process.env.API_URL || 'http://localhost:3001',
  test_email: process.env.TEST_EMAIL || 'test@example.com',
  test_password: process.env.TEST_PASSWORD || 'testpassword123',
  headless: process.env.HEADLESS !== 'false', // Default to headless
  timeout: 30000
};

// Test configuration schema
const TestConfigSchema = z.object({
  frontend_url: z.string().url(),
  api_url: z.string().url(),
  test_email: z.string().email(),
  test_password: z.string().min(6)
});

class RexeraE2ETests {
  private stagehand: Stagehand | null = null;

  async setup() {
    console.log('🚀 Setting up Stagehand E2E tests...');
    
    // Validate configuration
    const configResult = TestConfigSchema.safeParse(CONFIG);
    if (!configResult.success) {
      throw new Error(`Invalid configuration: ${configResult.error.message}`);
    }

    // Initialize Stagehand
    this.stagehand = new Stagehand({
      env: 'LOCAL',
      headless: CONFIG.headless,
      logger: (message: any) => console.log(`🎭 Stagehand: ${message}`),
    });

    await this.stagehand.init();
    console.log('✅ Stagehand initialized');
  }

  async cleanup() {
    if (this.stagehand) {
      await this.stagehand.close();
      console.log('🧹 Stagehand cleaned up');
    }
  }

  /**
   * Test 1: Login Flow
   */
  async testLogin() {
    console.log('\n🔐 Testing login flow...');
    
    if (!this.stagehand) throw new Error('Stagehand not initialized');

    // Navigate to login page
    await this.stagehand.page.goto(`${CONFIG.frontend_url}/auth/login`);
    
    // Wait for login form to load
    await this.stagehand.page.waitForSelector('form', { timeout: CONFIG.timeout });
    
    // Use Stagehand's AI to fill login form
    await this.stagehand.act({
      action: `Fill in the email field with "${CONFIG.test_email}" and password field with "${CONFIG.test_password}", then click the login button`
    });

    // Wait for redirect to dashboard
    await this.stagehand.page.waitForURL(/.*\/dashboard/, { timeout: CONFIG.timeout });
    
    console.log('✅ Login successful - redirected to dashboard');
  }

  /**
   * Test 2: View Workflows List
   */
  async testWorkflowsList() {
    console.log('\n📋 Testing workflows list view...');
    
    if (!this.stagehand) throw new Error('Stagehand not initialized');

    // Should already be on dashboard, but navigate just in case
    await this.stagehand.page.goto(`${CONFIG.frontend_url}/dashboard`);
    
    // Wait for workflows table to load
    await this.stagehand.page.waitForSelector('[data-testid="workflow-table"], table', { 
      timeout: CONFIG.timeout 
    });

    // Use Stagehand to verify workflows are visible
    const hasWorkflows = await this.stagehand.observe({
      instruction: "Check if there are any workflow rows visible in the table"
    });

    if (!hasWorkflows) {
      console.log('⚠️  No workflows found - creating test data might be needed');
      return false;
    }

    console.log('✅ Workflows list loaded successfully');
    return true;
  }

  /**
   * Test 3: Click on Workflow and View Details
   */
  async testWorkflowDetails() {
    console.log('\n🔍 Testing workflow details view...');
    
    if (!this.stagehand) throw new Error('Stagehand not initialized');

    // Use Stagehand's AI to click on the first workflow row
    await this.stagehand.act({
      action: "Click on the first workflow row in the table to open its details"
    });

    // Wait for navigation to workflow detail page
    await this.stagehand.page.waitForURL(/.*\/workflow\/.*/, { timeout: CONFIG.timeout });
    
    // Verify workflow details are loaded
    const workflowDetailsLoaded = await this.stagehand.observe({
      instruction: "Check if workflow details are visible, including workflow title, status, and task list"
    });

    if (!workflowDetailsLoaded) {
      throw new Error('Workflow details did not load properly');
    }

    // Extract workflow information using Stagehand
    const workflowInfo = await this.stagehand.extract({
      instruction: "Extract the workflow title, status, type, and number of tasks from the page",
      schema: z.object({
        title: z.string(),
        status: z.string(),
        type: z.string().optional(),
        taskCount: z.number().optional()
      })
    });

    console.log('✅ Workflow details loaded:');
    console.log(`   Title: ${workflowInfo.title}`);
    console.log(`   Status: ${workflowInfo.status}`);
    console.log(`   Type: ${workflowInfo.type || 'N/A'}`);
    console.log(`   Tasks: ${workflowInfo.taskCount || 'N/A'}`);

    return workflowInfo;
  }

  /**
   * Test 4: Verify Task List Functionality
   */
  async testTaskList() {
    console.log('\n📝 Testing task list functionality...');
    
    if (!this.stagehand) throw new Error('Stagehand not initialized');

    // Check if tasks are visible
    const hasTaskList = await this.stagehand.observe({
      instruction: "Check if there is a task list or task table visible on the page"
    });

    if (!hasTaskList) {
      console.log('⚠️  No task list found on this workflow');
      return false;
    }

    // Extract task information
    const taskInfo = await this.stagehand.extract({
      instruction: "Extract information about the tasks, including their names and statuses",
      schema: z.object({
        tasks: z.array(z.object({
          name: z.string(),
          status: z.string(),
          type: z.string().optional()
        }))
      })
    });

    console.log('✅ Task list verification:');
    taskInfo.tasks.forEach((task, index) => {
      console.log(`   ${index + 1}. ${task.name} - ${task.status}`);
    });

    return taskInfo;
  }

  /**
   * Test 5: Navigation Back to Dashboard
   */
  async testNavigationBack() {
    console.log('\n🔄 Testing navigation back to dashboard...');
    
    if (!this.stagehand) throw new Error('Stagehand not initialized');

    // Use Stagehand to navigate back to dashboard
    await this.stagehand.act({
      action: "Navigate back to the dashboard or workflows list"
    });

    // Wait for dashboard to load
    await this.stagehand.page.waitForURL(/.*\/dashboard/, { timeout: CONFIG.timeout });
    
    // Verify we're back on the workflows list
    await this.stagehand.page.waitForSelector('[data-testid="workflow-table"], table', { 
      timeout: CONFIG.timeout 
    });

    console.log('✅ Successfully navigated back to dashboard');
  }

  /**
   * Run all tests in sequence
   */
  async runAllTests() {
    try {
      await this.setup();
      
      console.log(`\n🎯 Running Rexera E2E Tests`);
      console.log(`   Frontend: ${CONFIG.frontend_url}`);
      console.log(`   API: ${CONFIG.api_url}`);
      console.log(`   User: ${CONFIG.test_email}`);
      console.log(`   Headless: ${CONFIG.headless}`);

      // Run tests in sequence
      await this.testLogin();
      
      const hasWorkflows = await this.testWorkflowsList();
      if (!hasWorkflows) {
        console.log('\n⚠️  Skipping workflow detail tests - no workflows found');
        return;
      }

      const workflowInfo = await this.testWorkflowDetails();
      await this.testTaskList();
      await this.testNavigationBack();

      console.log('\n🎉 All E2E tests passed successfully!');
      console.log('\n📊 Test Summary:');
      console.log('   ✅ Login flow');
      console.log('   ✅ Workflows list view');
      console.log('   ✅ Workflow details view');
      console.log('   ✅ Task list functionality');
      console.log('   ✅ Navigation flow');

    } catch (error) {
      console.error('\n❌ E2E test failed:', error);
      
      // Take screenshot for debugging
      if (this.stagehand) {
        const screenshot = await this.stagehand.page.screenshot({ 
          path: `./test-failure-${Date.now()}.png`,
          fullPage: true 
        });
        console.log('📸 Screenshot saved for debugging');
      }
      
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// CLI execution
async function main() {
  const testType = process.argv[2] || 'all';
  const tests = new RexeraE2ETests();

  try {
    switch (testType) {
      case 'workflow':
        await tests.setup();
        await tests.testLogin();
        await tests.testWorkflowsList();
        await tests.testWorkflowDetails();
        await tests.cleanup();
        break;
        
      case 'login':
        await tests.setup();
        await tests.testLogin();
        await tests.cleanup();
        break;
        
      case 'all':
      default:
        await tests.runAllTests();
        break;
    }
    
    console.log('\n✨ Tests completed successfully');
    process.exit(0);
    
  } catch (error) {
    console.error('\n💥 Test execution failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export default RexeraE2ETests;