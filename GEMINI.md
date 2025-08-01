# GEMINI.md

This file provides guidance to Gemini Cli Agent when working with this repository.

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

### API Architecture Pattern

**Clean Hono Approach**: The API uses a clean, minimal Hono setup that prioritizes simplicity and developer experience:

```typescript
// Route structure (e.g., workflows.ts)
import { Hono } from 'hono';
import { CreateWorkflowSchema } from '@rexera/shared';

const workflows = new Hono();

workflows.get('/', async (c) => {
  // Simple, clean handler logic
  return c.json({ success: true, data: results });
});

workflows.post('/', async (c) => {
  const body = await c.req.json();
  const validated = CreateWorkflowSchema.parse(body);
  // Implementation
  return c.json({ success: true, data: result }, 201);
});
```

**Key Principles:**
- **Reuse schemas from @rexera/shared** - Never duplicate Zod schemas
- **Clean handlers** - Minimal boilerplate, focus on business logic
- **Standard error handling** - Consistent JSON error responses
- **Type safety** - Full TypeScript + Zod validation throughout

**Why this approach:**
- Keeps route files concise (200-400 lines vs 1000+ with complex frameworks)
- Leverages existing shared schemas instead of redefining them
- Simple to understand, debug, and extend
- Fast compilation and runtime performance

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

### File Naming Convention
**All files MUST use kebab-case naming consistently:**
- **API Routes**: `kebab-case.ts` (e.g., `hil-notes.ts`, `audit-events.ts`)
- **Schemas**: `kebab-case.ts` (e.g., `hil-notes.ts`, `task-executions.ts`)
- **React Components**: `kebab-case.tsx` (e.g., `notes-tab.tsx`, `mention-input.tsx`)
- **React Hooks**: `use-kebab-case.ts` (e.g., `use-workflows.ts`, `use-documents.ts`)
- **Utilities**: `kebab-case.ts` (e.g., `audit-logger.ts`, `uuid-formatter.ts`)
- **Scripts**: `kebab-case.ts/.js` (e.g., `create-skip-auth-user.js`)

**Examples:**
```
✅ Good: hil-notes.ts, use-workflows.ts, notes-tab.tsx
❌ Bad: hilNotes.ts, useWorkflows.ts, NotesTab.tsx
```

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
- `notes-tab.tsx`: Main notes interface in workflow detail view
- `mention-input.tsx`: @username autocomplete component
- Real-time notifications via `use-unified-notifications.ts` hook

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

## Counterparties System

### Overview
The counterparties system manages external entities that workflows interact with, including HOAs, lenders, municipalities, utilities, and tax authorities. The system enforces workflow-type restrictions to ensure only appropriate counterparty types can be assigned to specific workflows.

### Architecture
- **Shared Schemas**: Type-safe validation and business logic in `@rexera/shared`
- **Backend API**: RESTful endpoints with Zod validation and relationship management
- **Frontend Components**: Modal-based CRUD operations with workflow integration
- **Type Safety**: Full TypeScript coverage with runtime validation

### Database Schema
- `counterparties` table: Core counterparty information
- `workflow_counterparties` table: Many-to-many relationship with status tracking
- Foreign keys maintain referential integrity
- Soft delete prevention for counterparties with active relationships

### Counterparty Types & Workflow Restrictions
```typescript
// Allowed counterparty types per workflow type
const WORKFLOW_COUNTERPARTY_RULES = {
  'hoa_lien_resolution': ['hoa', 'lender'],
  'municipal_lien_resolution': ['municipality', 'tax_authority'],
  'utility_lien_resolution': ['utility'],
  'property_research': ['hoa', 'lender', 'municipality', 'utility', 'tax_authority']
};
```

### API Endpoints
- `GET /api/counterparties` - List with filtering and pagination
- `POST /api/counterparties` - Create new counterparty
- `PATCH /api/counterparties/:id` - Update counterparty
- `DELETE /api/counterparties/:id` - Delete (with relationship validation)
- `GET /api/counterparties/types` - Get available types
- `GET /api/workflows/:id/counterparties` - List workflow assignments
- `POST /api/workflows/:id/counterparties` - Assign counterparty to workflow
- `PATCH /api/workflows/:id/counterparties/:relationshipId` - Update assignment status
- `DELETE /api/workflows/:id/counterparties/:relationshipId` - Remove assignment

### Status Tracking
Workflow counterparty assignments progress through status states:
- `PENDING` → Initial assignment
- `CONTACTED` → Outreach initiated
- `RESPONDED` → Response received
- `COMPLETED` → Interaction completed

### Frontend Components
- `counterparty-selector.tsx`: Main interface for assignment and management
- `add-counterparty-modal.tsx`: New counterparty creation
- `edit-counterparty-modal.tsx`: Counterparty editing
- Real-time updates via direct API state management

### Known Architecture Issues (Improvement Needed)
1. **File Organization**: API client not in `/endpoints/` directory
2. **State Management**: Manual state instead of React Query patterns
3. **Component Architecture**: Large monolithic selector component
4. **Missing Features**: No audit logging, limited access control
5. **Error Handling**: Inconsistent patterns compared to workflows

### Usage Examples
```typescript
// Create counterparty
const counterparty = await counterpartiesApi.create({
  name: 'ABC HOA',
  type: 'hoa',
  email: 'contact@abchoa.com',
  phone: '555-1234'
});

// Assign to workflow
await workflowCounterpartiesApi.add(workflowId, {
  counterparty_id: counterparty.id,
  status: 'PENDING'
});

// Update status
await workflowCounterpartiesApi.updateStatus(workflowId, relationshipId, {
  status: 'CONTACTED'
});
```

## Quality Standards
1. Run `pnpm lint` and `pnpm type-check` before commits
2. Write tests for new features
3. Use migrations for schema changes
4. Follow REST principles for APIs
5. Keep documentation updated