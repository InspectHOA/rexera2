# Task Execution System

## Overview

Tasks are individual workflow steps executed by AI agents or humans (HIL). The system manages task lifecycle, SLA tracking, and HIL intervention points.

## Task Lifecycle

```
PENDING → RUNNING → COMPLETED
                 → INTERRUPT → PENDING (after HIL approval)
                 → FAILED
```

## Database Schema

**Core Table**: `task_executions`

Key fields:
- `workflow_id`: Parent workflow
- `agent_id`: Assigned AI agent (null for HIL tasks)
- `executor_type`: 'AI' | 'HIL'
- `status`: Current execution state
- `interrupt_type`: Reason for HIL intervention
- `sla_hours`: Task deadline (default: 24h)
- `sla_due_at`: Calculated deadline
- `sla_status`: 'ON_TIME' | 'AT_RISK' | 'BREACHED'

## Task Creation

**Bulk Pre-population** (preferred pattern):
```typescript
// Create all workflow tasks upfront
POST /api/taskExecutions/bulk
{
  workflow_id: "uuid",
  tasks: [
    { title: "Extract Documents", agent_id: "iris", sequence_order: 1 },
    { title: "Send Email", agent_id: "mia", sequence_order: 2 }
  ]
}
```

All tasks start as `PENDING` and progress as n8n executes them.

## Status Updates

**From n8n webhooks:**
```typescript
PATCH /api/taskExecutions/{id}
{
  status: "RUNNING",
  started_at: "2024-01-01T12:00:00Z"
}
```

**HIL intervention triggers:**
```typescript
PATCH /api/taskExecutions/{id}  
{
  status: "INTERRUPT",
  interrupt_type: "MANUAL_VERIFICATION",
  error_message: "Document requires human review"
}
```

## SLA Management

**Automatic calculation:**
- `sla_due_at` = `started_at` + `sla_hours`
- Status auto-updates: ON_TIME → AT_RISK → BREACHED
- Background monitor runs every 15 minutes

**SLA breach handling:**
1. Task marked as `BREACHED`
2. HIL notifications created
3. Audit event logged

## HIL Intervention Flow

1. **Agent encounters issue** → Sets task to `INTERRUPT`
2. **HIL receives notification** → Reviews via agent interface
3. **HIL takes action** → Approves/rejects/provides input
4. **Task continues** → Status returns to `RUNNING`

## Frontend Integration

**Task List Component:**
```typescript
<TaskList
  tasks={tasks}
  selectedTask={selectedTask}
  onTaskClick={setSelectedTask}
  progress={workflow.progress}
/>
```

Features:
- Real-time status updates via Supabase subscriptions
- SLA status color coding
- Click to open agent interface for HIL intervention

## Agent Integration

Each task type routes to specific agent interface:
- **Mia**: Email communication tasks
- **Nina**: Counterparty management  
- **Iris**: Document extraction
- **HIL Monitor**: Manual review tasks

## Key Patterns

**Error Handling:**
- Failed tasks don't block workflow
- Retry mechanisms for transient failures
- Clear error messages for HIL intervention

**Performance:**
- Bulk task creation minimizes API calls
- Real-time updates only for active workflows
- Efficient SLA monitoring with database triggers