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
**RULE**: Use shadcn/ui Dialog components for all modals. Structure: `Dialog > DialogContent > DialogHeader/DialogFooter`. Never use custom modal implementations.

### 7. Form Patterns
**RULE**: Use shadcn/ui form components: `Input`, `Label`, `Select`, `Button`. Client-side validation with error state management. Always use `Label` with `htmlFor` attribute matching input `id`.

### 8. Toast Notifications
**RULE**: Use `toast()` with title + description pattern. Success: default variant, errors: destructive variant

### 9. Data Fetching
**RULE**: React Query with `['entity', filters]` query keys, `formatErrorMessage()` for errors, real-time subscriptions with invalidation

### 10. Component Library Pattern
**RULE**: Use shadcn/ui + Tailwind CSS complementary approach. ALWAYS use official shadcn CLI for component installation. shadcn/ui provides pre-built accessible components, Tailwind provides utility classes for layouts. Use `cn()` utility for className merging.

**Installation Pattern:**
```bash
# ✅ Always use official CLI
pnpm dlx shadcn@latest add button dialog input select tabs

# ❌ Never create components manually
```

**Component Usage:**
```tsx
// ✅ Good: shadcn components for UI elements
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Modal Title</DialogTitle>
      <DialogDescription>Modal description</DialogDescription>
    </DialogHeader>
    <form onSubmit={handleSubmit}>
      <Label htmlFor="name">Name</Label>
      <Input id="name" value={name} onChange={setName} />
      <Select value={type} onValueChange={setType}>
        <SelectTrigger>
          <SelectValue placeholder="Select type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    </form>
    <DialogFooter>
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button type="submit">Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

// ✅ Good: Tailwind for layouts
<div className="flex h-full bg-background border-r border-border p-4">

// ❌ Bad: Custom components when shadcn exists
<button className="inline-flex items-center justify-center...">
```

**Select Component Rules:**
- Never use `value=""` - use `value="all"` for "All" options
- Update filter logic to handle `value="all"` as no filter
- Initialize state with `"all"` not empty strings

### 11. Tailwind & Dark Mode
**RULE**: Use Tailwind classes with dark mode variants: `bg-card dark:bg-card`, `text-foreground dark:text-foreground`. Use semantic color tokens like `bg-background`, `text-muted-foreground`, `border-border`

### 12. Theme Integration
**RULE**: Use CSS custom properties and CVA variants: `variant: { default, destructive, outline }`, `size: { sm, md, lg }`. Always include dark mode variants for colors

### 13. Type Safety
**RULE**: All components use TypeScript with shared types from `@rexera/shared`. Props interfaces named `ComponentNameProps`

### 14. Responsive Design
**RULE**: Use standard Tailwind breakpoints with mobile-first approach: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`

### 15. Import Organization
**RULE**: Import order: external packages → `@rexera/shared` → `@/` aliases → relative imports. Group related imports, separate with blank lines

### 16. Environment Variables
**RULE**: Use `NEXT_PUBLIC_` prefix for client-side variables. Environment variables must be typed and validated at startup

### 17. Code Organization
**RULE**: Feature-based components, NOT file-type based. Use `@rexera/shared` for all shared code. Use `workspace:*` for internal dependencies

### 18. Script Standards  
**RULE**: All scripts in `/scripts/` directory using TypeScript only. Categories: `testing/`, `db/`, `utils/`, `deployment/`. Use unified runner: `tsx scripts/utils/script-runner.ts`

### 19. Testing Standards
**RULE**: Tests in `__tests__/` directories with `*.test.{ts,tsx}` naming. Use Jest + React Testing Library. Mock dependencies before imports, use `jest.clearAllMocks()` in `beforeEach`

### 20. No Hardcoded Values
**RULE**: Never hardcode business values, statuses, or mappings in components. All values must come from database, shared enums, or configuration files. Use `@rexera/shared` types and enums consistently.

**Examples:**
```tsx
// ✅ Good: Using shared enums
import { TaskStatus, TASK_STATUSES } from '@rexera/shared';
const status = task.status as TaskStatus;

// ✅ Good: Database-driven agent descriptions
const agentName = task.agents?.name || 'Unknown Agent';

// ❌ Bad: Hardcoded status mappings
const agentDescriptionMap = {
  'nina': 'Counterparty Management',
  'rex': 'Browser Automation'
};

// ❌ Bad: Hardcoded status displays
if (status === 'INTERRUPTED') return 'Task needs attention';
```

## API Consistency Rules

### 1. Frontend API Client Organization
**RULE**: All API clients in `/frontend/src/lib/api/endpoints/` with standard CRUD functions: `list`, `byId`, `create`, `update`, `delete`

### 2. Backend Route Organization
**RULE**: All routes in `/serverless-api/src/routes/` with kebab-case naming, use `clientDataMiddleware`, standard REST endpoints

### 3. Clean Hono Route Pattern
**RULE**: Use minimal Hono setup with shared schema reuse:
```typescript
import { Hono } from 'hono';
import { CreateWorkflowSchema } from '@rexera/shared';

const workflows = new Hono();

workflows.post('/', async (c) => {
  const body = await c.req.json();
  const validated = CreateWorkflowSchema.parse(body);
  // Business logic here
  return c.json({ success: true, data: result }, 201);
});
```
**Benefits**: Concise files (200-400 lines), no schema duplication, simple debugging, fast performance

### 4. Shared Schema Organization
**RULE**: All schemas in `/packages/shared/src/schemas/` with kebab-case naming. Required: Base, Create, Update, Filters, Response schemas. **NEVER duplicate schemas** - always import and reuse from `@rexera/shared`

### 5. Error Handling
**RULE**: Frontend uses `ApiError` class and `isApiError()` utility. Backend returns `{ success: boolean, error?: string, details?: any }`

### 6. Response Format
**RULE**: Success responses: `{ success: true, data: T, pagination?: PaginationMeta }`. Pagination: `{ page, limit, total, totalPages }`

### 7. Authentication & Authorization
**RULE**: All protected routes use `clientDataMiddleware`

### 8. Audit Logging
**RULE**: All data mutations include audit logging using `auditLogger.log()`. Include actor, action, resource details. Log audit errors but don't fail requests

### 9. Real-time Updates
**RULE**: All data hooks include Supabase real-time subscriptions with proper query invalidation

### 10. Query Key Factory Pattern
**RULE**: React hooks use structured query key factories with `all`, `lists`, `list`, `details`, `detail` pattern

### 11. Include Parameter Pattern
**RULE**: All list/detail endpoints support `include` parameter for relationship loading

### 12. Access Control Pattern
**RULE**: All backend routes implement `getCompanyFilter(user)` for proper data isolation

### 13. Database Operations
**RULE**: DML operations use TypeScript scripts. DDL operations manual via Supabase dashboard. Required env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

### 14. Type-Safe Database Operations
**RULE**: Never use raw Supabase `.insert()/.update()` - always use type-safe helper functions with explicit interfaces. Create `DatabaseInsert` types that match table schemas exactly. Use runtime validation in development to catch schema mismatches.

**Example**:
```typescript
// ✅ Good: Type-safe with validation
await insertNotifications([{
  user_id: userId,
  type: 'HIL_MENTION',  // TypeScript enforces correct column name
  priority: 'NORMAL',   // Required field enforced at compile time
  title: 'You were mentioned',
  message: 'Content here'
}]);

// ❌ Bad: No type safety
await supabase.from('hil_notifications').insert({
  notification_type: 'HIL_MENTION'  // Wrong column name, silent failure
});
```

### 15. Quality Gates
**RULE**: `pnpm lint` and `pnpm type-check` must pass before commits. Write tests for new features. Use migrations for schema changes

### 16. Documentation Updates
**RULE**: New systems require `docs1/systems/` updates. Breaking changes require migration guides in `docs1/guides/` 