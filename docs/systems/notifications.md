# Notification System

## Overview

Real-time notification system with toast popups and persistent notification tray for HIL operators.

## Architecture

```
Sources               Delivery              UI
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│ n8n webhooks│─────►│ hil_        │─────►│ Toast +     │
│ HIL mentions│      │ notifications│      │ Bell Icon   │
│ SLA breaches│      │ table       │      │ Tray        │
└─────────────┘      └─────────────┘      └─────────────┘
```

## Notification Types

- **TASK_INTERRUPT**: Agent needs HIL approval
- **HIL_MENTION**: User mentioned in notes (@username)
- **SLA_WARNING**: Task deadline breached
- **WORKFLOW_UPDATE**: Workflow status changes

## Database Schema

```sql
hil_notifications:
- user_id: Target user
- notification_type: Category  
- priority: LOW, NORMAL, HIGH, URGENT
- title/message: Content
- action_url: Click destination
- read_at: Read tracking
```

## Frontend Integration

```typescript
// Hook for notifications
const { notifications, markAsRead } = useUnifiedNotifications();

// Component usage
<NotificationTray notifications={notifications} />
<NotificationToast /> // Auto-shows for HIGH/URGENT
```

## Key Features

- **Real-time delivery** via Supabase subscriptions
- **Priority-based display** (URGENT/HIGH show toasts)
- **24-hour persistence** survives browser refresh
- **Read tracking** individual and bulk operations
- **Action URLs** for click-to-navigate

## HIL Notes Integration

When users mention `@username` in notes:
1. Creates `HIL_MENTION` notification
2. Real-time delivery to mentioned user
3. Toast popup based on note priority
4. Persistent in notification tray

## Notifications Dashboard

Comprehensive interface at `/notifications` for managing all system notifications.

### Features
- **Filtering**: By type, priority, read status
- **Search**: Across title, message, and type
- **Sorting**: By date, priority, type
- **Pagination**: 50 notifications per page
- **Click Navigation**: Auto-mark as read + redirect to workflow

### Component Structure
```
/notifications/
├── page.tsx              # Main dashboard page
├── _components/
│   ├── notifications-stats.tsx     # Metrics display
│   ├── notifications-table.tsx     # Main table
│   ├── notifications-filters.tsx   # Filter controls
│   ├── notification-row.tsx        # Individual rows
│   └── notifications-pagination.tsx # Page controls
```

### Navigation Access
- Notification bell dropdown "View all" link
- Clickable logo returns to workflows dashboard from any page
- Breadcrumb navigation: "Workflows / [Current Page]"
- Supports future pages: Notifications, SLA Breaches, etc.

## Settings

Users can configure:
- Toast display preferences by type
- Priority thresholds for popups
- Auto-read timeouts