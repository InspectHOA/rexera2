# 12_API_EXAMPLES.md

<!-- 
This document provides comprehensive API usage examples for Rexera 2.0's unified endpoint architecture, demonstrating real-world scenarios and best practices for the simplified 12-endpoint design.
-->

## API Examples Overview

This document demonstrates how to use Rexera 2.0's **unified API architecture** with real-world examples. The simplified 12-endpoint design reduces complexity while maintaining full functionality through consistent patterns.

### API Architecture Pattern

Rexera 2.0 uses a **Resources + Actions + Views + Events** pattern:

- **Resources (5)**: Core CRUD operations for workflows, tasks, communications, documents, counterparties
- **Actions (2)**: State-changing operations on workflows and tasks  
- **Views (4)**: Optimized read-only endpoints for dashboard, performance, SLA, notifications
- **Events (3)**: Real-time WebSocket channels for live updates

---

## Example Index

### Communication Examples
- [1.1 Agent Creating Draft Email Reply](#11-agent-creating-draft-email-reply)
- [1.2 HIL Reviewing and Sending Draft](#12-hil-reviewing-and-sending-draft)  
- [1.3 Auto-Send Email for Trusted Agents](#13-auto-send-email-for-trusted-agents)
- [1.4 Retrieving Email Thread History](#14-retrieving-email-thread-history)

### Workflow Examples
- [2.1 Creating New Workflow with Contacts](#21-creating-new-workflow-with-contacts)
- [2.2 Managing Workflow Contacts](#22-managing-workflow-contacts)
- [2.3 Contact Notifications](#23-contact-notifications)
- [2.4 Dashboard Data Loading](#24-dashboard-data-loading) *(Coming Soon)*

### Task Examples  
- [3.1 Agent Context Gathering](#31-agent-context-gathering)
- [3.2 Agent Task Coordination](#32-agent-task-coordination) *(Coming Soon)*

### Document Examples
- [4.1 File Upload and Processing](#41-file-upload-and-processing) *(Coming Soon)*
- [4.2 Workflow Deliverables](#42-workflow-deliverables) *(Coming Soon)*

### Real-time Examples
- [5.1 WebSocket Event Handling](#51-websocket-event-handling) *(Coming Soon)*
- [5.2 Live Status Updates](#52-live-status-updates) *(Coming Soon)*

---

## 1. Communication Examples

### 1.1 Agent Creating Draft Email Reply

**Scenario**: An AI agent (Mia 📧) needs to create a draft reply to an existing email in a workflow's email thread for HIL review before sending.

#### API Call

```typescript
POST /api/communications
Content-Type: application/json
Authorization: Bearer <agent-jwt-token>

{
  "type": "email",
  "workflowId": "wf-123",
  "taskId": "task-456",
  "subject": "Re: HOA Document Request - 123 Main St",
  "content": "Thank you for your email. We have received your HOA documents and are currently processing them. We'll have the analysis completed within 24 hours.",
  "status": "DRAFT",
  "isClientVisible": false,
  "isInternal": false,
  "participants": [
    {
      "email": "manager@paradise.com",
      "name": "Paradise Property Management", 
      "role": "recipient"
    },
    {
      "email": "agent@rexera.com",
      "name": "Rexera Agent",
      "role": "sender"
    }
  ],
  "metadata": {
    "messageId": "<draft-789@rexera.com>",
    "inReplyTo": "<original-123@paradise.com>",
    "emailThreadId": "thread-abc-123",
    "subject": "Re: HOA Document Request - 123 Main St",
    "recipients": {
      "to": ["manager@paradise.com"],
      "cc": [],
      "bcc": []
    },
    "attachments": [],
    "deliveryStatus": "draft"
  }
}
```

#### Response

```typescript
HTTP/1.1 201 Created
Content-Type: application/json

{
  "success": true,
  "data": {
    "id": "comm-draft-789",
    "type": "email",
    "workflowId": "wf-123",
    "taskId": "task-456",
    "status": "DRAFT",
    "subject": "Re: HOA Document Request - 123 Main St",
    "content": "Thank you for your email. We have received your HOA documents...",
    "isClientVisible": false,
    "isInternal": false,
    "participants": [...],
    "metadata": {
      "messageId": "<draft-789@rexera.com>",
      "inReplyTo": "<original-123@paradise.com>",
      "emailThreadId": "thread-abc-123",
      "recipients": {...},
      "deliveryStatus": "draft"
    },
    "createdAt": "2025-01-02T10:30:00Z",
    "updatedAt": "2025-01-02T10:30:00Z",
    "isDraft": true
  }
}
```

#### Database Storage

```sql
-- Main communication record
INSERT INTO communications (
  id, workflow_id, task_id, type, subject, content, 
  status, participants, is_client_visible, is_internal,
  email_thread_id, created_at
) VALUES (
  'comm-draft-789', 'wf-123', 'task-456', 'email',
  'Re: HOA Document Request - 123 Main St',
  'Thank you for your email. We have received your HOA documents...',
  'DRAFT',
  '[{"email": "manager@paradise.com", "role": "recipient"}]'::jsonb,
  false, false, 'thread-abc-123', NOW()
);

-- Email-specific metadata
INSERT INTO email_metadata (
  communication_id, message_id, in_reply_to, 
  subject, to_addresses, delivery_status
) VALUES (
  'comm-draft-789',
  '<draft-789@rexera.com>',
  '<original-123@paradise.com>',
  'Re: HOA Document Request - 123 Main St',
  ARRAY['manager@paradise.com'],
  'draft'
);

-- Automatic audit log entry
INSERT INTO audit_events (
  actor_type, actor_id, event_type, action, 
  resource_type, resource_id, workflow_id, event_data
) VALUES (
  'agent', 'mia', 'communication.created', 'create',
  'communication', 'comm-draft-789', 'wf-123',
  '{"communicationType": "email", "status": "draft", "agentConfidence": 0.95}'::jsonb
);
```

---

### 1.2 HIL Reviewing and Sending Draft

**Scenario**: A HIL operator reviews the agent's draft email, makes modifications, and approves it for sending.

#### Step 1: HIL Views Draft

```typescript
GET /api/communications?workflowId=wf-123&includeDrafts=true
Authorization: Bearer <hil-jwt-token>
```

#### Response: Draft in Communication List

```typescript
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "communications": [
      {
        "id": "comm-draft-789",
        "type": "email",
        "status": "DRAFT",
        "subject": "Re: HOA Document Request - 123 Main St",
        "content": "Thank you for your email. We have received your HOA documents and are currently processing them. We'll have the analysis completed within 24 hours.",
        "isClientVisible": false,
        "participants": [...],
        "metadata": {
          "messageId": "<draft-789@rexera.com>",
          "inReplyTo": "<original-123@paradise.com>",
          "emailThreadId": "thread-abc-123",
          "recipients": {...},
          "deliveryStatus": "draft"
        },
        "createdAt": "2025-01-02T10:30:00Z",
        "isDraft": true,
        "needsReview": true
      }
    ],
    "pagination": {
      "total": 1,
      "limit": 50,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

#### Step 2: HIL Approves and Sends

```typescript
POST /api/communications/comm-draft-789/actions
Content-Type: application/json
Authorization: Bearer <hil-jwt-token>

{
  "action": "send",
  "data": {
    "approvedBy": "hil-user-123",
    "modifications": {
      "content": "Thank you for your email. We have received your HOA documents and are currently processing them. We'll have the analysis completed within 24 hours.\n\nBest regards,\nRexera Team"
    },
    "sendImmediately": true
  }
}
```

#### Response: Send Confirmation

```typescript
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "action": "send",
    "communicationId": "comm-draft-789",
    "status": "SENT",
    "sentAt": "2025-01-02T10:35:00Z",
    "approvedBy": "hil-user-123",
    "modifications": {
      "content": "Thank you for your email..."
    },
    "deliveryTracking": {
      "messageId": "<sent-789@rexera.com>",
      "deliveryStatus": "sent",
      "estimatedDelivery": "2025-01-02T10:36:00Z"
    }
  }
}
```

#### Database Updates

```sql
-- Update communication status
UPDATE communications 
SET 
  status = 'SENT',
  content = 'Thank you for your email. We have received your HOA documents and are currently processing them. We''ll have the analysis completed within 24 hours.\n\nBest regards,\nRexera Team',
  is_client_visible = true,
  updated_at = NOW()
WHERE id = 'comm-draft-789';

-- Update email metadata
UPDATE email_metadata 
SET 
  delivery_status = 'sent',
  sent_at = NOW()
WHERE communication_id = 'comm-draft-789';

-- Log the action
INSERT INTO communication_actions (
  communication_id, action_type, performed_by, 
  action_data, created_at
) VALUES (
  'comm-draft-789', 'send', 'hil-user-123',
  '{"originalDraft": true, "approvedBy": "hil-user-123", "modifications": {"content": "..."}}'::jsonb,
  NOW()
);
```

---

### 1.3 Auto-Send Email for Trusted Agents

**Scenario**: A highly trusted agent with high confidence score sends an email immediately without HIL review.

#### API Call

```typescript
POST /api/communications
Content-Type: application/json
Authorization: Bearer <agent-jwt-token>

{
  "type": "email",
  "workflowId": "wf-123",
  "taskId": "task-457",
  "subject": "HOA Document Analysis Complete - 123 Main St",
  "content": "Your HOA document analysis is now complete. Please find the detailed report attached.",
  "status": "SENT",
  "isClientVisible": true,
  "isInternal": false,
  "autoSend": true,
  "agentConfidence": 0.95,
  "participants": [
    {
      "email": "client@example.com",
      "name": "John Doe",
      "role": "client"
    }
  ],
  "metadata": {
    "messageId": "<auto-send-790@rexera.com>",
    "inReplyTo": null,
    "emailThreadId": "thread-abc-123",
    "subject": "HOA Document Analysis Complete - 123 Main St",
    "recipients": {
      "to": ["client@example.com"],
      "cc": ["manager@rexera.com"],
      "bcc": []
    },
    "attachments": [
      {
        "filename": "hoa_analysis_report.pdf",
        "size": 245760,
        "type": "application/pdf",
        "url": "/documents/hoa-analysis-123.pdf"
      }
    ],
    "deliveryStatus": "sent"
  }
}
```

#### Response

```typescript
HTTP/1.1 201 Created
Content-Type: application/json

{
  "success": true,
  "data": {
    "id": "comm-auto-790",
    "type": "email",
    "status": "SENT",
    "autoSent": true,
    "agentConfidence": 0.95,
    "sentAt": "2025-01-02T11:00:00Z",
    "deliveryTracking": {
      "messageId": "<auto-send-790@rexera.com>",
      "deliveryStatus": "sent",
      "trackingEnabled": true
    },
    "subject": "HOA Document Analysis Complete - 123 Main St",
    "recipients": ["client@example.com"],
    "attachments": [
      {
        "filename": "hoa_analysis_report.pdf",
        "size": 245760,
        "url": "/documents/hoa-analysis-123.pdf"
      }
    ]
  }
}
```

---

### 1.4 Retrieving Email Thread History

**Scenario**: Get complete email thread history for a workflow, including all sent emails and current drafts.

#### Query All Communications in Thread

```typescript
GET /api/communications?emailThreadId=thread-abc-123&includeDrafts=true&orderBy=createdAt&order=asc
Authorization: Bearer <hil-jwt-token>
```

#### Response: Complete Thread History

```typescript
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "communications": [
      {
        "id": "comm-original-123",
        "type": "email",
        "status": "RECEIVED",
        "subject": "HOA Document Request - 123 Main St",
        "content": "We need the HOA documents for 123 Main St...",
        "isClientVisible": true,
        "metadata": {
          "messageId": "<original-123@paradise.com>",
          "emailThreadId": "thread-abc-123",
          "from": "manager@paradise.com",
          "deliveryStatus": "received"
        },
        "createdAt": "2025-01-02T09:00:00Z",
        "isDraft": false
      },
      {
        "id": "comm-draft-789",
        "type": "email", 
        "status": "SENT",
        "subject": "Re: HOA Document Request - 123 Main St",
        "content": "Thank you for your email. We have received your HOA documents...",
        "isClientVisible": true,
        "metadata": {
          "messageId": "<sent-789@rexera.com>",
          "inReplyTo": "<original-123@paradise.com>",
          "emailThreadId": "thread-abc-123",
          "deliveryStatus": "delivered"
        },
        "createdAt": "2025-01-02T10:30:00Z",
        "sentAt": "2025-01-02T10:35:00Z",
        "isDraft": false,
        "approvedBy": "hil-user-123"
      },
      {
        "id": "comm-auto-790",
        "type": "email",
        "status": "SENT", 
        "subject": "HOA Document Analysis Complete - 123 Main St",
        "content": "Your HOA document analysis is now complete...",
        "isClientVisible": true,
        "autoSent": true,
        "agentConfidence": 0.95,
        "metadata": {
          "messageId": "<auto-send-790@rexera.com>",
          "emailThreadId": "thread-abc-123",
          "deliveryStatus": "delivered",
          "attachments": [...]
        },
        "createdAt": "2025-01-02T11:00:00Z",
        "sentAt": "2025-01-02T11:00:00Z",
        "isDraft": false
      }
    ],
    "pagination": {
      "total": 3,
      "limit": 50,
      "offset": 0,
      "hasMore": false
    },
    "threadInfo": {
      "threadId": "thread-abc-123",
      "workflowId": "wf-123",
      "totalMessages": 3,
      "lastActivity": "2025-01-02T11:00:00Z",
      "participants": [
        "manager@paradise.com",
        "client@example.com", 
        "agent@rexera.com"
      ]
    }
  }
}
```

#### Query Patterns for Different Use Cases

```typescript
// Get only client-visible emails (external client view)
GET /api/communications?workflowId=wf-123&isClientVisible=true

// Get all drafts pending HIL review
GET /api/communications?status=DRAFT&assignedTo=hil-user-123

// Get recent communications across all workflows
GET /api/communications?createdAfter=2025-01-02T00:00:00Z&limit=20

// Get communications by type
GET /api/communications?type=email&workflowId=wf-123
GET /api/communications?type=call&workflowId=wf-123
GET /api/communications?type=message&workflowId=wf-123
```

---

## Benefits of Unified Communication API

### 1. **Simplified Integration**
- Single endpoint for all communication types (email, calls, messages, SMS)
- Consistent request/response patterns across all communication methods
- Unified status and metadata handling

### 2. **Type Safety & Performance**  
- Email-specific metadata stored in optimized `email_metadata` table
- Strong TypeScript interfaces for all communication types
- Optimized database queries with type-specific indexes

### 3. **Flexible Workflow Support**
- Draft → Review → Send pattern for sensitive communications
- Auto-send for trusted agents with high confidence scores
- Complete audit trail of all communication actions

### 4. **Real-time Capabilities**
- Live updates via WebSocket when drafts are created or sent
- Real-time notification to HIL operators for review
- Client notifications when communications are sent

### 5. **Thread Management**
- Proper email threading with Message-ID and In-Reply-To headers
- Cross-communication type threading (email → call → message in same workflow)
- Complete conversation history for each workflow

---

## 2. Workflow Examples

### 2.1 Creating New Workflow with Contacts

**Scenario**: Create a new Payoff workflow and immediately add all relevant contacts (buyer, title officer, loan officer) with their notification preferences.

#### Step 1: Create Workflow

```typescript
POST /api/workflows
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "type": "PAYOFF",
  "payload": {
    "propertyAddress": "123 Main Street, Anytown, CA 90210",
    "closingDate": "2025-07-15T00:00:00Z",
    "urgency": "HIGH",
    "buyerName": "John and Jane Doe",
    "lenderName": "ABC Mortgage Company",
    "loanNumber": "LOAN-789456123",
    "currentBalance": 245750.00,
    "communicationPreference": "email",
    "requestedDocuments": ["payoff_statement", "per_diem_rate"]
  },
  "clientId": "client-123",
  "assignedHilId": "hil-user-456"
}
```

#### Response: Workflow Created

```typescript
HTTP/1.1 201 Created
Content-Type: application/json

{
  "success": true,
  "data": {
    "id": "wf-payoff-789",
    "type": "PAYOFF",
    "status": "PENDING",
    "payload": {
      "propertyAddress": "123 Main Street, Anytown, CA 90210",
      "closingDate": "2025-07-15T00:00:00Z",
      "urgency": "HIGH",
      "buyerName": "John and Jane Doe",
      "lenderName": "ABC Mortgage Company",
      "loanNumber": "LOAN-789456123",
      "currentBalance": 245750.00,
      "communicationPreference": "email",
      "requestedDocuments": ["payoff_statement", "per_diem_rate"]
    },
    "clientId": "client-123",
    "assignedHilId": "hil-user-456",
    "createdAt": "2025-01-02T15:00:00Z",
    "updatedAt": "2025-01-02T15:00:00Z"
  }
}
```

#### Step 2: Add Workflow Contacts

```typescript
// Add buyer contact
POST /api/workflow-contacts
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "workflowId": "wf-payoff-789",
  "label": "buyer",
  "name": "John and Jane Doe",
  "email": "johndoe@email.com",
  "phone": "+1-555-0123",
  "notificationPreferences": {
    "notifyOnStatusChange": true,
    "notifyOnCompletion": true,
    "notifyOnIssues": true,
    "notifyOnDocuments": false,
    "notificationMethod": "both"
  },
  "isPrimary": true,
  "preferredContactTime": "business_hours",
  "timezone": "America/Los_Angeles"
}
```

```typescript
// Add title officer contact
POST /api/workflow-contacts
Content-Type: application/json

{
  "workflowId": "wf-payoff-789",
  "label": "title_officer",
  "name": "Sarah Smith",
  "email": "sarah@reliabletitle.com",
  "phone": "+1-555-0456",
  "company": "Reliable Title Company",
  "role": "Senior Title Officer",
  "notificationPreferences": {
    "notifyOnStatusChange": false,
    "notifyOnCompletion": true,
    "notifyOnIssues": true,
    "notifyOnDocuments": true,
    "notificationMethod": "email"
  },
  "preferredContactTime": "business_hours",
  "notes": "Prefers email communication, handles commercial and residential transactions"
}
```

```typescript
// Add loan officer contact
POST /api/workflow-contacts
Content-Type: application/json

{
  "workflowId": "wf-payoff-789",
  "label": "loan_officer",
  "name": "Mike Johnson",
  "email": "mjohnson@abcmortgage.com",
  "phone": "+1-555-0789",
  "company": "ABC Mortgage Company",
  "role": "Senior Loan Officer",
  "notificationPreferences": {
    "notifyOnStatusChange": false,
    "notifyOnCompletion": true,
    "notifyOnIssues": true,
    "notifyOnDocuments": false,
    "notificationMethod": "email"
  },
  "notes": "Available Mon-Fri 9-5 EST, extension 245"
}
```

### 2.2 Managing Workflow Contacts

**Scenario**: Retrieve, update, and manage contacts for an existing workflow.

#### Get All Contacts for Workflow

```typescript
GET /api/workflow-contacts?workflowId=wf-payoff-789
Authorization: Bearer <jwt-token>
```

#### Response: Organized Contact Data

```typescript
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "contacts": [
      {
        "id": "wc-buyer-123",
        "workflowId": "wf-payoff-789",
        "label": "buyer",
        "name": "John and Jane Doe",
        "email": "johndoe@email.com",
        "phone": "+1-555-0123",
        "notifyOnStatusChange": true,
        "notifyOnCompletion": true,
        "notifyOnIssues": true,
        "notifyOnDocuments": false,
        "notificationMethod": "both",
        "isPrimary": true,
        "preferredContactTime": "business_hours",
        "timezone": "America/Los_Angeles",
        "createdAt": "2025-01-02T15:05:00Z"
      },
      {
        "id": "wc-title-456",
        "workflowId": "wf-payoff-789",
        "label": "title_officer",
        "name": "Sarah Smith",
        "email": "sarah@reliabletitle.com",
        "phone": "+1-555-0456",
        "company": "Reliable Title Company",
        "role": "Senior Title Officer",
        "notifyOnStatusChange": false,
        "notifyOnCompletion": true,
        "notifyOnIssues": true,
        "notifyOnDocuments": true,
        "notificationMethod": "email",
        "preferredContactTime": "business_hours",
        "notes": "Prefers email communication, handles commercial and residential transactions",
        "createdAt": "2025-01-02T15:06:00Z"
      },
      {
        "id": "wc-loan-789",
        "workflowId": "wf-payoff-789",
        "label": "loan_officer",
        "name": "Mike Johnson",
        "email": "mjohnson@abcmortgage.com",
        "phone": "+1-555-0789",
        "company": "ABC Mortgage Company",
        "role": "Senior Loan Officer",
        "notifyOnStatusChange": false,
        "notifyOnCompletion": true,
        "notifyOnIssues": true,
        "notifyOnDocuments": false,
        "notificationMethod": "email",
        "notes": "Available Mon-Fri 9-5 EST, extension 245",
        "createdAt": "2025-01-02T15:07:00Z"
      }
    ],
    "contactsByLabel": {
      "buyer": [{
        "id": "wc-buyer-123",
        "name": "John and Jane Doe",
        "email": "johndoe@email.com",
        "isPrimary": true
      }],
      "title_officer": [{
        "id": "wc-title-456",
        "name": "Sarah Smith",
        "email": "sarah@reliabletitle.com",
        "company": "Reliable Title Company"
      }],
      "loan_officer": [{
        "id": "wc-loan-789",
        "name": "Mike Johnson",
        "email": "mjohnson@abcmortgage.com",
        "company": "ABC Mortgage Company"
      }]
    },
    "primaryContacts": {
      "buyer": {
        "id": "wc-buyer-123",
        "name": "John and Jane Doe",
        "email": "johndoe@email.com"
      }
    }
  }
}
```

#### Update Contact Information

```typescript
PATCH /api/workflow-contacts/wc-title-456
Content-Type: application/json

{
  "phone": "+1-555-0456-ext-123",
  "notificationPreferences": {
    "notifyOnStatusChange": true,
    "notifyOnDocuments": true
  },
  "notes": "Updated: Now wants status change notifications. Extension 123 for direct line."
}
```

### 2.3 Contact Notifications

**Scenario**: Workflow status changes and system automatically notifies relevant contacts based on their preferences.

#### Trigger: Workflow Status Change

```typescript
// System automatically identifies contacts to notify when workflow status changes
// This happens internally when workflow status updates

POST /api/workflows/wf-payoff-789/actions
Content-Type: application/json

{
  "action": "update_status",
  "data": {
    "newStatus": "IN_PROGRESS",
    "statusMessage": "Payoff request has been sent to lender. Awaiting response.",
    "estimatedCompletion": "2025-01-04T17:00:00Z"
  }
}
```

#### Automatic Notification Processing

```typescript
// System automatically processes notifications
// POST /api/workflow-contacts/notify (internal)
{
  "workflowId": "wf-payoff-789",
  "notificationType": "status_change",
  "message": "Your payoff request for 123 Main Street is now in progress. We have contacted ABC Mortgage Company and expect to receive the payoff statement within 24-48 hours.",
  "metadata": {
    "workflowTitle": "Payoff Request - 123 Main Street",
    "newStatus": "IN_PROGRESS",
    "propertyAddress": "123 Main Street, Anytown, CA 90210",
    "estimatedCompletion": "2025-01-04T17:00:00Z"
  },
  "recipientFilters": {
    "notifyOnStatusChange": true,
    "notificationMethod": ["email", "sms", "both"]
  }
}
```

#### Notification Results

```typescript
// System response showing who was notified
{
  "success": true,
  "data": {
    "workflowId": "wf-payoff-789",
    "notificationType": "status_change",
    "recipientsNotified": [
      {
        "contactId": "wc-buyer-123",
        "name": "John and Jane Doe",
        "label": "buyer",
        "methods": ["email", "sms"],
        "emailSent": true,
        "smsSent": true,
        "sentAt": "2025-01-02T16:30:00Z"
      }
    ],
    "recipientsSkipped": [
      {
        "contactId": "wc-title-456",
        "name": "Sarah Smith",
        "label": "title_officer",
        "reason": "notifyOnStatusChange is false"
      },
      {
        "contactId": "wc-loan-789",
        "name": "Mike Johnson",
        "label": "loan_officer",
        "reason": "notifyOnStatusChange is false"
      }
    ],
    "totalSent": 2,
    "totalSkipped": 2
  }
}
```

#### Manual Contact Notification

```typescript
// Manually notify specific contact types
POST /api/workflow-contacts/notify
Content-Type: application/json

{
  "workflowId": "wf-payoff-789",
  "contactLabels": ["title_officer", "loan_officer"],
  "notificationType": "documents",
  "message": "The payoff statement for 123 Main Street has been received and is ready for review.",
  "metadata": {
    "documentNames": ["payoff_statement.pdf", "per_diem_calculation.pdf"],
    "documentUrls": [
      "/documents/payoff-statement-wf789.pdf",
      "/documents/per-diem-wf789.pdf"
    ]
  },
  "forceNotify": true // Override individual notification preferences
}
```

---

## Benefits of Workflow Contacts Integration

### 🎯 **Targeted Communication**
- **Role-based notifications** - Only relevant people get notified
- **Preference-driven delivery** - Email, SMS, or both based on contact preferences
- **Time-aware delivery** - Respects preferred contact times and timezones

### 🔄 **Workflow Integration**
- **Automatic triggers** - Notifications sent based on workflow events
- **Status-aware messaging** - Different messages for different workflow states
- **Document notifications** - Alerts when deliverables are ready

### 📱 **Multi-channel Delivery**
- **Email notifications** with rich HTML content and attachments
- **SMS alerts** for urgent updates and status changes
- **Combined delivery** for critical communications

### 👥 **Stakeholder Management**
- **Clear role definition** - title officer, buyer, loan officer, etc.
- **Primary contact designation** - One main contact per role
- **Company tracking** - Know which organizations are involved

### 🔧 **Developer-Friendly**
- **Simple REST API** - Standard CRUD operations
- **Consistent patterns** - Same API structure as other resources
- **Type-safe interfaces** - Full TypeScript support
- **Flexible querying** - Filter by workflow, label, notification preferences

This workflow contacts system seamlessly integrates with the unified API architecture while providing powerful stakeholder management and automated notification capabilities!

---

## 3. Task Examples

### 3.1 Agent Context Gathering

**Scenario**: Agent Mia 📧 receives a task to reply to an email, but needs complete workflow context to craft an appropriate response.

#### Step 1: Agent Gets Task Assignment

```typescript
// n8n calls Mia with task assignment
POST https://api.rexera-agents.com/mia/execute-task
Content-Type: application/json
Authorization: Bearer <agent-api-key>

{
  "taskId": "task-reply-456",
  "workflowId": "wf-payoff-789",
  "agentName": "mia",
  "taskType": "email_reply",
  "payload": {
    "originalEmailId": "comm-inbound-123",
    "instruction": "Send professional reply requesting payoff statement",
    "urgency": "HIGH"
  }
}
```

#### Step 2: Agent Gathers Complete Workflow Context

```typescript
// Mia calls Agent Tools API to get full context
GET /api/agent-tools/workflow-data?workflowId=wf-payoff-789&agentName=mia
Authorization: Bearer <agent-api-key>
X-Agent-Name: mia
X-Workflow-ID: wf-payoff-789
```

#### Response: Complete Workflow Context

```typescript
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "workflow": {
      "id": "wf-payoff-789",
      "type": "PAYOFF",
      "status": "IN_PROGRESS",
      "payload": {
        "propertyAddress": "123 Main Street, Anytown, CA 90210",
        "closingDate": "2025-07-15T00:00:00Z",
        "urgency": "HIGH",
        "buyerName": "John and Jane Doe",
        "lenderName": "ABC Mortgage Company",
        "loanNumber": "LOAN-789456123",
        "currentBalance": 245750.00
      }
    },
    "tasks": [
      {
        "id": "task-reply-456",
        "taskType": "email_reply",
        "status": "PENDING",
        "agentInput": {
          "originalEmailId": "comm-inbound-123",
          "instruction": "Send professional reply requesting payoff statement"
        }
      }
    ],
    "communications": [
      {
        "id": "comm-inbound-123",
        "type": "email",
        "subject": "Payoff Information Request",
        "content": "We need the payoff statement for loan LOAN-789456123 for property at 123 Main Street. Closing is scheduled for July 15th.",
        "participants": [
          {
            "email": "payoffs@abcmortgage.com",
            "name": "ABC Mortgage Payoff Department",
            "role": "sender"
          }
        ],
        "createdAt": "2025-01-02T14:30:00Z"
      }
    ],
    "documents": [
      {
        "id": "doc-purchase-101",
        "filename": "purchase_agreement.pdf",
        "documentType": "WORKING",
        "url": "/documents/secure/doc-purchase-101"
      }
    ],
    "counterparties": [
      {
        "id": "cp-abc-mortgage",
        "type": "lender",
        "name": "ABC Mortgage Company",
        "email": "payoffs@abcmortgage.com",
        "phone": "(555) 123-4567"
      }
    ],
    "workflowContacts": [
      {
        "id": "wc-buyer-303",
        "label": "buyer",
        "name": "John and Jane Doe",
        "email": "johndoe@email.com",
        "notificationMethod": "both"
      },
      {
        "id": "wc-title-456",
        "label": "title_officer",
        "name": "Sarah Smith",
        "email": "sarah@reliabletitle.com",
        "notificationMethod": "email"
      }
    ]
  }
}
```

#### Step 3: Agent Accesses Related Documents (if needed)

```typescript
// Mia gets document content for additional context
GET /api/agent-tools/document?workflowId=wf-payoff-789&documentId=doc-purchase-101&agentName=mia
Authorization: Bearer <agent-api-key>
X-Agent-Name: mia
X-Workflow-ID: wf-payoff-789
```

#### Response: Document Content

```typescript
{
  "success": true,
  "data": {
    "document": {
      "id": "doc-purchase-101",
      "filename": "purchase_agreement.pdf",
      "extractedText": "PURCHASE AGREEMENT\nProperty: 123 Main Street, Anytown, CA 90210\nBuyer: John and Jane Doe\nLoan Amount: $245,750.00\nClosing Date: July 15, 2025...",
      "metadata": {
        "pages": 12,
        "fileSize": 587264,
        "mimeType": "application/pdf"
      }
    }
  }
}
```

#### Step 4: Agent Learns from Similar Past Workflows

```typescript
// Mia checks successful patterns from similar workflows
GET /api/agent-tools/similar-workflows?workflowId=wf-payoff-789&workflowType=PAYOFF&limit=3
Authorization: Bearer <agent-api-key>
X-Agent-Name: mia
```

#### Response: Learning from Past Success

```typescript
{
  "success": true,
  "data": {
    "similarWorkflows": [
      {
        "id": "wf-payoff-100",
        "type": "PAYOFF",
        "status": "COMPLETED",
        "payload": {
          "lenderName": "ABC Mortgage Company",
          "propertyAddress": "456 Oak Street"
        },
        "successfulApproach": {
          "emailTemplate": "formal_payoff_request",
          "contactMethod": "email",
          "avgResponseTime": "4 hours",
          "keyElements": [
            "Include loan number",
            "Specify closing date",
            "Request per diem rate",
            "CC title officer"
          ]
        }
      }
    ]
  }
}
```

#### Step 5: Agent Crafts Informed Response

With complete context, Mia creates a professional, contextually-aware email:

```typescript
// Mia creates draft email with full context
POST /api/communications
Authorization: Bearer <agent-api-key>

{
  "type": "email",
  "workflowId": "wf-payoff-789",
  "taskId": "task-reply-456",
  "subject": "Re: Payoff Information Request - 123 Main Street (LOAN-789456123)",
  "content": "Dear ABC Mortgage Payoff Department,\n\nThank you for your email regarding the payoff statement for loan number LOAN-789456123.\n\nWe confirm the following details for this urgent payoff request:\n\n• Property Address: 123 Main Street, Anytown, CA 90210\n• Borrower: John and Jane Doe\n• Loan Number: LOAN-789456123\n• Current Balance: $245,750.00\n• Scheduled Closing Date: July 15, 2025\n\nPlease provide:\n1. Complete payoff statement as of closing date\n2. Per diem interest rate for delays\n3. Wire transfer instructions\n4. Any additional requirements or fees\n\nI am copying our title officer Sarah Smith (sarah@reliabletitle.com) for coordination.\n\nGiven the closing timeline, we would appreciate your prompt response.\n\nBest regards,\nRexera Automation Team\nOn behalf of: John and Jane Doe",
  "status": "DRAFT",
  "isClientVisible": false,
  "participants": [
    {
      "email": "payoffs@abcmortgage.com",
      "name": "ABC Mortgage Payoff Department",
      "role": "recipient"
    },
    {
      "email": "sarah@reliabletitle.com", 
      "name": "Sarah Smith",
      "role": "cc"
    }
  ],
  "metadata": {
    "inReplyTo": "<original-123@abcmortgage.com>",
    "emailThreadId": "thread-payoff-789",
    "recipients": {
      "to": ["payoffs@abcmortgage.com"],
      "cc": ["sarah@reliabletitle.com"],
      "bcc": []
    }
  }
}
```

#### Automatic Audit Logging

```sql
-- All agent data access is automatically logged
INSERT INTO audit_events (
  actor_type, actor_id, event_type, action, 
  resource_type, resource_id, workflow_id, event_data
) VALUES 
  ('agent', 'mia', 'data.accessed', 'read', 'workflow_data', 'wf-payoff-789', 'wf-payoff-789',
   '{"dataTypes": ["workflow", "communications", "documents", "counterparties", "workflowContacts"], "documentsAccessed": ["doc-purchase-101"], "taskContext": "task-reply-456"}'::jsonb),
  ('agent', 'mia', 'communication.created', 'create', 'communication', 'comm-draft-890', 'wf-payoff-789',
   '{"communicationType": "email", "status": "draft", "contextualElements": ["loan_number", "closing_date", "property_address", "title_officer_cc"]}'::jsonb);
```

---

## Benefits of Agent Tools API

### 🎯 **Context-Aware Responses**
- **Complete workflow understanding** - Agents know property details, participants, timeline
- **Informed decision making** - Access to documents, past communications, counterparty info
- **Personalized interactions** - Use real names, specific details, appropriate tone

### 🔒 **Secure Access Control**
- **Workflow-scoped access** - Agents only see data for their assigned workflow
- **Audit trail** - Every data access logged for compliance and debugging
- **Role-based permissions** - Different agents can have different access levels

### 📚 **Learning from Experience**
- **Pattern recognition** - Learn from successful past workflows
- **Template optimization** - Use proven approaches for similar situations
- **Performance improvement** - Understand what works best for different counterparties

### 🚀 **Developer Simplicity**
- **Single API call** - Get complete workflow context in one request
- **Consistent interface** - Same patterns for all agent data needs
- **Rich context** - Everything an agent needs to make smart decisions

This Agent Tools API enables truly intelligent agent behavior while maintaining security and simplicity! 🎉

---

*This unified communication system demonstrates how the simplified API architecture reduces complexity while providing more powerful and flexible functionality than the previous fragmented approach.*