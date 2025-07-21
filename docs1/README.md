# Rexera 2.0 Documentation

AI-powered workflow automation for real estate and financial services.

## Quick Start

1. **[Setup](getting-started.md)** - Get running locally
2. **[Architecture](architecture.md)** - Platform overview  
3. **[Development](development.md)** - Build features

## Core Systems

- **[Workflows](systems/workflows.md)** - n8n orchestration
- **[Task Executions](systems/task-executions.md)** - Task lifecycle & SLA tracking  
- **[Communications](systems/communications.md)** - Email threading & templates
- **[Documents](systems/documents.md)** - File storage & AI processing
- **[HIL Notes](systems/hil-notes.md)** - Collaborative notes with @mentions
- **[Notifications](systems/notifications.md)** - Real-time alerts
- **[Audit](systems/audit.md)** - Activity logging
- **[Agents](systems/agents.md)** - AI interfaces
- **[Authentication](systems/authentication.md)** - OAuth & user management
- **[Dark Mode](systems/dark-mode.md)** - Theme system

## Guides

- **[Adding Features](guides/adding-features.md)** - Development workflow
- **[Environment Setup](guides/environment-setup.md)** - Local & production config
- **[Coding Standards](guides/coding-standards.md)** - File naming & patterns
- **[Testing](guides/testing.md)** - Test strategy
- **[Deployment](guides/deployment.md)** - Production setup

## Quick Reference

- **Start**: `pnpm dev` (Frontend: 3000, API: 3001)
- **Schema**: `/supabase/migrations/`
- **API Docs**: `/api-docs` (Swagger)
- **Test Data**: `npx tsx scripts/db/seed.ts`