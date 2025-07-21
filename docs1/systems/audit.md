# Audit System

## Overview

Universal, immutable logging of all significant actions by humans, agents, and system processes for compliance and debugging.

## Architecture

```sql
audit_events table:
- actor_type: 'human' | 'agent' | 'system'  
- event_type: 'workflow_management', 'task_execution', etc.
- action: 'create', 'update', 'execute', 'approve', etc.
- resource_type: 'workflow', 'task_execution', etc.
- event_data: JSONB for context
```

## Usage

```typescript
import { auditLogger, AuditHelpers } from '@rexera/shared';

// Log workflow creation
await auditLogger.log(
  AuditHelpers.workflowEvent(
    userId, userName, 'create', workflowId, clientId,
    { workflow_type: 'PAYOFF_REQUEST' }
  )
);

// Log task approval
await auditLogger.log({
  actor_type: 'human',
  event_type: 'task_intervention', 
  action: 'approve',
  resource_type: 'task_execution',
  resource_id: taskId,
  // ... other fields
});
```

## API Endpoints

- `GET /api/audit-events` - List with filtering
- `GET /api/audit-events/workflow/{id}` - Workflow audit trail
- `GET /api/audit-events/stats` - System statistics

## Frontend Integration

```typescript
// Activity feed component
<ActivityFeed workflowId={id} limit={10} autoRefresh={true} />
```

Features:
- **Real-time updates** via Supabase subscriptions
- **Human-readable messages** with icons
- **Workflow-specific** or global activity feeds

## Key Principles

- **Non-blocking**: Audit failures never break business operations
- **Immutable**: Append-only for data integrity
- **Comprehensive**: Logs all significant platform actions
- **Performance**: Asynchronous with batch processing support