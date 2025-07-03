/**
 * Agent Monitoring System
 * Provides comprehensive monitoring, alerting, and performance tracking for all agents
 */

import { EventEmitter } from 'events';
import type { 
  AgentType, 
  AgentTaskRequest, 
  AgentTaskResponse, 
  AgentHealthCheck 
} from '@rexera/types';
import { BaseAgentSDK } from './agent-sdk';
import { AgentLoadBalancer } from './load-balancer';

export interface MonitoringConfig {
  healthCheckInterval: number;
  alertThresholds: {
    responseTime: number;
    errorRate: number;
    successRate: number;
    queueLength: number;
  };
  retentionPeriod: number;
  enableAlerts: boolean;
  alertChannels: string[];
}

export interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
  enabled: boolean;
  cooldown: number;
}

export interface Alert {
  id: string;
  ruleId: string;
  agentType: AgentType;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: string;
  acknowledged: boolean;
  resolvedAt?: string;
  metadata: Record<string, any>;
}

export interface MetricPoint {
  timestamp: string;
  agentType: AgentType;
  metric: string;
  value: number;
  tags: Record<string, string>;
}

export interface AgentMetrics {
  agentType: AgentType;
  timestamp: string;
  responseTime: {
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  };
  throughput: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  reliability: {
    successRate: number;
    errorRate: number;
    timeoutRate: number;
  };
  utilization: {
    cpuUsage: number;
    memoryUsage: number;
    queueLength: number;
  };
  costs: {
    totalCostCents: number;
    avgCostPerRequest: number;
    costTrend: 'up' | 'down' | 'stable';
  };
}

export interface SystemMetrics {
  timestamp: string;
  totalRequests: number;
  totalAgents: number;
  healthyAgents: number;
  averageResponseTime: number;
  overallSuccessRate: number;
  totalCostCents: number;
  activeAlerts: number;
  systemLoad: number;
}

export class AgentMonitoringSystem extends EventEmitter {
  private config: MonitoringConfig;
  private agentSDK: BaseAgentSDK;
  private loadBalancer?: AgentLoadBalancer;
  private metrics: Map<string, MetricPoint[]> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private monitoringTimer: NodeJS.Timeout | null = null;
  private agentHealth: Map<AgentType, AgentHealthCheck> = new Map();

  constructor(
    config: Partial<MonitoringConfig> = {}, 
    agentSDK?: BaseAgentSDK,
    loadBalancer?: AgentLoadBalancer
  ) {
    super();
    
    this.config = {
      healthCheckInterval: config.healthCheckInterval || 30000,
      alertThresholds: {
        responseTime: 10000,
        errorRate: 0.1,
        successRate: 0.9,
        queueLength: 50,
        ...config.alertThresholds,
      },
      retentionPeriod: config.retentionPeriod || 86400000, // 24 hours
      enableAlerts: config.enableAlerts ?? true,
      alertChannels: config.alertChannels || ['console', 'email'],
    };

    this.agentSDK = agentSDK || new BaseAgentSDK();
    this.loadBalancer = loadBalancer;

    this.setupDefaultAlertRules();
    this.startMonitoring();
  }

  /**
   * Start monitoring system
   */
  startMonitoring(): void {
    this.monitoringTimer = setInterval(() => {
      this.performHealthChecks();
      this.collectMetrics();
      this.evaluateAlertRules();
      this.cleanupOldData();
    }, this.config.healthCheckInterval);

    this.emit('monitoring_started');
  }

  /**
   * Stop monitoring system
   */
  stopMonitoring(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }
    this.emit('monitoring_stopped');
  }

  /**
   * Record agent execution metrics
   */
  recordExecution(
    agentType: AgentType,
    request: AgentTaskRequest,
    response: AgentTaskResponse,
    executionTime: number
  ): void {
    const timestamp = new Date().toISOString();
    
    // Record execution time
    this.addMetric({
      timestamp,
      agentType,
      metric: 'response_time',
      value: executionTime,
      tags: {
        task_type: request.task_type,
        complexity: request.complexity,
        status: response.status,
      },
    });

    // Record cost
    this.addMetric({
      timestamp,
      agentType,
      metric: 'cost',
      value: response.cost_cents,
      tags: {
        task_type: request.task_type,
      },
    });

    // Record success/failure
    this.addMetric({
      timestamp,
      agentType,
      metric: 'success',
      value: response.status === 'success' ? 1 : 0,
      tags: {
        status: response.status,
      },
    });

    this.emit('execution_recorded', {
      agentType,
      executionTime,
      cost: response.cost_cents,
      success: response.status === 'success',
    });
  }

  /**
   * Get agent metrics for a time period
   */
  getAgentMetrics(
    agentType: AgentType,
    timeRange: { from: string; to: string }
  ): AgentMetrics {
    const fromTime = new Date(timeRange.from).getTime();
    const toTime = new Date(timeRange.to).getTime();

    const agentMetrics = this.getMetricsForAgent(agentType, fromTime, toTime);
    
    return this.calculateAgentMetrics(agentType, agentMetrics);
  }

  /**
   * Get system-wide metrics
   */
  getSystemMetrics(timeRange: { from: string; to: string }): SystemMetrics {
    const fromTime = new Date(timeRange.from).getTime();
    const toTime = new Date(timeRange.to).getTime();

    const allMetrics = Array.from(this.metrics.values()).flat()
      .filter(m => {
        const metricTime = new Date(m.timestamp).getTime();
        return metricTime >= fromTime && metricTime <= toTime;
      });

    return this.calculateSystemMetrics(allMetrics);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values())
      .filter(alert => !alert.acknowledged && !alert.resolvedAt)
      .sort((a, b) => {
        const severityOrder = { critical: 4, error: 3, warning: 2, info: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      this.emit('alert_acknowledged', alert);
    }
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolvedAt = new Date().toISOString();
      this.emit('alert_resolved', alert);
    }
  }

  /**
   * Add custom alert rule
   */
  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    this.emit('alert_rule_added', rule);
  }

  /**
   * Private methods
   */
  private async performHealthChecks(): Promise<void> {
    const agents: AgentType[] = ['nina', 'mia', 'florian', 'rex', 'iris', 'ria', 'kosha', 'cassy', 'max', 'corey'];
    
    const healthCheckPromises = agents.map(async (agentType) => {
      try {
        const health = await this.agentSDK.healthCheck(agentType);
        this.agentHealth.set(agentType, health);
        
        // Record health metrics
        this.addMetric({
          timestamp: new Date().toISOString(),
          agentType,
          metric: 'health_check',
          value: health.status === 'online' ? 1 : 0,
          tags: { status: health.status },
        });

        this.addMetric({
          timestamp: new Date().toISOString(),
          agentType,
          metric: 'response_time_health',
          value: health.response_time_ms,
          tags: {},
        });

      } catch (error) {
        this.agentHealth.set(agentType, {
          agent_type: agentType,
          status: 'error',
          last_health_check: new Date().toISOString(),
          response_time_ms: 0,
          error_rate_24h: 1,
          current_load: 0,
          available_capacity: 0,
          alerts: [{
            level: 'critical',
            message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: new Date().toISOString(),
          }],
        });
      }
    });

    await Promise.allSettled(healthCheckPromises);
  }

  private collectMetrics(): void {
    const timestamp = new Date().toISOString();
    
    // Collect load balancer metrics if available
    if (this.loadBalancer) {
      const stats = this.loadBalancer.getStatistics();
      
      this.addMetric({
        timestamp,
        agentType: 'system' as AgentType,
        metric: 'total_instances',
        value: stats.totalInstances,
        tags: {},
      });

      this.addMetric({
        timestamp,
        agentType: 'system' as AgentType,
        metric: 'healthy_instances',
        value: stats.healthyInstances,
        tags: {},
      });

      this.addMetric({
        timestamp,
        agentType: 'system' as AgentType,
        metric: 'average_load',
        value: stats.averageLoad,
        tags: {},
      });
    }

    // Collect system metrics
    this.addMetric({
      timestamp,
      agentType: 'system' as AgentType,
      metric: 'memory_usage',
      value: process.memoryUsage().heapUsed / 1024 / 1024, // MB
      tags: {},
    });
  }

  private evaluateAlertRules(): void {
    for (const rule of this.alertRules.values()) {
      if (!rule.enabled) continue;

      try {
        const shouldAlert = this.evaluateAlertCondition(rule);
        
        if (shouldAlert && !this.hasRecentAlert(rule.id)) {
          this.createAlert(rule);
        }
      } catch (error) {
        console.error(`Error evaluating alert rule ${rule.id}:`, error);
      }
    }
  }

  private evaluateAlertCondition(rule: AlertRule): boolean {
    const now = Date.now();
    const lookbackPeriod = 5 * 60 * 1000; // 5 minutes
    
    // Get recent metrics for evaluation
    const recentMetrics = Array.from(this.metrics.values()).flat()
      .filter(m => {
        const metricTime = new Date(m.timestamp).getTime();
        return metricTime >= (now - lookbackPeriod);
      });

    // Simple condition evaluation - can be extended with complex rule engine
    switch (rule.condition) {
      case 'high_response_time':
        const avgResponseTime = this.calculateAverageMetric(recentMetrics, 'response_time');
        return avgResponseTime > rule.threshold;
        
      case 'high_error_rate':
        const errorRate = this.calculateErrorRate(recentMetrics);
        return errorRate > rule.threshold;
        
      case 'low_success_rate':
        const successRate = this.calculateSuccessRate(recentMetrics);
        return successRate < rule.threshold;
        
      case 'agent_unhealthy':
        return Array.from(this.agentHealth.values())
          .some(health => health.status !== 'online');
        
      default:
        return false;
    }
  }

  private createAlert(rule: AlertRule): void {
    const alert: Alert = {
      id: crypto.randomUUID(),
      ruleId: rule.id,
      agentType: 'system' as AgentType, // Can be made more specific
      severity: rule.severity,
      message: `Alert: ${rule.name}`,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      metadata: {
        rule: rule.name,
        condition: rule.condition,
        threshold: rule.threshold,
      },
    };

    this.alerts.set(alert.id, alert);
    this.emit('alert_created', alert);

    if (this.config.enableAlerts) {
      this.sendAlert(alert);
    }
  }

  private sendAlert(alert: Alert): void {
    this.config.alertChannels.forEach(channel => {
      switch (channel) {
        case 'console':
          console.warn(`[ALERT] ${alert.severity.toUpperCase()}: ${alert.message}`);
          break;
        case 'email':
          // Email notification would be implemented here
          break;
        case 'webhook':
          // Webhook notification would be implemented here
          break;
      }
    });
  }

  private hasRecentAlert(ruleId: string): boolean {
    const rule = this.alertRules.get(ruleId);
    if (!rule) return false;

    const cutoff = Date.now() - rule.cooldown;
    
    return Array.from(this.alerts.values())
      .some(alert => 
        alert.ruleId === ruleId &&
        new Date(alert.timestamp).getTime() > cutoff &&
        !alert.resolvedAt
      );
  }

  private addMetric(metric: MetricPoint): void {
    const key = `${metric.agentType}_${metric.metric}`;
    
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    
    this.metrics.get(key)!.push(metric);
  }

  private getMetricsForAgent(
    agentType: AgentType, 
    fromTime: number, 
    toTime: number
  ): MetricPoint[] {
    return Array.from(this.metrics.entries())
      .filter(([key]) => key.startsWith(agentType))
      .flatMap(([, metrics]) => metrics)
      .filter(m => {
        const metricTime = new Date(m.timestamp).getTime();
        return metricTime >= fromTime && metricTime <= toTime;
      });
  }

  private calculateAgentMetrics(agentType: AgentType, metrics: MetricPoint[]): AgentMetrics {
    const responseTimeMetrics = metrics.filter(m => m.metric === 'response_time');
    const successMetrics = metrics.filter(m => m.metric === 'success');
    const costMetrics = metrics.filter(m => m.metric === 'cost');

    const responseTimes = responseTimeMetrics.map(m => m.value).sort((a, b) => a - b);
    const successRate = successMetrics.length > 0 ? 
      successMetrics.reduce((sum, m) => sum + m.value, 0) / successMetrics.length : 0;

    return {
      agentType,
      timestamp: new Date().toISOString(),
      responseTime: {
        avg: responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0,
        p50: this.percentile(responseTimes, 0.5),
        p95: this.percentile(responseTimes, 0.95),
        p99: this.percentile(responseTimes, 0.99),
      },
      throughput: {
        requestsPerMinute: metrics.length / 60,
        requestsPerHour: metrics.length / 3600,
      },
      reliability: {
        successRate,
        errorRate: 1 - successRate,
        timeoutRate: 0, // Would be calculated from timeout metrics
      },
      utilization: {
        cpuUsage: 0, // Would be collected from agent health
        memoryUsage: 0, // Would be collected from agent health
        queueLength: 0, // Would be collected from load balancer
      },
      costs: {
        totalCostCents: costMetrics.reduce((sum, m) => sum + m.value, 0),
        avgCostPerRequest: costMetrics.length > 0 ? 
          costMetrics.reduce((sum, m) => sum + m.value, 0) / costMetrics.length : 0,
        costTrend: 'stable', // Would be calculated from historical data
      },
    };
  }

  private calculateSystemMetrics(metrics: MetricPoint[]): SystemMetrics {
    const healthyAgents = Array.from(this.agentHealth.values())
      .filter(h => h.status === 'online').length;

    return {
      timestamp: new Date().toISOString(),
      totalRequests: metrics.filter(m => m.metric === 'success').length,
      totalAgents: this.agentHealth.size,
      healthyAgents,
      averageResponseTime: this.calculateAverageMetric(metrics, 'response_time'),
      overallSuccessRate: this.calculateSuccessRate(metrics),
      totalCostCents: metrics.filter(m => m.metric === 'cost')
        .reduce((sum, m) => sum + m.value, 0),
      activeAlerts: this.getActiveAlerts().length,
      systemLoad: healthyAgents / Math.max(this.agentHealth.size, 1),
    };
  }

  private calculateAverageMetric(metrics: MetricPoint[], metricName: string): number {
    const filtered = metrics.filter(m => m.metric === metricName);
    return filtered.length > 0 ? 
      filtered.reduce((sum, m) => sum + m.value, 0) / filtered.length : 0;
  }

  private calculateSuccessRate(metrics: MetricPoint[]): number {
    const successMetrics = metrics.filter(m => m.metric === 'success');
    return successMetrics.length > 0 ? 
      successMetrics.reduce((sum, m) => sum + m.value, 0) / successMetrics.length : 0;
  }

  private calculateErrorRate(metrics: MetricPoint[]): number {
    return 1 - this.calculateSuccessRate(metrics);
  }

  private percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    const index = Math.ceil(values.length * p) - 1;
    return values[index] || 0;
  }

  private cleanupOldData(): void {
    const cutoff = Date.now() - this.config.retentionPeriod;
    
    for (const [key, metricArray] of this.metrics.entries()) {
      const filtered = metricArray.filter(m => 
        new Date(m.timestamp).getTime() > cutoff
      );
      this.metrics.set(key, filtered);
    }

    // Cleanup old resolved alerts
    for (const [id, alert] of this.alerts.entries()) {
      if (alert.resolvedAt && 
          new Date(alert.resolvedAt).getTime() < cutoff) {
        this.alerts.delete(id);
      }
    }
  }

  private setupDefaultAlertRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'high_response_time',
        name: 'High Response Time',
        condition: 'high_response_time',
        threshold: this.config.alertThresholds.responseTime,
        severity: 'warning',
        enabled: true,
        cooldown: 300000, // 5 minutes
      },
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        condition: 'high_error_rate',
        threshold: this.config.alertThresholds.errorRate,
        severity: 'error',
        enabled: true,
        cooldown: 300000,
      },
      {
        id: 'agent_unhealthy',
        name: 'Agent Unhealthy',
        condition: 'agent_unhealthy',
        threshold: 0,
        severity: 'critical',
        enabled: true,
        cooldown: 600000, // 10 minutes
      },
    ];

    defaultRules.forEach(rule => this.alertRules.set(rule.id, rule));
  }
}

// Export singleton instance
export const agentMonitoring = new AgentMonitoringSystem();