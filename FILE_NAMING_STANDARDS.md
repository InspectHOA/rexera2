# File Naming Standards for Rexera 2.0

This document outlines the consistent file naming conventions used throughout the Rexera 2.0 codebase.

## Frontend (`/frontend/src/`)

### React Components
- **Convention**: `kebab-case.tsx`
- **Examples**: 
  - `workflow-table.tsx`
  - `task-detail-view.tsx`
  - `loading-spinner.tsx`
  - `agent-layout.tsx`

### React Hooks
- **Convention**: `camelCase.ts`
- **Examples**:
  - `useWorkflows.ts`
  - `useUnifiedNotifications.ts`
  - `useWorkflowTableState.ts`
  - `useToast.ts`

### Pages (Next.js App Router)
- **Convention**: `camelCase.tsx` (follows Next.js conventions)
- **Examples**:
  - `page.tsx`
  - `layout.tsx`
  - `loading.tsx`
  - `error.tsx`

### Utilities and Libraries
- **Convention**: `kebab-case.ts` or `camelCase.ts` (depending on context)
- **Examples**:
  - `utils.ts`
  - `client.ts`
  - `provider.tsx`

### Types
- **Convention**: `camelCase.ts`
- **Examples**:
  - `workflow.ts`

## Backend (`/serverless-api/src/`)

### API Routes and Modules
- **Convention**: `kebab-case.ts`
- **Examples**:
  - `task-executions.ts`
  - `workflows.ts`
  - `app-test.ts`
  - `dev-server.ts`

### Utilities
- **Convention**: `kebab-case.ts`
- **Examples**:
  - `workflow-resolver.ts`
  - `database.ts`

### Configuration
- **Convention**: `camelCase.ts` for index files, `kebab-case.ts` for specific configs
- **Examples**:
  - `index.ts`

## Scripts (`/scripts/`)

### All Scripts
- **Convention**: `kebab-case.ts`
- **Examples**:
  - `script-runner.ts`
  - `base-script.ts`
  - `test-api-integration.ts`
  - `assign-agents-to-tasks.ts`

## Shared Package (`/packages/shared/`)

### All Files
- **Convention**: `camelCase.ts`
- **Examples**:
  - `workflows.ts`
  - `taskExecutions.ts`

## General Rules

1. **Components**: Always use `kebab-case` for React components
2. **Hooks**: Always use `camelCase` starting with "use"
3. **Scripts**: Always use `kebab-case`
4. **API Routes**: Always use `kebab-case`
5. **Types and Schemas**: Use `camelCase`
6. **Utilities**: Use `kebab-case` unless they're clearly library-style utilities

## Migration Notes

During the refactoring process, the following files were renamed for consistency:

### Frontend
- `WorkflowTable.tsx` → `workflow-table.tsx`
- `WorkflowFilters.tsx` → `workflow-filters.tsx`
- `WorkflowRow.tsx` → `workflow-row.tsx`
- `WorkflowTableHeader.tsx` → `workflow-table-header.tsx`
- `WorkflowPagination.tsx` → `workflow-pagination.tsx`
- `use-toast.ts` → `useToast.ts`

All import statements were updated accordingly to maintain functionality.

## Benefits

This consistent naming convention provides:

1. **Predictability**: Developers can predict file names based on type
2. **Readability**: Clear distinction between components, hooks, and utilities
3. **Maintainability**: Easier to navigate and organize the codebase
4. **Team Consistency**: All team members follow the same standards

## Tools

TypeScript compiler and ESLint are configured to enforce these naming conventions where possible.