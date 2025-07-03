# Universal Audit System Implementation Guide

## Overview

The Rexera 2.0 audit system provides comprehensive tracking of every action taken by humans, agents, or system processes. This single-table approach ensures complete visibility for compliance, debugging, and analytics while maintaining developer simplicity.

## Core Design Principles

### 🎯 **Single Source of Truth**
- **One table (`audit_events`)** captures all system activity
- **Consistent schema** across all event types
- **Flexible JSONB storage** for event-specific details

### 🚀 **Developer Ease**
- **One function** logs everything: `logAuditEvent()`
- **Automatic middleware** captures API calls
- **Built-in SDK integration** for agent activities

### 📊 **Analytics Ready**
- **Fast queries** with optimized indexes
- **Cross-cutting analysis** across all system components
- **Real-time monitoring** capabilities

---

## Database Schema

### Core Table Structure

```sql
CREATE TABLE audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Actor Information
    actor_type TEXT NOT NULL,    -- 'human', 'agent', 'system'
    actor_id TEXT NOT NULL,      -- user_id, agent_name, or process name
    actor_name TEXT,             -- Display name for UI
    
    -- Action Details
    event_type TEXT NOT NULL,    -- 'workflow.created', 'task.completed'
    action TEXT NOT NULL,        -- 'create', 'update', 'execute', etc.
    
    -- Resource Information
    resource_type TEXT NOT NULL, -- 'workflow', 'task', 'document'
    resource_id UUID NOT NULL,   -- ID of affected resource
    
    -- Context
    workflow_id UUID,            -- For workflow-related events
    client_id UUID,              -- For data isolation
    
    -- Details
    event_data JSONB DEFAULT '{}', -- Flexible metadata storage
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Standard Event Types

| Pattern | Description | Examples |
|---------|-------------|----------|
| `{resource}.{action}` | Resource operations | `workflow.created`, `task.updated` |
| `auth.{action}` | Authentication events | `auth.login`, `auth.logout` |
| `sla.{status}` | SLA monitoring | `sla.breached`, `sla.warning` |
| `agent.{action}` | AI agent activities | `agent.started`, `agent.completed` |

---

## Implementation Guide

### 1. Core Logging Function

```typescript
// /lib/audit.ts

interface AuditEventData {
  actorType: 'human' | 'agent' | 'system';
  actorId: string;
  actorName?: string;
  eventType: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'execute' | 'approve' | 'reject' | 'login' | 'logout';
  resourceType: string;
  resourceId: string;
  workflowId?: string;
  clientId?: string;
  eventData?: Record<string, any>;
}

export async function logAuditEvent(data: AuditEventData) {
  try {
    await db.audit_events.insert({
      actor_type: data.actorType,
      actor_id: data.actorId,
      actor_name: data.actorName,
      event_type: data.eventType,
      action: data.action,
      resource_type: data.resourceType,
      resource_id: data.resourceId,
      workflow_id: data.workflowId,
      client_id: data.clientId,
      event_data: data.eventData || {}
    });
  } catch (error) {
    // Never fail the main operation due to audit logging
    console.error('Audit logging failed:', error);
  }
}

// Helper function for common patterns
export async function logWorkflowEvent(
  workflowId: string,
  action: string,
  actorType: 'human' | 'agent' | 'system',
  actorId: string,
  eventData?: any
) {
  await logAuditEvent({
    actorType,
    actorId,
    eventType: `workflow.${action}`,
    action: action as any,
    resourceType: 'workflow',
    resourceId: workflowId,
    workflowId,
    eventData
  });
}
```

### 2. Automatic API Middleware

```typescript
// /middleware/audit.ts

import { logAuditEvent } from '@/lib/audit';

export function auditMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip GET requests and failed requests
  if (req.method === 'GET') {
    return next();
  }

  const originalSend = res.send;
  
  res.send = function(data) {
    // Only log successful operations
    if (res.statusCode >= 200 && res.statusCode < 400) {
      const resourceType = extractResourceType(req.path);
      const action = getActionFromMethod(req.method);
      const resourceId = extractResourceId(req, data);
      
      logAuditEvent({
        actorType: req.user?.type === 'agent' ? 'agent' : 'human',
        actorId: req.user?.id || 'anonymous',
        actorName: req.user?.name,
        eventType: `${resourceType}.${action}`,
        action,
        resourceType,
        resourceId,
        workflowId: req.body?.workflowId || req.query?.workflowId,
        clientId: req.user?.clientId,
        eventData: {
          method: req.method,
          path: req.path,
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip,
          requestBody: sanitizeRequestBody(req.body)
        }
      }).catch(console.error);
    }
    
    return originalSend.call(this, data);
  };
  
  next();
}

function extractResourceType(path: string): string {
  const match = path.match(/\/api\/([^\/]+)/);
  return match ? match[1] : 'unknown';
}

function getActionFromMethod(method: string): string {
  const map = {
    'POST': 'create',
    'PUT': 'update', 
    'PATCH': 'update',
    'DELETE': 'delete'
  };
  return map[method] || 'unknown';
}

function extractResourceId(req: Request, responseData: any): string {
  // Try to get ID from response data
  if (responseData?.data?.id) return responseData.data.id;
  
  // Try to get ID from request params
  if (req.params?.id) return req.params.id;
  
  // Try to get ID from request body
  if (req.body?.id) return req.body.id;
  
  return 'unknown';
}

function sanitizeRequestBody(body: any): any {
  // Remove sensitive fields from audit logs
  const sensitiveFields = ['password', 'token', 'secret', 'key'];
  const sanitized = { ...body };
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
}
```

### 3. Agent SDK Integration

```typescript
// /lib/agents/base-agent.ts

import { logAuditEvent } from '@/lib/audit';

export abstract class BaseAgent {
  protected agentName: string;
  
  constructor(agentName: string) {
    this.agentName = agentName;
  }
  
  async executeTask(taskId: string, workflowId: string, input: any) {
    // Log task start
    await logAuditEvent({
      actorType: 'agent',
      actorId: this.agentName,
      actorName: `${this.agentName} AI Agent`,
      eventType: 'task.started',
      action: 'execute',
      resourceType: 'task',
      resourceId: taskId,
      workflowId,
      eventData: {
        input: this.sanitizeInput(input),
        agentVersion: this.getVersion()
      }
    });
    
    try {
      const startTime = Date.now();
      const result = await this.performTask(input);
      const processingTime = Date.now() - startTime;
      
      // Log successful completion
      await logAuditEvent({
        actorType: 'agent',
        actorId: this.agentName,
        actorName: `${this.agentName} AI Agent`,
        eventType: 'task.completed',
        action: 'execute',
        resourceType: 'task',
        resourceId: taskId,
        workflowId,
        eventData: {
          output: this.sanitizeOutput(result),
          processingTimeMs: processingTime,
          confidenceScore: result.confidence,
          costUsd: result.cost,
          agentVersion: this.getVersion()
        }
      });
      
      return result;
      
    } catch (error) {
      // Log failure
      await logAuditEvent({
        actorType: 'agent',
        actorId: this.agentName,
        actorName: `${this.agentName} AI Agent`,
        eventType: 'task.failed',
        action: 'execute',
        resourceType: 'task',
        resourceId: taskId,
        workflowId,
        eventData: {
          error: error.message,
          stack: error.stack,
          agentVersion: this.getVersion()
        }
      });
      
      throw error;
    }
  }
  
  protected abstract performTask(input: any): Promise<any>;
  protected abstract sanitizeInput(input: any): any;
  protected abstract sanitizeOutput(output: any): any;
  protected abstract getVersion(): string;
}
```

### 4. System Process Monitoring

```typescript
// /lib/monitoring/sla-monitor.ts

import { logAuditEvent } from '@/lib/audit';

export class SLAMonitor {
  async checkSLABreaches() {
    const breachedTasks = await this.findBreachedTasks();
    
    for (const task of breachedTasks) {
      await logAuditEvent({
        actorType: 'system',
        actorId: 'sla-monitor',
        actorName: 'SLA Monitoring System',
        eventType: 'sla.breached',
        action: 'update',
        resourceType: 'task',
        resourceId: task.id,
        workflowId: task.workflowId,
        clientId: task.clientId,
        eventData: {
          slaDueAt: task.slaDueAt,
          breachMinutes: this.calculateBreachMinutes(task),
          taskType: task.taskType,
          agentName: task.agentName,
          escalatedTo: task.escalatedTo
        }
      });
      
      await this.escalateTask(task);
    }
  }
  
  private async findBreachedTasks() {
    // Implementation to find SLA-breached tasks
  }
  
  private calculateBreachMinutes(task: any): number {
    // Calculate how many minutes past the SLA
  }
  
  private async escalateTask(task: any) {
    // Escalate to HIL manager
  }
}
```

---

## Common Usage Patterns

### Human Actions

```typescript
// Workflow creation
await logAuditEvent({
  actorType: 'human',
  actorId: req.user.id,
  actorName: req.user.fullName,
  eventType: 'workflow.created',
  action: 'create',
  resourceType: 'workflow',
  resourceId: workflow.id,
  workflowId: workflow.id,
  clientId: workflow.clientId,
  eventData: {
    workflowType: workflow.type,
    propertyAddress: workflow.propertyAddress,
    urgency: workflow.urgency,
    ipAddress: req.ip
  }
});

// Document access (PII tracking)
await logAuditEvent({
  actorType: 'human',
  actorId: req.user.id,
  actorName: req.user.fullName,
  eventType: 'document.viewed',
  action: 'read',
  resourceType: 'document',
  resourceId: document.id,
  workflowId: document.workflowId,
  clientId: document.clientId,
  eventData: {
    documentType: document.type,
    containsPII: document.containsPII,
    fileName: document.fileName,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  }
});

// Task approval/rejection
await logAuditEvent({
  actorType: 'human',
  actorId: req.user.id,
  actorName: req.user.fullName,
  eventType: 'task.approved',
  action: 'approve',
  resourceType: 'task',
  resourceId: task.id,
  workflowId: task.workflowId,
  clientId: task.clientId,
  eventData: {
    previousStatus: task.status,
    newStatus: 'COMPLETED',
    approvalNotes: req.body.notes,
    timeToApproval: calculateTimeToApproval(task)
  }
});
```

### Authentication Events

```typescript
// Successful login
await logAuditEvent({
  actorType: 'human',
  actorId: user.id,
  actorName: user.fullName,
  eventType: 'auth.login',
  action: 'login',
  resourceType: 'user',
  resourceId: user.id,
  clientId: user.clientId,
  eventData: {
    loginMethod: 'google_oauth',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    sessionId: session.id
  }
});

// Failed login attempt
await logAuditEvent({
  actorType: 'system',
  actorId: 'auth-system',
  actorName: 'Authentication System',
  eventType: 'auth.failed_login',
  action: 'login',
  resourceType: 'user',
  resourceId: 'unknown',
  eventData: {
    attemptedEmail: req.body.email,
    failureReason: 'invalid_credentials',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  }
});
```

### System Events

```typescript
// Workflow auto-progression
await logAuditEvent({
  actorType: 'system',
  actorId: 'workflow-engine',
  actorName: 'Workflow Automation Engine',
  eventType: 'workflow.progressed',
  action: 'update',
  resourceType: 'workflow',
  resourceId: workflow.id,
  workflowId: workflow.id,
  clientId: workflow.clientId,
  eventData: {
    previousStatus: workflow.status,
    newStatus: 'IN_PROGRESS',
    trigger: 'task_completion',
    triggerTaskId: completedTask.id
  }
});

// Database maintenance
await logAuditEvent({
  actorType: 'system',
  actorId: 'db-maintenance',
  actorName: 'Database Maintenance',
  eventType: 'system.maintenance',
  action: 'update',
  resourceType: 'system',
  resourceId: 'database',
  eventData: {
    operation: 'index_rebuild',
    tablesAffected: ['workflows', 'tasks', 'audit_events'],
    duration: '45 minutes',
    recordsProcessed: 1500000
  }
});
```

---

## Query Examples

### Workflow Timeline

```sql
-- Complete timeline for a workflow
SELECT 
  created_at,
  actor_type,
  actor_name,
  event_type,
  action,
  resource_type,
  event_data
FROM audit_events 
WHERE workflow_id = 'wf-payoff-123'
ORDER BY created_at ASC;
```

### User Activity Analysis

```sql
-- What actions did a user perform today?
SELECT 
  event_type,
  action,
  resource_type,
  resource_id,
  event_data->>'ipAddress' as ip_address,
  created_at
FROM audit_events
WHERE actor_type = 'human' 
  AND actor_id = 'user-123'
  AND created_at >= CURRENT_DATE
ORDER BY created_at DESC;
```

### Agent Performance Metrics

```sql
-- Agent task completion analytics
SELECT 
  actor_id as agent_name,
  COUNT(*) as tasks_completed,
  AVG((event_data->>'confidenceScore')::numeric) as avg_confidence,
  AVG((event_data->>'processingTimeMs')::numeric) as avg_processing_time,
  SUM((event_data->>'costUsd')::numeric) as total_cost
FROM audit_events
WHERE event_type = 'task.completed' 
  AND actor_type = 'agent'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY actor_id
ORDER BY avg_confidence DESC;
```

### Compliance Reporting

```sql
-- PII access tracking for compliance
SELECT 
  actor_type,
  actor_name,
  resource_id,
  event_data->>'documentType' as document_type,
  event_data->>'fileName' as file_name,
  event_data->>'ipAddress' as ip_address,
  created_at
FROM audit_events
WHERE event_type = 'document.viewed'
  AND event_data->>'containsPII' = 'true'
  AND created_at >= '2025-01-01'
ORDER BY created_at DESC;
```

### Security Monitoring

```sql
-- Failed login attempts by IP
SELECT 
  event_data->>'ipAddress' as ip_address,
  event_data->>'attemptedEmail' as attempted_email,
  COUNT(*) as attempt_count,
  MIN(created_at) as first_attempt,
  MAX(created_at) as last_attempt
FROM audit_events
WHERE event_type = 'auth.failed_login'
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY event_data->>'ipAddress', event_data->>'attemptedEmail'
HAVING COUNT(*) > 5
ORDER BY attempt_count DESC;
```

### SLA Breach Analysis

```sql
-- SLA breach trends by workflow type
SELECT 
  w.type as workflow_type,
  COUNT(*) as breach_count,
  AVG((ae.event_data->>'breachMinutes')::numeric) as avg_breach_minutes,
  COUNT(DISTINCT ae.workflow_id) as affected_workflows
FROM audit_events ae
JOIN workflows w ON ae.workflow_id = w.id
WHERE ae.event_type = 'sla.breached'
  AND ae.created_at >= NOW() - INTERVAL '30 days'
GROUP BY w.type
ORDER BY breach_count DESC;
```

---

## Implementation Checklist

### Database Setup
- [ ] Deploy `audit_events` table with all indexes
- [ ] Set up automated backup for audit data
- [ ] Configure retention policy (e.g., keep 7 years for compliance)

### Core Implementation
- [ ] Implement `logAuditEvent()` function
- [ ] Add audit middleware to all API routes
- [ ] Integrate audit logging into agent SDK
- [ ] Add system process monitoring with audit logs

### Frontend Integration
- [ ] Create audit trail viewer for HIL dashboard
- [ ] Add user activity logs to admin panel
- [ ] Implement real-time audit event notifications
- [ ] Build compliance reporting interface

### Monitoring & Alerting
- [ ] Set up alerts for failed audit log writes
- [ ] Monitor audit event volume and performance
- [ ] Create dashboards for audit analytics
- [ ] Implement automated compliance reports

### Security & Compliance
- [ ] Ensure PII is properly masked in audit logs
- [ ] Verify GDPR compliance with data retention
- [ ] Test audit trail integrity and tamper detection
- [ ] Document audit procedures for compliance audits

---

## Benefits Summary

### 🛡️ **Compliance Ready**
- **Complete audit trail** for SOC 2, GDPR, HIPAA requirements
- **PII access tracking** with IP address and user agent logging
- **Tamper-evident** with immutable timestamps and integrity checks

### 🐛 **Debugging Power** 
- **Full workflow timeline** for troubleshooting complex issues
- **Agent behavior tracking** for performance optimization
- **System event correlation** for root cause analysis

### 📊 **Analytics & Insights**
- **User behavior patterns** for UX improvements
- **Agent performance metrics** for optimization
- **SLA breach analysis** for process improvements

### 🚀 **Developer Experience**
- **Single function** handles all audit logging
- **Automatic capture** via middleware requires no manual coding
- **Flexible schema** accommodates any event type without changes

This audit system provides enterprise-grade visibility with minimal complexity - perfect for the Rexera 2.0 architecture!