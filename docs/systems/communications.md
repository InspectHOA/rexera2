# Communications System

## Overview

Manages email communication between the platform, clients, and counterparties with threading, templates, and tracking capabilities.

## Architecture

```
Email Sources               Platform                Email Delivery
┌─────────────┐           ┌─────────────┐          ┌─────────────┐
│ Inbound     │──────────►│ Communication│─────────►│ Outbound    │
│ Emails      │           │ System       │          │ Emails      │
│             │           │              │          │             │
│ Client      │◄──────────│ Threading    │◄─────────│ Templates   │
│ Replies     │           │ & Tracking   │          │ & Routing   │
└─────────────┘           └─────────────┘          └─────────────┘
```

## Database Schema

**Core Table**: `communications`

Key fields:
- `workflow_id`: Associated workflow
- `thread_id`: Email conversation grouping
- `sender_id`: Internal user who sent email
- `recipient_email`: External recipient
- `direction`: 'INBOUND' | 'OUTBOUND'
- `status`: 'SENT' | 'DELIVERED' | 'READ' | 'BOUNCED' | 'FAILED'
- `communication_type`: 'email' | 'sms' | 'phone_call'
- `subject` / `body`: Email content
- `metadata`: Additional context (attachments, etc.)

## Email Threading

**Thread Management:**
- Emails grouped by `thread_id`
- Automatic thread detection via subject/references
- Reply-to handling preserves conversation context

```typescript
// Create email thread
POST /api/communications
{
  workflow_id: "uuid",
  recipient_email: "client@example.com",
  subject: "Document Request - Workflow #1234",
  body: "Please provide...",
  communication_type: "email"
}

// Reply in thread  
POST /api/communications/{id}/reply
{
  body: "Thank you for your response...",
  recipient_email: "client@example.com"
}
```

## Agent Integration

**Mia Email Agent:**
- Drafts emails based on workflow context
- Uses templates for common scenarios
- Handles client communication automatically
- Escalates to HIL when uncertain

```typescript
// Agent interface for email composition
<EmailInterface 
  agentId="mia"
  workflowId={workflowId}
/>
```

## Email Templates

**Template System:**
- Workflow-type specific templates
- Variable substitution (client name, loan number, etc.)
- Approval workflows for sensitive communications

**Common Templates:**
- Document request emails
- Status update notifications  
- Payoff instruction requests
- Completion confirmations

## Tracking & Analytics

**Delivery Tracking:**
- Email sent/delivered/opened status
- Bounce handling and retry logic
- Response time metrics

**Thread Analytics:**
- Communication frequency per workflow
- Average response times
- Escalation patterns to HIL

## API Endpoints

```bash
GET    /api/communications           # List communications
POST   /api/communications           # Send new email
PATCH  /api/communications/{id}      # Update status
POST   /api/communications/{id}/reply    # Reply to thread
POST   /api/communications/{id}/forward  # Forward email
```

## Frontend Components

**Communication Timeline:**
- Chronological view of all workflow communications
- Thread grouping with expand/collapse
- Read/unread status indicators
- Quick reply functionality

**Email Composer:**
- Rich text editor with templates
- Recipient validation
- Attachment handling
- Send/draft/schedule options

## Integration Points

**Workflow Events:**
- Automatic emails on workflow milestones
- Status change notifications to clients
- Document request automation

**External Services:**
- Email service provider integration (SendGrid, etc.)
- Bounce/delivery webhook handling
- Spam filter coordination

## Key Features

- **Thread Continuity**: Maintains conversation context
- **Template System**: Consistent, professional communications
- **Delivery Tracking**: Complete email lifecycle monitoring
- **Agent Automation**: AI-driven email composition and sending
- **HIL Oversight**: Human review for sensitive communications