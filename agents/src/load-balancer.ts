/**
 * Agent Load Balancer
 * Distributes tasks across multiple agent instances based on capacity and performance
 */

import { EventEmitter } from 'events';
import type { AgentType, AgentTaskRequest, AgentHealthCheck } from '@rexera/types';
import { BaseAgentSDK } from './agent-sdk';

export interface AgentInstance {
  id: string;
  agentType: AgentType;
  endpoint: string;
  capacity: number;
  currentLoad: number;
  health: AgentHealthCheck;
  lastHealthCheck: Date;
  performanceMetrics: PerformanceMetrics;
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  successRate: number;
  throughput: number;
  errorRate: number;
  costEfficiency: number;
}

export interface LoadBalancerConfig {
  healthCheckInterval: number;
  maxRetries: number;
  loadBalancingStrategy: 'round_robin' | 'least_connections' | 'weighted_response_time' | 'adaptive';
  failoverThreshold: number;
  circuitBreakerThreshold: number;
}

export class AgentLoadBalancer extends EventEmitter {
  private instances: Map<string, AgentInstance> = new Map();
  private agentPools: Map<AgentType, AgentInstance[]> = new Map();
  private config: LoadBalancerConfig;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private requestCounters: Map<string, number> = new Map();

  constructor(config: Partial<LoadBalancerConfig> = {}) {
    super();
    
    this.config = {
      healthCheckInterval: config.healthCheckInterval || 30000,
      maxRetries: config.maxRetries || 3,
      loadBalancingStrategy: config.loadBalancingStrategy || 'adaptive',
      failoverThreshold: config.failoverThreshold || 0.8,
      circuitBreakerThreshold: config.circuitBreakerThreshold || 5,
    };

    this.startHealthChecking();
  }

  /**
   * Register agent instance
   */
  registerAgent(instance: Omit<AgentInstance, 'health' | 'lastHealthCheck' | 'performanceMetrics'>): void {
    const agentInstance: AgentInstance = {
      ...instance,
      health: {
        agent_type: instance.agentType,
        status: 'unknown',
        last_health_check: new Date().toISOString(),
        response_time_ms: 0,
        error_rate_24h: 0,
        current_load: 0,
        available_capacity: 100,
        alerts: [],
      },
      lastHealthCheck: new Date(),
      performanceMetrics: {
        averageResponseTime: 0,
        successRate: 1,
        throughput: 0,
        errorRate: 0,
        costEfficiency: 1,
      },
    };

    this.instances.set(instance.id, agentInstance);

    // Add to agent pool
    if (!this.agentPools.has(instance.agentType)) {
      this.agentPools.set(instance.agentType, []);
    }
    this.agentPools.get(instance.agentType)!.push(agentInstance);

    // Initialize circuit breaker
    this.circuitBreakers.set(instance.id, new CircuitBreaker(this.config.circuitBreakerThreshold));

    this.emit('agent_registered', { agentType: instance.agentType, instanceId: instance.id });
  }

  /**
   * Get best available agent instance for task execution
   */
  getAgentInstance(agentType: AgentType, request: AgentTaskRequest): AgentInstance | null {
    const pool = this.agentPools.get(agentType);
    if (!pool || pool.length === 0) {
      return null;
    }

    // Filter healthy instances
    const healthyInstances = pool.filter(instance => 
      instance.health.status === 'online' &&
      instance.currentLoad < instance.capacity &&
      !this.circuitBreakers.get(instance.id)?.isOpen()
    );

    if (healthyInstances.length === 0) {
      return null;
    }

    switch (this.config.loadBalancingStrategy) {
      case 'round_robin':
        return this.selectRoundRobin(agentType, healthyInstances);
      case 'least_connections':
        return this.selectLeastConnections(healthyInstances);
      case 'weighted_response_time':
        return this.selectWeightedResponseTime(healthyInstances);
      case 'adaptive':
        return this.selectAdaptive(healthyInstances, request);
      default:
        return healthyInstances[0];
    }
  }

  /**
   * Update agent performance metrics
   */
  updatePerformance(instanceId: string, metrics: Partial<PerformanceMetrics>): void {
    const instance = this.instances.get(instanceId);
    if (!instance) return;

    instance.performanceMetrics = {
      ...instance.performanceMetrics,
      ...metrics,
    };

    // Update circuit breaker based on success rate
    const circuitBreaker = this.circuitBreakers.get(instanceId);
    if (circuitBreaker) {
      if (metrics.successRate !== undefined && metrics.successRate < 0.5) {
        circuitBreaker.recordFailure();
      } else {
        circuitBreaker.recordSuccess();
      }
    }
  }

  /**
   * Load balancing strategies
   */
  private selectRoundRobin(agentType: AgentType, instances: AgentInstance[]): AgentInstance {
    const counter = this.requestCounters.get(agentType) || 0;
    const selectedIndex = counter % instances.length;
    this.requestCounters.set(agentType, counter + 1);
    return instances[selectedIndex];
  }

  private selectLeastConnections(instances: AgentInstance[]): AgentInstance {
    return instances.reduce((best, current) => 
      current.currentLoad < best.currentLoad ? current : best
    );
  }

  private selectWeightedResponseTime(instances: AgentInstance[]): AgentInstance {
    // Calculate weights based on inverse response time
    const weights = instances.map(instance => 
      1 / (instance.performanceMetrics.averageResponseTime || 1)
    );
    
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const random = Math.random() * totalWeight;
    
    let weightSum = 0;
    for (let i = 0; i < instances.length; i++) {
      weightSum += weights[i];
      if (random <= weightSum) {
        return instances[i];
      }
    }
    
    return instances[0];
  }

  private selectAdaptive(instances: AgentInstance[], request: AgentTaskRequest): AgentInstance {
    // Score instances based on multiple factors
    const scores = instances.map(instance => {
      const responseTimeScore = 1 / (instance.performanceMetrics.averageResponseTime || 1);
      const loadScore = (instance.capacity - instance.currentLoad) / instance.capacity;
      const successRateScore = instance.performanceMetrics.successRate;
      const costScore = instance.performanceMetrics.costEfficiency;
      
      // Weight factors based on request priority
      const priorityWeight = request.priority === 'urgent' ? 2 : 1;
      const complexityWeight = request.complexity === 'complex' ? 1.5 : 1;
      
      return (responseTimeScore * 0.3 + loadScore * 0.3 + successRateScore * 0.2 + costScore * 0.2) 
        * priorityWeight * complexityWeight;
    });

    const bestIndex = scores.indexOf(Math.max(...scores));
    return instances[bestIndex];
  }

  /**
   * Health checking
   */
  private startHealthChecking(): void {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckInterval);
  }

  private async performHealthChecks(): Promise<void> {
    const healthCheckPromises = Array.from(this.instances.values()).map(async (instance) => {
      try {
        const sdk = new BaseAgentSDK({ baseUrl: instance.endpoint });
        const health = await sdk.healthCheck(instance.agentType);
        
        instance.health = health;
        instance.lastHealthCheck = new Date();
        instance.currentLoad = health.current_load;

        this.emit('health_check_completed', { 
          instanceId: instance.id, 
          health: health.status 
        });
      } catch (error) {
        instance.health.status = 'error';
        instance.lastHealthCheck = new Date();
        
        this.emit('health_check_failed', { 
          instanceId: instance.id, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    await Promise.allSettled(healthCheckPromises);
  }

  /**
   * Circuit breaker management
   */
  recordSuccess(instanceId: string): void {
    const circuitBreaker = this.circuitBreakers.get(instanceId);
    if (circuitBreaker) {
      circuitBreaker.recordSuccess();
    }
  }

  recordFailure(instanceId: string): void {
    const circuitBreaker = this.circuitBreakers.get(instanceId);
    if (circuitBreaker) {
      circuitBreaker.recordFailure();
    }
  }

  /**
   * Get load balancer statistics
   */
  getStatistics(): LoadBalancerStatistics {
    const totalInstances = this.instances.size;
    const healthyInstances = Array.from(this.instances.values())
      .filter(instance => instance.health.status === 'online').length;

    const agentTypeCounts = new Map<AgentType, number>();
    this.agentPools.forEach((instances, agentType) => {
      agentTypeCounts.set(agentType, instances.length);
    });

    return {
      totalInstances,
      healthyInstances,
      agentTypeCounts: Object.fromEntries(agentTypeCounts),
      averageLoad: Array.from(this.instances.values())
        .reduce((sum, instance) => sum + instance.currentLoad, 0) / totalInstances,
      strategy: this.config.loadBalancingStrategy,
    };
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
    this.removeAllListeners();
  }
}

/**
 * Circuit Breaker Implementation
 */
class CircuitBreaker {
  private state: 'closed' | 'open' | 'half_open' = 'closed';
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly timeout = 60000; // 1 minute

  constructor(private threshold: number) {}

  isOpen(): boolean {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half_open';
        return false;
      }
      return true;
    }
    return false;
  }

  recordSuccess(): void {
    this.failureCount = 0;
    this.state = 'closed';
  }

  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.threshold) {
      this.state = 'open';
    }
  }
}

// Types
export interface LoadBalancerStatistics {
  totalInstances: number;
  healthyInstances: number;
  agentTypeCounts: Record<string, number>;
  averageLoad: number;
  strategy: string;
}