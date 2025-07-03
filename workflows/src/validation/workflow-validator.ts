/**
 * Workflow Validation System
 * Validates workflow definitions for correctness, completeness, and best practices
 */

import type { N8nWorkflow, N8nNode, N8nConnection } from '../shared/workflow-nodes';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
  score: number; // 0-100 quality score
}

export interface ValidationError {
  type: 'structure' | 'logic' | 'configuration' | 'dependencies';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  location?: string;
  nodeId?: string;
  suggestion?: string;
}

export interface ValidationWarning {
  type: 'performance' | 'maintainability' | 'security' | 'best_practice';
  message: string;
  location?: string;
  nodeId?: string;
  recommendation?: string;
}

export interface ValidationSuggestion {
  type: 'optimization' | 'enhancement' | 'alternative';
  message: string;
  location?: string;
  nodeId?: string;
  benefit?: string;
}

export class WorkflowValidator {
  private requiredNodeTypes = new Set([
    'webhook', 
    'database', 
    'response',
    'error_handler'
  ]);

  private agentTypes = new Set([
    'nina', 'mia', 'florian', 'rex', 'iris', 
    'ria', 'kosha', 'cassy', 'max', 'corey'
  ]);

  /**
   * Validate complete workflow
   */
  validateWorkflow(workflow: N8nWorkflow): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    // Basic structure validation
    this.validateBasicStructure(workflow, errors);
    
    // Node validation
    this.validateNodes(workflow.nodes, errors, warnings, suggestions);
    
    // Connection validation
    this.validateConnections(workflow.nodes, workflow.connections, errors, warnings);
    
    // Workflow logic validation
    this.validateWorkflowLogic(workflow, errors, warnings, suggestions);
    
    // Performance and best practices
    this.validateBestPractices(workflow, warnings, suggestions);
    
    // Security validation
    this.validateSecurity(workflow, errors, warnings);

    const score = this.calculateQualityScore(errors, warnings, suggestions);

    return {
      valid: errors.filter(e => e.severity === 'critical' || e.severity === 'high').length === 0,
      errors,
      warnings,
      suggestions,
      score,
    };
  }

  /**
   * Validate basic workflow structure
   */
  private validateBasicStructure(workflow: N8nWorkflow, errors: ValidationError[]): void {
    // Check required fields
    if (!workflow.id) {
      errors.push({
        type: 'structure',
        severity: 'critical',
        message: 'Workflow must have an ID',
        suggestion: 'Add a unique workflow ID',
      });
    }

    if (!workflow.name) {
      errors.push({
        type: 'structure',
        severity: 'critical',
        message: 'Workflow must have a name',
        suggestion: 'Add a descriptive workflow name',
      });
    }

    if (!workflow.nodes || workflow.nodes.length === 0) {
      errors.push({
        type: 'structure',
        severity: 'critical',
        message: 'Workflow must contain at least one node',
        suggestion: 'Add workflow nodes',
      });
    }

    // Check workflow metadata
    if (!workflow.staticData?.workflow_type) {
      errors.push({
        type: 'structure',
        severity: 'medium',
        message: 'Workflow should specify its type in staticData',
        suggestion: 'Add workflow_type to staticData',
      });
    }

    if (!workflow.tags || workflow.tags.length === 0) {
      errors.push({
        type: 'structure',
        severity: 'low',
        message: 'Workflow should have tags for organization',
        suggestion: 'Add descriptive tags',
      });
    }
  }

  /**
   * Validate individual nodes
   */
  private validateNodes(
    nodes: N8nNode[], 
    errors: ValidationError[], 
    warnings: ValidationWarning[], 
    suggestions: ValidationSuggestion[]
  ): void {
    const nodeIds = new Set<string>();
    const nodeTypes = new Set<string>();

    for (const node of nodes) {
      // Check for duplicate IDs
      if (nodeIds.has(node.id)) {
        errors.push({
          type: 'structure',
          severity: 'critical',
          message: `Duplicate node ID: ${node.id}`,
          nodeId: node.id,
          suggestion: 'Ensure all node IDs are unique',
        });
      }
      nodeIds.add(node.id);

      // Track node types
      nodeTypes.add(node.type);

      // Validate node structure
      this.validateNode(node, errors, warnings, suggestions);
    }

    // Check for required node types
    this.checkRequiredNodeTypes(nodeTypes, errors);
  }

  /**
   * Validate individual node
   */
  private validateNode(
    node: N8nNode, 
    errors: ValidationError[], 
    warnings: ValidationWarning[], 
    suggestions: ValidationSuggestion[]
  ): void {
    // Required fields
    if (!node.name) {
      errors.push({
        type: 'structure',
        severity: 'high',
        message: 'Node must have a name',
        nodeId: node.id,
        suggestion: 'Add a descriptive node name',
      });
    }

    if (!node.type) {
      errors.push({
        type: 'structure',
        severity: 'critical',
        message: 'Node must have a type',
        nodeId: node.id,
        suggestion: 'Specify the node type',
      });
    }

    // Position validation
    if (!node.position || node.position.length !== 2) {
      warnings.push({
        type: 'maintainability',
        message: 'Node should have valid position coordinates',
        nodeId: node.id,
        recommendation: 'Set position as [x, y] coordinates',
      });
    }

    // Agent node validation
    if (node.type === 'n8n-nodes-base.httpRequest' && node.name.includes('Agent')) {
      this.validateAgentNode(node, errors, warnings, suggestions);
    }

    // Database node validation
    if (node.type === 'n8n-nodes-base.supabase') {
      this.validateDatabaseNode(node, errors, warnings);
    }

    // Webhook validation
    if (node.type === 'n8n-nodes-base.webhook') {
      this.validateWebhookNode(node, errors, warnings);
    }
  }

  /**
   * Validate agent nodes
   */
  private validateAgentNode(
    node: N8nNode, 
    errors: ValidationError[], 
    warnings: ValidationWarning[], 
    suggestions: ValidationSuggestion[]
  ): void {
    const parameters = node.parameters;

    // Check for agent type in URL
    const agentTypeMatch = parameters?.url?.match(/\/(\w+)\/execute$/);
    if (!agentTypeMatch) {
      errors.push({
        type: 'configuration',
        severity: 'high',
        message: 'Agent node URL should follow pattern: /{agentType}/execute',
        nodeId: node.id,
        suggestion: 'Update URL to match agent API pattern',
      });
    } else {
      const agentType = agentTypeMatch[1];
      if (!this.agentTypes.has(agentType)) {
        errors.push({
          type: 'configuration',
          severity: 'medium',
          message: `Unknown agent type: ${agentType}`,
          nodeId: node.id,
          suggestion: 'Use a valid agent type (nina, mia, florian, etc.)',
        });
      }
    }

    // Check for required parameters
    const bodyParams = parameters?.bodyParameters?.parameters || [];
    const requiredParams = ['agent_type', 'task_type', 'task_id', 'workflow_id', 'input_data'];
    
    for (const requiredParam of requiredParams) {
      const hasParam = bodyParams.some((param: any) => param.name === requiredParam);
      if (!hasParam) {
        errors.push({
          type: 'configuration',
          severity: 'high',
          message: `Agent node missing required parameter: ${requiredParam}`,
          nodeId: node.id,
          suggestion: `Add ${requiredParam} to body parameters`,
        });
      }
    }

    // Check for timeout and retry configuration
    if (!parameters?.options?.timeout) {
      warnings.push({
        type: 'performance',
        message: 'Agent node should have timeout configured',
        nodeId: node.id,
        recommendation: 'Set appropriate timeout (e.g., 30000ms)',
      });
    }

    if (!parameters?.options?.retry?.enabled) {
      suggestions.push({
        type: 'enhancement',
        message: 'Consider enabling retry for agent nodes',
        nodeId: node.id,
        benefit: 'Improves reliability for transient failures',
      });
    }
  }

  /**
   * Validate database nodes
   */
  private validateDatabaseNode(
    node: N8nNode, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): void {
    const parameters = node.parameters;

    if (!parameters?.operation) {
      errors.push({
        type: 'configuration',
        severity: 'high',
        message: 'Database node must specify operation',
        nodeId: node.id,
        suggestion: 'Set operation (insert, update, select, delete)',
      });
    }

    if (!parameters?.tableId) {
      errors.push({
        type: 'configuration',
        severity: 'high',
        message: 'Database node must specify table',
        nodeId: node.id,
        suggestion: 'Set tableId parameter',
      });
    }

    if (!node.credentials?.supabaseApi) {
      errors.push({
        type: 'configuration',
        severity: 'critical',
        message: 'Database node must have Supabase credentials',
        nodeId: node.id,
        suggestion: 'Configure Supabase API credentials',
      });
    }
  }

  /**
   * Validate webhook nodes
   */
  private validateWebhookNode(
    node: N8nNode, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): void {
    const parameters = node.parameters;

    if (!parameters?.path) {
      errors.push({
        type: 'configuration',
        severity: 'critical',
        message: 'Webhook node must have path',
        nodeId: node.id,
        suggestion: 'Set webhook path',
      });
    }

    if (parameters?.responseMode !== 'responseNode') {
      warnings.push({
        type: 'best_practice',
        message: 'Webhook should use responseNode mode for proper response handling',
        nodeId: node.id,
        recommendation: 'Set responseMode to "responseNode"',
      });
    }
  }

  /**
   * Validate connections
   */
  private validateConnections(
    nodes: N8nNode[], 
    connections: Record<string, Record<string, N8nConnection[][]>>, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): void {
    const nodeIds = new Set(nodes.map(n => n.id));

    for (const [sourceNodeId, nodeConnections] of Object.entries(connections)) {
      // Check if source node exists
      if (!nodeIds.has(sourceNodeId)) {
        errors.push({
          type: 'structure',
          severity: 'critical',
          message: `Connection references non-existent source node: ${sourceNodeId}`,
          suggestion: 'Remove invalid connection or add missing node',
        });
        continue;
      }

      for (const [connectionType, connectionArrays] of Object.entries(nodeConnections)) {
        for (const connectionArray of connectionArrays) {
          for (const connection of connectionArray) {
            // Check if target node exists
            if (!nodeIds.has(connection.node)) {
              errors.push({
                type: 'structure',
                severity: 'critical',
                message: `Connection references non-existent target node: ${connection.node}`,
                location: `${sourceNodeId} -> ${connection.node}`,
                suggestion: 'Remove invalid connection or add missing node',
              });
            }
          }
        }
      }
    }

    // Check for orphaned nodes (no incoming connections except triggers)
    this.checkOrphanedNodes(nodes, connections, warnings);
    
    // Check for dead ends (no outgoing connections except response nodes)
    this.checkDeadEnds(nodes, connections, warnings);
  }

  /**
   * Check for orphaned nodes
   */
  private checkOrphanedNodes(
    nodes: N8nNode[], 
    connections: Record<string, Record<string, N8nConnection[][]>>, 
    warnings: ValidationWarning[]
  ): void {
    const targetNodes = new Set<string>();
    const triggerTypes = new Set(['n8n-nodes-base.webhook', 'n8n-nodes-base.cron']);

    // Collect all target nodes
    for (const nodeConnections of Object.values(connections)) {
      for (const connectionArrays of Object.values(nodeConnections)) {
        for (const connectionArray of connectionArrays) {
          for (const connection of connectionArray) {
            targetNodes.add(connection.node);
          }
        }
      }
    }

    // Check for orphaned nodes
    for (const node of nodes) {
      if (!targetNodes.has(node.id) && !triggerTypes.has(node.type)) {
        warnings.push({
          type: 'maintainability',
          message: `Node "${node.name}" appears to be orphaned (no incoming connections)`,
          nodeId: node.id,
          recommendation: 'Ensure node is properly connected or remove if unnecessary',
        });
      }
    }
  }

  /**
   * Check for dead end nodes
   */
  private checkDeadEnds(
    nodes: N8nNode[], 
    connections: Record<string, Record<string, N8nConnection[][]>>, 
    warnings: ValidationWarning[]
  ): void {
    const responseTypes = new Set([
      'n8n-nodes-base.respondToWebhook',
      'n8n-nodes-base.httpResponse'
    ]);

    for (const node of nodes) {
      const hasOutgoingConnections = connections[node.id];
      const isResponseNode = responseTypes.has(node.type);

      if (!hasOutgoingConnections && !isResponseNode) {
        warnings.push({
          type: 'maintainability',
          message: `Node "${node.name}" has no outgoing connections and is not a response node`,
          nodeId: node.id,
          recommendation: 'Add outgoing connections or ensure this is intentional',
        });
      }
    }
  }

  /**
   * Validate workflow logic
   */
  private validateWorkflowLogic(
    workflow: N8nWorkflow, 
    errors: ValidationError[], 
    warnings: ValidationWarning[], 
    suggestions: ValidationSuggestion[]
  ): void {
    // Check for proper error handling
    this.validateErrorHandling(workflow.nodes, warnings, suggestions);
    
    // Check for quality gates
    this.validateQualityGates(workflow.nodes, suggestions);
    
    // Check for proper HIL intervention points
    this.validateHILInterventions(workflow.nodes, suggestions);
  }

  /**
   * Validate error handling
   */
  private validateErrorHandling(
    nodes: N8nNode[], 
    warnings: ValidationWarning[], 
    suggestions: ValidationSuggestion[]
  ): void {
    const hasErrorHandler = nodes.some(node => 
      node.type === 'n8n-nodes-base.function' && 
      node.name.toLowerCase().includes('error')
    );

    if (!hasErrorHandler) {
      suggestions.push({
        type: 'enhancement',
        message: 'Consider adding error handling nodes',
        benefit: 'Improves workflow reliability and debugging',
      });
    }

    // Check for agent nodes without error handling
    const agentNodes = nodes.filter(node => 
      node.type === 'n8n-nodes-base.httpRequest' && 
      node.name.includes('Agent')
    );

    if (agentNodes.length > 0 && !hasErrorHandler) {
      warnings.push({
        type: 'best_practice',
        message: 'Agent nodes should have error handling',
        recommendation: 'Add error handling for agent executions',
      });
    }
  }

  /**
   * Validate quality gates
   */
  private validateQualityGates(nodes: N8nNode[], suggestions: ValidationSuggestion[]): void {
    const hasQualityCheck = nodes.some(node => 
      node.name.toLowerCase().includes('quality') ||
      node.name.toLowerCase().includes('cassy')
    );

    if (!hasQualityCheck) {
      suggestions.push({
        type: 'enhancement',
        message: 'Consider adding quality assurance checkpoints',
        benefit: 'Ensures output quality and reduces manual review',
      });
    }
  }

  /**
   * Validate HIL interventions
   */
  private validateHILInterventions(nodes: N8nNode[], suggestions: ValidationSuggestion[]): void {
    const hasHIL = nodes.some(node => 
      node.name.toLowerCase().includes('hil') ||
      node.name.toLowerCase().includes('intervention')
    );

    if (!hasHIL) {
      suggestions.push({
        type: 'enhancement',
        message: 'Consider adding human-in-the-loop intervention points',
        benefit: 'Allows manual intervention for complex cases',
      });
    }
  }

  /**
   * Validate best practices
   */
  private validateBestPractices(
    workflow: N8nWorkflow, 
    warnings: ValidationWarning[], 
    suggestions: ValidationSuggestion[]
  ): void {
    // Check node naming conventions
    this.validateNamingConventions(workflow.nodes, warnings);
    
    // Check for performance considerations
    this.validatePerformance(workflow.nodes, warnings, suggestions);
    
    // Check workflow organization
    this.validateOrganization(workflow, suggestions);
  }

  /**
   * Validate naming conventions
   */
  private validateNamingConventions(nodes: N8nNode[], warnings: ValidationWarning[]): void {
    for (const node of nodes) {
      if (!node.name || node.name.trim() === '') {
        warnings.push({
          type: 'maintainability',
          message: 'Node should have a descriptive name',
          nodeId: node.id,
          recommendation: 'Add meaningful node name',
        });
      }

      // Check for generic names
      const genericNames = ['node', 'http', 'request', 'function'];
      if (genericNames.some(generic => node.name.toLowerCase().includes(generic))) {
        warnings.push({
          type: 'maintainability',
          message: `Node name "${node.name}" is too generic`,
          nodeId: node.id,
          recommendation: 'Use more descriptive name indicating purpose',
        });
      }
    }
  }

  /**
   * Validate performance considerations
   */
  private validatePerformance(
    nodes: N8nNode[], 
    warnings: ValidationWarning[], 
    suggestions: ValidationSuggestion[]
  ): void {
    // Check for parallel execution opportunities
    const sequentialAgentNodes = this.findSequentialAgentNodes(nodes);
    if (sequentialAgentNodes.length > 2) {
      suggestions.push({
        type: 'optimization',
        message: 'Consider parallelizing independent agent executions',
        benefit: 'Reduces overall workflow execution time',
      });
    }

    // Check for timeout configurations
    const httpNodes = nodes.filter(node => node.type === 'n8n-nodes-base.httpRequest');
    for (const node of httpNodes) {
      if (!node.parameters?.options?.timeout) {
        warnings.push({
          type: 'performance',
          message: 'HTTP nodes should have timeout configured',
          nodeId: node.id,
          recommendation: 'Set appropriate timeout value',
        });
      }
    }
  }

  /**
   * Find sequential agent nodes
   */
  private findSequentialAgentNodes(nodes: N8nNode[]): N8nNode[] {
    return nodes.filter(node => 
      node.type === 'n8n-nodes-base.httpRequest' && 
      node.name.includes('Agent')
    );
  }

  /**
   * Validate workflow organization
   */
  private validateOrganization(workflow: N8nWorkflow, suggestions: ValidationSuggestion[]): void {
    // Check for proper documentation
    if (!workflow.staticData?.description) {
      suggestions.push({
        type: 'enhancement',
        message: 'Add workflow description to staticData',
        benefit: 'Improves maintainability and onboarding',
      });
    }

    // Check for version information
    if (!workflow.versionId || workflow.versionId === '1') {
      suggestions.push({
        type: 'enhancement',
        message: 'Consider implementing version tracking',
        benefit: 'Enables better change management',
      });
    }
  }

  /**
   * Validate security
   */
  private validateSecurity(
    workflow: N8nWorkflow, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): void {
    // Check for credential usage
    for (const node of workflow.nodes) {
      if (node.type === 'n8n-nodes-base.httpRequest' && !node.credentials) {
        warnings.push({
          type: 'security',
          message: 'HTTP request nodes should use credentials for authentication',
          nodeId: node.id,
          recommendation: 'Configure appropriate credentials',
        });
      }

      // Check for hardcoded secrets
      const parametersStr = JSON.stringify(node.parameters || {});
      if (this.containsHardcodedSecrets(parametersStr)) {
        errors.push({
          type: 'configuration',
          severity: 'critical',
          message: 'Node contains hardcoded secrets',
          nodeId: node.id,
          suggestion: 'Use environment variables or credentials for sensitive data',
        });
      }
    }
  }

  /**
   * Check for hardcoded secrets
   */
  private containsHardcodedSecrets(text: string): boolean {
    const secretPatterns = [
      /password[\s]*[:=][\s]*['"]\w+['"]/i,
      /api[_-]?key[\s]*[:=][\s]*['"]\w+['"]/i,
      /secret[\s]*[:=][\s]*['"]\w+['"]/i,
      /token[\s]*[:=][\s]*['"]\w+['"]/i,
    ];

    return secretPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Check for required node types
   */
  private checkRequiredNodeTypes(nodeTypes: Set<string>, errors: ValidationError[]): void {
    const requiredChecks = [
      {
        types: ['n8n-nodes-base.webhook'],
        message: 'Workflow should have a webhook trigger',
        severity: 'medium' as const,
      },
      {
        types: ['n8n-nodes-base.respondToWebhook', 'n8n-nodes-base.httpResponse'],
        message: 'Workflow should have a response node',
        severity: 'medium' as const,
      },
    ];

    for (const check of requiredChecks) {
      const hasRequiredType = check.types.some(type => nodeTypes.has(type));
      if (!hasRequiredType) {
        errors.push({
          type: 'structure',
          severity: check.severity,
          message: check.message,
          suggestion: `Add one of: ${check.types.join(', ')}`,
        });
      }
    }
  }

  /**
   * Calculate quality score
   */
  private calculateQualityScore(
    errors: ValidationError[], 
    warnings: ValidationWarning[], 
    suggestions: ValidationSuggestion[]
  ): number {
    let score = 100;

    // Deduct for errors
    for (const error of errors) {
      switch (error.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 8;
          break;
        case 'low':
          score -= 3;
          break;
      }
    }

    // Deduct for warnings
    for (const warning of warnings) {
      score -= 2;
    }

    // Small deduction for suggestions (missed opportunities)
    score -= suggestions.length * 0.5;

    return Math.max(0, Math.round(score));
  }
}

// Export singleton instance
export const workflowValidator = new WorkflowValidator();