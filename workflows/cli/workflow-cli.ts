#!/usr/bin/env node

/**
 * n8n Workflow CLI
 * 
 * Command-line interface for managing n8n workflows using TypeScript utilities
 */

import { createWorkflowManager, workflowUtils } from '../utils/workflow-manager';

async function main() {
  const command = process.argv[2];
  const arg1 = process.argv[3];
  const arg2 = process.argv[4];

  try {
    const manager = createWorkflowManager();

    switch (command) {
      case 'list':
        const workflows = await manager.getAllWorkflows();
        console.log('Available workflows:');
        workflows.forEach((workflow, index) => {
          console.log(`${index + 1}. ${workflow.name} (ID: ${workflow.id}) - ${workflow.active ? 'Active' : 'Inactive'}`);
        });
        break;

      case 'get':
        if (!arg1) {
          console.error('Please provide workflow ID');
          process.exit(1);
        }
        const workflow = await manager.getWorkflow(arg1);
        console.log(JSON.stringify(workflow, null, 2));
        break;

      case 'import':
        if (!arg1) {
          console.error('Please provide JSON file path');
          process.exit(1);
        }
        await manager.importWorkflow(arg1);
        break;

      case 'import-payoff':
        await workflowUtils.importPayoffWorkflow(manager);
        break;

      case 'export':
        if (!arg1 || !arg2) {
          console.error('Please provide workflow ID and output path');
          process.exit(1);
        }
        await manager.exportWorkflow(arg1, arg2);
        break;

      case 'delete':
        if (!arg1) {
          console.error('Please provide workflow ID');
          process.exit(1);
        }
        await manager.deleteWorkflow(arg1);
        console.log(`Workflow ${arg1} deleted successfully`);
        break;

      case 'activate':
        if (!arg1) {
          console.error('Please provide workflow ID');
          process.exit(1);
        }
        await manager.toggleWorkflow(arg1, true);
        break;

      case 'deactivate':
        if (!arg1) {
          console.error('Please provide workflow ID');
          process.exit(1);
        }
        await manager.toggleWorkflow(arg1, false);
        break;

      case 'executions':
        if (!arg1) {
          console.error('Please provide workflow ID');
          process.exit(1);
        }
        const executions = await manager.getWorkflowExecutions(arg1);
        console.log('Recent executions:');
        executions.forEach((exec, index) => {
          console.log(`${index + 1}. ID: ${exec.id}, Status: ${exec.status}, Started: ${exec.startedAt}`);
        });
        break;

      case 'test':
        const result = await manager.testConnection();
        console.log(result.success ? '✅ Connection successful' : '❌ Connection failed');
        console.log(`Message: ${result.message}`);
        break;

      case 'test-payoff':
        console.log('🚀 Testing payoff workflow...');
        const testResult = await workflowUtils.testPayoffWorkflow(manager);
        console.log('✅ Payoff workflow test completed');
        console.log('Response:', JSON.stringify(testResult, null, 2));
        break;

      case 'find':
        if (!arg1) {
          console.error('Please provide workflow name');
          process.exit(1);
        }
        const found = await manager.findWorkflowByName(arg1);
        if (found) {
          console.log(`Found workflow: ${found.name} (ID: ${found.id})`);
        } else {
          console.log('Workflow not found');
        }
        break;

      default:
        console.log('n8n Workflow CLI');
        console.log('');
        console.log('Usage:');
        console.log('  npx tsx src/cli/workflow-cli.ts <command> [args]');
        console.log('');
        console.log('Commands:');
        console.log('  list                                    - List all workflows');
        console.log('  get <id>                               - Get workflow details');
        console.log('  import <json-file>                     - Import workflow from JSON');
        console.log('  import-payoff                          - Import payoff workflow');
        console.log('  export <id> <output-file>              - Export workflow to JSON');
        console.log('  delete <id>                            - Delete workflow');
        console.log('  activate <id>                          - Activate workflow');
        console.log('  deactivate <id>                        - Deactivate workflow');
        console.log('  executions <id>                        - Get workflow executions');
        console.log('  test                                   - Test n8n connection');
        console.log('  test-payoff                            - Test payoff workflow');
        console.log('  find <name>                            - Find workflow by name');
        console.log('');
        console.log('Examples:');
        console.log('  npx tsx src/cli/workflow-cli.ts import ../n8n-workflows/real-estate/payoff-request.json');
        console.log('  npx tsx src/cli/workflow-cli.ts export abc123 ./exported-workflow.json');
        console.log('  npx tsx src/cli/workflow-cli.ts test-payoff');
        break;
    }
  } catch (error) {
    console.error('❌ Command failed:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}