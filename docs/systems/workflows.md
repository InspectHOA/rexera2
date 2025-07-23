# Workflow System

## Overview

Workflows are business processes (Payoff Requests, HOA Acquisition) orchestrated by n8n Cloud with visibility/control via the Rexera platform.

## Architecture

```
Rexera Platform                 n8n Cloud
┌─────────────────┐            ┌─────────────────┐
│ 1. Create       │────────────│ 4. Execute      │
│    Workflow     │            │    Tasks        │
│                 │            │                 │
│ 2. Pre-populate │◄───────────│ 5. Webhook      │
│    All Tasks    │            │    Updates      │
│                 │            │                 │
│ 3. Start n8n    │────────────│ 6. HIL          │
│    Execution    │            │    Interrupts   │
└─────────────────┘            └─────────────────┘
```

## Workflow Lifecycle

1. **Creation**: User creates workflow via frontend
2. **Task Pre-population**: All possible tasks created with `PENDING` status
3. **n8n Trigger**: Platform triggers n8n Cloud workflow
4. **Execution**: Tasks progress `PENDING` → `RUNNING` → `COMPLETED/FAILED`
5. **HIL Intervention**: Tasks pause for human approval when needed
6. **Completion**: Workflow marked complete when all tasks done

## Database Schema

**Core Tables**: `workflows`, `task_executions`, `agents`

Key fields:
- `n8n_execution_id`: Links to n8n Cloud execution
- `status`: Workflow state (NOT_STARTED, IN_PROGRESS, etc.)
- `sla_due_at`: Automatic SLA deadline calculation

## API Integration

```typescript
// Create workflow
POST /api/workflows

// Start n8n execution  
POST /api/workflows/{id}/trigger-n8n

// Update task status (from n8n webhooks)
PATCH /api/taskExecutions/{id}
```

## Frontend Components

- `WorkflowHeader`: Status, progress, controls
- `TaskList`: Real-time task status with SLA indicators
- `AgentInterface`: Task-specific UI for HIL intervention

## Key Features

- **Real-time Updates**: UI automatically updates as n8n progresses
- **SLA Monitoring**: Automatic deadline tracking with breach alerts  
- **HIL Integration**: Seamless human-in-loop intervention
- **Audit Trail**: Complete activity logging for compliance