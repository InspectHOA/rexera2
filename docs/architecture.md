# Architecture Overview

## High-Level Design

**Dual-layer platform**: n8n Cloud orchestrates workflows, PostgreSQL + Next.js provides business visibility.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js UI   │    │   Hono API      │    │   n8n Cloud     │
│   (Frontend)    │◄──►│   (Backend)     │◄──►│   (Automation)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         └───────────────────────┼─────────────────────────┐
                                 ▼                         ▼
                    ┌─────────────────┐         ┌─────────────────┐
                    │   Supabase      │         │   File Storage  │
                    │   (Database)    │         │   (Documents)   │
                    └─────────────────┘         └─────────────────┘
```

## Core Components

### Frontend (`/frontend`)
- **Next.js 14** with TypeScript
- **Tailwind CSS** for styling
- **Real-time updates** via Supabase subscriptions
- **Dark mode** support

### Backend (`/serverless-api`) 
- **Hono API** framework
- **Vercel Functions** for deployment
- **Zod validation** for type safety
- **OpenAPI/Swagger** documentation

### Database (Supabase)
- **PostgreSQL** with real-time subscriptions
- **Row Level Security** for multi-tenancy
- **Automated migrations** via scripts

### Shared Package (`/packages/shared`)
- **TypeScript types** and enums
- **Zod schemas** for validation
- **Utility functions** and helpers

## Data Flow

1. **Workflow Creation**: UI → API → Database
2. **n8n Orchestration**: API triggers n8n Cloud workflows  
3. **Task Execution**: n8n executes tasks, reports back via webhooks
4. **Real-time Updates**: Database changes push to UI via subscriptions
5. **HIL Intervention**: Users approve/reject tasks when agents need help

## Key Concepts

- **Workflows**: Business processes (Payoff Request, HOA Acquisition)
- **Tasks**: Individual steps executed by agents or humans
- **HIL (Human-in-Loop)**: Manual intervention points
- **SLA Monitoring**: Automatic deadline tracking
- **Audit Trail**: Complete activity logging

## Technology Choices

- **TypeScript everywhere** for type safety
- **Monorepo** with Turborepo for code sharing
- **Real-time by default** via Supabase subscriptions
- **API-first design** with comprehensive OpenAPI docs