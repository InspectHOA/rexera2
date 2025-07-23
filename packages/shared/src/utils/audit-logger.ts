/**
 * Audit Logger Utility
 * 
 * Provides consistent audit logging across the entire Rexera application.
 * Follows the established pattern of utilities being simple, well-documented,
 * and focused on developer ease.
 */

import { CreateAuditEvent, CreateAuditEventSchema } from '../schemas/audit-events';

/**
 * Interface for audit logger implementations
 * Allows for different implementations (database, file, remote service)
 */
export interface IAuditLogger {
  log(event: CreateAuditEvent): Promise<void>;
  logBatch(events: CreateAuditEvent[]): Promise<void>;
}

/**
 * Configuration for the audit logger
 */
export interface AuditLoggerConfig {
  enableLogging: boolean;
  enableBatchLogging: boolean;
  batchSize: number;
  batchTimeoutMs: number;
  onError?: (error: Error, event: CreateAuditEvent) => void;
}

/**
 * Default configuration for audit logging
 */
const DEFAULT_CONFIG: AuditLoggerConfig = {
  enableLogging: true,
  enableBatchLogging: false,
  batchSize: 10,
  batchTimeoutMs: 5000,
  onError: (error: Error, event: CreateAuditEvent) => {
    console.error('Audit logging failed:', error.message, 'Event:', event);
  },
};

/**
 * Base audit logger class with common functionality
 * Follows the pattern of Rexera utilities being simple and focused
 */
export abstract class BaseAuditLogger implements IAuditLogger {
  protected config: AuditLoggerConfig;
  private eventQueue: CreateAuditEvent[] = [];
  private batchTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<AuditLoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Log a single audit event
   * Validates the event structure before logging
   */
  async log(event: CreateAuditEvent): Promise<void> {
    if (!this.config.enableLogging) {
      return;
    }

    try {
      // Validate event structure using Zod schema
      const validatedEvent = CreateAuditEventSchema.parse(event);
      
      if (this.config.enableBatchLogging) {
        this.addToBatch(validatedEvent);
      } else {
        await this.writeEvent(validatedEvent);
      }
    } catch (error) {
      this.handleError(error as Error, event);
    }
  }

  /**
   * Log multiple audit events in a batch
   * Useful for bulk operations or performance optimization
   */
  async logBatch(events: CreateAuditEvent[]): Promise<void> {
    if (!this.config.enableLogging || events.length === 0) {
      return;
    }

    try {
      // Validate all events before batch processing
      const validatedEvents = events.map(event => CreateAuditEventSchema.parse(event));
      await this.writeBatch(validatedEvents);
    } catch (error) {
      this.handleError(error as Error, events[0] || {});
    }
  }

  /**
   * Abstract method for writing a single event
   * Must be implemented by concrete audit logger classes
   */
  protected abstract writeEvent(event: CreateAuditEvent): Promise<void>;

  /**
   * Abstract method for writing multiple events
   * Must be implemented by concrete audit logger classes
   */
  protected abstract writeBatch(events: CreateAuditEvent[]): Promise<void>;

  /**
   * Add event to batch queue and manage batch processing
   */
  private addToBatch(event: CreateAuditEvent): void {
    this.eventQueue.push(event);

    // Process batch if it reaches the configured size
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flushBatch();
    }

    // Set up timer to flush batch after timeout
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.flushBatch();
      }, this.config.batchTimeoutMs);
    }
  }

  /**
   * Flush the current batch of events
   */
  private async flushBatch(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    const eventsToProcess = [...this.eventQueue];
    this.eventQueue = [];
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    try {
      await this.writeBatch(eventsToProcess);
    } catch (error) {
      this.handleError(error as Error, eventsToProcess[0] || {});
    }
  }

  /**
   * Handle audit logging errors without throwing
   * Follows Rexera's pattern of non-blocking error handling
   */
  private handleError(error: Error, event: CreateAuditEvent | any): void {
    if (this.config.onError) {
      this.config.onError(error, event);
    }
  }

  /**
   * Gracefully shutdown the audit logger
   * Flushes any pending batched events
   */
  async shutdown(): Promise<void> {
    if (this.eventQueue.length > 0) {
      await this.flushBatch();
    }
  }
}

/**
 * Helper function to create commonly used audit events
 * Provides shortcuts for the most frequent audit scenarios
 */
export class AuditHelpers {
  /**
   * Create a workflow management audit event
   */
  static workflowEvent(
    actorId: string, 
    actorName: string, 
    action: 'create' | 'update' | 'delete',
    workflowId: string,
    clientId: string,
    eventData?: Record<string, any>
  ): CreateAuditEvent {
    return {
      actor_type: 'human',
      actor_id: actorId,
      actor_name: actorName,
      event_type: 'workflow_management',
      action,
      resource_type: 'workflow',
      resource_id: workflowId,
      workflow_id: workflowId,
      client_id: clientId,
      event_data: eventData || {},
    };
  }

  /**
   * Create a task execution audit event
   */
  static taskEvent(
    actorType: 'human' | 'agent' | 'system',
    actorId: string,
    actorName: string,
    action: 'execute' | 'approve' | 'reject',
    taskId: string,
    workflowId: string,
    eventData?: Record<string, any>
  ): CreateAuditEvent {
    return {
      actor_type: actorType,
      actor_id: actorId,
      actor_name: actorName,
      event_type: actorType === 'human' ? 'task_intervention' : 'task_execution',
      action,
      resource_type: 'task_execution',
      resource_id: taskId,
      workflow_id: workflowId,
      event_data: eventData || {},
    };
  }

  /**
   * Create a system operation audit event
   */
  static systemEvent(
    systemId: string,
    systemName: string,
    action: 'create' | 'update' | 'execute',
    resourceType: string,
    resourceId: string,
    eventData?: Record<string, any>
  ): CreateAuditEvent {
    return {
      actor_type: 'system',
      actor_id: systemId,
      actor_name: systemName,
      event_type: 'system_operation',
      action,
      resource_type: resourceType as any,
      resource_id: resourceId,
      event_data: eventData || {},
    };
  }

  /**
   * Create a user authentication audit event
   */
  static authEvent(
    userId: string,
    userName: string,
    action: 'login' | 'logout',
    eventData?: Record<string, any>
  ): CreateAuditEvent {
    return {
      actor_type: 'human',
      actor_id: userId,
      actor_name: userName,
      event_type: 'user_authentication',
      action,
      resource_type: 'user_profile',
      resource_id: userId,
      event_data: eventData || {},
    };
  }
}