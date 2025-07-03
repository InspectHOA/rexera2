/**
 * Agent Coordination System
 * Orchestrates complex multi-agent workflows with coordination patterns
 */

import { EventEmitter } from 'events';
import type {
  AgentType,
  AgentTaskRequest,
  AgentTaskResponse,
  AgentCoordinationPlan,
  AgentHandoffRequest,
  AgentCollaborationRequest,
  CoordinationPattern,
  QualityGate,
  WorkflowContext
} from '@rexera/types';
import { BaseAgentSDK } from './agent-sdk';
import { AgentLoadBalancer } from './load-balancer';

export interface CoordinationEvent {
  type: 'agent_started' | 'agent_completed' | 'agent_failed' | 'handoff_initiated' | 'quality_gate_failed' | 'coordination_completed';
  agentType: AgentType;
  taskId: string;
  workflowId: string;
  data: any;
  timestamp: string;
}

export class AgentCoordinator extends EventEmitter {
  private agentSDK: BaseAgentSDK;
  private loadBalancer: AgentLoadBalancer;
  private activeCoordinations: Map<string, CoordinationExecution> = new Map();

  constructor(agentSDK?: BaseAgentSDK, loadBalancer?: AgentLoadBalancer) {
    super();
    this.agentSDK = agentSDK || new BaseAgentSDK();
    this.loadBalancer = loadBalancer || new AgentLoadBalancer();
  }

  /**
   * Execute a coordination plan with multiple agents
   */
  async executeCoordinationPlan(
    plan: AgentCoordinationPlan,
    context: WorkflowContext
  ): Promise<CoordinationResult> {
    const coordinationId = `coord_${plan.workflow_id}_${plan.task_id}_${Date.now()}`;
    
    const execution: CoordinationExecution = {
      id: coordinationId,
      plan,
      context,
      status: 'running',
      startTime: new Date(),
      agentResults: new Map(),
      errors: [],
      completedAgents: new Set(),
      qualityGateResults: new Map(),
    };

    this.activeCoordinations.set(coordinationId, execution);

    try {
      this.emitEvent('coordination_started', plan.agents[0].agent_type, plan.task_id, plan.workflow_id, { plan });

      const result = await this.executeCoordinationPattern(execution);
      
      execution.status = 'completed';
      execution.endTime = new Date();
      
      this.emitEvent('coordination_completed', plan.agents[0].agent_type, plan.task_id, plan.workflow_id, { result });
      
      return result;
    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date();
      execution.errors.push(error as Error);
      
      throw error;
    } finally {
      this.activeCoordinations.delete(coordinationId);
    }
  }

  /**
   * Execute coordination pattern based on type
   */
  private async executeCoordinationPattern(execution: CoordinationExecution): Promise<CoordinationResult> {
    const { plan } = execution;

    switch (plan.coordination_type) {
      case 'sequential':
        return this.executeSequentialPattern(execution);
      case 'parallel':
        return this.executeParallelPattern(execution);
      case 'conditional':
        return this.executeConditionalPattern(execution);
      case 'feedback_loop':
        return this.executeFeedbackLoopPattern(execution);
      default:
        throw new Error(`Unsupported coordination pattern: ${plan.coordination_type}`);
    }
  }

  /**
   * Sequential execution pattern - agents execute one after another
   */
  private async executeSequentialPattern(execution: CoordinationExecution): Promise<CoordinationResult> {
    const { plan, context } = execution;
    const sortedAgents = plan.agents.sort((a, b) => a.execution_order - b.execution_order);
    
    for (const agentConfig of sortedAgents) {
      // Check dependencies
      const dependenciesMet = agentConfig.dependencies.every(dep => 
        execution.completedAgents.has(dep)
      );
      
      if (!dependenciesMet) {
        throw new Error(`Dependencies not met for agent ${agentConfig.agent_type}`);
      }

      // Build input data from previous results
      const inputData = this.buildInputFromPreviousResults(
        agentConfig.input_mapping,
        execution.agentResults
      );

      // Execute agent
      const result = await this.executeAgent(
        agentConfig.agent_type,
        {
          agent_type: agentConfig.agent_type,
          task_id: plan.task_id,
          workflow_id: plan.workflow_id,
          task_type: context.workflow_type || 'coordination',
          complexity: 'moderate',
          input_data: inputData,
          context: { workflow_context: context },
          priority: 'normal',
        }
      );

      execution.agentResults.set(agentConfig.agent_type, result);
      execution.completedAgents.add(agentConfig.agent_type);

      // Check quality gates
      await this.checkQualityGates(execution, agentConfig.agent_type);
    }

    return this.buildCoordinationResult(execution);
  }

  /**
   * Parallel execution pattern - agents execute simultaneously
   */
  private async executeParallelPattern(execution: CoordinationExecution): Promise<CoordinationResult> {
    const { plan, context } = execution;
    
    // Group agents by dependency levels
    const dependencyLevels = this.groupAgentsByDependencyLevel(plan.agents);
    
    for (const level of dependencyLevels) {
      const promises = level.map(async (agentConfig) => {
        const inputData = this.buildInputFromPreviousResults(
          agentConfig.input_mapping,
          execution.agentResults
        );

        const result = await this.executeAgent(
          agentConfig.agent_type,
          {
            agent_type: agentConfig.agent_type,
            task_id: plan.task_id,
            workflow_id: plan.workflow_id,
            task_type: context.workflow_type || 'coordination',
            complexity: 'moderate',
            input_data: inputData,
            context: { workflow_context: context },
            priority: 'normal',
          }
        );

        execution.agentResults.set(agentConfig.agent_type, result);
        execution.completedAgents.add(agentConfig.agent_type);

        return { agentType: agentConfig.agent_type, result };
      });

      // Wait for all agents in this level to complete
      const levelResults = await Promise.allSettled(promises);
      
      // Handle any failures
      levelResults.forEach((result, index) => {
        if (result.status === 'rejected') {
          execution.errors.push(new Error(`Agent ${level[index].agent_type} failed: ${result.reason}`));
        }
      });

      // Check quality gates for this level
      for (const agentConfig of level) {
        await this.checkQualityGates(execution, agentConfig.agent_type);
      }
    }

    return this.buildCoordinationResult(execution);
  }

  /**
   * Conditional execution pattern - agents execute based on conditions
   */
  private async executeConditionalPattern(execution: CoordinationExecution): Promise<CoordinationResult> {
    const { plan, context } = execution;
    
    for (const agentConfig of plan.agents) {
      // Evaluate conditions
      const shouldExecute = agentConfig.conditions ? 
        this.evaluateConditions(agentConfig.conditions, execution.agentResults, context) : 
        true;

      if (!shouldExecute) {
        continue;
      }

      const inputData = this.buildInputFromPreviousResults(
        agentConfig.input_mapping,
        execution.agentResults
      );

      const result = await this.executeAgent(
        agentConfig.agent_type,
        {
          agent_type: agentConfig.agent_type,
          task_id: plan.task_id,
          workflow_id: plan.workflow_id,
          task_type: context.workflow_type || 'coordination',
          complexity: 'moderate',
          input_data: inputData,
          context: { workflow_context: context },
          priority: 'normal',
        }
      );

      execution.agentResults.set(agentConfig.agent_type, result);
      execution.completedAgents.add(agentConfig.agent_type);

      await this.checkQualityGates(execution, agentConfig.agent_type);
    }

    return this.buildCoordinationResult(execution);
  }

  /**
   * Feedback loop pattern - agents iterate until convergence
   */
  private async executeFeedbackLoopPattern(execution: CoordinationExecution): Promise<CoordinationResult> {
    const { plan, context } = execution;
    const maxIterations = 5; // Prevent infinite loops
    let iteration = 0;

    while (iteration < maxIterations) {
      let hasChanges = false;

      for (const agentConfig of plan.agents) {
        const inputData = this.buildInputFromPreviousResults(
          agentConfig.input_mapping,
          execution.agentResults
        );

        const result = await this.executeAgent(
          agentConfig.agent_type,
          {
            agent_type: agentConfig.agent_type,
            task_id: plan.task_id,
            workflow_id: plan.workflow_id,
            task_type: context.workflow_type || 'coordination',
            complexity: 'moderate',
            input_data: { ...inputData, iteration },
            context: { workflow_context: context },
            priority: 'normal',
          }
        );

        // Check if result differs significantly from previous iteration
        const previousResult = execution.agentResults.get(agentConfig.agent_type);
        if (!previousResult || this.hasSignificantChange(previousResult, result)) {
          hasChanges = true;
        }

        execution.agentResults.set(agentConfig.agent_type, result);
        execution.completedAgents.add(agentConfig.agent_type);
      }

      iteration++;

      // Check convergence
      if (!hasChanges) {
        break;
      }
    }

    return this.buildCoordinationResult(execution);
  }

  /**
   * Execute individual agent with load balancing
   */
  private async executeAgent(
    agentType: AgentType,
    request: AgentTaskRequest
  ): Promise<AgentTaskResponse> {
    this.emitEvent('agent_started', agentType, request.task_id, request.workflow_id, { request });

    try {
      const result = await this.agentSDK.executeTask(agentType, request);
      
      this.emitEvent('agent_completed', agentType, request.task_id, request.workflow_id, { result });
      
      return result;
    } catch (error) {
      this.emitEvent('agent_failed', agentType, request.task_id, request.workflow_id, { error });
      throw error;
    }
  }

  /**
   * Handle agent handoff between different agent types
   */
  async handleAgentHandoff(handoffRequest: AgentHandoffRequest): Promise<AgentTaskResponse> {
    this.emitEvent('handoff_initiated', handoffRequest.from_agent, handoffRequest.task_id, handoffRequest.workflow_id, { handoffRequest });

    const targetRequest: AgentTaskRequest = {
      agent_type: handoffRequest.to_agent,
      task_id: handoffRequest.task_id,
      workflow_id: handoffRequest.workflow_id,
      task_type: handoffRequest.handoff_reason,
      complexity: 'moderate',
      input_data: handoffRequest.handoff_data,
      context: { workflow_context: handoffRequest.context_data },
      priority: 'normal',
    };

    return this.executeAgent(handoffRequest.to_agent, targetRequest);
  }

  /**
   * Coordinate agent collaboration for review/validation
   */
  async coordinateCollaboration(collaborationRequest: AgentCollaborationRequest): Promise<AgentTaskResponse[]> {
    const primaryRequest: AgentTaskRequest = {
      agent_type: collaborationRequest.primary_agent,
      task_id: collaborationRequest.task_id,
      workflow_id: collaborationRequest.workflow_id,
      task_type: collaborationRequest.collaboration_type,
      complexity: 'moderate',
      input_data: collaborationRequest.collaboration_data,
      context: {},
      priority: 'normal',
    };

    // Execute primary agent
    const primaryResult = await this.executeAgent(collaborationRequest.primary_agent, primaryRequest);

    // Execute supporting agents for review/validation
    const supportingPromises = collaborationRequest.supporting_agents.map(agentType => {
      const supportingRequest: AgentTaskRequest = {
        agent_type: agentType,
        task_id: collaborationRequest.task_id,
        workflow_id: collaborationRequest.workflow_id,
        task_type: `${collaborationRequest.collaboration_type}_review`,
        complexity: 'simple',
        input_data: {
          primary_result: primaryResult.result_data,
          original_data: collaborationRequest.collaboration_data,
        },
        context: {},
        priority: 'normal',
      };

      return this.executeAgent(agentType, supportingRequest);
    });

    const supportingResults = await Promise.all(supportingPromises);
    
    return [primaryResult, ...supportingResults];
  }

  /**
   * Helper methods
   */
  private buildInputFromPreviousResults(
    inputMapping: Record<string, string>,
    agentResults: Map<AgentType, AgentTaskResponse>
  ): Record<string, any> {
    const inputData: Record<string, any> = {};

    for (const [targetField, sourceField] of Object.entries(inputMapping)) {
      const [agentType, field] = sourceField.split('.');
      const agentResult = agentResults.get(agentType as AgentType);
      
      if (agentResult) {
        inputData[targetField] = field ? agentResult.result_data[field] : agentResult.result_data;
      }
    }

    return inputData;
  }

  private groupAgentsByDependencyLevel(agents: any[]): any[][] {
    const levels: any[][] = [];
    const processed = new Set<AgentType>();

    while (processed.size < agents.length) {
      const currentLevel = agents.filter(agent => 
        !processed.has(agent.agent_type) &&
        agent.dependencies.every((dep: AgentType) => processed.has(dep))
      );

      if (currentLevel.length === 0) {
        throw new Error('Circular dependency detected in agent coordination plan');
      }

      levels.push(currentLevel);
      currentLevel.forEach(agent => processed.add(agent.agent_type));
    }

    return levels;
  }

  private evaluateConditions(
    conditions: string[],
    agentResults: Map<AgentType, AgentTaskResponse>,
    context: WorkflowContext
  ): boolean {
    // Simple condition evaluation - can be extended with a proper expression parser
    return conditions.every(condition => {
      // Example: "nina.confidence > 0.8"
      const [left, operator, right] = condition.split(' ');
      
      if (left.includes('.')) {
        const [agentType, field] = left.split('.');
        const agentResult = agentResults.get(agentType as AgentType);
        
        if (!agentResult) return false;
        
        const value = field === 'confidence' ? agentResult.confidence_score : agentResult.result_data[field];
        
        switch (operator) {
          case '>': return Number(value) > Number(right);
          case '<': return Number(value) < Number(right);
          case '>=': return Number(value) >= Number(right);
          case '<=': return Number(value) <= Number(right);
          case '==': return value == right;
          case '!=': return value != right;
          default: return false;
        }
      }
      
      return true;
    });
  }

  private hasSignificantChange(
    previous: AgentTaskResponse,
    current: AgentTaskResponse,
    threshold: number = 0.1
  ): boolean {
    return Math.abs(previous.confidence_score - current.confidence_score) > threshold;
  }

  private async checkQualityGates(execution: CoordinationExecution, agentType: AgentType): Promise<void> {
    // Implementation would check quality gates defined in the plan
    // For now, this is a placeholder
  }

  private buildCoordinationResult(execution: CoordinationExecution): CoordinationResult {
    const results = Array.from(execution.agentResults.entries()).map(([agentType, result]) => ({
      agent_type: agentType,
      result,
    }));

    return {
      coordination_id: execution.id,
      status: execution.status,
      results,
      errors: execution.errors,
      execution_time_ms: execution.endTime ? 
        execution.endTime.getTime() - execution.startTime.getTime() : 0,
      total_cost_cents: results.reduce((sum, r) => sum + r.result.cost_cents, 0),
      overall_confidence: results.reduce((sum, r) => sum + r.result.confidence_score, 0) / results.length,
    };
  }

  private emitEvent(
    type: CoordinationEvent['type'],
    agentType: AgentType,
    taskId: string,
    workflowId: string,
    data: any
  ): void {
    const event: CoordinationEvent = {
      type,
      agentType,
      taskId,
      workflowId,
      data,
      timestamp: new Date().toISOString(),
    };

    this.emit('coordination_event', event);
  }
}

// Types
interface CoordinationExecution {
  id: string;
  plan: AgentCoordinationPlan;
  context: WorkflowContext;
  status: 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  agentResults: Map<AgentType, AgentTaskResponse>;
  errors: Error[];
  completedAgents: Set<AgentType>;
  qualityGateResults: Map<string, boolean>;
}

interface CoordinationResult {
  coordination_id: string;
  status: string;
  results: Array<{
    agent_type: AgentType;
    result: AgentTaskResponse;
  }>;
  errors: Error[];
  execution_time_ms: number;
  total_cost_cents: number;
  overall_confidence: number;
}