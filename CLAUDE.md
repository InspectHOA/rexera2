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

This project is a workflow automation platform where n8n orchestrates complex business processes by calling a suite of external, specialized AI agent services. The backend API and database serve as a simple "log book," atomically recording the outcomes of each step that n8n completes. The frontend provides a complete view of the workflow's progress by combining the static process definition with the execution logs, and it serves as the dashboard for Human-in-the-Loop (HIL) operators to resolve any flagged interrupts.

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

**Frontend (frontend/)**: Next.js 14 application with TypeScript, Tailwind CSS, and shadcn/ui components. Features real-time dashboard updates via Supabase subscriptions. UI-focused with no API routes.

**API (serverless-api/)**: Vercel serverless functions providing REST endpoints for workflows, agents, tasks, and communications. Built with Zod validation and type safety.

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
- **Data Fetching**: REST API + TanStack React Query
- **Theming**: next-themes for dark/light mode

**⚡ Backend API Stack**
- **Runtime**: Vercel serverless functions
- **Language**: TypeScript
- **API Architecture**: REST endpoints with Zod validation
- **Validation**: Zod schemas for runtime type safety
- **Authentication**: Supabase Auth with Row Level Security
- **Deployment**: Vercel edge functions with auto-scaling

**🗄️ Database & Infrastructure**
- **Database**: Supabase PostgreSQL with Row-Level Security (RLS)
- **Real-time**: Supabase subscriptions for live updates
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
├── serverless-api/     # Vercel serverless functions  
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

### The "Log Book" Architecture: Static Blueprint + Dynamic Log

Rexera 2.0's task execution architecture is built on a simple and powerful philosophy: the database serves as an **immutable log of completed work**, not a state machine for pending tasks. This separation of concerns creates a robust, scalable, and easily debuggable system.

-   **Static Blueprint (Workflow Definition):** The complete plan for any workflow is defined in a static JSON file (e.g., `PAYOFF_REQUEST.json`). This file contains a `taskSequence` array that lists all potential steps in their intended order. This is the "to-do list" and is the source of truth for the UI.

-   **Dynamic Log (Database):** The database, specifically the `task_executions` table, only records work that has already been completed. It is the "log book" of what has happened. It does not know or care about what tasks are pending.

-   **`taskType` Identifier:** A human-readable string (e.g., `"identify_lender_contact"`) is the shared key that links the static blueprint to the dynamic log entries created by `n8n`.

### The Execution Flow

This diagram illustrates how a workflow proceeds from start to finish under the new model:

```mermaid
graph TD
    subgraph "Application Backend"
        A[1. Start Workflow] --> B(Create `workflows` record);
        B --> C{Pass `workflow_id` to n8n};
    end

    subgraph "n8n Workflow Engine"
        C --> D[2. Execute Step 1 logic<br/>(e.g., taskType: 'identify_lender_contact')];
        D --> E[Agent completes work];
        E --> F{3. Report Result via Webhook};
    end

    subgraph "Application Backend"
        F --> G["POST /api/webhooks/n8n<br/>Receives `workflow_id`, `taskType`, and `result`"];
        G --> H[4. Create `task_executions` record<br/>(The immutable log entry)];
        H --> I[...next step in n8n];
    end
```

### API Interaction: The `n8n` Webhook

All communication from `n8n` to the Rexera backend happens through a single, unified webhook endpoint. Instead of telling the backend to perform actions (like starting or completing a task), `n8n` simply reports events that have already occurred.

**Endpoint:** `POST /api/webhooks/n8n`

#### `n8n` Reporting Payload

When an `n8n` node finishes a task, it sends a simple payload to the webhook:

```json
// Example from an n8n "HTTP Request" node
{
  "eventType": "agent_task_completed",
  "data": {
    "workflow_id": "{{ $json.workflow_id }}",
    "taskType": "identify_lender_contact",
    "status": "COMPLETED",
    "result": {
      "contacts": [
        {
          "name": "Big Bank Mortgage Dept.",
          "email": "payoffs@bigbank.com",
          "phone": "1-800-555-1234"
        }
      ],
      "confidenceScore": 0.95
    },
    "agentName": "nina",
    "executionTime": 4500
  }
}
```

#### Backend Logging Logic (Conceptual)

The backend's responsibility is to validate the incoming event and create a corresponding record in the `task_executions` table. It does not manage state; it simply logs the event.

```javascript
// Conceptual handler for the /api/webhooks/n8n endpoint

// 1. Validate the incoming payload against a schema.
const { eventType, data } = validatePayload(req.body);

// 2. Prepare the data for the database log.
const executionLogEntry = {
  workflow_id: data.workflow_id,
  task_type: data.taskType, // The shared identifier
  action_type: 'execute', // Or derived from eventType
  status: data.status, // 'COMPLETED' or 'FAILED'
  output_data: data.result,
  agent_name: data.agentName,
  // ... and other relevant fields
};

// 3. Insert the immutable record into the log.
await supabase
  .from('task_executions')
  .insert(executionLogEntry);

// 4. Send a simple success response.
res.status(200).json({ success: true });
```

This architecture ensures that `n8n` remains the master of the workflow process, while the Rexera application provides a robust, real-time view into the execution history without managing complex state.

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