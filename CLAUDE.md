# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Root Level Commands (using Turbo monorepo)
- `npm run dev` - Start all services in development mode
- `npm run build` - Build all packages
- `npm run test` - Run tests across all packages
- `npm run lint` - Lint all packages
- `npm run type-check` - Type check all packages
- `npm run clean` - Clean build artifacts

### Database Operations
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with initial data
- `cd database && npm run generate-types` - Generate TypeScript types from Supabase schema

### Testing
- `npm run e2e` - Run end-to-end tests with Playwright
- `cd agents && npm run test` - Run agent integration tests

### Deployment
- `npm run deploy:staging` - Deploy to staging environment
- `npm run deploy:prod` - Deploy to production environment

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

**Frontend (frontend/)**: Next.js 14 application with TypeScript, Tailwind CSS, and shadcn/ui components. Features real-time dashboard updates via WebSocket connections.

**Database (database/)**: Supabase PostgreSQL setup with Row-Level Security, migrations, and generated TypeScript types. Contains comprehensive schema for workflows, tasks, agents, and business entities.

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

**Types (types/)**: Shared TypeScript type definitions across all packages for workflows, agents, API responses, and database entities.

## Workspace Structure

This is a Turbo monorepo with the following workspaces:
- `frontend` - Next.js application
- `database` - Schema, migrations, and database utilities
- `workflows` - n8n workflow definitions
- `types` - Shared TypeScript types
- `agents` - AI agent integration system

Each workspace has its own package.json with specific scripts. Use `cd <workspace>` to run workspace-specific commands.

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

## Development Guidelines

1. **Type Safety**: All components use shared types from `types/` package
2. **Real-Time**: Use Supabase real-time subscriptions for live data updates
3. **Error Handling**: Implement graceful degradation and HIL escalation paths
4. **Testing**: Run type checks and tests before committing changes
5. **Database Changes**: Use migrations in `database/migrations/` for schema changes
6. **API Patterns**: Follow the 12 unified endpoints pattern with Resources + Actions + Views + Events