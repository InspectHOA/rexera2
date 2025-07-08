# Notification System Documentation

## Overview

Rexera 2.0 features a comprehensive notification system that provides both real-time toast notifications and persistent daily notifications to keep HIL operators informed about workflow status changes, task completions, and system events.

## System Architecture

The notification system consists of two complementary subsystems:

### 1. Real-Time Toast Notifications (`useNotifications`)
- **Purpose**: Immediate feedback for real-time events
- **Duration**: Temporary (3-5 seconds)
- **Triggers**: Live database changes via Supabase subscriptions
- **Location**: `frontend/src/lib/hooks/useNotifications.ts`

### 2. Persistent Daily Notifications (`usePersistentNotifications`)
- **Purpose**: Day-long notification history and actionable items
- **Duration**: 24 hours from creation
- **Storage**: `hil_notifications` database table
- **Location**: `frontend/src/lib/hooks/usePersistentNotifications.ts`

## Database Schema

### HIL Notifications Table

```sql
CREATE TABLE hil_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id),
    type notification_type NOT NULL,
    priority priority_level NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    metadata JSONB,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Notification Types

```sql
CREATE TYPE notification_type AS ENUM (
    'WORKFLOW_UPDATE',
    'TASK_INTERRUPT', 
    'HIL_MENTION',
    'CLIENT_MESSAGE_RECEIVED',
    'COUNTERPARTY_MESSAGE_RECEIVED',
    'SLA_WARNING',
    'AGENT_FAILURE'
);
```

### Priority Levels

```sql
CREATE TYPE priority_level AS ENUM (
    'LOW',
    'NORMAL', 
    'HIGH',
    'URGENT'
);
```

## Notification Flow

### 1. Notification Creation

Notifications are created automatically by the system when specific events occur:

```javascript
// Example: Creating an SLA warning notification
await supabase
  .from('hil_notifications')
  .insert({
    user_id: hilOperatorId,
    type: 'SLA_WARNING',
    priority: 'HIGH',
    title: 'SLA Breach Warning',
    message: `Task "${taskTitle}" in workflow ${workflowId} is approaching SLA deadline`,
    action_url: `/workflow/${workflowId}`,
    metadata: {
      workflow_id: workflowId,
      task_id: taskId,
      sla_due_at: slaDueAt
    }
  });
```

### 2. Real-Time Distribution

The notification system uses Supabase real-time subscriptions to instantly deliver notifications:

```javascript
// Subscription in usePersistentNotifications hook
const subscription = supabase
  .channel('user_notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'hil_notifications',
    filter: `user_id=eq.${user.id}`
  }, () => {
    fetchNotifications(); // Refresh notification list
  })
  .subscribe();
```

### 3. Display in UI

Notifications appear in the dashboard header's notification tray:

- **Bell Icon**: Shows unread count badge
- **Notification Tray**: Displays last 10 notifications from today
- **Visual Indicators**: 
  - Blue background for unread notifications
  - Gray background for read notifications
  - Blue dot for unread, gray dot for read

## Key Features

### Persistence
- Notifications remain visible for 24 hours
- Survive browser refreshes and sessions
- Stored in database with full history

### Read Status Management
- Individual notifications can be marked as read
- "Mark all as read" functionality
- Visual distinction between read/unread
- Automatic read tracking with timestamps

### Priority-Based Styling
- Different colors/styles based on priority level
- Urgent notifications get prominent styling
- Critical notifications may trigger additional alerts

### Actionable Notifications
- Each notification can have an `action_url`
- Clicking navigates to relevant workflow/task
- Supports both internal routes and external URLs
- Automatic read-marking on click

### Filtering and Organization
- Only shows notifications from last 24 hours
- Ordered by creation time (newest first)
- Limited to 50 notifications per user for performance
- Real-time updates without page refresh

## Usage Examples

### Creating Workflow Notifications

When a workflow status changes, the system creates notifications for relevant HIL operators:

```javascript
// In n8n webhook or API endpoint
if (workflow.status === 'BLOCKED') {
  await createNotification({
    user_id: workflow.assigned_to,
    type: 'WORKFLOW_UPDATE',
    priority: 'URGENT',
    title: 'Workflow Blocked',
    message: `${workflow.title} is blocked and requires intervention`,
    action_url: `/workflow/${workflow.human_readable_id}`,
    metadata: {
      workflow_id: workflow.id,
      previous_status: previousStatus,
      block_reason: blockReason
    }
  });
}
```

### Creating Task Interrupt Notifications

When a task needs human review:

```javascript
// When task status changes to AWAITING_REVIEW
await createNotification({
  user_id: assignedHilOperator,
  type: 'TASK_INTERRUPT',
  priority: 'HIGH', 
  title: 'Task Requires Review',
  message: `${taskType} in ${workflowId} needs manual review`,
  action_url: `/workflow/${workflowId}`,
  metadata: {
    task_id: taskId,
    task_type: taskType,
    interrupt_reason: interruptReason,
    confidence_score: confidenceScore
  }
});
```

### Creating SLA Notifications

Automated SLA monitoring creates warning notifications:

```javascript
// From SLA monitoring background job
await createNotification({
  user_id: responsibleOperator,
  type: 'SLA_WARNING',
  priority: 'HIGH',
  title: 'SLA Deadline Approaching', 
  message: `Task due in ${hoursRemaining} hours`,
  action_url: `/workflow/${workflowId}`,
  metadata: {
    sla_due_at: slaDueAt,
    hours_remaining: hoursRemaining,
    escalation_level: 'warning'
  }
});
```

## Benefits

### For HIL Operators
- **Never miss important events** - 24-hour persistence ensures visibility
- **Actionable notifications** - Direct links to workflows requiring attention  
- **Read status tracking** - Clear indication of what's been handled
- **Priority awareness** - Visual cues for urgent vs normal notifications
- **Real-time updates** - Instant notifications without page refresh

### For System Operations
- **Audit trail** - Complete history of notifications sent
- **User-specific delivery** - Notifications routed to appropriate operators
- **Metadata tracking** - Rich context for debugging and analytics
- **Scalable architecture** - Efficient real-time subscriptions
- **Reliable delivery** - Database persistence ensures no lost notifications

## Integration Points

### SLA Monitoring
- Background jobs create SLA warning notifications
- Automatic escalation for overdue tasks
- Integration with HIL notification preferences

### Workflow Engine (n8n)
- Workflow status change notifications
- Agent failure notifications  
- Completion and error notifications

### Task Execution System
- Interrupt notifications for manual review
- Task completion confirmations
- Error and retry notifications

### Client Communication
- New message notifications
- Response deadline reminders
- Client portal activity alerts

## Future Enhancements

### Planned Features
- **Email notifications** for urgent items
- **SMS notifications** for critical failures
- **Notification preferences** per user
- **Bulk operations** (mark multiple as read)
- **Search and filtering** within notifications
- **Notification templates** for consistent formatting
- **Integration with external systems** (Slack, Teams)

### Analytics and Reporting
- Notification delivery metrics
- Response time tracking
- HIL operator workload analysis
- SLA breach prevention effectiveness

## Technical Implementation

### Frontend Components
- `DashboardHeader.tsx` - Main notification tray UI
- `usePersistentNotifications.ts` - Data fetching and state management
- `useNotifications.ts` - Real-time toast notifications

### Backend Integration
- `hil_notifications` table for persistence
- Supabase real-time subscriptions for delivery
- Background jobs for automated notification creation

### Performance Considerations
- Efficient querying with time-based filtering
- Real-time subscriptions with user-specific filters
- Pagination for large notification volumes
- Automatic cleanup of old notifications