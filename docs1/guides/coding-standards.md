# Coding Standards

## File Naming Conventions

### Frontend (`/frontend/src/`)

**React Components:**
- Format: `kebab-case.tsx`
- Examples: `workflow-table.tsx`, `task-detail-view.tsx`, `loading-spinner.tsx`

**React Hooks:**
- Format: `camelCase.ts`  
- Examples: `useWorkflows.ts`, `useUnifiedNotifications.ts`, `useToast.ts`

**Pages (Next.js):**
- Format: `camelCase.tsx`
- Examples: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`

### Backend (`/serverless-api/src/`)

**Route Files:**
- Format: `kebab-case.ts`
- Examples: `audit-events.ts`, `task-executions.ts`, `hil-notes.ts`

**Utility Files:**
- Format: `kebab-case.ts`
- Examples: `database.ts`, `workflow-resolver.ts`

### Shared (`/packages/shared/src/`)

**Schema Files:**
- Format: `camelCase.ts`
- Examples: `auditEvents.ts`, `taskExecutions.ts`, `hilNotes.ts`

## Code Structure

### TypeScript Standards
- **Strict mode** enabled everywhere
- **Explicit return types** for functions
- **Interface over type** for object definitions
- **Zod schemas** for all validation

### API Development
- **REST conventions** (GET, POST, PATCH, DELETE)
- **Consistent response format**:
  ```typescript
  // Success
  { success: true, data: {...} }
  
  // Error  
  { success: false, error: "message", details: "..." }
  ```
- **OpenAPI documentation** for all endpoints
- **Middleware** for auth, validation, error handling

### Frontend Development
- **Component composition** over inheritance
- **Custom hooks** for reusable logic
- **Real-time subscriptions** via Supabase
- **Dark mode support** with Tailwind variants

### Database Patterns
- **Snake_case** for table/column names
- **UUID primary keys** for all entities
- **Foreign key constraints** for relationships
- **Timestamps** (created_at, updated_at) on all tables

## Import Organization

**Order:**
1. External libraries
2. Internal utilities/types
3. Relative imports

**Examples:**
```typescript
// External
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Internal  
import { AuditEvent, auditLogger } from '@rexera/shared';
import { api } from '@/lib/api/client';

// Relative
import { ActivityFeed } from './activity-feed';
```

## Error Handling

**API Endpoints:**
```typescript
try {
  const result = await operation();
  return c.json({ success: true, data: result });
} catch (error) {
  console.error('Operation failed:', error);
  return c.json({ 
    success: false, 
    error: 'Operation failed',
    details: error.message 
  }, 500);
}
```

**Frontend Components:**
```typescript
try {
  await riskyOperation();
} catch (error) {
  console.error('Error:', error);
  // Show user-friendly error, don't crash
  setError('Something went wrong. Please try again.');
}
```

## Testing Patterns

**API Tests:**
- Integration tests for all endpoints
- Test helpers for database setup/cleanup
- Mock external services (n8n, email)

**Frontend Tests:**
- Component rendering tests
- User interaction tests  
- Hook behavior tests

## Documentation Standards

- **Code comments** for complex logic only
- **JSDoc** for public functions
- **README updates** when adding features
- **OpenAPI docs** for all API endpoints