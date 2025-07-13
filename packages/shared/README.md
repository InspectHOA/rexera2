# @rexera/shared

Shared types, schemas, and utilities for the Rexera platform.

## Overview

This package provides a single source of truth for:
- TypeScript type definitions
- Zod validation schemas
- Business logic constants and enums
- Database type definitions
- API contracts and error handling

## Installation

This package is automatically installed as a workspace dependency:

```bash
# In frontend or serverless-api
pnpm install
```

## Usage

### API Types and Error Handling

```typescript
import { 
  ApiResponse, 
  ApiError, 
  ValidationError,
  NotFoundError,
  API_ERROR_CODES 
} from '@rexera/shared';

// Type-safe API responses
const response: ApiResponse<Workflow[]> = await fetchWorkflows();

// Standardized error handling
try {
  await createWorkflow(data);
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('Validation failed:', error.details);
  } else if (error instanceof NotFoundError) {
    console.log('Resource not found:', error.message);
  }
}

// Error factory functions
throw createNotFoundError('Workflow', workflowId);
throw createValidationError('Invalid email format', { field: 'email' });
```

### Business Enums and Types

```typescript
import { 
  WorkflowType, 
  WorkflowStatus, 
  PriorityLevel,
  TaskStatus 
} from '@rexera/shared';

// Type-safe business logic
const workflow = {
  type: WorkflowType.MUNI_LIEN_SEARCH,
  status: WorkflowStatus.IN_PROGRESS,
  priority: PriorityLevel.HIGH
};

// Enums provide IntelliSense and prevent typos
if (task.status === TaskStatus.COMPLETED) {
  // Handle completed task
}
```

### Zod Validation Schemas

```typescript
import { 
  CreateWorkflowSchema, 
  WorkflowFiltersSchema,
  TaskExecutionSchema 
} from '@rexera/shared';

// Backend API validation
const validatedData = CreateWorkflowSchema.parse(requestBody);

// Frontend form validation
const result = WorkflowFiltersSchema.safeParse(formData);
if (!result.success) {
  console.log('Form errors:', result.error.issues);
}
```

### Database Types

```typescript
import type { Database, Tables } from '@rexera/shared';

// Type-safe Supabase client
const supabase: SupabaseClient<Database> = createClient(url, key);

// Type-safe database operations
const workflow: Tables<'workflows'> = await supabase
  .from('workflows')
  .select('*')
  .eq('id', id)
  .single();
```

### Pagination

```typescript
import type { 
  PaginationMeta, 
  PaginatedResponse,
  PaginationQuery 
} from '@rexera/shared';

// Type-safe pagination
const query: PaginationQuery = {
  page: 1,
  limit: 20,
  sortBy: 'created_at',
  sortDirection: 'desc'
};

const response: PaginatedResponse<Workflow> = await api.workflows.list(query);
```

### Utilities

```typescript
import { formatWorkflowIdWithType } from '@rexera/shared';

// Consistent ID formatting across frontend and backend
const displayId = formatWorkflowIdWithType(workflow.human_readable_id, workflow.workflow_type);
// Output: "ML-1001" (MUNI_LIEN_SEARCH-1001)
```

## Package Structure

```
src/
├── enums/              # Business constants and enums
├── schemas/            # Zod validation schemas
├── types/
│   ├── api.ts         # API request/response types
│   ├── database.ts    # Supabase generated types
│   ├── errors.ts      # Error classes and utilities
│   └── workflows.ts   # Business entity types
├── utils/             # Shared utility functions
└── index.ts           # Main exports
```

## Development

### Building

```bash
cd packages/shared
pnpm build
```

### Testing

```bash
cd packages/shared
pnpm test
```

### Adding New Types

1. Add types to appropriate file in `src/types/`
2. Export from `src/index.ts`
3. Update this README with usage examples
4. Run tests to ensure no breaking changes

## Best Practices

### DO:
- ✅ Add types that are used by both frontend and backend
- ✅ Include comprehensive JSDoc comments
- ✅ Use Zod schemas for validation + TypeScript types
- ✅ Follow existing naming conventions
- ✅ Add tests for new schemas and utilities

### DON'T:
- ❌ Add frontend-specific types (put in frontend package)
- ❌ Add backend-specific types (put in serverless-api package)
- ❌ Create circular dependencies
- ❌ Break existing API contracts without migration plan

## Migration Guide

When updating shared types that affect API contracts:

1. **Additive changes** (new optional fields) - Safe to deploy
2. **Breaking changes** (required fields, renames) - Requires coordinated deployment
3. **Deprecations** - Add `@deprecated` JSDoc and migration timeline

## Version History

- **1.0.0** - Initial shared package with basic types
- **1.1.0** - Added comprehensive API types and error handling
- **1.2.0** - Consolidated pagination and validation schemas