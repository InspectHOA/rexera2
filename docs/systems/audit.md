# Audit System

## Overview

Comprehensive audit trail system that tracks all user actions, system events, and data changes across the platform.

## Architecture

**Universal Logging**: Every significant action generates an immutable audit event

**Event Types**:
- **Workflow Events**: Creation, status changes, assignments
- **Task Events**: Execution start/completion, interrupts, failures
- **Communication Events**: Emails sent, calls made
- **Document Events**: Uploads, updates, deletions
- **Authentication Events**: User logins, logouts

## Database Schema

**Core Table**: `audit_events`

Key fields:
- `actor_type`: 'human' | 'agent' | 'system'
- `actor_id`: User/agent/system identifier
- `event_type`: Category of the event (workflow_created, task_completed, etc.)
- `action`: Specific action (create, update, delete, execute, etc.)
- `resource_type`: Type of resource affected (workflow, task_execution, etc.)
- `resource_id`: ID of the affected resource
- `workflow_id`: Associated workflow (for context)
- `event_data`: JSON metadata about the event

## Implementation

**Shared Package**: `@rexera/shared`
- `AuditLogger` class for consistent logging
- `AuditHelpers` for common scenarios
- Zod schemas for validation

**API Integration**:
```typescript
import { auditLogger } from '@rexera/shared';

// Log workflow creation
await auditLogger.logWorkflowEvent({
  actor: { type: 'human', id: userId, name: 'Admin User' },
  action: 'create',
  workflow: workflowData,
  eventData: { workflow_type: 'MUNI_LIEN_SEARCH' }
});
```

**Frontend Display**:
- `ActivityFeed` component shows human-readable audit events
- Real-time updates via Supabase subscriptions
- Workflow-specific and global views

## Usage Patterns

**Automatic Logging**: 
- API endpoints automatically log significant changes
- Background tasks log completion/failure events
- Authentication system logs user sessions

**Manual Logging**:
- HIL actions and decisions
- System maintenance operations
- Configuration changes

## API Endpoints

- `GET /api/audit-events` - List audit events with filtering
- `POST /api/audit-events` - Create new audit event (internal use)
- `GET /api/audit-events?workflow_id=X` - Workflow-specific events

## Real-time Updates

Uses Supabase real-time subscriptions to automatically refresh activity feeds when new audit events are created.