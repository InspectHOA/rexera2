# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Core Principles
- **MINIMIZE COMPLEXITY** - Optimize for developer ease
- **CONSISTENT CODE** - Follow established patterns, TypeScript only, proper file structure
- **TYPE SAFETY** - Use TypeScript strict mode with Zod validation
- **MODERN PATTERNS** - Leverage Turbo, pnpm, Next.js 14

## Quick Start

### Development
```bash
pnpm dev           # Start all services
pnpm build         # Build all packages
pnpm test          # Run tests
pnpm lint          # Lint code
pnpm type-check    # Type check
```

### Ports
- Frontend: http://localhost:3000
- API: http://localhost:3001

### Database
```bash
# Seed database with 50 workflows + test data
npx tsx scripts/db/seed.ts

# List all scripts
tsx scripts/utils/script-runner.ts list
```

## Architecture

**Dual-layer platform**: n8n Cloud orchestrates workflows, PostgreSQL + Next.js provides business visibility.

**Stack**: Next.js 14, TypeScript, Tailwind, Vercel functions, Supabase PostgreSQL, n8n Cloud

**Monorepo**: Turborepo + pnpm
```
├── frontend/           # Next.js app
├── serverless-api/     # Vercel functions
├── packages/shared/    # Types, schemas, utils
├── scripts/           # All scripts (TypeScript only)
└── supabase/          # Database schema
```

## Workflow Execution

1. **Task Pre-population**: n8n creates ALL potential tasks with `PENDING` status
2. **Status Updates**: Tasks progress `PENDING` → `RUNNING` → `COMPLETED/FAILED` 
3. **Real-time UI**: Frontend shows live task status via Supabase subscriptions

## Development Guidelines

### Package Management
- Use `@rexera/shared` for all shared code
- Add new packages only for genuinely independent services
- Use `workspace:*` for internal dependencies

### Scripts
- All scripts in `/scripts/` directory using TypeScript
- Categories: `testing/`, `db/`, `utils/`, `deployment/`
- Use unified runner: `tsx scripts/utils/script-runner.ts <script-name>`

### Code Organization
- Feature-based components, not file-type based
- Strict TypeScript everywhere
- Zod schemas for API validation
- Import order: external → internal → relative

### Database
- **DML operations**: Supported via TypeScript scripts
- **DDL operations**: Manual via Supabase dashboard (enum changes, schema)
- Environment variables required: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

## Key Files

### Database Seeding
- `scripts/db/seed.ts` - Comprehensive seeding (50 workflows, agents, clients)

### Supabase Config
- Project: `wmgidablmqotriwlefhq`
- Dashboard: https://app.supabase.com/project/wmgidablmqotriwlefhq

### API Endpoints
- `POST /api/workflows` - Create workflow
- `POST /api/taskExecutions/bulk` - Create all tasks
- `PATCH /api/taskExecutions/:id` - Update task status
- `GET /api/hil-notes` - List HIL notes for workflow
- `POST /api/hil-notes` - Create HIL note with mentions
- `PATCH /api/hil-notes/:id` - Update HIL note
- `POST /api/hil-notes/:id/reply` - Reply to HIL note

## HIL Notes System

### Features
- **Threaded Notes**: Support for parent-child note relationships
- **User Mentions**: @username autocomplete with real-time notifications
- **Priority Levels**: LOW, NORMAL, HIGH, URGENT with visual indicators
- **Resolution Tracking**: Mark notes as resolved/unresolved
- **Real-time Updates**: Live collaboration via Supabase subscriptions

### Database Schema
- `hil_notes` table with threading, mentions, priorities, and resolution tracking
- Foreign keys to `workflows` and `user_profiles`
- Automatic `created_at`/`updated_at` timestamps

### Frontend Components
- `NotesTab`: Main notes interface in workflow detail view
- `MentionInput`: @username autocomplete component
- Real-time notifications via `useUnifiedNotifications` hook

### Notifications Flow
1. User mentions @username in note → `HIL_MENTION` notification created
2. Real-time delivery via Supabase subscription
3. Toast notification shows for mentioned user
4. Notification appears in header bell icon

### Usage
```typescript
// API usage
await api.hilNotes.create({
  workflow_id: 'workflow-123',
  content: '@john.doe Please review this case - urgent!',
  priority: 'URGENT',
  mentions: ['user-uuid-for-john-doe']
});

// Component usage
<NotesTab workflowId={workflowId} />
```

## Quality Standards
1. Run `pnpm lint` and `pnpm type-check` before commits
2. Write tests for new features
3. Use migrations for schema changes
4. Follow REST principles for APIs
5. Keep documentation updated