# Development Guide

## Code Organization

```
rexera2/
├── frontend/               # Next.js app
├── serverless-api/         # Hono API
├── packages/shared/        # Shared types & utils
├── scripts/               # Database & utility scripts
└── supabase/              # Database schema
```

## Development Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Add Database Changes** (if needed)
   - Update `/supabase/migrations/`
   - Run `npx tsx scripts/db/seed.ts` to test

3. **Add Backend API** (if needed)
   - Create route in `/serverless-api/src/routes/`
   - Add OpenAPI docs in `/serverless-api/src/schemas/openapi/`
   - Export from `/serverless-api/src/routes/index.ts`

4. **Add Frontend Components**
   - Create components in `/frontend/src/components/`
   - Add pages in `/frontend/src/app/`
   - Use shared types from `@rexera/shared`

5. **Test & Validate**
   ```bash
   pnpm type-check    # Type validation
   pnpm lint          # Code quality
   pnpm test          # Run tests
   ```

## Code Standards

### TypeScript
- **Strict mode** enabled everywhere
- Import shared types from `@rexera/shared`
- Use Zod schemas for validation

### API Development
- Follow REST conventions
- Add OpenAPI documentation
- Use middleware for auth/validation
- Return consistent response formats

### Frontend Development
- Use Next.js 14 app router
- Implement dark mode support
- Real-time updates via Supabase subscriptions
- Responsive design with Tailwind

### Database
- Use TypeScript scripts for DML operations
- Manual DDL via Supabase dashboard
- Follow naming conventions (snake_case)

## Key Patterns

### Adding New Entity
1. Define in database schema
2. Add types to `@rexera/shared`
3. Create Zod schemas
4. Build API endpoints
5. Create frontend components

### Real-time Features
- Use Supabase subscriptions for live updates
- Handle connection states gracefully
- Implement optimistic updates where appropriate

### Error Handling
- Non-blocking audit logging
- Graceful degradation for real-time features
- Consistent error responses

## Useful Commands

```bash
# Development
pnpm dev                    # Start all services
pnpm type-check            # Type validation
pnpm lint                  # Code quality

# Database
npx tsx scripts/db/seed.ts          # Reset with test data
tsx scripts/utils/script-runner.ts  # List available scripts

# Testing
pnpm test                  # Run test suite
```

## Common Gotchas

- Always run `pnpm type-check` before commits
- Database changes require both schema + types update
- Real-time subscriptions need cleanup on unmount
- Audit logging should never block business operations