# HIL Notes System

## Overview

Collaborative note-taking system for HIL operators with threaded conversations, user mentions, priority levels, and real-time notifications.

## Architecture

```
Note Creation            Notification System        Real-time Updates
┌─────────────┐         ┌─────────────┐            ┌─────────────┐
│ User types  │────────►│ @mention    │───────────►│ Live        │
│ @username   │         │ detection   │            │ notifications│
│ in note     │         │             │            │             │
└─────────────┘         │ HIL_MENTION │◄───────────│ Supabase    │
                        │ notification│            │ subscriptions│
                        └─────────────┘            └─────────────┘
```

## Database Schema

**Core Table**: `hil_notes`

Key fields:
- `workflow_id`: Associated workflow
- `author_id`: User who created the note
- `content`: Note text with @mentions
- `priority`: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
- `is_resolved`: Resolution status
- `parent_note_id`: For threaded conversations (nullable)
- `mentions`: Array of mentioned user IDs
- `created_at` / `updated_at`: Timestamps

## Features

### Threaded Conversations
- **Parent-child relationships** via `parent_note_id`
- **Nested replies** for organized discussions
- **Thread resolution** tracking

### User Mentions
- **@username autocomplete** in note composer
- **Real-time notifications** to mentioned users
- **Automatic mention detection** and user ID extraction

### Priority System
- **Visual indicators** (colors, icons) by priority
- **Notification behavior** based on priority:
  - **URGENT/HIGH**: Toast notifications by default
  - **NORMAL/LOW**: Silent notifications (badge only)

### Resolution Tracking
- **Mark notes as resolved/unresolved**
- **Filter by resolution status**
- **Automatic resolution** workflows

## API Usage

**Create Note with Mentions:**
```typescript
POST /api/hil-notes
{
  workflow_id: "uuid",
  content: "@john.doe Please review this case - urgent!",
  priority: "URGENT",
  mentions: ["user-uuid-for-john-doe"]
}
```

**Reply to Note:**
```typescript
POST /api/hil-notes/{id}/reply
{
  content: "I'll review this right away, @jane.smith can you assist?",
  mentions: ["user-uuid-for-jane-smith"]
}
```

**Update Note Status:**
```typescript
PATCH /api/hil-notes/{id}
{
  is_resolved: true,
  content: "Updated content..."
}
```

## Frontend Integration

**Notes Tab Component:**
```typescript
<NotesTab workflowId={workflowId} />
```

Features:
- **Rich text editor** with @mention autocomplete
- **Priority selection** dropdown
- **Threaded display** with expand/collapse
- **Real-time updates** via Supabase subscriptions
- **Resolution controls** for note management

**Mention Input Component:**
```typescript
<MentionInput
  value={content}
  onChange={setContent}
  onMentionSelect={(users) => setMentions(users)}
  placeholder="Type @ to mention users..."
/>
```

## Notification Flow

1. **User mentions @username** in note content
2. **System detects mention** and extracts user ID
3. **Creates HIL_MENTION notification** for mentioned user
4. **Real-time delivery** via Supabase subscription
5. **Toast notification** appears (based on priority settings)
6. **Persistent notification** in header bell icon

## Real-time Features

**Live Collaboration:**
- **New notes** appear instantly for all users
- **Edit indicators** show when someone is typing
- **Resolution updates** sync across sessions
- **Mention notifications** delivered immediately

## Integration with Notifications

**Notification Types:**
- **HIL_MENTION**: User mentioned in note
- **Priority-based display**: URGENT/HIGH show toasts
- **Workflow context**: Links back to specific workflow

**Settings Integration:**
- Users can configure mention notification preferences
- Priority thresholds for toast display
- Quiet hours and notification filtering

## API Endpoints

```bash
GET    /api/hil-notes              # List notes for workflow
POST   /api/hil-notes              # Create note
PATCH  /api/hil-notes/{id}         # Update note
DELETE /api/hil-notes/{id}         # Delete note (author only)
POST   /api/hil-notes/{id}/reply   # Reply to note
```

## Key Features

- **@mention autocomplete** with user search
- **Threaded conversations** for organized discussions
- **Priority-based notifications** for urgent items
- **Real-time collaboration** via live updates
- **Resolution tracking** for workflow progress
- **Audit integration** logs all note activities
- **Permission controls** (only author can edit/delete)