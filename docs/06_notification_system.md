# Notification System

## Overview

Real-time popup notifications and persistent notification history using [`hil_notifications`](supabase/migrations/20250708000000_stateful_task_execution_schema.sql:422) table and [`useUnifiedNotifications`](frontend/src/lib/hooks/useUnifiedNotifications.ts) hook.

## Database Schema

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

CREATE TYPE notification_type AS ENUM (
    'WORKFLOW_UPDATE',
    'TASK_INTERRUPT', 
    'HIL_MENTION',
    'CLIENT_MESSAGE_RECEIVED',
    'COUNTERPARTY_MESSAGE_RECEIVED',
    'SLA_WARNING',
    'AGENT_FAILURE'
);

CREATE TYPE priority_level AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
```

## Flow

1. **Creation**: n8n webhook creates notifications automatically
2. **Real-time**: Supabase subscription delivers to frontend
3. **Display**: Smart popups + persistent tray + interrupt queue

## Usage

### Frontend Hook

```typescript
const {
  notifications,
  unreadCount,
  loading,
  markAsRead,
  markAllAsRead,
  interruptNotifications
} = useUnifiedNotifications();
```

### Backend Creation

```javascript
await createNotification(
  supabase,
  userId,
  'AGENT_FAILURE',
  'HIGH',
  '💥 Workflow Failed',
  `Workflow ${workflowId} encountered errors`,
  `/workflow/${workflowId}`,
  { workflow_id: workflowId, error: errorDetails }
);
```

## Components

- **Header**: Bell icon with unread count, notification tray
- **Interrupt Queue**: Filters `TASK_INTERRUPT` notifications
- **Smart Popups**: Configurable by priority (default: HIGH/URGENT only)

## Settings

```typescript
interface NotificationSettings {
  showPopupsForUrgent: boolean;    // Default: true
  showPopupsForHigh: boolean;      // Default: true
  showPopupsForNormal: boolean;    // Default: false
  showPopupsForLow: boolean;       // Default: false
  enableTaskInterrupts: boolean;   // Default: true
  enableWorkflowFailures: boolean; // Default: true
  enableSlaWarnings: boolean;      // Default: true
}
```

## Integration

- **n8n webhook**: Auto-creates notifications for workflow/task events
- **HIL Notes**: Creates `HIL_MENTION` notifications when users mention each other
- **24-hour persistence**: Notifications survive browser refreshes
- **Read tracking**: Individual and bulk read status management
- **Action URLs**: Click-to-navigate functionality

## HIL Notes Integration

### Mention Notifications

When a user mentions another user in a HIL note using `@username`, the system:

1. **Creates HIL_MENTION notification**:
   ```sql
   INSERT INTO hil_notifications (user_id, notification_type, title, message, metadata)
   VALUES (mentioned_user_id, 'HIL_MENTION', 'You were mentioned in a note', 
           'John mentioned you in a HIGH priority note', 
           '{"note_id": "note-123", "workflow_id": "workflow-456", "priority": "HIGH"}');
   ```

2. **Real-time delivery**: Supabase subscription delivers to mentioned user immediately

3. **Toast popup**: Shows based on priority settings (URGENT/HIGH by default)

4. **Persistent notification**: Appears in header bell icon until marked as read

### Note Priority Impact

- **URGENT/HIGH**: Toast notifications shown by default
- **NORMAL/LOW**: Silent notifications (header badge only)
- **All priorities**: Appear in notification tray regardless of popup settings

### Distinction from Interrupts

- **HIL_MENTION**: User-to-user communication in notes
- **TASK_INTERRUPT**: Agent-to-HIL system requiring immediate workflow intervention
- **Different queues**: Mentions in general notifications, interrupts in interrupt queue