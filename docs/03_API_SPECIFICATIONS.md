# 03_API_SPECIFICATIONS.md

<!--
This document provides tRPC API specifications for Rexera 2.0 using a unified Resources + Actions + Views + Events pattern that serves both human operators and AI agents through consistent, predictable procedures.
-->

## 📋 API Overview

Rexera 2.0 uses a **hybrid tRPC + REST API design** where AI agents and human operators manipulate the same core data model through type-safe, consistent procedures. The frontend uses tRPC for type-safe communication, while external systems can access the same functionality through REST endpoints that internally call tRPC procedures. The API follows four clear patterns:

### Core Patterns
- **Resources** - Standard CRUD operations on data entities via tRPC procedures
- **Actions** - Atomic operations that coordinate across resources
- **Views** - Optimized read-only data for dashboards and monitoring
- **Events** - Real-time updates via WebSocket subscriptions

### Unified Access
All tRPC procedures serve both human operators (via frontend) and AI agents (via MCP server), ensuring consistency and simplicity across all interactions.

---

## 📋 tRPC API Index

### Core Resources (CRUD Operations)
- **Workflows** - `workflows.*` procedures - Business process management
- **Tasks** - `tasks.*` procedures - Work unit operations
- **Communications** - `communications.*` procedures - Unified messaging system
- **Documents** - `documents.*` procedures - File and deliverable management
- **Counterparties** - `counterparties.*` procedures - External organization management

### Actions (Coordinated Operations)
- **Workflow Actions** - `workflows.executeAction` - Process control operations
- **Task Actions** - `tasks.executeAction` - Work unit operations

### Views (Optimized Data Access)
- **Dashboard** - `views.dashboard` - HIL operator interface data
- **Performance** - `views.performance` - System and agent metrics
- **SLA** - `views.sla` - Service level monitoring
- **Notifications** - `views.notifications` - User alerts and updates

### Events (Real-time Updates)
- **Workflow Events** - `workflows.subscribe` - Process state changes
- **Task Events** - `tasks.subscribe` - Work unit updates
- **Notification Events** - `notifications.subscribe` - User alerts

---

## tRPC API Architecture Overview

Rexera 2.0 uses a **unified data-centric tRPC architecture** where all actors (humans and AI agents) interact with the same consistent, type-safe procedures:

```mermaid
graph TB
    subgraph "Client Layer"
        HIL[HIL Dashboard<br/>Next.js 15 + tRPC Client]
        MCP[MCP Server<br/>AI Agent Interface]
    end
    
    subgraph "tRPC API Layer (Express.js on Vercel)"
        TRPC[tRPC Router<br/>Type-safe Procedures]
        RESOURCES[Resources<br/>CRUD Procedures]
        ACTIONS[Actions<br/>Coordinated Procedures]
        VIEWS[Views<br/>Optimized Read Procedures]
        EVENTS[Events<br/>Real-time Subscriptions]
    end
    
    subgraph "Data Layer"
        DB[(Supabase PostgreSQL<br/>35+ Tables)]
        N8N[n8n Cloud<br/>Workflow Orchestration]
        AGENTS[External AI Agents<br/>10 Specialized Services]
    end
    
    HIL --> TRPC
    MCP --> TRPC
    
    TRPC --> RESOURCES
    TRPC --> ACTIONS
    TRPC --> VIEWS
    TRPC --> EVENTS
    
    RESOURCES --> DB
    ACTIONS --> DB
    ACTIONS --> N8N
    ACTIONS --> AGENTS
    VIEWS --> DB
    EVENTS --> DB
```

## Core Design Principles

### 1. **Unified Interface**
Both human operators and AI agents use the same endpoints, ensuring consistency and reducing maintenance overhead.

### 2. **Data-Centric Operations**
All operations manipulate the core data model (workflows, tasks, communications, documents, counterparties) through predictable patterns.

### 3. **Atomic Actions**
Actions coordinate across multiple resources in single operations, reducing complexity and ensuring data consistency.

### 4. **Real-time Coordination**
Event-driven updates keep all actors synchronized without manual polling or complex state management.

## tRPC Request Flow Patterns

### Typical Workflow Creation
```mermaid
sequenceDiagram
    participant Client as Client (HIL/MCP)
    participant tRPC as tRPC Router
    participant DB as Supabase
    participant N8N as n8n Workflow
    participant Agents as AI Agents

    Client->>tRPC: workflows.create(input)
    tRPC->>DB: Create workflow + initial tasks
    tRPC->>N8N: Trigger workflow webhook
    N8N->>Agents: Execute first tasks
    N8N->>DB: Update task results
    DB->>Client: Real-time events (Subscription)
```

### Task Action Execution
```mermaid
sequenceDiagram
    participant Client as Client (HIL/MCP)
    participant tRPC as tRPC Router
    participant DB as Supabase

    Client->>tRPC: tasks.executeAction(input)
    tRPC->>DB: Update task + workflow + notifications
    DB->>Client: Real-time events
    Note over tRPC,DB: Single atomic procedure<br/>coordinates multiple resources
```

## Core Resources (tRPC Procedures)

All resources follow tRPC patterns with Zod validation and type-safe inputs/outputs.

### Workflows

#### `workflows.list`
List workflows with filtering and pagination.

**Input Schema:**
```typescript
z.object({
  clientId: z.string().optional(),           // Filter by client
  hilId: z.string().optional(),              // Filter by assigned HIL
  status: z.enum(['PENDING', 'IN_PROGRESS', 'AWAITING_REVIEW', 'BLOCKED', 'COMPLETED']).optional(),
  type: z.enum(['MUNI_LIEN_SEARCH', 'HOA_ACQUISITION', 'PAYOFF']).optional(),
  createdAfter: z.string().datetime().optional(),   // Filter by creation date
  createdBefore: z.string().datetime().optional(),  // Filter by creation date
  include: z.array(z.enum(['tasks', 'communications', 'documents', 'counterparties'])).optional(),
  limit: z.number().min(1).max(100).default(50),    // Pagination limit
  offset: z.number().min(0).default(0)              // Pagination offset
})
```

**Frontend Usage:**
```typescript
const { data } = await trpc.workflows.list.useQuery({
  status: 'IN_PROGRESS',
  include: ['tasks', 'communications'],
  limit: 20
});
```

**cURL Example:**
```bash
curl -X POST http://localhost:3002/api/trpc/workflows.list \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt-token>" \
  -d '{
    "json": {
      "status": "IN_PROGRESS",
      "include": ["tasks", "communications"],
      "limit": 20
    }
  }'
```

**Response:**
```json
{
  "result": {
    "data": {
      "json": {
        "workflows": [
          {
            "id": "wf-123",
            "type": "HOA_ACQUISITION",
            "status": "IN_PROGRESS",
            "clientId": "client-456",
            "hilId": "hil-789",
            "payload": {
              "address": "123 Main St, Anytown, ST 12345",
              "hoaName": "Sunset Hills HOA"
            },
            "progress": {
              "totalTasks": 12,
              "completedTasks": 8,
              "progressPercentage": 67
            },
            "slaStatus": "ON_TIME",
            "createdAt": "2025-06-28T10:00:00Z",
            "updatedAt": "2025-06-28T14:30:00Z",
            "tasks": [ /* task objects */ ],
            "communications": [ /* communication objects */ ]
          }
        ],
        "totalCount": 156,
        "hasMore": true
      }
    }
  }
}
```

#### `workflows.create`
Create a new workflow.

**Input Schema:**
```typescript
z.object({
  type: z.enum(['MUNI_LIEN_SEARCH', 'HOA_ACQUISITION', 'PAYOFF']),
  clientId: z.string(),
  hilId: z.string(),
  payload: z.record(z.any())  // Workflow-specific data
})
```

**Frontend Usage:**
```typescript
const createWorkflow = trpc.workflows.create.useMutation();

await createWorkflow.mutateAsync({
  type: 'MUNI_LIEN_SEARCH',
  clientId: 'client-123',
  hilId: 'hil-456',
  payload: {
    address: '123 Main St, Anytown, ST 12345',
    county: 'Orange County',
    parcelNumber: '123-456-789',
    buyer: 'John Doe',
    closingDate: '2025-07-15T00:00:00Z'
  }
});
```

**cURL Example:**
```bash
curl -X POST http://localhost:3002/api/trpc/workflows.create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt-token>" \
  -d '{
    "json": {
      "type": "MUNI_LIEN_SEARCH",
      "clientId": "client-123",
      "hilId": "hil-456",
      "payload": {
        "address": "123 Main St, Anytown, ST 12345",
        "county": "Orange County",
        "parcelNumber": "123-456-789",
        "buyer": "John Doe",
        "closingDate": "2025-07-15T00:00:00Z"
      }
    }
  }'
```

**Response:**
```json
{
  "result": {
    "data": {
      "json": {
        "id": "wf-789",
        "type": "MUNI_LIEN_SEARCH",
        "status": "PENDING",
        "clientId": "client-123",
        "hilId": "hil-456",
        "payload": { /* as provided */ },
        "progress": {
          "totalTasks": 0,
          "completedTasks": 0,
          "progressPercentage": 0
        },
        "createdAt": "2025-06-28T15:00:00Z",
        "updatedAt": "2025-06-28T15:00:00Z"
      }
    }
  }
}
```

#### `workflows.getById`
Get a specific workflow with optional related data.

**Input Schema:**
```typescript
z.object({
  id: z.string(),
  include: z.array(z.enum(['tasks', 'communications', 'documents', 'counterparties'])).optional()
})
```

**Frontend Usage:**
```typescript
const { data } = await trpc.workflows.getById.useQuery({
  id: 'wf-123',
  include: ['tasks', 'communications']
});
```

#### `workflows.update`
Update workflow fields.

**Input Schema:**
```typescript
z.object({
  id: z.string(),
  data: z.object({
    status: z.enum(['PENDING', 'IN_PROGRESS', 'AWAITING_REVIEW', 'BLOCKED', 'COMPLETED']).optional(),
    hilId: z.string().optional(),
    payload: z.record(z.any()).optional()
  })
})
```

#### `workflows.delete`
Soft delete a workflow (sets status to CANCELLED).

**Input Schema:**
```typescript
z.object({
  id: z.string()
})
```

**Response:** `{ success: true }`

### Tasks

#### `tasks.list`
List tasks with filtering and pagination.

**Input Schema:**
```typescript
z.object({
  workflowId: z.string().optional(),         // Filter by workflow
  executorId: z.string().optional(),         // Filter by assigned executor (HIL user)
  agentName: z.string().optional(),          // Filter by AI agent
  status: z.enum(['PENDING', 'AWAITING_REVIEW', 'COMPLETED', 'FAILED', 'CANCELLED']).optional(),
  slaStatus: z.enum(['ON_TIME', 'AT_RISK', 'BREACHED']).optional(),
  createdAfter: z.string().datetime().optional(),
  include: z.array(z.enum(['workflow', 'timeline', 'executions'])).optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0)
})
```

**Frontend Usage:**
```typescript
const { data } = await trpc.tasks.list.useQuery({
  workflowId: 'wf-456',
  status: 'COMPLETED',
  include: ['workflow', 'timeline'],
  limit: 20
});
```

**cURL Example:**
```bash
curl -X POST http://localhost:3002/api/trpc/tasks.list \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt-token>" \
  -d '{
    "json": {
      "workflowId": "wf-456",
      "status": "COMPLETED",
      "include": ["workflow", "timeline"],
      "limit": 20
    }
  }'
```

**Response:**
```json
{
  "result": {
    "data": {
      "json": {
        "tasks": [
          {
            "id": "task-123",
            "workflowId": "wf-456",
            "taskType": "research-contact",
            "executorType": "AI",
            "executorId": null,
            "agentName": "Nina",
            "status": "COMPLETED",
            "slaStatus": "ON_TIME",
            "slaDueAt": "2025-06-28T11:00:00Z",
            "agentInput": {
              "entityName": "Sunset Hills HOA",
              "location": "Orange County, CA"
            },
            "agentOutput": {
              "contacts": [
                {
                  "name": "Paradise Property Management",
                  "email": "manager@paradise.com",
                  "phone": "(614) 555-PROP"
                }
              ]
            },
            "result": {
              "contactsFound": 1,
              "confidenceScore": 0.92
            },
            "priority": "NORMAL",
            "createdAt": "2025-06-28T10:00:00Z",
            "updatedAt": "2025-06-28T10:04:40Z"
          }
        ],
        "totalCount": 89,
        "hasMore": true
      }
    }
  }
}
```

#### `tasks.create`
Create a new task.

**Input Schema:**
```typescript
z.object({
  workflowId: z.string(),
  taskType: z.string(),
  executorType: z.enum(['AI', 'HIL']),
  agentName: z.string().optional(),
  agentInput: z.record(z.any()).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  slaDueAt: z.string().datetime().optional()
})
```

**Frontend Usage:**
```typescript
const createTask = trpc.tasks.create.useMutation();

await createTask.mutateAsync({
  workflowId: 'wf-456',
  taskType: 'send-email-request',
  executorType: 'AI',
  agentName: 'Mia',
  agentInput: {
    recipient: 'manager@paradise.com',
    subject: 'HOA Document Request',
    template: 'hoa_document_request'
  },
  priority: 'HIGH',
  slaDueAt: '2025-06-28T16:00:00Z'
});
```

#### `tasks.getById`
Get a specific task with optional related data.

**Input Schema:**
```typescript
z.object({
  id: z.string(),
  include: z.array(z.enum(['workflow', 'timeline', 'executions'])).optional()
})
```

#### `tasks.update`
Update task fields.

**Input Schema:**
```typescript
z.object({
  id: z.string(),
  data: z.object({
    status: z.enum(['PENDING', 'AWAITING_REVIEW', 'COMPLETED', 'FAILED', 'CANCELLED']).optional(),
    executorId: z.string().optional(),
    agentOutput: z.record(z.any()).optional(),
    result: z.record(z.any()).optional(),
    priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional()
  })
})
```

#### `tasks.delete`
Cancel a task (sets status to CANCELLED).

**Input Schema:**
```typescript
z.object({
  id: z.string()
})
```

### Communications

#### `communications.list`
List all communications (emails, calls, messages, SMS) with unified filtering.

**Input Schema:**
```typescript
z.object({
  workflowId: z.string().optional(),         // Filter by workflow
  taskId: z.string().optional(),             // Filter by task
  type: z.enum(['email', 'call', 'message', 'sms']).optional(),
  status: z.string().optional(),             // Filter by status
  isClientVisible: z.boolean().optional(),   // Filter by client visibility
  createdAfter: z.string().datetime().optional(),
  include: z.array(z.enum(['metadata', 'attachments'])).optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0)
})
```

**Frontend Usage:**
```typescript
const { data } = await trpc.communications.list.useQuery({
  workflowId: 'wf-456',
  type: 'email',
  isClientVisible: true,
  include: ['attachments'],
  limit: 20
});
```

**cURL Example:**
```bash
curl -X POST http://localhost:3002/api/trpc/communications.list \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt-token>" \
  -d '{
    "json": {
      "workflowId": "wf-456",
      "type": "email",
      "isClientVisible": true,
      "include": ["attachments"],
      "limit": 20
    }
  }'
```

**Response:**
```json
{
  "result": {
    "data": {
      "json": {
        "communications": [
          {
            "id": "comm-123",
            "workflowId": "wf-456",
            "taskId": "task-789",
            "type": "email",
            "emailThreadId": "thread-abc",
            "subject": "HOA Document Request Status",
            "content": "What's the ETA for the HOA documents?",
            "status": "DELIVERED",
            "participants": [
              {
                "email": "client@example.com",
                "role": "client",
                "name": "John Doe"
              },
              {
                "email": "sarah@rexera.com",
                "role": "hil",
                "name": "Sarah Johnson"
              }
            ],
            "priority": "NORMAL",
            "isClientVisible": true,
            "sentimentScore": 0.1,
            "urgencyDetected": false,
            "readAt": null,
            "createdAt": "2025-06-28T10:30:00Z"
          }
        ],
        "totalCount": 45,
        "hasMore": true
      }
    }
  }
}
```

#### `communications.create`
Create a new communication.

**Input Schema:**
```typescript
z.object({
  workflowId: z.string(),
  type: z.enum(['email', 'call', 'message', 'sms']),
  emailThreadId: z.string().optional(),
  subject: z.string().optional(),
  content: z.string(),
  participants: z.array(z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    role: z.enum(['sender', 'recipient', 'client', 'hil', 'counterparty']),
    name: z.string()
  })),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  isClientVisible: z.boolean().default(true),
  attachments: z.array(z.object({
    filename: z.string(),
    url: z.string().url(),
    mimeType: z.string()
  })).optional()
})
```

**Frontend Usage:**
```typescript
const createCommunication = trpc.communications.create.useMutation();

await createCommunication.mutateAsync({
  workflowId: 'wf-456',
  type: 'email',
  emailThreadId: 'thread-abc',
  subject: 'HOA Document Update',
  content: 'The ETA for HOA documents is 3-5 business days',
  participants: [
    {
      email: 'client@example.com',
      role: 'recipient',
      name: 'John Doe'
    },
    {
      email: 'sarah@rexera.com',
      role: 'sender',
      name: 'Sarah Johnson'
    }
  ],
  priority: 'NORMAL',
  isClientVisible: true,
  attachments: [
    {
      filename: 'hoa_status_update.pdf',
      url: 'https://s3.../hoa_status_update.pdf',
      mimeType: 'application/pdf'
    }
  ]
});
```

### Documents

#### `documents.list`
List documents with filtering.

**Input Schema:**
```typescript
z.object({
  workflowId: z.string().optional(),         // Filter by workflow
  taskId: z.string().optional(),             // Filter by task
  documentType: z.enum(['WORKING', 'DELIVERABLE', 'ATTACHMENT']).optional(),
  status: z.string().optional(),             // Filter by status
  tagId: z.string().optional(),              // Filter by tag
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0)
})
```

**Frontend Usage:**
```typescript
const { data } = await trpc.documents.list.useQuery({
  workflowId: 'wf-456',
  documentType: 'DELIVERABLE',
  status: 'COMPLETED'
});
```

#### `documents.create`
Create/upload a new document.

**Input Schema:**
```typescript
z.object({
  workflowId: z.string(),
  filename: z.string(),
  url: z.string().url(),
  documentType: z.enum(['WORKING', 'DELIVERABLE', 'ATTACHMENT']),
  status: z.string(),
  deliverableData: z.record(z.any()).optional(),
  changeSummary: z.string().optional()
})
```

**Frontend Usage:**
```typescript
const createDocument = trpc.documents.create.useMutation();

await createDocument.mutateAsync({
  workflowId: 'wf-456',
  filename: 'hoa_bylaws.pdf',
  url: 'https://s3.../hoa_bylaws.pdf',
  documentType: 'DELIVERABLE',
  status: 'COMPLETED',
  deliverableData: {
    property: {
      address: '123 Main St, Anytown, ST 12345',
      hoaName: 'Sunset Hills HOA'
    },
    documentsObtained: [
      {
        type: 'bylaws',
        filename: 'hoa_bylaws.pdf',
        obtainedAt: '2025-06-28T10:30:00Z'
      }
    ]
  }
});
```

### Counterparties

#### `counterparties.list`
List counterparties (HOAs, lenders, municipalities, etc.).

**Input Schema:**
```typescript
z.object({
  type: z.enum(['hoa', 'lender', 'municipality', 'utility', 'tax_authority']).optional(),
  search: z.string().optional(),             // Search by name or contact info
  workflowId: z.string().optional(),         // Filter by workflow association
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0)
})
```

**Frontend Usage:**
```typescript
const { data } = await trpc.counterparties.list.useQuery({
  type: 'hoa',
  search: 'Sunset Hills'
});
```

#### `counterparties.create`
Create a new counterparty.

**Input Schema:**
```typescript
z.object({
  type: z.enum(['hoa', 'lender', 'municipality', 'utility', 'tax_authority']),
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url().optional(),
  notes: z.string().optional()
})
```

**Frontend Usage:**
```typescript
const createCounterparty = trpc.counterparties.create.useMutation();

await createCounterparty.mutateAsync({
  type: 'hoa',
  name: 'Sunset Hills HOA',
  email: 'manager@sunsethills.com',
  phone: '(555) 123-4567',
  address: '123 Management Way, City, ST 12345',
  website: 'https://sunsethills.com',
  notes: 'Responsive management company'
});
```

---

## Actions (Coordinated tRPC Procedures)

Actions perform atomic operations that coordinate across multiple resources, ensuring data consistency and triggering appropriate workflows.

### Workflow Actions

#### `workflows.executeAction`
Execute coordinated actions on workflows.

**Input Schema:**
```typescript
z.object({
  id: z.string(),
  action: z.enum(['start', 'pause', 'resume', 'cancel', 'complete']),
  data: z.object({
    reason: z.string().optional(),
    priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
    notifications: z.object({
      notifyClient: z.boolean().optional(),
      notifyTeam: z.boolean().optional()
    }).optional()
  }).optional()
})
```

**Frontend Usage:**
```typescript
const executeWorkflowAction = trpc.workflows.executeAction.useMutation();

const result = await executeWorkflowAction.mutateAsync({
  id: 'wf-456',
  action: 'start',
  data: {
    reason: 'Ready to begin processing',
    priority: 'HIGH',
    notifications: {
      notifyClient: true,
      notifyTeam: true
    }
  }
});
```

**cURL Example:**
```bash
curl -X POST http://localhost:3002/api/trpc/workflows.executeAction \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt-token>" \
  -d '{
    "json": {
      "id": "wf-456",
      "action": "start",
      "data": {
        "reason": "Ready to begin processing",
        "priority": "HIGH",
        "notifications": {
          "notifyClient": true,
          "notifyTeam": true
        }
      }
    }
  }'
```

**Response:**
```json
{
  "result": {
    "data": {
      "json": {
        "success": true,
        "workflowId": "wf-456",
        "action": "start",
        "newStatus": "IN_PROGRESS",
        "tasksCreated": 8,
        "n8nExecutionId": "exec-789",
        "notifications": {
          "clientNotified": true,
          "teamNotified": true
        },
        "timestamp": "2025-06-28T15:00:00Z"
      }
    }
  }
}
```

### Task Actions

#### `tasks.executeAction`
Execute coordinated actions on tasks.

**Input Schema:**
```typescript
z.object({
  id: z.string(),
  action: z.enum(['complete', 'retry', 'escalate', 'assign', 'fail']),
  data: z.object({
    result: z.record(z.any()).optional(),
    reason: z.string().optional(),
    assignTo: z.string().optional(),
    coordination: z.object({
      updateWorkflow: z.boolean().optional(),
      createFollowupTasks: z.boolean().optional(),
      notifyTeam: z.boolean().optional()
    }).optional()
  }).optional()
})
```

**Frontend Usage:**
```typescript
const executeTaskAction = trpc.tasks.executeAction.useMutation();

const result = await executeTaskAction.mutateAsync({
  id: 'task-123',
  action: 'complete',
  data: {
    result: {
      contactsFound: 3,
      confidenceScore: 0.92,
      nextSteps: ['send-email-request']
    },
    coordination: {
      updateWorkflow: true,
      createFollowupTasks: true,
      notifyTeam: true
    }
  }
});
```

**Response:**
```json
{
  "result": {
    "data": {
      "json": {
        "success": true,
        "taskId": "task-123",
        "action": "complete",
        "newStatus": "COMPLETED",
        "workflowUpdated": true,
        "followupTasksCreated": ["task-124", "task-125"],
        "notificationsSent": 2,
        "timestamp": "2025-06-28T10:04:40Z"
      }
    }
  }
}
```

---

## Views (Optimized tRPC Procedures)

Views provide optimized, read-only access to derived and aggregated data for dashboards and monitoring.

### Dashboard View

#### `views.dashboard`
Get complete HIL dashboard data in a single request.

**Input Schema:**
```typescript
z.object({
  hilId: z.string().optional(),              // Filter for specific HIL user
  timeframe: z.enum(['today', 'week', 'month']).optional(),
  includeMetrics: z.boolean().default(true)  // Include performance metrics
})
```

**Frontend Usage:**
```typescript
const { data } = await trpc.views.dashboard.useQuery({
  timeframe: 'today',
  includeMetrics: true
});
```

**cURL Example:**
```bash
curl -X POST http://localhost:3002/api/trpc/views.dashboard \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt-token>" \
  -d '{
    "json": {
      "timeframe": "today",
      "includeMetrics": true
    }
  }'
```

**Response:**
```json
{
  "result": {
    "data": {
      "json": {
        "summary": {
          "activeWorkflows": 12,
          "pendingTasks": 8,
          "overdueItems": 2,
          "completedToday": 5
        },
        "taskQueue": [
          {
            "id": "task-123",
            "workflowId": "wf-456",
            "taskType": "review-documents",
            "priority": "HIGH",
            "slaStatus": "AT_RISK",
            "timeRemaining": 1800,
            "clientName": "ABC Realty",
            "workflowType": "HOA_ACQUISITION"
          }
        ],
        "workflows": [
          {
            "id": "wf-456",
            "type": "HOA_ACQUISITION",
            "status": "IN_PROGRESS",
            "clientName": "ABC Realty",
            "progress": 67,
            "slaStatus": "ON_TIME",
            "lastActivity": "2025-06-28T14:30:00Z"
          }
        ],
        "notifications": [
          {
            "id": "notif-789",
            "type": "SLA_WARNING",
            "priority": "HIGH",
            "message": "Task approaching deadline",
            "workflowId": "wf-456",
            "createdAt": "2025-06-28T14:45:00Z"
          }
        ],
        "metrics": {
          "completionRate": 94.2,
          "avgResponseTime": "3.2 hours",
          "clientSatisfaction": 4.8
        }
      }
    }
  }
}
```

### Performance View

#### `views.performance`
Get system and agent performance metrics.

**Input Schema:**
```typescript
z.object({
  timeframe: z.enum(['hour', 'day', 'week', 'month']).optional(),
  agentName: z.string().optional(),          // Filter by specific agent
  workflowType: z.string().optional()        // Filter by workflow type
})
```

**Frontend Usage:**
```typescript
const { data } = await trpc.views.performance.useQuery({
  timeframe: 'week',
  agentName: 'Nina'
});
```

**Response:**
```json
{
  "result": {
    "data": {
      "json": {
        "systemMetrics": {
          "totalWorkflows": 247,
          "activeWorkflows": 156,
          "completedToday": 7,
          "avgCompletionTime": "4.2 hours",
          "slaCompliance": 94.2
        },
        "agentMetrics": [
          {
            "agentName": "Nina",
            "tasksCompleted": 156,
            "successRate": 92.5,
            "avgProcessingTime": "12 seconds",
            "avgConfidenceScore": 0.89,
            "costPerTask": 0.15
          }
        ],
        "workflowMetrics": [
          {
            "workflowType": "MUNI_LIEN_SEARCH",
            "totalCount": 89,
            "avgCompletionTime": "3.2 hours",
            "successRate": 94.5,
            "slaCompliance": 96.1
          }
        ]
      }
    }
  }
}
```

### SLA View

#### `views.sla`
Get comprehensive SLA monitoring data.

**Input Schema:**
```typescript
z.object({
  status: z.enum(['ACTIVE', 'COMPLETED', 'BREACHED', 'PAUSED']).optional(),
  workflowType: z.string().optional(),
  agentName: z.string().optional(),
  alertLevel: z.enum(['GREEN', 'YELLOW', 'ORANGE', 'RED']).optional()
})
```

**Frontend Usage:**
```typescript
const { data } = await trpc.views.sla.useQuery({
  alertLevel: 'RED'
});
```

**Response:**
```json
{
  "result": {
    "data": {
      "json": {
        "summary": {
          "totalActiveSLAs": 45,
          "onTime": 38,
          "atRisk": 5,
          "breached": 2,
          "complianceRate": 84.4
        },
        "alerts": [
          {
            "id": "alert-123",
            "taskId": "task-456",
            "workflowId": "wf-789",
            "alertLevel": "RED",
            "message": "SLA breached - task exceeded deadline by 18 minutes",
            "timeOverdue": 1080,
            "escalatedTo": "hil-manager-123"
          }
        ],
        "tracking": [
          {
            "taskId": "task-789",
            "workflowId": "wf-456",
            "agentName": "Rex",
            "taskType": "portal-access",
            "dueAt": "2025-06-28T11:00:00Z",
            "status": "ACTIVE",
            "timeRemaining": -1080,
            "riskLevel": "RED"
          }
        ]
      }
    }
  }
}
```

### Notifications View

#### `views.notifications`
Get user notifications with unread counts and filtering.

**Input Schema:**
```typescript
z.object({
  unreadOnly: z.boolean().optional(),        // Only unread notifications
  type: z.string().optional(),               // Filter by type
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional()
})
```

**Frontend Usage:**
```typescript
const { data } = await trpc.views.notifications.useQuery({
  unreadOnly: true,
  priority: 'HIGH'
});
```

**Response:**
```json
{
  "result": {
    "data": {
      "json": {
        "notifications": [
          {
            "id": "notif-123",
            "type": "TASK_INTERRUPT",
            "title": "Task Failed: portal-access",
            "message": "Rex encountered an error in HOA_ACQUISITION",
            "priority": "HIGH",
            "context": {
              "workflowId": "wf-456",
              "taskId": "task-789",
              "agentName": "Rex",
              "actionUrl": "/workflows/wf-456/tasks/task-789"
            },
            "readAt": null,
            "createdAt": "2025-06-28T10:18:00Z"
          }
        ],
        "counts": {
          "unreadCount": 12,
          "urgentCount": 3,
          "byType": {
            "TASK_INTERRUPT": 5,
            "SLA_WARNING": 3,
            "CLIENT_MESSAGE": 2
          }
        }
      }
    }
  }
}
```

---

## Events (Real-time tRPC Subscriptions)

tRPC subscriptions for real-time coordination between all actors.

### Workflow Events

#### `workflows.subscribe`
Subscribe to real-time workflow updates.

**Input Schema:**
```typescript
z.object({
  workflowId: z.string()
})
```

**Frontend Usage:**
```typescript
trpc.workflows.subscribe.useSubscription(
  { workflowId: 'wf-456' },
  {
    onData: (event) => {
      console.log('Workflow event:', event);
      // Update UI based on event
    }
  }
);
```

**Event Types:**
```typescript
interface WorkflowEvent {
  type: 'status_changed' | 'progress_updated' | 'task_added' | 'task_completed'
  workflowId: string
  data: {
    newStatus?: WorkflowStatus
    progress?: number
    taskId?: string
    completedTasks?: number
    totalTasks?: number
  }
  timestamp: string
}
```

### Task Events

#### `tasks.subscribe`
Subscribe to real-time task updates.

**Input Schema:**
```typescript
z.object({
  taskId: z.string()
})
```

**Frontend Usage:**
```typescript
trpc.tasks.subscribe.useSubscription(
  { taskId: 'task-123' },
  {
    onData: (event) => {
      console.log('Task event:', event);
    }
  }
);
```

### Notification Events

#### `notifications.subscribe`
Subscribe to real-time user notifications.

**Input Schema:**
```typescript
z.object({
  userId: z.string().optional() // Defaults to current user
})
```

**Frontend Usage:**
```typescript
trpc.notifications.subscribe.useSubscription(
  {},
  {
    onData: (notification) => {
      console.log('New notification:', notification);
      // Show toast or update notification count
    }
  }
);
```

**Event Example:**
```json
{
  "type": "new_notification",
  "notification": {
    "id": "notif-456",
    "type": "SLA_WARNING",
    "title": "Task Approaching Deadline",
    "priority": "HIGH",
    "context": {
      "workflowId": "wf-789",
      "taskId": "task-123"
    }
  },
  "timestamp": "2025-06-28T15:00:00Z"
}
```

---

## TypeScript Interfaces & tRPC Types

### Core Resource Types

```typescript
// Core workflow types with Zod validation
const WorkflowSchema = z.object({
  id: z.string(),
  type: z.enum(['MUNI_LIEN_SEARCH', 'HOA_ACQUISITION', 'PAYOFF']),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'AWAITING_REVIEW', 'BLOCKED', 'COMPLETED']),
  clientId: z.string(),
  hilId: z.string(),
  managerHilId: z.string().optional(),
  payload: z.record(z.any()),
  progress: z.object({
    totalTasks: z.number(),
    completedTasks: z.number(),
    progressPercentage: z.number()
  }),
  slaStatus: z.enum(['ON_TIME', 'AT_RISK', 'BREACHED']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  
  // Optional includes
  tasks: z.array(TaskSchema).optional(),
  communications: z.array(CommunicationSchema).optional(),
  documents: z.array(DocumentSchema).optional(),
  counterparties: z.array(CounterpartySchema).optional()
});

const TaskSchema = z.object({
  id: z.string(),
  workflowId: z.string(),
  taskType: z.string(),
  executorType: z.enum(['AI', 'HIL']),
  executorId: z.string().optional(),
  agentName: z.string().optional(),
  status: z.enum(['PENDING', 'AWAITING_REVIEW', 'COMPLETED', 'FAILED', 'CANCELLED']),
  slaStatus: z.enum(['ON_TIME', 'AT_RISK', 'BREACHED']),
  slaDueAt: z.string().datetime().optional(),
  agentInput: z.record(z.any()).optional(),
  agentOutput: z.record(z.any()).optional(),
  result: z.record(z.any()).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

const CommunicationSchema = z.object({
  id: z.string(),
  workflowId: z.string(),
  taskId: z.string().optional(),
  type: z.enum(['email', 'call', 'message', 'sms']),
  emailThreadId: z.string().optional(),
  subject: z.string().optional(),
  content: z.string(),
  status: z.string(),
  participants: z.array(ParticipantSchema),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
  isClientVisible: z.boolean(),
  sentimentScore: z.number().optional(),
  urgencyDetected: z.boolean(),
  readAt: z.string().datetime().optional(),
  createdAt: z.string().datetime()
});

const DocumentSchema = z.object({
  id: z.string(),
  workflowId: z.string(),
  taskId: z.string().optional(),
  filename: z.string(),
  url: z.string().url(),
  documentType: z.enum(['WORKING', 'DELIVERABLE', 'ATTACHMENT']),
  status: z.string(),
  deliverableData: z.record(z.any()).optional(),
  version: z.number().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

const CounterpartySchema = z.object({
  id: z.string(),
  type: z.enum(['hoa', 'lender', 'municipality', 'utility', 'tax_authority']),
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url().optional(),
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

// Inferred TypeScript types
type Workflow = z.infer<typeof WorkflowSchema>;
type Task = z.infer<typeof TaskSchema>;
type Communication = z.infer<typeof CommunicationSchema>;
type Document = z.infer<typeof DocumentSchema>;
type Counterparty = z.infer<typeof CounterpartySchema>;
```

### AI Agent Access via tRPC

**AI agents use the same unified tRPC procedures with intelligent filtering:**

#### Agent Authentication
```typescript
// tRPC context includes agent authentication
const ctx = {
  user: {
    id: 'agent-mia',
    type: 'AI_AGENT',
    agentName: 'mia',
    workflowScope: 'wf-123'
  }
};
```

#### Agent tRPC Usage Examples
```typescript
// Agents use same procedures with automatic filtering
const workflow = await trpc.workflows.getById.query({
  id: 'wf-123'
}); // Automatically scoped to agent's workflow

const communications = await trpc.communications.list.query({
  workflowId: 'wf-123'
}); // Filtered to workflow scope

const documents = await trpc.documents.list.query({
  workflowId: 'wf-123'
}); // Only workflow-related documents

const counterparties = await trpc.counterparties.list.query({
  workflowId: 'wf-123'
}); // Business contact info only
```

#### Smart Response Filtering
tRPC middleware automatically filters responses based on agent permissions:
- **Workflow-scoped access** - Only data for assigned workflow
- **Sanitized responses** - No internal HIL notes or sensitive PII
- **Context-optimized** - All related data included in responses
- **Automatic audit logging** - Every agent procedure call tracked
- **Type safety** - Zod validation ensures data integrity

#### Agent Access Control
```typescript
// Agents can access (filtered by tRPC middleware):
- Assigned workflow data and related tasks
- Communications within their workflow
- Documents related to current task
- Counterparty business contact information
- Workflow contacts for coordination

// Agents CANNOT access:
- Other workflows or unrelated data
- HIL internal notes or admin functions
- User profiles or authentication data
- Financial data beyond workflow scope
```

---

### tRPC Action Types

```typescript
// Workflow action input schema
const WorkflowActionSchema = z.object({
  id: z.string(),
  action: z.enum(['start', 'pause', 'resume', 'cancel', 'complete']),
  data: z.object({
    reason: z.string().optional(),
    priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
    notifications: z.object({
      notifyClient: z.boolean().optional(),
      notifyTeam: z.boolean().optional()
    }).optional()
  }).optional()
});

// Task action input schema
const TaskActionSchema = z.object({
  id: z.string(),
  action: z.enum(['complete', 'retry', 'escalate', 'assign', 'fail']),
  data: z.object({
    result: z.record(z.any()).optional(),
    reason: z.string().optional(),
    assignTo: z.string().optional(),
    coordination: z.object({
      updateWorkflow: z.boolean().optional(),
      createFollowupTasks: z.boolean().optional(),
      notifyTeam: z.boolean().optional()
    }).optional()
  }).optional()
});

// Inferred types
type WorkflowActionInput = z.infer<typeof WorkflowActionSchema>;
type TaskActionInput = z.infer<typeof TaskActionSchema>;
```

### tRPC Response Types

```typescript
// List response schema
const ListResponseSchema = <T extends z.ZodType>(itemSchema: T) => z.object({
  items: z.array(itemSchema),
  totalCount: z.number(),
  hasMore: z.boolean()
});

// Action response schema
const ActionResponseSchema = z.object({
  success: z.boolean(),
  action: z.string(),
  newStatus: z.string().optional(),
  timestamp: z.string().datetime()
}).and(z.record(z.any())); // Allow additional action-specific fields

// tRPC error handling
const TRPCErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  data: z.object({
    code: z.string(),
    httpStatus: z.number(),
    stack: z.string().optional(),
    path: z.string(),
    zodError: z.any().optional()
  }).optional()
});

// Inferred types
type ListResponse<T> = {
  items: T[];
  totalCount: number;
  hasMore: boolean;
};

type ActionResponse = z.infer<typeof ActionResponseSchema>;
type TRPCError = z.infer<typeof TRPCErrorSchema>;
```

---

## Authentication & Security

### JWT Token Structure
```json
{
  "sub": "<user-uuid>",
  "email": "user@example.com",
  "role": "HIL",
  "userType": "hil_user",
  "companyId": null,
  "iat": 1640995200,
  "exp": 1641081600
}
```

### tRPC Authentication
All tRPC procedures require authentication via context:

```typescript
// tRPC context with authentication
const createContext = ({ req, res }: CreateNextContextOptions) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const user = verifyJWT(token);
  
  return {
    user,
    req,
    res
  };
};

// Protected procedure middleware
const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
```

### Rate Limiting
- **Query procedures**: 2000 requests/hour per user (optimized for reads)
- **Mutation procedures**: 500 requests/hour per user (write operations)
- **Subscription procedures**: 100 concurrent connections per user
- **Agent procedures**: 10,000 requests/hour per agent (AI workload)

### Comprehensive Audit Logging
**All tRPC operations are automatically audited for compliance, debugging, and analytics:**

```typescript
// Every successful tRPC procedure automatically creates an audit event
const auditMiddleware = middleware(async ({ ctx, path, type, next }) => {
  const result = await next();
  
  if (result.ok) {
    await createAuditEvent({
      actor_type: ctx.user.type === 'AI_AGENT' ? 'agent' : 'human',
      actor_id: ctx.user.id,
      event_type: `${path.split('.')[0]}.${type}`, // e.g., 'workflows.query'
      action: type, // 'query', 'mutation', 'subscription'
      resource_type: path.split('.')[0], // 'workflows', 'tasks', etc.
      resource_id: result.data?.id,
      workflow_id: result.data?.workflowId || ctx.workflowScope,
      client_id: ctx.user.clientId,
      event_data: {
        procedure: path,
        type: type,
        ipAddress: ctx.req.ip,
        userAgent: ctx.req.headers['user-agent'],
        input: sanitizeInput(ctx.input)
      }
    });
  }
  
  return result;
});
```

**Audit events captured:**
- **Authentication**: Login/logout with IP and device tracking
- **Procedure calls**: All tRPC queries, mutations, and subscriptions
- **Action executions**: Workflow and task actions with timing metrics
- **Document access**: PII-containing file views for compliance
- **Administrative changes**: User management and system configuration

All audit data is stored in the `audit_events` table for compliance reporting, security monitoring, and operational analytics. See [`13_AUDIT_SYSTEM.md`](13_AUDIT_SYSTEM.md) for implementation details.

---

## Error Handling

### tRPC Error Response
```json
{
  "error": {
    "message": "Invalid workflow type specified",
    "code": -32600,
    "data": {
      "code": "BAD_REQUEST",
      "httpStatus": 400,
      "path": "workflows.create",
      "zodError": {
        "fieldErrors": {
          "type": ["Invalid enum value. Expected 'MUNI_LIEN_SEARCH' | 'HOA_ACQUISITION' | 'PAYOFF'"]
        }
      }
    }
  }
}
```

### tRPC Error Codes
- `UNAUTHORIZED` - Missing or invalid authentication
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `BAD_REQUEST` - Invalid input data (Zod validation errors)
- `CONFLICT` - Resource conflict (e.g., duplicate creation)
- `PRECONDITION_FAILED` - Business logic validation failed
- `TOO_MANY_REQUESTS` - Rate limit exceeded
- `INTERNAL_SERVER_ERROR` - Server errors

### Error Handling in Frontend
```typescript
// tRPC error handling with React Query
const { data, error, isLoading } = trpc.workflows.list.useQuery(
  { status: 'IN_PROGRESS' },
  {
    onError: (error) => {
      if (error.data?.code === 'UNAUTHORIZED') {
        router.push('/login');
      } else if (error.data?.zodError) {
        // Handle validation errors
        console.error('Validation errors:', error.data.zodError.fieldErrors);
      } else {
        // Handle other errors
        toast.error(error.message);
      }
    }
  }
);

// Mutation error handling
const createWorkflow = trpc.workflows.create.useMutation({
  onError: (error) => {
    if (error.data?.code === 'BAD_REQUEST') {
      // Show validation errors in form
      setFormErrors(error.data.zodError?.fieldErrors || {});
    }
  },
  onSuccess: () => {
    toast.success('Workflow created successfully');
  }
});
```

---

## tRPC API Summary & Benefits

### Simplified Type-Safe Architecture
This unified tRPC design reduces complexity while maintaining full functionality:

- **Type-Safe Procedures** with end-to-end TypeScript support
- **4 Clear Patterns** (Resources + Actions + Views + Events)
- **Unified Access** for both human operators and AI agents
- **Zod Validation** across all inputs and outputs
- **Atomic Actions** that coordinate across multiple resources

### Developer Experience
- **End-to-end type safety** from database to frontend
- **Automatic TypeScript inference** for all procedures
- **Single procedure calls** replace complex multi-request operations
- **Real-time coordination** through tRPC subscriptions
- **Optimized dashboard data** through unified view procedures
- **Built-in error handling** with structured error responses

### Performance Benefits
- **75% fewer API calls** for common operations
- **Single-request dashboard loading** via `views.dashboard`
- **Efficient filtering** with validated input schemas
- **Real-time updates** eliminate polling overhead
- **Optimized database queries** through view procedures
- **Request/response caching** built into tRPC client

### Type Safety Benefits
- **Compile-time validation** prevents runtime errors
- **Automatic API documentation** from TypeScript types
- **Refactoring safety** with IDE support across full stack
- **Input validation** with detailed Zod error messages
- **Response type guarantees** eliminate manual type assertions

### MCP Server Integration
The type-safe, consistent tRPC procedures make it easy to expose all functionality through an MCP server for AI agent access, ensuring both human operators and AI agents work with the same reliable, validated interface.

---

*This tRPC API design provides a clean, type-safe interface that serves both human operators and AI agents while dramatically reducing complexity, improving performance, and ensuring type safety across the entire application stack.*
      },
      "version": 1,
      "createdAt": "2025-06-28T10:35:00Z"
    }
  ],
  "communications": [
    {
      "id": "comm-456",
      "type": "email",
      "subject": "HOA Document Request",
      "participants": [
        {"email": "manager@sunsethills.com", "role": "counterparty"},
        {"email": "sarah@rexera.com", "role": "hil"}
      ],
      "status": "SENT",
      "createdAt": "2025-06-28T09:00:00Z"
    }
  ],
  "sla": {
    "trackingId": "sla-789",
    "status": "ACTIVE",
    "dueAt": "2025-06-30T17:00:00Z",
    "timeRemaining": 7200,
    "riskLevel": "GREEN"
  }
}
```

#### GET `/api/workflows/statistics`
Real-time workflow statistics for dashboard monitoring.

**Query Parameters:**
- `date` (optional): Filter by specific date
- `hilId` (optional): Filter by HIL operator

**Response:**
```json
{
  "totalWorkflows": 247,
  "activeWorkflows": 156,
  "completedToday": 7,
  "workflowsWithInterrupts": 12,
  "avgCompletionTimeHours": 4.2,
  "slaBreachCount": 2,
  "workflowsByType": {
    "MUNI_LIEN_SEARCH": 89,
    "HOA_ACQUISITION": 102,
    "PAYOFF": 56
  },
  "lastUpdated": "2025-06-28T10:45:00Z"
}
```

#### GET `/api/documents`
Retrieve documents with filtering support, including workflow deliverables.

**Query Parameters:**
- `workflowId` (optional): Filter by workflow
- `document_type` (optional): Filter by document type (`DELIVERABLE`, `ATTACHMENT`, `COMMUNICATION`)
- `status` (optional): Filter by status
- `limit` (default: 50): Number of documents
- `offset` (default: 0): Pagination offset

**Response:**
```json
{
  "documents": [
    {
      "id": "<UUID>",
      "workflowId": "<UUID>",
      "filename": "muni_lien_search_results.pdf",
      "url": "https://s3.../muni_lien_search_results.pdf",
      "document_type": "DELIVERABLE",
      "status": "COMPLETED",
      "deliverable_data": {
        "property": {
          "address": "123 Main St, Anytown, ST 12345",
          "parcelId": "ABC-123-456"
        },
        "searchResults": {
          "liensFound": [
            {
              "type": "tax_lien",
              "amount": 1500.00,
              "status": "active",
              "filingDate": "2024-03-15"
            }
          ],
          "totalLienAmount": 1500.00,
          "searchCompletedAt": "2025-06-28T14:30:00Z"
        }
      },
      "version": 2,
      "createdAt": "2025-06-28T14:35:00Z",
      "updatedAt": "2025-06-28T14:35:00Z"
    }
  ],
  "totalCount": 15,
  "hasMore": false
}
```

#### POST `/api/documents`
Create new document including workflow deliverables with structured data.

**Request Body:**
```json
{
  "workflowId": "<UUID>",
  "filename": "hoa_acquisition_results.pdf",
  "url": "https://s3.../hoa_acquisition_results.pdf",
  "document_type": "DELIVERABLE",
  "status": "DRAFT",
  "deliverable_data": {
    "property": {
      "address": "123 Main St, Anytown, ST 12345",
      "hoaName": "Sunset Hills HOA"
    },
    "documentsObtained": [
      {
        "type": "bylaws",
        "filename": "hoa_bylaws.pdf",
        "obtainedAt": "2025-06-28T14:30:00Z"
      },
      {
        "type": "financials",
        "filename": "hoa_financials_2024.pdf",
        "obtainedAt": "2025-06-28T14:35:00Z"
      }
    ],
    "acquisitionCompletedAt": "2025-06-28T14:35:00Z"
  },
  "changeSummary": "Initial deliverable creation with obtained documents"
}
```

**Response:**
```json
{
  "documentId": "<UUID>",
  "version": 1,
  "status": "DRAFT",
  "timestamp": "2025-06-28T14:35:00Z"
}
```

### Task Management

#### POST `/api/tasks/[id]/action`
Execute unified task actions including complete, retry, pause, and other operations.

**Request Body:**
```json
{
  "action": "complete", // "complete", "retry", "pause", "resume", "escalate"
  "userId": "<UUID>",
  "data": {
    "result": {
      "action": "CREDENTIALS_UPDATED",
      "notes": "Updated portal credentials, agent can retry",
      "nextSteps": ["retry-portal-access"]
    },
    "reason": "Credential issue resolved", // for retry/escalate actions
    "resetRetryCount": false, // for retry actions
    "agentOverride": "Rex" // for retry actions
  }
}
```

**Response:**
```json
{
  "status": "completed", // "retrying", "paused", "resumed", "escalated"
  "taskId": "<UUID>",
  "workflowResumed": true,
  "estimatedStart": "2025-06-28T11:00:00Z", // for retry actions
  "executionId": "<UUID>" // new execution ID for retry actions
}
```

#### GET `/api/tasks/[id]/timeline`
Retrieves complete timeline of events for a specific task with simplified response format.

**Response:**
```json
{
  "events": [
    {
      "id": "<UUID>",
      "taskId": "<UUID>",
      "eventType": "STARTED",
      "agentName": "Nina",
      "description": "Task started by Nina agent",
      "eventData": {
        "confidence": 0.95,
        "estimatedDuration": 300
      },
      "timestamp": "2025-06-28T10:00:00Z"
    },
    {
      "id": "<UUID>",
      "taskId": "<UUID>",
      "eventType": "COMPLETED",
      "agentName": "Nina",
      "description": "Contact research completed successfully",
      "eventData": {
        "confidence": 0.92,
        "actualDuration": 280,
        "contactsFound": 3
      },
      "timestamp": "2025-06-28T10:04:40Z"
    },
    {
      "id": "<UUID>",
      "taskId": "<UUID>",
      "eventType": "RETRIED",
      "agentName": "Rex",
      "description": "Task retried with agent override",
      "eventData": {
        "reason": "Credential issue resolved",
        "executionNumber": 2
      },
      "timestamp": "2025-06-28T11:00:00Z"
    }
  ],
  "totalEvents": 3,
  "taskStatus": "IN_PROGRESS"
}
```

### Communication APIs

#### GET `/api/communications`
Retrieve unified communications (emails, messages, calls, SMS) with filtering and threading support.

**Query Parameters:**
- `workflowId` (optional): Filter by workflow
- `taskId` (optional): Filter by task
- `type` (optional): Filter by communication type (`email`, `message`, `call`, `sms`)
- `threadId` (optional): Filter by specific thread
- `status` (optional): Filter by status
- `priority` (optional): Filter by priority level
- `isClientVisible` (boolean): Filter by client visibility
- `limit` (default: 20): Number of communications
- `offset` (default: 0): Pagination offset

**Response:**
```json
{
  "communications": [
    {
      "id": "<UUID>",
      "workflowId": "<UUID>",
      "taskId": "<UUID>",
      "type": "email",
      "threadId": "<UUID>",
      "participants": [
        {
          "email": "client@example.com",
          "role": "client",
          "name": "John Doe"
        },
        {
          "email": "sarah@rexera.com",
          "role": "hil",
          "name": "Sarah Johnson"
        }
      ],
      "subject": "HOA Document Request Status",
      "content": "What's the ETA for the HOA documents?",
      "metadata": {
        "direction": "INBOUND",
        "messageId": "msg-123@client.com"
      },
      "status": "DELIVERED",
      "priority": "NORMAL",
      "isClientVisible": true,
      "sentimentScore": 0.1,
      "urgencyDetected": false,
      "readAt": null,
      "timestamp": "2025-06-28T10:30:00Z"
    }
  ],
  "totalCount": 45,
  "hasMore": true
}
```

#### POST `/api/communications`
Send unified communication (email, message, call log, SMS) with flexible participant support.

**Request Body:**
```json
{
  "workflowId": "<UUID>",
  "taskId": "<UUID>", // optional
  "type": "email", // "email", "message", "call", "sms"
  "threadId": "<UUID>", // optional, for replies
  "participants": [
    {
      "email": "client@example.com",
      "role": "recipient",
      "name": "John Doe"
    },
    {
      "email": "sarah@rexera.com",
      "role": "sender",
      "name": "Sarah Johnson"
    }
  ],
  "subject": "HOA Document Update", // for emails
  "content": "The ETA for HOA documents is 3-5 business days",
  "metadata": {
    "direction": "OUTBOUND",
    "ccAddresses": ["supervisor@rexera.com"],
    "trackDelivery": true
  },
  "priority": "NORMAL",
  "isClientVisible": true,
  "attachments": [
    {
      "filename": "hoa_status_update.pdf",
      "url": "https://s3.../hoa_status_update.pdf",
      "mimeType": "application/pdf"
    }
  ]
}
```

**Response:**
```json
{
  "communicationId": "<UUID>",
  "status": "SENT",
  "threadId": "<UUID>",
  "deliveryTracking": {
    "enabled": true,
    "expectedDelivery": "2025-06-28T10:31:00Z"
  },
  "timestamp": "2025-06-28T10:30:00Z"
}
```


### Counterparty Management

#### GET `/api/counterparties`
Retrieve counterparties filtered by type with search capabilities.

**Query Parameters:**
- `type` (required): One of `hoa`, `lender`, `municipality`, `utility`, `tax_authority`
- `search` (optional): Search by name or contact info
- `limit` (default: 50): Number of results

**Response:**
```json
{
  "counterparties": [
    {
      "id": "<UUID>",
      "type": "hoa",
      "name": "Sunset Hills HOA",
      "email": "manager@sunsethills.com",
      "phone": "(555) 123-4567",
      "address": "123 Management Way, City, ST 12345",
      "website": "https://sunsethills.com",
      "notes": "Responsive management company",
      "metadata": {
        "managementCompany": "ABC Property Management",
        "established": "2010",
        "units": 150
      },
      "createdAt": "2025-06-28T10:00:00Z",
      "updatedAt": "2025-06-28T10:00:00Z"
    }
  ],
  "totalCount": 45,
  "hasMore": false
}
```

#### POST `/api/workflows/[id]/counterparties`
Link an existing counterparty to a workflow with status tracking.

**Request Body:**
```json
{
  "counterpartyId": "<UUID>",
  "status": "pending",
  "eta": "2025-06-30T17:00:00Z",
  "contactNotes": "Initial contact made via phone",
  "documentsRequested": ["bylaws", "financials", "meeting_minutes"]
}
```

**Response:**
- `200 OK`: `{ "status": "linked", "workflowCounterpartyId": "<UUID>" }`

### Agent Performance & Monitoring

#### GET `/api/agents/performance`
Comprehensive agent performance metrics and analytics.

**Query Parameters:**
- `agent` (optional): Filter by specific agent name
- `taskType` (optional): Filter by task type
- `days` (default: 30): Time period for metrics

**Response:**
```json
{
  "metrics": [
    {
      "agentName": "Nina",
      "taskType": "research-contact",
      "successRate": 92.5,
      "avgProcessingTimeMs": 12000,
      "avgConfidenceScore": 0.89,
      "totalTasksCompleted": 156,
      "totalTasksFailed": 12,
      "avgCostPerTask": 0.15,
      "slaComplianceRate": 94.2,
      "dateCalculated": "2025-06-28"
    }
  ],
  "systemOverview": {
    "totalAgents": 10,
    "activeAgents": 8,
    "systemUtilization": 67,
    "avgSystemResponseTime": 8500
  }
}
```

#### GET `/api/agents/utilization/real-time`
Real-time agent utilization across all active workflows.

**Response:**
```json
{
  "agents": [
    {
      "name": "Nina",
      "currentTasks": 2,
      "maxConcurrent": 3,
      "utilizationPct": 67,
      "avgTaskDuration": "8.2min",
      "successRate": 92.5,
      "currentWorkflows": ["wf-123", "wf-456"],
      "queuedTasks": 1,
      "estimatedAvailableAt": "2025-06-28T10:45:00Z",
      "status": "ACTIVE"
    },
    {
      "name": "Rex",
      "currentTasks": 0,
      "maxConcurrent": 3,
      "utilizationPct": 0,
      "status": "AVAILABLE",
      "lastTaskCompleted": "2025-06-28T10:18:00Z",
      "lastTaskResult": "FAILED"
    }
  ],
  "systemUtilization": 45,
  "totalActiveWorkflows": 12,
  "totalActiveTasks": 28
}
```

### Document & File Management

#### POST `/api/files/[id]/tag`
Add or update tags for intelligent file categorization.

**Request Body:**
```json
{
  "tags": [
    {
      "name": "document_type",
      "value": "bylaws"
    },
    {
      "name": "priority",
      "value": "high"
    },
    {
      "name": "review_status",
      "value": "approved"
    }
  ]
}
```

**Response:**
- `200 OK`: `{ "status": "tagged", "tagsAdded": 3 }`


### SLA Monitoring & Alerts

#### GET `/api/sla`
Unified SLA tracking and alerts endpoint with comprehensive monitoring data.

**Query Parameters:**
- `status` (optional): Filter by SLA status (`ACTIVE`, `COMPLETED`, `BREACHED`, `PAUSED`)
- `workflowType` (optional): Filter by workflow type
- `agentName` (optional): Filter by agent
- `alertLevel` (optional): Filter by alert level (`GREEN`, `YELLOW`, `ORANGE`, `RED`)
- `includeAlerts` (boolean, default: true): Include active alerts in response
- `includeMetrics` (boolean, default: true): Include summary metrics

**Response:**
```json
{
  "tracking": [
    {
      "id": "<UUID>",
      "taskId": "<UUID>",
      "workflowId": "<UUID>",
      "agentName": "Nina",
      "taskType": "research-contact",
      "startedAt": "2025-06-28T10:00:00Z",
      "dueAt": "2025-06-28T11:00:00Z",
      "status": "ACTIVE",
      "timeRemaining": 1800,
      "progressPercentage": 70,
      "riskLevel": "GREEN",
      "breachMinutes": 0
    },
    {
      "id": "<UUID>",
      "taskId": "<UUID>",
      "workflowId": "<UUID>",
      "agentName": "Rex",
      "taskType": "portal-access",
      "startedAt": "2025-06-28T09:30:00Z",
      "dueAt": "2025-06-28T10:30:00Z",
      "status": "ACTIVE",
      "timeRemaining": -1080,
      "progressPercentage": 120,
      "riskLevel": "RED",
      "breachMinutes": 18
    }
  ],
  "alerts": [
    {
      "id": "<UUID>",
      "trackingId": "<UUID>",
      "alertLevel": "RED",
      "alertThresholdPct": 100,
      "triggeredAt": "2025-06-28T10:30:00Z",
      "taskId": "<UUID>",
      "workflowId": "<UUID>",
      "agentName": "Rex",
      "alertMessage": "SLA breached - task exceeded deadline by 18 minutes",
      "isResolved": false,
      "escalatedAt": "2025-06-28T10:45:00Z",
      "escalatedTo": "<UUID>",
      "estimatedResolution": "2025-06-28T11:30:00Z"
    }
  ],
  "metrics": {
    "totalActiveSLAs": 45,
    "onTime": 38,
    "atRisk": 5,
    "breached": 2,
    "complianceRate": 84.4,
    "avgBreachMinutes": 12.5,
    "alertCounts": {
      "GREEN": 38,
      "YELLOW": 3,
      "ORANGE": 2,
      "RED": 2
    }
  },
  "lastUpdated": "2025-06-28T10:50:00Z"
}
```

### HIL Notification System

#### GET `/api/notifications`
Retrieve notifications for HIL users with filtering, pagination, and unread count.

**Query Parameters:**
- `unread_only` (boolean): Only unread notifications
- `type` (optional): Filter by notification type
- `priority` (optional): Filter by priority level
- `limit` (default: 50): Number of notifications
- `offset` (default: 0): Pagination offset

**Response:**
```json
{
  "notifications": [
    {
      "id": "<UUID>",
      "type": "TASK_INTERRUPT",
      "title": "Task Failed: portal-access",
      "message": "Rex encountered an error in HOA_ACQUISITION: Credentials rejected by portal",
      "priority": "HIGH",
      "context": {
        "workflowId": "abc-123",
        "taskId": "def-456",
        "agentName": "Rex",
        "actionUrl": "/workflows/abc-123/tasks/def-456",
        "errorCode": "AUTH_FAILED",
        "retryCount": 3
      },
      "readAt": null,
      "timestamp": "2025-06-28T10:18:00Z"
    },
    {
      "id": "<UUID>",
      "type": "SLA_WARNING",
      "title": "SLA Alert: Task Approaching Deadline",
      "message": "Task 'research-contact' is 80% through its SLA window",
      "priority": "HIGH",
      "context": {
        "workflowId": "def-789",
        "taskId": "ghi-012",
        "agentName": "Nina",
        "actionUrl": "/workflows/def-789/tasks/ghi-012",
        "alertLevel": "ORANGE",
        "timeRemaining": 720
      },
      "readAt": "2025-06-28T10:25:00Z",
      "timestamp": "2025-06-28T10:20:00Z"
    }
  ],
  "pagination": {
    "total": 47,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  },
  "counts": {
    "unreadCount": 12,
    "urgentCount": 3,
    "byType": {
      "TASK_INTERRUPT": 5,
      "SLA_WARNING": 3,
      "HIL_MENTION": 2,
      "CLIENT_MESSAGE_RECEIVED": 1,
      "COUNTERPARTY_MESSAGE_RECEIVED": 1,
      "AGENT_FAILURE": 1
    },
    "byPriority": {
      "LOW": 8,
      "NORMAL": 25,
      "HIGH": 12,
      "URGENT": 2
    }
  },
  "lastUpdated": "2025-06-28T10:30:00Z"
}
```

## Backward Compatibility

The following endpoints have been consolidated or removed in this simplified API design:

### Removed Endpoints (Consolidated)
- **GET** `/api/workflows/[id]/files` → Use `GET /api/workflows/[id]?include=files`
- **GET** `/api/workflows/[id]/outputs` → Use `GET /api/workflows/[id]?include=outputs` (returns deliverable documents)
- **POST** `/api/workflows/[id]/outputs` → Use `POST /api/documents` with `document_type=DELIVERABLE`
- **GET** `/api/workflows/[id]/email-threads` → Use `GET /api/communications?workflowId=[id]&type=email`
- **GET** `/api/messages/[wfId]` → Use `GET /api/communications?workflowId=[wfId]`
- **POST** `/api/messages/send` → Use `POST /api/communications`
- **POST** `/api/email-threads/[id]/reply` → Use `POST /api/communications` with `threadId`
- **POST** `/api/tasks/[id]/complete` → Use `POST /api/tasks/[id]/action` with `action: "complete"`
- **POST** `/api/tasks/[id]/retry` → Use `POST /api/tasks/[id]/action` with `action: "retry"`
- **GET** `/api/sla/tracking` → Use `GET /api/sla`
- **GET** `/api/sla/alerts` → Use `GET /api/sla?includeAlerts=true`
- **GET** `/api/notifications/unread-count` → Included in `GET /api/notifications` response

### Migration Guide
1. **Workflow Data Access**: Replace separate file/output requests with single workflow request using `include` parameter
2. **Workflow Deliverables**: Replace `/api/workflows/[id]/outputs` endpoints with `/api/documents` endpoints using `document_type=DELIVERABLE`
3. **Communication**: Update all message/email endpoints to use unified `/api/communications` endpoints
4. **Task Actions**: Replace specific task action endpoints with unified `/api/tasks/[id]/action` endpoint
5. **SLA Monitoring**: Use single `/api/sla` endpoint with query parameters for filtering
6. **Notifications**: Use main notifications endpoint which now includes unread counts

### Response Format Changes
- **Timestamps**: Unified to single `timestamp` field instead of `createdAt`/`updatedAt` where appropriate
- **Metadata**: Flattened nested metadata objects into `context` or direct fields
- **Participants**: Communication participants now use structured array format
- **Counts**: Notification and SLA counts embedded in main response objects
- **Deliverables**: Workflow outputs now returned as documents with `document_type=DELIVERABLE` and structured `deliverable_data` field

## Webhook APIs (n8n Integration)

All webhook endpoints require authentication header: `x-api-key: <N8N_WEBHOOK_KEY>`

### POST `/webhooks/workflows/new`
Entry point to start any workflow type in n8n orchestration layer.

**Payload:** Same as REST `/api/workflows/new`
**Response:** `{ "workflowId": "<UUID>", "executionId": "<n8n-execution-id>" }`

### POST `/webhooks/muni-lien`
Initiate Municipal Lien Search workflow with specialized parameters.

**Payload:**
```json
{
  "workflowId": "<UUID>",
  "payload": {
    "address": "123 Main St, Anytown, ST 12345",
    "county": "Orange County",
    "parcelNumber": "123-456-789",
    "searchTypes": ["tax_liens", "utility_liens", "municipal_liens"]
  },
  "hilId": "<UUID>",
  "managerHilId": "<UUID>"
}
```

### POST `/webhooks/hoa-acquisition`
Initiate HOA Document Acquisition workflow.

**Payload:**
```json
{
  "workflowId": "<UUID>",
  "payload": {
    "address": "123 Main St, Anytown, ST 12345",
    "hoaName": "Sunset Hills HOA",
    "documentsRequested": ["bylaws", "financials", "meeting_minutes"],
    "urgency": "NORMAL"
  }
}
```

### POST `/webhooks/payoff`
Initiate Mortgage Payoff Request workflow.

**Payload:**
```json
{
  "workflowId": "<UUID>",
  "payload": {
    "address": "123 Main St, Anytown, ST 12345",
    "borrowerName": "John Doe",
    "lenderName": "ABC Mortgage",
    "loanNumber": "12345678",
    "requestedBy": "2025-07-01T00:00:00Z"
  }
}
```

### POST `/webhooks/tasks/:id/action`
Execute task actions and resume workflow execution.

**Payload:**
```json
{
  "taskId": "<UUID>",
  "action": "complete", // "complete", "retry", "escalate"
  "userId": "<UUID>",
  "data": {
    "result": {
      "action": "MANUAL_COMPLETION",
      "data": { /* task-specific result data */ },
      "notes": "Completed manually due to portal issue"
    },
    "reason": "Credential issue resolved", // for retry/escalate
    "agentOverride": "Rex" // for retry actions
  }
}
```

**Response:**
```json
{
  "status": "completed", // "retrying", "escalated"
  "taskId": "<UUID>",
  "executionId": "<UUID>", // for retry actions
  "workflowResumed": true,
  "timestamp": "2025-06-28T11:00:00Z"
}
```

## Real-Time Communication

### WebSocket `/ws/notifications`
Real-time notification delivery for HIL dashboard updates.

**Authentication:** JWT token in connection query parameter
**Message Format:**
```json
{
  "type": "NOTIFICATION",
  "data": {
    "id": "<UUID>",
    "type": "TASK_INTERRUPT",
    "title": "Task Failed: portal-access",
    "message": "Rex encountered an error in HOA_ACQUISITION: Credentials rejected by portal",
    "priority": "HIGH",
    "context": {
      "workflowId": "abc-123",
      "taskId": "def-456",
      "agentName": "Rex",
      "actionUrl": "/workflows/abc-123/tasks/def-456",
      "errorCode": "AUTH_FAILED"
    },
    "readAt": null,
    "timestamp": "2025-06-28T10:18:00Z"
  }
}
```

### WebSocket `/ws/workflow-updates`
Real-time workflow status and progress updates.

**Message Format:**
```json
{
  "type": "WORKFLOW_UPDATE",
  "workflowId": "<UUID>",
  "data": {
    "status": "IN_PROGRESS",
    "progress": {
      "completedTasks": 9,
      "totalTasks": 12,
      "progressPercentage": 75
    },
    "lastUpdate": "2025-06-28T14:30:00Z"
  }
}
```

## Authentication & Security

### JWT Token Structure
```json
{
  "sub": "<user-uuid>",
  "email": "user@example.com",
  "role": "HIL",
  "userType": "hil_user",
  "companyId": null,
  "iat": 1640995200,
  "exp": 1641081600
}
```

### API Rate Limiting
- **REST APIs:** 1000 requests/hour per user
- **WebSocket:** 100 connections per user
- **Webhook APIs:** 10,000 requests/hour per API key

### Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid workflow type specified",
    "details": {
      "field": "workflowType",
      "allowedValues": ["MUNI_LIEN_SEARCH", "HOA_ACQUISITION", "PAYOFF"]
    },
    "timestamp": "2025-06-28T10:18:00Z",
    "requestId": "<UUID>"
  }
}
```

---

## Summary of API Simplifications

This simplified API specification reduces complexity while maintaining full functionality:

### Key Consolidations:
- **Workflow Data Access**: Single endpoint with `include` parameter replaces 3 separate endpoints
- **Workflow Deliverables**: Deliverables now managed through documents system with `document_type=DELIVERABLE`, eliminating separate workflow outputs tables
- **Communication System**: Unified `/api/communications` handles emails, messages, calls, and SMS
- **Task Management**: Single `/api/tasks/[id]/action` endpoint replaces multiple action-specific endpoints
- **SLA Monitoring**: Combined tracking and alerts in single `/api/sla` endpoint
- **Notifications**: Unified response includes counts, eliminating separate count endpoint

### Benefits:
- **Reduced API Surface**: 13 fewer endpoints to maintain and document
- **Consistent Response Formats**: Standardized timestamp and metadata structures
- **Flexible Data Loading**: Include parameters allow efficient data fetching
- **Simplified Integration**: Fewer endpoints reduce client complexity
- **Better Performance**: Consolidated endpoints reduce round trips
- **Unified Document Management**: Deliverables leverage existing documents system with structured data support

### Developer Experience:
- Clear migration path from old endpoints
- Backward compatibility documentation
- Consistent error handling across all endpoints
- Unified authentication and rate limiting

*This simplified API specification serves as the definitive reference for all Rexera 2.0 integrations, providing streamlined coverage of workflow automation, AI agent coordination, and real-time communication patterns with reduced complexity and improved developer experience.*