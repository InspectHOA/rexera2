# Rexera 2.0 Consistency Rules

Golden standard patterns that ALL components must follow for platform consistency.

## Frontend Consistency Rules

### 1. Component Architecture
**RULE**: Functional components with TypeScript interfaces: `ComponentNameProps` interface, `export function ComponentName()` pattern

### 2. File Naming
**RULE**: All components use kebab-case naming: `workflow-detail.tsx`, `add-counterparty-modal.tsx`, hooks use `use-kebab-case.ts`

### 3. Class Management
**RULE**: Always use `cn()` utility for conditional classes: `className={cn(baseClasses, conditionalClasses, className)}`

### 4. Loading States
**RULE**: Standardized loading patterns: `<LoadingSpinner size="sm|md|lg" />` for async operations, skeleton loading for data lists

### 5. Error Handling
**RULE**: Use `useErrorHandling()` hook with consistent error display patterns. Show `AlertTriangle` icon + message for form errors

### 6. Modal Structure
**RULE**: Consistent modal patterns: `fixed inset-0 bg-black/50 backdrop-blur-sm` backdrop, `bg-card rounded-lg shadow-xl border` container

### 7. Form Patterns
**RULE**: Client-side validation with error state management, consistent field structure with labels and icons

### 8. Toast Notifications
**RULE**: Use `toast()` with title + description pattern. Success: default variant, errors: destructive variant

### 9. Data Fetching
**RULE**: React Query with `['entity', filters]` query keys, `formatErrorMessage()` for errors, real-time subscriptions with invalidation

### 10. Tailwind & Dark Mode
**RULE**: Use Tailwind classes with dark mode variants: `bg-card dark:bg-card`, `text-foreground dark:text-foreground`. Use semantic color tokens like `bg-background`, `text-muted-foreground`, `border-border`

### 11. Theme Integration
**RULE**: Use CSS custom properties and CVA variants: `variant: { default, destructive, outline }`, `size: { sm, md, lg }`. Always include dark mode variants for colors

### 12. Type Safety
**RULE**: All components use TypeScript with shared types from `@rexera/shared`. Props interfaces named `ComponentNameProps`

### 13. Responsive Design
**RULE**: Use standard Tailwind breakpoints with mobile-first approach: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`

### 14. Import Organization
**RULE**: Import order: external packages → `@rexera/shared` → `@/` aliases → relative imports. Group related imports, separate with blank lines

### 15. Environment Variables
**RULE**: Use `NEXT_PUBLIC_` prefix for client-side variables. Environment variables must be typed and validated at startup

### 16. Code Organization
**RULE**: Feature-based components, NOT file-type based. Use `@rexera/shared` for all shared code. Use `workspace:*` for internal dependencies

### 17. Script Standards  
**RULE**: All scripts in `/scripts/` directory using TypeScript only. Categories: `testing/`, `db/`, `utils/`, `deployment/`. Use unified runner: `tsx scripts/utils/script-runner.ts`

### 18. Testing Standards
**RULE**: Tests in `__tests__/` directories with `*.test.{ts,tsx}` naming. Use Jest + React Testing Library. Mock dependencies before imports, use `jest.clearAllMocks()` in `beforeEach`

## API Consistency Rules

### 1. Frontend API Client Organization
**RULE**: All API clients in `/frontend/src/lib/api/endpoints/` with standard CRUD functions: `list`, `byId`, `create`, `update`, `delete`

### 2. Backend Route Organization
**RULE**: All routes in `/serverless-api/src/routes/` with kebab-case naming, use `clientDataMiddleware`, standard REST endpoints

### 3. Shared Schema Organization
**RULE**: All schemas in `/packages/shared/src/schemas/` with kebab-case naming. Required: Base, Create, Update, Filters, Response schemas

### 4. Error Handling
**RULE**: Frontend uses `ApiError` class and `isApiError()` utility. Backend returns `{ success: boolean, error?: string, details?: any }`

### 5. Response Format
**RULE**: Success responses: `{ success: true, data: T, pagination?: PaginationMeta }`. Pagination: `{ page, limit, total, totalPages }`

### 6. Authentication & Authorization
**RULE**: All protected routes use `clientDataMiddleware`

### 7. Audit Logging
**RULE**: All data mutations include audit logging using `auditLogger.log()`. Include actor, action, resource details. Log audit errors but don't fail requests

### 8. Real-time Updates
**RULE**: All data hooks include Supabase real-time subscriptions with proper query invalidation

### 9. Query Key Factory Pattern
**RULE**: React hooks use structured query key factories with `all`, `lists`, `list`, `details`, `detail` pattern

### 10. Include Parameter Pattern
**RULE**: All list/detail endpoints support `include` parameter for relationship loading

### 11. Access Control Pattern
**RULE**: All backend routes implement `getCompanyFilter(user)` for proper data isolation

### 12. OpenAPI Integration
**RULE**: All new routes use `@hono/zod-openapi` with proper schema registration and tags

### 13. Database Operations
**RULE**: DML operations use TypeScript scripts. DDL operations manual via Supabase dashboard. Required env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

### 14. Quality Gates
**RULE**: `pnpm lint` and `pnpm type-check` must pass before commits. Write tests for new features. Use migrations for schema changes

### 15. Documentation Updates
**RULE**: New systems require `docs1/systems/` updates. Breaking changes require migration guides in `docs1/guides/` 