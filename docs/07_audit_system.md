# Audit System Documentation

## Overview

The Rexera 2.0 audit system provides comprehensive logging and tracking of all significant actions performed by humans, agents, and system processes. This system ensures compliance, aids in debugging, and provides valuable analytics for the platform.

## Architecture

### Database Schema

The audit system uses a single `audit_events` table with the following structure:

```sql
CREATE TABLE audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_type TEXT NOT NULL,              -- 'human', 'agent', 'system'
    actor_id TEXT NOT NULL,                -- ID of the actor
    actor_name TEXT,                       -- Human-readable name
    event_type TEXT NOT NULL,              -- Category of event
    action TEXT NOT NULL,                  -- Specific action performed
    resource_type TEXT NOT NULL,           -- Type of resource affected
    resource_id UUID NOT NULL,             -- ID of resource affected
    workflow_id UUID REFERENCES workflows(id),
    client_id UUID REFERENCES clients(id),
    event_data JSONB DEFAULT '{}',         -- Additional event-specific data
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Key Features

1. **Universal Logging**: Captures all significant actions across the platform
2. **Immutable Records**: Append-only table for data integrity
3. **Flexible Data**: JSONB column for event-specific metadata
4. **Performance Optimized**: Indexed for efficient querying
5. **Real-time Updates**: Supabase subscriptions for live activity feeds

## Event Types

### Actor Types
- **human**: HIL operators, client users, administrators
- **agent**: AI agents processing workflows
- **system**: Automated processes and background jobs

### Event Categories
- **workflow_management**: Workflow CRUD operations
- **task_execution**: Agent task processing
- **task_intervention**: Human task approvals/rejections
- **sla_management**: SLA status updates and breaches
- **user_authentication**: Login/logout events
- **document_management**: Document operations
- **communication**: Email/message activities
- **system_operation**: Background system processes

### Actions
- **create**: Resource creation
- **read**: Resource access (for sensitive operations)
- **update**: Resource modification
- **delete**: Resource deletion
- **execute**: Task or process execution
- **approve**: Manual approval actions
- **reject**: Manual rejection actions
- **login/logout**: Authentication events

## Implementation

### Backend: Audit Logger

```typescript
import { auditLogger, AuditHelpers } from '@rexera/shared';

// Example: Log workflow creation
await auditLogger.log(
  AuditHelpers.workflowEvent(
    userId,
    userName,
    'create',
    workflowId,
    clientId,
    {
      workflow_type: 'PAYOFF_REQUEST',
      initial_status: 'NOT_STARTED',
      created_via: 'api'
    }
  )
);
```

### API Endpoints

#### GET /api/audit-events
Retrieve audit events with filtering and pagination.

**Query Parameters:**
- `workflow_id`: Filter by workflow
- `client_id`: Filter by client
- `actor_type`: Filter by actor type
- `event_type`: Filter by event category
- `from_date`/`to_date`: Date range filtering
- `page`/`per_page`: Pagination

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "actor_type": "human",
      "actor_name": "John Doe",
      "event_type": "workflow_management",
      "action": "create",
      "resource_type": "workflow",
      "workflow_id": "uuid",
      "created_at": "2024-01-01T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 50,
    "total": 100
  }
}
```

#### POST /api/audit-events
Manually create audit events.

#### GET /api/audit-events/workflow/:id
Get complete audit trail for a specific workflow.

#### GET /api/audit-events/stats
Get audit statistics for monitoring.

### Frontend: Activity Feed

The `ActivityFeed` component displays real-time audit events:

```tsx
import { ActivityFeed } from '@/components/dashboard/activity-feed';

// Global activity feed
<ActivityFeed limit={10} autoRefresh={true} />

// Workflow-specific activity
<ActivityFeed workflowId="uuid" limit={20} />
```

**Features:**
- Real-time updates via Supabase subscriptions
- Configurable filtering and limits
- Dark mode support
- Responsive design
- Human-readable message formatting

## Usage Examples

### Workflow Operations

```typescript
// Workflow creation audit
await auditLogger.log({
  actor_type: 'human',
  actor_id: user.id,
  actor_name: user.full_name,
  event_type: 'workflow_management',
  action: 'create',
  resource_type: 'workflow',
  resource_id: workflow.id,
  workflow_id: workflow.id,
  client_id: workflow.client_id,
  event_data: {
    workflow_type: workflow.workflow_type,
    initial_status: workflow.status,
    created_via: 'dashboard'
  }
});
```

### Task Interventions

```typescript
// HIL task approval
await auditLogger.log({
  actor_type: 'human',
  actor_id: user.id,
  actor_name: user.full_name,
  event_type: 'task_intervention',
  action: 'approve',
  resource_type: 'task_execution',
  resource_id: task.id,
  workflow_id: task.workflow_id,
  event_data: {
    comment: 'Approved after review',
    intervention_reason: 'manual_verification'
  }
});
```

### System Operations

```typescript
// SLA breach detection
await auditLogger.log({
  actor_type: 'system',
  actor_id: 'sla_monitor',
  actor_name: 'SLA Monitoring System',
  event_type: 'sla_management',
  action: 'update',
  resource_type: 'task_execution',
  resource_id: task.id,
  workflow_id: task.workflow_id,
  event_data: {
    field_changed: 'sla_status',
    old_value: 'ON_TIME',
    new_value: 'BREACHED',
    hours_overdue: 4,
    automated_action: true
  }
});
```

## Best Practices

### When to Log Audit Events

**Always Log:**
- User authentication events
- Workflow state changes
- Task approvals/rejections
- SLA breaches
- Document uploads/downloads
- System failures or errors

**Consider Logging:**
- Data exports
- Configuration changes
- User profile updates
- Client communication

**Don't Log:**
- Read-only operations (unless sensitive)
- Automated health checks
- Performance monitoring data

### Event Data Guidelines

1. **Include Context**: Add relevant metadata to `event_data`
2. **Consistent Naming**: Use snake_case for field names
3. **Meaningful Values**: Store human-readable values when possible
4. **Size Limits**: Keep `event_data` under 10KB
5. **No Secrets**: Never log passwords, tokens, or sensitive data

### Error Handling

Audit logging should never break business operations:

```typescript
try {
  await auditLogger.log(auditEvent);
} catch (auditError) {
  console.warn('Audit logging failed:', auditError);
  // Continue with business logic
}
```

## Monitoring and Analytics

### Key Metrics
- Events per hour by type
- User activity patterns
- System operation frequency
- Error rates by actor type

### Compliance Features
- Immutable audit trail
- Complete user action history
- System process tracking
- Tamper-evident logging

### Performance Considerations
- Asynchronous logging
- Batch processing capabilities
- Efficient database indexes
- Real-time subscription filtering

## Security

### Access Control
- Audit events require authentication
- Read access based on user permissions
- Service role access for system operations

### Data Privacy
- No sensitive data in audit logs
- Proper anonymization for compliance
- Retention policies for audit data

### Integrity
- Append-only design prevents tampering
- Database constraints ensure data quality
- Backup and recovery procedures

## Development Guidelines

### Adding New Event Types

1. Update `AuditEventType` enum in shared package
2. Add validation to schemas if needed
3. Update frontend message formatting
4. Add appropriate database indexes
5. Document the new event type

### Testing Audit Events

```typescript
// Test audit logging
it('should log workflow creation audit event', async () => {
  const workflow = await createWorkflow(testData);
  
  const auditEvents = await getAuditEvents({
    resource_id: workflow.id,
    event_type: 'workflow_management'
  });
  
  expect(auditEvents).toHaveLength(1);
  expect(auditEvents[0].action).toBe('create');
});
```

### Performance Testing

Monitor audit system performance:
- Logging latency
- Database query performance
- Real-time subscription load
- Storage growth rates

This audit system provides the foundation for compliance, debugging, and analytics while maintaining the simplicity and performance characteristics expected in the Rexera platform.