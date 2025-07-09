# Testing Strategy

## Current State

### **Implemented Testing Infrastructure**

**API Testing (✅ Strong)**
- **Framework**: Jest + Supertest + TypeScript
- **Coverage**: 1,500+ lines of comprehensive integration tests
- **CI/CD**: Full GitHub Actions pipeline with PostgreSQL service
- **Test Types**: Unit, integration, smoke tests with custom matchers
- **Environment Support**: Local, CI, staging, production configurations
- **Test Helpers**: 390-line APITestHelper class with database management

**Key Files:**
- `serverless-api/tests/integration/` - Complete API endpoint coverage
- `serverless-api/tests/utils/test-helpers.ts` - Comprehensive test utilities
- `.github/workflows/api-tests.yml` - 352-line CI/CD pipeline

### **Missing Critical Components**

**Frontend Testing (❌ None)**
- No React component tests
- No UI integration tests
- No user interaction testing

**End-to-End Testing (⚠️ Partial)**
- Playwright installed but not configured
- No E2E test files or page objects

**Package Testing (❌ None)**
- No tests for `@rexera/shared` utilities
- No schema validation testing

## Robust Testing Framework Design

### **1. Frontend Testing Implementation**

**Setup Required:**
```bash
# Add to frontend package.json
"@testing-library/react": "^13.4.0",
"@testing-library/jest-dom": "^6.1.4", 
"@testing-library/user-event": "^14.5.1",
"jest-environment-jsdom": "^29.7.0"
```

**Test Structure:**
```
frontend/
├── __tests__/
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── workflow-table.test.tsx
│   │   │   ├── interrupt-queue.test.tsx
│   │   │   └── header.test.tsx
│   │   └── ui/
│   ├── hooks/
│   │   ├── use-unified-notifications.test.ts
│   │   └── use-toast.test.ts
│   ├── pages/
│   │   └── workflow/[id].test.tsx
│   └── utils/
└── jest.config.js
```

**Priority Test Coverage:**
1. **Critical Components**: WorkflowTable, InterruptQueue, NotificationProvider
2. **Custom Hooks**: useUnifiedNotifications, useToast
3. **Workflow Pages**: Dashboard, workflow detail views
4. **Real-time Features**: Supabase subscription handling

### **2. End-to-End Testing Framework**

**Playwright Configuration:**
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
```

**E2E Test Structure:**
```
e2e/
├── workflows/
│   ├── create-workflow.spec.ts
│   ├── workflow-lifecycle.spec.ts
│   └── interrupt-handling.spec.ts
├── dashboard/
│   ├── workflow-table.spec.ts
│   └── notifications.spec.ts
├── auth/
│   └── authentication.spec.ts
├── fixtures/
│   └── test-data.ts
└── page-objects/
    ├── dashboard-page.ts
    ├── workflow-page.ts
    └── base-page.ts
```

**Critical E2E Scenarios:**
1. **Workflow Lifecycle**: Create → Execute → Complete
2. **HIL Interrupts**: Task failure → Notification → Resolution
3. **Real-time Updates**: Status changes, notifications
4. **Multi-user Scenarios**: Concurrent workflow management

### **3. Package Testing Framework**

**Shared Package Tests:**
```
packages/shared/
├── __tests__/
│   ├── schemas/
│   │   ├── workflow-schemas.test.ts
│   │   ├── task-schemas.test.ts
│   │   └── validation.test.ts
│   ├── types/
│   │   └── database-types.test.ts
│   └── utils/
│       ├── uuid-formatter.test.ts
│       └── date-utils.test.ts
└── jest.config.js
```

**Test Priorities:**
1. **Zod Schema Validation**: All API request/response schemas
2. **Type Safety**: Database type accuracy
3. **Utility Functions**: UUID formatting, date handling
4. **Cross-package Compatibility**: Import/export validation

### **4. Enhanced CI/CD Pipeline**

**Comprehensive Test Matrix:**
```yaml
# .github/workflows/comprehensive-tests.yml
strategy:
  matrix:
    test-type: [unit, integration, frontend, e2e]
    node-version: [18, 20]
    
jobs:
  test:
    steps:
      - name: Unit Tests
        run: pnpm test:unit
      - name: Integration Tests  
        run: pnpm test:integration
      - name: Frontend Tests
        run: pnpm test:frontend
      - name: E2E Tests
        run: pnpm test:e2e
      - name: Upload Coverage
        uses: codecov/codecov-action@v3
```

**Test Stages:**
1. **Fast Tests** (< 30s): Unit tests, schema validation
2. **Integration Tests** (< 2min): API endpoints with database
3. **Frontend Tests** (< 1min): Component and hook testing
4. **E2E Tests** (< 5min): Critical user journeys
5. **Performance Tests** (< 3min): Load testing key endpoints

### **5. Performance Testing Integration**

**Load Testing Setup:**
```javascript
// k6-scripts/workflow-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 10 },
    { duration: '5m', target: 50 },
    { duration: '2m', target: 0 },
  ],
};

export default function() {
  let response = http.get('http://localhost:3001/api/workflows');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
```

### **6. Automated Testing Coverage**

**Coverage Targets:**
- **Unit Tests**: >90% statements, >85% branches
- **Integration Tests**: >95% API endpoint coverage
- **Frontend Tests**: >80% component coverage
- **E2E Tests**: >90% critical user journey coverage

**Quality Gates:**
```javascript
// jest.config.js
coverageThreshold: {
  global: {
    statements: 80,
    branches: 75,
    functions: 80,
    lines: 80
  },
  './src/api/': {
    statements: 95,
    branches: 90,
    functions: 95,
    lines: 95
  }
}
```

## Implementation Roadmap

### **Phase 1: Frontend Testing (Week 1-2)**
1. Configure Jest + React Testing Library
2. Test critical components (WorkflowTable, InterruptQueue)
3. Test custom hooks (useUnifiedNotifications)
4. Add to CI/CD pipeline

### **Phase 2: E2E Testing (Week 2-3)**
1. Configure Playwright
2. Create page object models
3. Implement critical user journeys
4. Add visual regression testing

### **Phase 3: Package Testing (Week 3-4)**
1. Test shared schemas and utilities
2. Add cross-package integration tests
3. Validate type definitions

### **Phase 4: Performance Testing (Week 4)**
1. Implement k6 load testing
2. Add performance monitoring
3. Set up performance regression detection

## Testing Commands

```bash
# Development
pnpm test              # All tests
pnpm test:unit         # Unit tests only  
pnpm test:integration  # Integration tests only
pnpm test:frontend     # Frontend tests only
pnpm test:e2e          # E2E tests only
pnpm test:watch        # Watch mode
pnpm test:coverage     # Coverage reports

# CI/CD
pnpm test:ci           # All tests with coverage
pnpm test:smoke        # Quick health checks
pnpm test:performance  # Load testing
```

## Benefits

**Development Velocity:**
- Catch regressions early
- Safe refactoring with confidence
- Faster debugging with isolated test failures

**Production Reliability:**
- 95%+ critical path coverage
- Multi-browser compatibility
- Performance regression detection
- Database integrity validation

**Team Productivity:**
- Clear testing patterns
- Automated quality gates
- Comprehensive CI/CD feedback