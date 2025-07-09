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
- **24-hour persistence**: Notifications survive browser refreshes
- **Read tracking**: Individual and bulk read status management
- **Action URLs**: Click-to-navigate functionality