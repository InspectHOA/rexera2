/**
 * Rexera Workflows Package
 * 
 * TypeScript utilities for n8n workflow management
 */

export { WorkflowManager, createWorkflowManager, workflowUtils } from './utils/workflow-manager';

// Re-export types for convenience
export type {
  N8nWorkflow,
  N8nExecution,
  N8nConfig
} from './utils/workflow-manager';