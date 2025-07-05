# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Core Principles
- **BE VERY CAREFUL ABOUT ADDING UNNECESSARY COMPLEXITY IN THE CODE. OPTIMIZE FOR DEVELOPER EASE.**
- **KEEP CODE CLEAN AND CONSISTENT** - Follow established patterns and conventions
- **MAINTAIN TYPE SAFETY** - Use TypeScript properly with strict mode
- **EMBRACE MODERN PATTERNS** - Leverage Zod, Turbo, and modern tooling effectively
## Development Commands

### Root Level Commands (using Turbo + pnpm)
- `pnpm dev` - Start all services in development mode (Turbo orchestrated)
- `pnpm build` - Build all packages in dependency order
- `pnpm test` - Run tests across all packages
- `pnpm lint` - Lint all packages
- `pnpm type-check` - Type check all packages  
- `pnpm clean` - Clean build artifacts

### Database Operations
- `pnpm db:migrate` - Run database migrations
- `pnpm db:seed` - Seed database with initial data
- `npx supabase gen types typescript` - Generate TypeScript types from Supabase schema

### Testing
- `pnpm e2e` - Run end-to-end tests with Playwright
- `pnpm --filter agents test` - Run agent integration tests

### Deployment
- `pnpm deploy:staging` - Deploy to staging environment
- `pnpm deploy:prod` - Deploy to production environment

## Architecture Overview

Rexera 2.0 is an AI-powered real estate workflow automation platform with a sophisticated **dual-layer architecture**:

### Layer 1: Technical Orchestration (n8n Cloud)
- Handles complex workflow logic and AI agent coordination
- Manages external API integrations and data transformations
- Provides robust error handling and retry mechanisms
- Executes 3 core workflow types: Municipal Lien Search, HOA Acquisition, Payoff Request

### Layer 2: Business Visibility (PostgreSQL + Next.js)
- Provides human-friendly interfaces for HIL (Human-in-the-Loop) operators
- Stores business-critical data and relationships in 35+ PostgreSQL tables
- Enables real-time reporting and analytics
- Supports cross-workflow coordination and SLA monitoring

### Key Components

**Frontend (frontend/)**: Next.js 14 application with TypeScript, Tailwind CSS, and shadcn/ui components. Features real-time dashboard updates via WebSocket connections. UI-focused with no API routes.

**API (api/)**: Standalone API service providing all endpoints for workflows, agents, tasks, and communications. Deployed separately on Vercel.

**Database (supabase/)**: Supabase PostgreSQL setup with Row-Level Security, migrations, and configuration. Contains comprehensive schema for workflows, tasks, agents, and business entities.

**Workflows (workflows/)**: n8n workflow definitions and validation scripts for orchestrating AI agent coordination.

**Agents (agents/)**: Integration system for 10 specialized AI agents:
- Nina 🔍 (Research & Data Discovery)
- Mia 📧 (Email Communication)
- Florian 🗣️ (Phone Outreach)
- Rex 🌐 (Web Portal Navigation)
- Iris 📄 (Document Processing)
- Ria 🤝 (Support & Coordination)
- Kosha 💰 (Financial Analysis)
- Cassy ✓ (Quality Assurance)
- Max 📞 (IVR Navigation)
- Corey 🏢 (HOA Specialized Analysis)

**Types & Schemas (packages/)**: Organized type system with clear separation:
- `packages/types/` - Shared enums, utility types, external service interfaces
- `packages/schemas/` - Zod validation schemas for all API endpoints

## Monorepo Architecture

This project uses a **Turbo + pnpm** monorepo setup for optimal performance and developer experience.

### Technology Stack

**🏗️ Architecture & Build System**
- **Monorepo**: Turborepo for task orchestration and caching
- **Package Manager**: pnpm for fast, efficient dependency management
- **Platform**: AI-powered real estate workflow automation with dual-layer architecture (n8n Cloud + PostgreSQL)

**🎨 Frontend Stack**
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui + Radix UI primitives
- **State Management**: Zustand + TanStack Query
- **Data Fetching**: tRPC + TanStack React Query
- **Theming**: next-themes for dark/light mode

**⚡ Backend API Stack**
- **Runtime**: Node.js with Express
- **Language**: TypeScript
- **API Architecture**: tRPC + REST endpoints
- **Validation**: Zod schemas for runtime type safety
- **Authentication**: JWT with Google SSO (jose library)
- **Middleware**: CORS, custom auth middleware

**🗄️ Database & Infrastructure**
- **Database**: Supabase PostgreSQL with Row-Level Security (RLS)
- **Real-time**: Supabase subscriptions + WebSocket connections
- **Workflow Engine**: n8n Cloud for orchestration
- **Deployment**: Vercel for frontend and API
- **File Storage**: Supabase storage for document management

**🤖 AI & Automation**
- **AI Agents**: 10 specialized agents with HTTP API integration
- **Workflow Types**: 3 core workflows (Municipal Lien Search, HOA Acquisition, Payoff Request)
- **Communication**: Standardized JSON request/response format
- **Error Handling**: Automatic retry with exponential backoff, HIL escalation

**🔧 Development & Testing Tools**
- **Build System**: Turborepo with intelligent caching
- **Testing**: Jest (unit/integration) + Playwright (E2E)
- **Code Quality**: ESLint + Prettier
- **Type Safety**: Strict TypeScript with custom type packages
- **Development**: Hot reload, concurrent dev servers

### Workspace Structure
```
├── frontend/           # Next.js 14 application
├── api/               # Standalone API service  
├── agents/            # AI agent integration system
├── workflows/         # n8n workflow definitions
├── supabase/          # Database schema and migrations
└── packages/
    ├── types/         # Shared enums, utilities, external interfaces
    └── schemas/       # Zod validation schemas for APIs
```

### Package Management
- **Workspace Dependencies**: Use `workspace:*` for internal packages
- **Script Execution**: Use `pnpm --filter <package>` for workspace-specific commands  
- **Caching**: Turbo handles build caching and dependency graphs
- **Package Structure**:
  - `@rexera/types` - Shared enums, utilities, external service interfaces
  - `@rexera/schemas` - Zod validation schemas for all API endpoints

## Authentication & Security

- Google SSO integration with JWT tokens
- Row-Level Security (RLS) policies in PostgreSQL
- Role-based access control for HIL operators, managers, and clients
- All API communications encrypted with TLS 1.3

## Real-Time Features

The system uses WebSocket connections for live updates:
- Workflow status changes
- Task execution updates
- HIL notifications and alerts
- Cross-workflow coordination events

## Integration Patterns & Workflow Execution

### **Dual-Layer Workflow Execution Pattern**

Rexera implements a sophisticated dual-layer architecture where **n8n Cloud orchestrates technical execution** while **PostgreSQL maintains business state** for real-time visibility and reporting.

### **Complete Workflow Example: Mortgage Payoff Request**

#### **1. Workflow Initiation**
```typescript
// Frontend creates workflow via tRPC
const workflow = await trpc.workflows.create.mutate({
  workflow_type: 'PAYOFF',
  client_id: 'client-123',
  title: 'Payoff Request - 123 Main St',
  metadata: {
    property: { address: '123 Main St', loanNumber: 'LOAN-2024-001' },
    borrower: { name: 'John Doe', email: 'john.doe@example.com' }
  }
});

// Automatically triggers n8n workflow
await triggerN8nPayoffWorkflow({
  rexeraWorkflowId: workflow.id,
  workflowType: 'PAYOFF',
  metadata: workflow.metadata
});
```

#### **2. Agent Orchestration in n8n**
```json
// n8n workflow nodes call AI agents sequentially
{
  "nodes": [
    {
      "name": "Nina Research",
      "type": "httpRequest",
      "url": "/api/agents/nina/execute",
      "body": {
        "taskType": "identify_lender_contact",
        "payload": { "loanNumber": "LOAN-2024-001" }
      }
    },
    {
      "name": "Communication Switch",
      "type": "switch",
      "conditions": [
        { "if": "phone_preferred", "route": "Florian Phone Call" },
        { "if": "ivr_system", "route": "Max IVR Navigation" }
      ]
    },
    {
      "name": "Florian Phone Call",
      "url": "/api/agents/florian/execute",
      "body": { "taskType": "request_payoff_statement" }
    },
    {
      "name": "Iris Email Monitor",
      "url": "/api/agents/iris/execute", 
      "body": { "taskType": "monitor_payoff_email" }
    },
    {
      "name": "Cassy Validation",
      "url": "/api/agents/cassy/execute",
      "body": { "taskType": "validate_payoff_statement" }
    }
  ]
}
```

#### **3. Real-Time Database Synchronization**
```typescript
// n8n sends webhooks to sync PostgreSQL state
router.post('/api/webhook/n8n', async (req) => {
  const event = validateWebhookEvent(req.body);
  
  switch (event.eventType) {
    case 'workflow_started':
      await supabase.from('workflows').update({
        n8n_execution_id: event.executionId,
        status: 'IN_PROGRESS'
      }).eq('id', event.data.rexeraWorkflowId);
      
    case 'agent_task_completed':
      await supabase.from('tasks').update({
        status: 'COMPLETED',
        metadata: { agent_result: event.data.result }
      }).eq('id', event.data.taskId);
      
    case 'workflow_completed':
      await supabase.from('workflows').update({
        status: 'COMPLETED',
        metadata: { payoffAmount: '$284,567.89' }
      }).eq('id', event.data.rexeraWorkflowId);
  }
});
```

#### **4. Error Handling & HIL Escalation**
```typescript
// Automatic error escalation to Human-in-the-Loop
case 'error_occurred':
  await supabase.from('workflows').update({
    status: 'BLOCKED',  // Triggers HIL dashboard alert
    metadata: {
      n8n_error: event.data.error,
      n8n_error_node: event.data.nodeId,
      escalation_reason: 'Agent task failed - requires manual intervention'
    }
  });
```

### **Core Integration Patterns**

**🔄 Workflow Triggering**: tRPC creates PostgreSQL record → triggers n8n via API → links with `n8n_execution_id`

**📡 Real-Time Sync**: n8n webhooks → PostgreSQL updates → Supabase real-time → Frontend updates

**🤖 Agent Coordination**: n8n orchestrates 10 specialized AI agents via HTTP APIs with standardized JSON payloads

**⚠️ Error Handling**: n8n errors → PostgreSQL BLOCKED status → HIL dashboard alerts → Manual intervention

**📊 Business Reporting**: All execution data flows to PostgreSQL for analytics, SLA tracking, and cross-workflow coordination

### **n8n Workflow Development Process**

#### **1. Environment Setup**
```bash
N8N_API_KEY=your_api_key
N8N_BASE_URL=https://rexera2.app.n8n.cloud
N8N_PAYOFF_WORKFLOW_ID=workflow-id
```

#### **2. Workflow Creation & Management**
```bash
# Import workflow from JSON
npm run workflow:import-payoff

# Test workflow with sample data  
npm run workflow:test-payoff

# Activate workflow in n8n
npm run workflow -- activate <workflow-id>

# Monitor executions
npm run workflow -- executions <workflow-id>
```

#### **3. Workflow JSON Structure**
```json
{
  "name": "Mortgage Payoff Request Workflow",
  "nodes": [
    {
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "parameters": { "path": "payoff-request" }
    },
    {
      "name": "Agent HTTP Call",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "={{ $json.rexeraApiUrl }}/api/agents/nina/execute",
        "body": { "taskType": "research_task", "payload": "={{ $json }}" }
      }
    },
    {
      "name": "Update Database",
      "type": "n8n-nodes-base.httpRequest", 
      "parameters": {
        "url": "={{ $json.rexeraApiUrl }}/api/webhook/n8n",
        "body": {
          "eventType": "agent_task_completed",
          "data": { "result": "={{ $json }}" }
        }
      }
    }
  ],
  "connections": {
    "Webhook Trigger": { "main": [["Agent HTTP Call"]] },
    "Agent HTTP Call": { "main": [["Update Database"]] }
  }
}
```

This architecture enables **complex multi-agent workflows** with **real-time business visibility**, **automatic error handling**, and **seamless human intervention** when needed.

## Development Guidelines & Patterns

### 🎯 Type Safety & Validation
1. **Zod-First APIs**: Use `@rexera/schemas` for all API endpoints
   ```typescript
   // ✅ API validation with Zod
   const createWorkflowSchema = z.object({
     title: z.string().min(1),
     workflow_type: z.enum(['HOA_ACQUISITION', 'MUNICIPAL_LIEN_SEARCH'])
   });
   ```

2. **Dual Package System**:
   - `@rexera/schemas` - Runtime validation + type inference for APIs
   - `@rexera/types` - Shared enums, utilities, external service types

3. **Strict TypeScript**: Enable strict mode, use proper typing throughout

### 🏗️ Code Organization
1. **Clean Architecture**: Separate concerns, follow established patterns
2. **Consistent Naming**: Use descriptive, consistent naming conventions
3. **Component Structure**: Organize by feature, not by file type
4. **Import Order**: External deps → Internal packages → Relative imports

### 🚀 Modern Patterns
1. **Next.js App Router**: Use server components, streaming, and modern patterns
2. **Turbo Orchestration**: Leverage Turbo for build optimization and caching  
3. **pnpm Workspaces**: Use `workspace:*` for internal dependencies
4. **Real-Time**: Implement live updates with Supabase subscriptions

### ✅ Quality Standards
1. **Testing**: Write tests, run type checks before committing
2. **Error Handling**: Implement graceful degradation and HIL escalation
3. **Database**: Use migrations in `supabase/migrations/` for schema changes
4. **API Design**: Follow REST principles with standardized response formats
5. **Performance**: Optimize for both developer experience and runtime performance

### 🔧 Development Workflow
1. **Branch Strategy**: Feature branches with descriptive names
2. **Code Review**: All changes go through review process
3. **CI/CD**: Automated testing and deployment pipelines
4. **Documentation**: Keep CLAUDE.md updated with architectural changes