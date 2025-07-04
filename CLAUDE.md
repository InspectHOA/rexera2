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
- **🏗️ Monorepo**: Turborepo for task orchestration and caching
- **📦 Package Manager**: pnpm for fast, efficient dependency management
- **⚡ Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **🔒 Validation**: Zod for runtime type safety and API validation
- **🗄️ Database**: Supabase PostgreSQL with Row-Level Security
- **🎨 UI**: shadcn/ui components with Radix primitives

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

## Integration Patterns

**AI Agents**: External HTTP APIs with standardized JSON request/response format
**Webhooks**: n8n workflows triggered by external system events
**Database Sync**: n8n workflows update PostgreSQL at each step for business visibility
**Error Handling**: Automatic retry with exponential backoff, HIL escalation on failure

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