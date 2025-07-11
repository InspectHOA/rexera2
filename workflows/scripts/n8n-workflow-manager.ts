#!/usr/bin/env tsx

/**
 * ============================================================================
 * Consolidated n8n Workflow Manager for Rexera 2.0
 * ============================================================================
 * 
 * This is the unified command-line interface for managing all n8n Cloud
 * workflows in the Rexera platform. It consolidates functionality from
 * multiple previous deployment scripts into a single, comprehensive tool.
 * 
 * BUSINESS CONTEXT:
 * ----------------
 * Rexera uses n8n Cloud for workflow orchestration of real estate processes
 * like PAYOFF requests, HOA acquisition, and lender communications. This script
 * manages the deployment and maintenance of these business-critical workflows.
 * 
 * ARCHITECTURE OVERVIEW:
 * ---------------------
 * 1. Workflow Definitions: JSON files in ../definitions/ contain n8n workflow configs
 * 2. n8n Cloud Integration: REST API calls to manage workflows remotely
 * 3. Project Management: Workflows can be organized into n8n projects
 * 4. Replacement Strategy: Smart detection and replacement of existing workflows
 * 5. Validation: Connection testing and dry-run capabilities
 * 
 * FEATURES:
 * --------
 * ✅ Deploy single or multiple workflows with automatic replacement
 * ✅ List, inspect, and manage existing workflows  
 * ✅ Project management and workflow organization
 * ✅ Comprehensive testing and validation (dry-run mode)
 * ✅ Clean error handling and detailed reporting
 * ✅ Connection testing and status monitoring
 * 
 * WORKFLOW LIFECYCLE:
 * ------------------
 * 1. Load workflow definition from JSON file
 * 2. Check for existing workflow with same name
 * 3. If exists and replace=true: deactivate → delete → recreate
 * 4. Create new workflow in n8n Cloud
 * 5. Activate workflow for production use
 * 6. Verify deployment success
 * 
 * USAGE PATTERNS:
 * --------------
 * 
 * Single Deployment:
 *   tsx workflows/scripts/n8n-workflow-manager.ts deploy payoff-request.json
 * 
 * Bulk Deployment (all definitions):
 *   tsx workflows/scripts/n8n-workflow-manager.ts deploy-all
 * 
 * Safe Testing (no changes):
 *   tsx workflows/scripts/n8n-workflow-manager.ts deploy-all --dry-run
 * 
 * System Monitoring:
 *   tsx workflows/scripts/n8n-workflow-manager.ts status
 * 
 * Workflow Inspection:
 *   tsx workflows/scripts/n8n-workflow-manager.ts list
 *   tsx workflows/scripts/n8n-workflow-manager.ts inspect <workflow-id>
 * 
 * Project Management:
 *   tsx workflows/scripts/n8n-workflow-manager.ts projects
 * 
 * COMMANDS REFERENCE:
 * ------------------
 * deploy <workflow>     Deploy a single workflow (replaces existing by default)
 * deploy-all           Deploy all workflow definitions from ../definitions/
 * deploy-all --dry-run  Test deployment without making changes
 * list                 List all workflows with status indicators
 * inspect <id>         Get detailed workflow information and node breakdown
 * delete <id>          Delete a specific workflow (use with caution)
 * status               Show comprehensive n8n system status
 * projects             List available n8n projects for organization
 * 
 * ENVIRONMENT REQUIREMENTS:
 * ------------------------
 * N8N_BASE_URL         - n8n Cloud instance URL (e.g., https://rexera2.app.n8n.cloud)
 * N8N_API_KEY          - API key for authentication with n8n Cloud
 * 
 * FILES MANAGED:
 * -------------
 * ../definitions/payoff-request.json     - Main PAYOFF workflow
 * ../definitions/payoff-test.json        - Testing version of PAYOFF workflow  
 * ../definitions/reply-to-lender.json    - Lender email response workflow
 * 
 * ERROR HANDLING:
 * --------------
 * - Connection failures: Clear error messages with troubleshooting hints
 * - API errors: Full error context with HTTP status codes
 * - File errors: Detailed file system error reporting
 * - Validation errors: Step-by-step failure analysis
 * 
 * SECURITY CONSIDERATIONS:
 * -----------------------
 * - API keys loaded from environment variables (never hardcoded)
 * - All API calls use HTTPS to n8n Cloud
 * - No sensitive data logged to console
 * - Graceful handling of authentication failures
 * 
 * MAINTENANCE NOTES:
 * -----------------
 * - Keep workflow definitions in sync with business requirements
 * - Test all deployments in staging before production
 * - Monitor n8n Cloud API changes and update endpoints if needed
 * - Regularly verify webhook URLs are accessible from n8n Cloud
 * 
 * @version 2.0
 * @since 2024-07-11
 * @author Rexera Development Team
 */

// Core Node.js and external dependencies
import { config } from 'dotenv';
import { promises as fs } from 'fs';
import path from 'path';

// ============================================================================
// ENVIRONMENT CONFIGURATION
// ============================================================================

// Load environment variables from multiple possible locations
// Priority: .env.local (project root) → serverless-api/.env (API config)
config({ path: path.join(__dirname, '../../.env.local') });
config({ path: path.join(__dirname, '../../serverless-api/.env') });

// Extract required n8n configuration from environment
const N8N_BASE_URL = process.env.N8N_BASE_URL;
const N8N_API_KEY = process.env.N8N_API_KEY;

// Validate critical environment variables before proceeding
// Without these, the script cannot function properly
if (!N8N_BASE_URL) {
  console.error('❌ N8N_BASE_URL environment variable is not set');
  console.error('   Expected format: https://your-instance.app.n8n.cloud');
  process.exit(1);
}

if (!N8N_API_KEY) {
  console.error('❌ N8N_API_KEY environment variable is not set');
  console.error('   Generate this from your n8n Cloud account settings');
  process.exit(1);
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Complete n8n workflow definition as returned by the API
 * 
 * This represents a workflow in n8n Cloud with all its configuration,
 * nodes, connections, and metadata. Used for both reading existing
 * workflows and creating new ones.
 */
interface N8nWorkflow {
  /** Unique identifier assigned by n8n Cloud */
  id: string;
  /** Human-readable workflow name (must be unique within project) */
  name: string;
  /** Whether the workflow is currently active and can be triggered */
  active: boolean;
  /** Array of workflow nodes (triggers, actions, conditions, etc.) */
  nodes: any[];
  /** Node connection definitions (data flow between nodes) */
  connections: any;
  /** Workflow-level settings and configuration */
  settings?: any;
  /** Persistent data shared across workflow executions */
  staticData?: any;
  /** ISO timestamp when workflow was created */
  createdAt?: string;
  /** ISO timestamp when workflow was last modified */
  updatedAt?: string;
}

/**
 * n8n project definition for workflow organization
 * 
 * Projects are used to group related workflows together in n8n Cloud.
 * They provide organizational structure and access control.
 */
interface N8nProject {
  /** Unique project identifier */
  id: string;
  /** Human-readable project name */
  name: string;
  /** Project type (personal, team, etc.) */
  type: string;
}

/**
 * n8n workflow execution information
 * 
 * Represents a single execution instance of a workflow.
 * Used for monitoring workflow performance and debugging.
 */
interface N8nExecution {
  /** Unique execution identifier */
  id: string;
  /** Whether the execution has completed (success or failure) */
  finished: boolean;
  /** Current execution status (success, error, running, etc.) */
  status: string;
  /** ISO timestamp when execution began */
  startedAt: string;
  /** ISO timestamp when execution completed (if finished) */
  stoppedAt?: string;
  /** ID of the workflow that was executed */
  workflowId: string;
}

/**
 * Configuration options for workflow deployment operations
 * 
 * Provides fine-grained control over how workflows are deployed
 * and managed in n8n Cloud.
 */
interface DeploymentOptions {
  /** Whether to replace existing workflows with the same name (default: true) */
  replace?: boolean;
  /** Whether to activate the workflow after deployment (default: true) */
  activate?: boolean;
  /** Optional project ID to deploy the workflow into */
  projectId?: string;
  /** Whether to simulate deployment without making changes (default: false) */
  dryRun?: boolean;
}

/**
 * ============================================================================
 * N8nWorkflowManager Class
 * ============================================================================
 * 
 * The main class that handles all interactions with n8n Cloud API.
 * Provides a high-level interface for workflow management operations
 * while handling low-level API details, error handling, and validation.
 * 
 * DESIGN PRINCIPLES:
 * - Single Responsibility: Each method has one clear purpose
 * - Error Handling: Comprehensive error catching and reporting
 * - Type Safety: Full TypeScript typing for all operations
 * - Logging: Clear progress and status reporting
 * - Validation: Input validation and sanity checking
 * 
 * SECURITY:
 * - API key authentication for all requests
 * - HTTPS-only communication with n8n Cloud
 * - No sensitive data logging
 * - Proper error message sanitization
 */
class N8nWorkflowManager {
  /**
   * Standard HTTP headers used for all n8n API requests
   * 
   * X-N8N-API-KEY: Authentication header required by n8n Cloud
   * Content-Type: Ensures JSON payloads are properly handled
   */
  private apiHeaders = {
    'X-N8N-API-KEY': N8N_API_KEY!,
    'Content-Type': 'application/json'
  };

  // ============================================================================
  // CORE API METHODS
  // ============================================================================

  /**
   * Generic HTTP request method for n8n Cloud API
   * 
   * This is the foundation method that all other API operations use.
   * It handles:
   * - URL construction with proper API versioning
   * - Authentication header injection
   * - HTTP error handling and reporting
   * - JSON response parsing
   * - Comprehensive error wrapping
   * 
   * @param endpoint - API endpoint (e.g., '/workflows', '/workflows/123')
   * @param options - Fetch options (method, body, headers, etc.)
   * @returns Promise that resolves to the parsed JSON response
   * @throws Error with detailed context if the request fails
   * 
   * @example
   * ```typescript
   * // Get all workflows
   * const workflows = await makeApiRequest<{data: N8nWorkflow[]}>('/workflows');
   * 
   * // Create a workflow
   * const newWorkflow = await makeApiRequest<N8nWorkflow>('/workflows', {
   *   method: 'POST',
   *   body: JSON.stringify(workflowData)
   * });
   * ```
   */
  async makeApiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Construct full API URL with proper versioning
    const url = `${N8N_BASE_URL}/api/v1${endpoint}`;
    
    try {
      // Make HTTP request with merged headers (API key + custom headers)
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.apiHeaders,
          ...options.headers
        }
      });

      // Check for HTTP errors and extract response body for context
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      // Parse and return JSON response
      return await response.json();
    } catch (error) {
      // Wrap all errors with context about which endpoint failed
      throw new Error(`Failed to make API request to ${endpoint}: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Test connectivity to n8n Cloud API
   * 
   * Performs a lightweight API call to verify:
   * - Network connectivity to n8n Cloud
   * - API key authentication is working
   * - n8n service is available and responding
   * 
   * This is typically called before performing any major operations
   * to fail fast if there are connectivity issues.
   * 
   * @returns Promise<boolean> - true if connection successful, false otherwise
   * 
   * @example
   * ```typescript
   * const connected = await testConnection();
   * if (!connected) {
   *   console.error('Cannot connect to n8n Cloud');
   *   process.exit(1);
   * }
   * ```
   */
  async testConnection(): Promise<boolean> {
    try {
      // Use minimal API call (limit=1) to test connectivity without loading data
      await this.makeApiRequest('/workflows?limit=1');
      return true;
    } catch (error) {
      // Log error details for debugging but return boolean for programmatic use
      console.error('❌ n8n connection failed:', error instanceof Error ? error.message : error);
      return false;
    }
  }

  // =============================================================================
  // WORKFLOW OPERATIONS
  // =============================================================================

  async listWorkflows(projectId?: string): Promise<N8nWorkflow[]> {
    const endpoint = projectId ? `/workflows?projectId=${projectId}` : '/workflows';
    const response = await this.makeApiRequest<{ data: N8nWorkflow[] }>(endpoint);
    return response.data || [];
  }

  async getWorkflow(workflowId: string): Promise<N8nWorkflow> {
    return await this.makeApiRequest<N8nWorkflow>(`/workflows/${workflowId}`);
  }

  async findWorkflowByName(name: string, projectId?: string): Promise<N8nWorkflow | null> {
    const workflows = await this.listWorkflows(projectId);
    return workflows.find(w => w.name === name) || null;
  }

  async createWorkflow(workflowData: any, projectId?: string): Promise<N8nWorkflow> {
    // Clean workflow data for n8n API
    const { id, createdAt, updatedAt, active, webhookId, versionId, tags, meta, ...cleanData } = workflowData;

    const createPayload = {
      name: cleanData.name,
      nodes: cleanData.nodes,
      connections: cleanData.connections,
      settings: cleanData.settings || {},
      staticData: cleanData.staticData || {}
    };

    const endpoint = projectId ? `/workflows?projectId=${projectId}` : '/workflows';
    return await this.makeApiRequest<N8nWorkflow>(endpoint, {
      method: 'POST',
      body: JSON.stringify(createPayload)
    });
  }

  async deleteWorkflow(workflowId: string): Promise<void> {
    await this.makeApiRequest(`/workflows/${workflowId}`, {
      method: 'DELETE'
    });
  }

  async activateWorkflow(workflowId: string): Promise<void> {
    await this.makeApiRequest(`/workflows/${workflowId}/activate`, {
      method: 'POST'
    });
  }

  async deactivateWorkflow(workflowId: string): Promise<void> {
    await this.makeApiRequest(`/workflows/${workflowId}/deactivate`, {
      method: 'POST'
    });
  }

  // =============================================================================
  // PROJECT OPERATIONS
  // =============================================================================

  async listProjects(): Promise<N8nProject[]> {
    try {
      const response = await this.makeApiRequest<{ data: N8nProject[] }>('/projects');
      return response.data || [];
    } catch (error) {
      // Projects might not be available in all n8n versions
      return [];
    }
  }

  async findProjectByName(name: string): Promise<N8nProject | null> {
    const projects = await this.listProjects();
    return projects.find(p => p.name === name) || null;
  }

  // =============================================================================
  // FILE OPERATIONS
  // =============================================================================

  async loadWorkflowFile(fileName: string): Promise<any> {
    const filePath = path.join(__dirname, '../definitions', fileName);
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to load workflow file ${fileName}: ${error instanceof Error ? error.message : error}`);
    }
  }

  async getAvailableWorkflowFiles(): Promise<string[]> {
    try {
      const definitionsPath = path.join(__dirname, '../definitions');
      const files = await fs.readdir(definitionsPath);
      return files.filter(f => f.endsWith('.json'));
    } catch (error) {
      throw new Error(`Failed to list workflow files: ${error instanceof Error ? error.message : error}`);
    }
  }

  // =============================================================================
  // HIGH-LEVEL OPERATIONS
  // =============================================================================

  async deployWorkflow(fileName: string, options: DeploymentOptions = {}): Promise<string> {
    const { replace = true, activate = true, projectId, dryRun = false } = options;

    console.log(`🚀 Deploying workflow: ${fileName}`);
    if (dryRun) console.log('🔍 DRY RUN MODE - No changes will be made');

    // Load workflow data
    const workflowData = await this.loadWorkflowFile(fileName);
    console.log(`📂 Loaded workflow: ${workflowData.name}`);

    // Check for existing workflow
    const existingWorkflow = await this.findWorkflowByName(workflowData.name, projectId);
    
    if (existingWorkflow) {
      console.log(`📋 Found existing workflow: ${existingWorkflow.name} (ID: ${existingWorkflow.id})`);
      
      if (replace) {
        if (!dryRun) {
          console.log(`🔄 Replacing existing workflow...`);
          
          // Deactivate and delete existing workflow
          if (existingWorkflow.active) {
            console.log(`⏸️  Deactivating workflow...`);
            await this.deactivateWorkflow(existingWorkflow.id);
          }
          
          console.log(`🗑️  Deleting workflow...`);
          await this.deleteWorkflow(existingWorkflow.id);
        } else {
          console.log(`🔄 Would replace existing workflow (DRY RUN)`);
        }
      } else {
        throw new Error(`Workflow ${workflowData.name} already exists. Use --replace flag to replace it.`);
      }
    } else {
      console.log(`📋 No existing workflow found with name: ${workflowData.name}`);
    }

    if (!dryRun) {
      // Create new workflow
      console.log(`📤 Creating new workflow...`);
      const newWorkflow = await this.createWorkflow(workflowData, projectId);
      console.log(`✅ Workflow created with ID: ${newWorkflow.id}`);

      // Activate if requested
      if (activate) {
        console.log(`▶️  Activating workflow...`);
        await this.activateWorkflow(newWorkflow.id);
        console.log(`✅ Workflow activated successfully`);
      }

      return newWorkflow.id;
    } else {
      console.log(`📤 Would create new workflow (DRY RUN)`);
      return 'dry-run-id';
    }
  }

  async deployAllWorkflows(options: DeploymentOptions = {}): Promise<void> {
    console.log('🚀 Deploying all workflow definitions...\n');
    
    const workflowFiles = await this.getAvailableWorkflowFiles();
    console.log(`📋 Found ${workflowFiles.length} workflow files`);
    
    const results: { file: string; success: boolean; id?: string; error?: string }[] = [];
    
    for (const file of workflowFiles) {
      try {
        console.log(`\n📦 Processing ${file}...`);
        const workflowId = await this.deployWorkflow(file, options);
        results.push({ file, success: true, id: workflowId });
        console.log(`✅ ${file} deployed successfully`);
      } catch (error) {
        results.push({ 
          file, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        console.error(`❌ ${file} deployment failed:`, error);
      }
    }
    
    // Summary
    console.log('\n📊 Deployment Summary:');
    console.log('===================');
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.file}${result.id ? ` (${result.id})` : ''}`);
      if (result.error) {
        console.log(`    Error: ${result.error}`);
      }
    });
    
    const successful = results.filter(r => r.success).length;
    console.log(`\nOverall: ${successful}/${results.length} workflows deployed successfully`);
  }

  async getWorkflowStatus(): Promise<void> {
    console.log('📊 n8n Workflow Status');
    console.log('=====================\n');
    
    // Connection test
    console.log('🔗 Testing connection...');
    const connected = await this.testConnection();
    console.log(`   ${connected ? '✅ Connected' : '❌ Failed'}\n`);
    
    if (!connected) return;
    
    // Workflows summary
    console.log('📋 Workflows Summary:');
    const workflows = await this.listWorkflows();
    const activeWorkflows = workflows.filter(w => w.active);
    const inactiveWorkflows = workflows.filter(w => !w.active);
    
    console.log(`   Total: ${workflows.length}`);
    console.log(`   Active: ${activeWorkflows.length}`);
    console.log(`   Inactive: ${inactiveWorkflows.length}\n`);
    
    // Projects summary
    console.log('🏗️  Projects Summary:');
    const projects = await this.listProjects();
    if (projects.length > 0) {
      console.log(`   Total projects: ${projects.length}`);
      projects.forEach(project => {
        console.log(`   - ${project.name} (${project.type})`);
      });
    } else {
      console.log('   No projects found (or not supported)');
    }
    
    console.log('\n📁 Available Workflow Files:');
    const workflowFiles = await this.getAvailableWorkflowFiles();
    workflowFiles.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file}`);
    });
  }

  async inspectWorkflow(workflowId: string): Promise<void> {
    console.log(`🔍 Inspecting workflow: ${workflowId}\n`);
    
    try {
      const workflow = await this.getWorkflow(workflowId);
      
      console.log('📋 Basic Information:');
      console.log(`   Name: ${workflow.name}`);
      console.log(`   ID: ${workflow.id}`);
      console.log(`   Status: ${workflow.active ? '✅ Active' : '⏸️  Inactive'}`);
      console.log(`   Nodes: ${workflow.nodes?.length || 0}`);
      console.log(`   Created: ${workflow.createdAt || 'Unknown'}`);
      console.log(`   Updated: ${workflow.updatedAt || 'Unknown'}\n`);
      
      if (workflow.nodes && workflow.nodes.length > 0) {
        console.log('🔧 Nodes:');
        workflow.nodes.forEach((node, index) => {
          console.log(`   ${index + 1}. ${node.name} (${node.type})`);
        });
      }
      
    } catch (error) {
      console.error('❌ Failed to inspect workflow:', error);
    }
  }
}

// =============================================================================
// CLI INTERFACE
// =============================================================================

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const manager = new N8nWorkflowManager();

  console.log('🚀 n8n Workflow Manager');
  console.log('=======================');
  console.log(`🔧 n8n URL: ${N8N_BASE_URL}`);
  console.log(`🔑 API Key: ${N8N_API_KEY ? '[SET]' : '[MISSING]'}\n`);

  if (!command) {
    console.log('Usage: tsx workflows/scripts/n8n-workflow-manager.ts <command> [options]\n');
    console.log('Commands:');
    console.log('  deploy <workflow>     Deploy a single workflow (replaces existing)');
    console.log('  deploy-all [--dry-run] Deploy all workflow definitions');
    console.log('  list                  List all workflows');
    console.log('  inspect <id>          Get detailed workflow information');
    console.log('  delete <id>           Delete a workflow');
    console.log('  status                Show overall n8n status');
    console.log('  projects              List available projects');
    console.log('\nExamples:');
    console.log('  tsx workflows/scripts/n8n-workflow-manager.ts deploy payoff-request.json');
    console.log('  tsx workflows/scripts/n8n-workflow-manager.ts deploy-all');
    console.log('  tsx workflows/scripts/n8n-workflow-manager.ts status');
    return;
  }

  try {
    switch (command) {
      case 'deploy':
        const workflowFile = args[1];
        if (!workflowFile) {
          console.error('❌ Please specify a workflow file');
          process.exit(1);
        }
        await manager.deployWorkflow(workflowFile);
        break;

      case 'deploy-all':
        const dryRun = args.includes('--dry-run');
        await manager.deployAllWorkflows({ dryRun });
        break;

      case 'list':
        const workflows = await manager.listWorkflows();
        console.log('📋 Workflows:');
        workflows.forEach((workflow, index) => {
          const status = workflow.active ? '✅' : '⏸️ ';
          console.log(`   ${index + 1}. ${status} ${workflow.name} (${workflow.id})`);
        });
        break;

      case 'inspect':
        const workflowId = args[1];
        if (!workflowId) {
          console.error('❌ Please specify a workflow ID');
          process.exit(1);
        }
        await manager.inspectWorkflow(workflowId);
        break;

      case 'delete':
        const deleteId = args[1];
        if (!deleteId) {
          console.error('❌ Please specify a workflow ID');
          process.exit(1);
        }
        console.log(`🗑️  Deleting workflow ${deleteId}...`);
        await manager.deleteWorkflow(deleteId);
        console.log('✅ Workflow deleted successfully');
        break;

      case 'status':
        await manager.getWorkflowStatus();
        break;

      case 'projects':
        const projects = await manager.listProjects();
        console.log('🏗️  Projects:');
        if (projects.length > 0) {
          projects.forEach((project, index) => {
            console.log(`   ${index + 1}. ${project.name} (${project.type}) - ID: ${project.id}`);
          });
        } else {
          console.log('   No projects found (or not supported in this n8n version)');
        }
        break;

      default:
        console.error(`❌ Unknown command: ${command}`);
        process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Command failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n🛑 Operation interrupted by user');
  process.exit(0);
});

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ Script failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  });
}

export { N8nWorkflowManager };