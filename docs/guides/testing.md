# Testing Guide

## Running Tests

```bash
# All tests
pnpm test

# Type checking
pnpm type-check

# Linting
pnpm lint

# Specific package
pnpm test --filter=@rexera/api
```

## Test Structure

```
tests/
├── unit/           # Unit tests
├── integration/    # API integration tests  
└── e2e/           # End-to-end tests
```

## Writing Tests

### API Tests
```typescript
// serverless-api/tests/unit/routes.test.ts
import { testClient } from 'hono/testing';
import app from '../src/app';

describe('API Routes', () => {
  it('should create workflow', async () => {
    const res = await testClient(app).workflows.$post({
      json: { /* test data */ }
    });
    
    expect(res.status).toBe(201);
  });
});
```

### Component Tests
```typescript
// frontend/tests/components/MyComponent.test.tsx
import { render, screen } from '@testing-library/react';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected text')).toBeInTheDocument();
  });
});
```

### Database Tests
```typescript
// scripts/tests/database.test.ts
import { createClient } from '@supabase/supabase-js';

describe('Database', () => {
  beforeEach(async () => {
    // Setup test data
    await supabase.from('workflows').insert(testWorkflow);
  });
  
  afterEach(async () => {
    // Cleanup
    await supabase.from('workflows').delete().eq('id', testWorkflow.id);
  });
});
```

## Test Data

```bash
# Reset database with test data
npx tsx scripts/db/seed.ts

# Generate specific test scenarios
npx tsx scripts/testing/create-test-scenarios.ts
```

## Testing Best Practices

- **Isolated tests** - Each test should be independent
- **Test data cleanup** - Clean up after each test
- **Mock external services** - Don't hit real APIs in tests
- **Test error cases** - Not just happy paths
- **Real database** - Use Supabase test instance for integration tests

## CI/CD Integration

```yaml
# .github/workflows/test.yml
- name: Type Check
  run: pnpm type-check
  
- name: Lint
  run: pnpm lint
  
- name: Test
  run: pnpm test
```

## Manual Testing

1. **Create test workflow** via UI
2. **Trigger n8n execution** 
3. **Test HIL intervention** flows
4. **Verify real-time updates** work
5. **Check audit logging** completeness