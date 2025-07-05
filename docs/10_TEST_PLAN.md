# Test Plan

<!--
This document provides comprehensive testing strategies and procedures for Rexera 2.0, including unit testing, integration testing, end-to-end workflow validation, and quality assurance protocols.
-->

## Overview

Rexera 2.0 testing strategy encompasses **multi-layer validation** across AI agents, workflow orchestration, database integrity, and user interfaces. The testing approach ensures **production readiness** through comprehensive coverage of functional, performance, security, and integration scenarios.

## Testing Architecture

```mermaid
graph TB
    subgraph "Testing Layers"
        subgraph "Unit Testing"
            UT1[Component Tests<br/>Jest + RTL]
            UT2[API Tests<br/>tRPC + REST Testing]
            UT3[Schema Validation<br/>Zod Testing]
        end
        
        subgraph "Integration Testing"
            IT1[Database Integration<br/>Supabase Testing]
            IT2[Agent API Testing<br/>HTTP Mocking]
            IT3[Workflow Testing<br/>n8n Validation]
        end
        
        subgraph "End-to-End Testing"
            E2E1[Workflow Automation<br/>Playwright]
            E2E2[User Journey Testing<br/>Browser Automation]
            E2E3[Real-time Features<br/>WebSocket Testing]
        end
        
        subgraph "Quality Assurance"
            QA1[Performance Testing<br/>Load & Stress]
            QA2[Security Testing<br/>Penetration Testing]
            QA3[Accessibility Testing<br/>WCAG Compliance]
        end
    end
```

## Test Categories

### 1. Unit Testing

#### 1.1 Frontend Component Testing
```typescript
// __tests__/components/WorkflowDashboard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { WorkflowDashboard } from '@/components/WorkflowDashboard'
import { mockWorkflowData } from '@/test-utils/mocks'

describe('WorkflowDashboard', () => {
  it('displays workflow status correctly', () => {
    render(<WorkflowDashboard workflows={mockWorkflowData} />)
    
    expect(screen.getByText('Municipal Lien Search')).toBeInTheDocument()
    expect(screen.getByText('IN_PROGRESS')).toBeInTheDocument()
  })

  it('handles workflow status updates', async () => {
    const onStatusUpdate = jest.fn()
    render(
      <WorkflowDashboard 
        workflows={mockWorkflowData} 
        onStatusUpdate={onStatusUpdate}
      />
    )
    
    fireEvent.click(screen.getByText('Update Status'))
    expect(onStatusUpdate).toHaveBeenCalledWith('COMPLETED')
  })
})
```

#### 1.2 Hybrid API Testing (tRPC + REST)
```typescript
// __tests__/api/workflows.test.ts
import { createTRPCMsw } from 'msw-trpc'
import { appRouter } from '@/server/api/root'
import { createMocks } from 'node-mocks-http'
import { prismaMock } from '@/test-utils/prisma-mock'

describe('Workflow API (tRPC + REST)', () => {
  // Test tRPC procedure directly
  it('creates workflow via tRPC procedure', async () => {
    const caller = appRouter.createCaller({
      session: { user: { id: 'test-user' } },
      db: prismaMock
    })

    prismaMock.workflows.create.mockResolvedValue({
      id: 'test-workflow-id',
      type: 'PAYOFF_REQUEST',
      status: 'PENDING'
    })

    const result = await caller.workflows.create({
      type: 'PAYOFF_REQUEST',
      clientId: 'test-client-id',
      payload: { propertyAddress: '123 Test St' }
    })
    
    expect(result.id).toBe('test-workflow-id')
    expect(result.type).toBe('PAYOFF_REQUEST')
  })

  // Test REST endpoint that calls tRPC procedure
  it('creates workflow via REST endpoint', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      url: '/api/rest/workflows',
      body: {
        type: 'PAYOFF_REQUEST',
        clientId: 'test-client-id',
        payload: { propertyAddress: '123 Test St' }
      }
    })

    prismaMock.workflows.create.mockResolvedValue({
      id: 'test-workflow-id',
      type: 'PAYOFF_REQUEST',
      status: 'PENDING'
    })

    await handler(req, res)
    
    expect(res._getStatusCode()).toBe(201)
    expect(JSON.parse(res._getData())).toMatchObject({
      id: 'test-workflow-id',
      type: 'PAYOFF_REQUEST'
    })
  })
})
```

#### 1.3 Schema Validation Testing
```typescript
// __tests__/schemas/payoff-request.test.ts
import { PayoffRequestSchema } from '@rexera/types'
import { ZodError } from 'zod'

describe('PayoffRequestSchema', () => {
  it('validates complete payoff request', () => {
    const validPayload = {
      propertyAddress: '123 Main St, City, ST 12345',
      loanNumber: 'LN123456789',
      borrowerName: 'John Doe',
      requestedBy: 'Jane Smith',
      urgency: 'STANDARD'
    }

    expect(() => PayoffRequestSchema.parse(validPayload)).not.toThrow()
  })

  it('rejects invalid payoff request', () => {
    const invalidPayload = {
      propertyAddress: '', // Required field empty
      loanNumber: 'invalid', // Too short
      urgency: 'INVALID_URGENCY' // Invalid enum
    }

    expect(() => PayoffRequestSchema.parse(invalidPayload)).toThrow(ZodError)
  })
})
```

### 2. Integration Testing

#### 2.1 Database Integration Testing
```typescript
// __tests__/integration/database.test.ts
import { createClient } from '@supabase/supabase-js'
import { testDatabaseUrl, testAnonKey } from '@/test-utils/config'

describe('Database Integration', () => {
  let supabase: ReturnType<typeof createClient>

  beforeAll(() => {
    supabase = createClient(testDatabaseUrl, testAnonKey)
  })

  it('creates workflow with proper relationships', async () => {
    // Create client first
    const { data: client } = await supabase
      .from('clients')
      .insert({ name: 'Test Client', email: 'test@example.com' })
      .select()
      .single()

    // Create workflow
    const { data: workflow, error } = await supabase
      .from('workflows')
      .insert({
        type: 'PAYOFF_REQUEST',
        client_id: client.id,
        payload: { propertyAddress: '123 Test St' }
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(workflow.client_id).toBe(client.id)
  })

  it('enforces RLS policies correctly', async () => {
    // Test unauthorized access
    const unauthorizedClient = createClient(testDatabaseUrl, testAnonKey)
    
    const { data, error } = await unauthorizedClient
      .from('workflows')
      .select('*')

    expect(error).toBeTruthy()
    expect(error?.message).toContain('RLS')
  })
})
```

#### 2.2 AI Agent API Testing
```typescript
// __tests__/integration/agents.test.ts
import { NinaAgent, MiaAgent, FlorianAgent } from '@/lib/agents'
import { mockAgentResponses } from '@/test-utils/agent-mocks'

describe('AI Agent Integration', () => {
  beforeEach(() => {
    // Mock HTTP requests to agent APIs
    jest.clearAllMocks()
  })

  it('Nina agent performs property research', async () => {
    const mockResponse = mockAgentResponses.nina.propertyResearch
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    } as Response)

    const result = await NinaAgent.researchProperty({
      address: '123 Main St, City, ST 12345',
      taskId: 'test-task-id'
    })

    expect(result.propertyDetails).toBeDefined()
    expect(result.ownerInformation).toBeDefined()
    expect(result.confidence).toBeGreaterThan(0.8)
  })

  it('handles agent API failures gracefully', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'))

    const result = await MiaAgent.sendEmail({
      to: 'test@example.com',
      subject: 'Test Email',
      body: 'Test content'
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Network error')
  })
})
```

#### 2.3 Workflow Engine Testing
```typescript
// __tests__/integration/n8n-workflows.test.ts
import { N8nClient } from '@/lib/n8n-client'
import { testWorkflowDefinitions } from '@/test-utils/workflow-mocks'

describe('n8n Workflow Integration', () => {
  let n8nClient: N8nClient

  beforeAll(() => {
    n8nClient = new N8nClient({
      baseUrl: process.env.TEST_N8N_URL,
      apiKey: process.env.TEST_N8N_API_KEY
    })
  })

  it('triggers payoff workflow successfully', async () => {
    const workflowData = {
      workflowId: 'test-payoff-workflow',
      payload: {
        propertyAddress: '123 Test St',
        loanNumber: 'LN123456789'
      }
    }

    const result = await n8nClient.triggerWorkflow(
      'payoff-request-workflow',
      workflowData
    )

    expect(result.success).toBe(true)
    expect(result.executionId).toBeDefined()
  })

  it('handles workflow execution errors', async () => {
    const invalidData = {
      workflowId: 'invalid-workflow',
      payload: {} // Missing required fields
    }

    const result = await n8nClient.triggerWorkflow(
      'payoff-request-workflow',
      invalidData
    )

    expect(result.success).toBe(false)
    expect(result.error).toContain('validation')
  })
})
```

### 3. End-to-End Testing

#### 3.1 Complete Workflow Testing
```typescript
// __tests__/e2e/payoff-workflow.test.ts
import { test, expect } from '@playwright/test'

test.describe('Payoff Request Workflow', () => {
  test('complete payoff workflow execution', async ({ page }) => {
    // Login as HIL operator
    await page.goto('/login')
    await page.fill('[data-testid=email]', 'hil@rexera.com')
    await page.fill('[data-testid=password]', 'test-password')
    await page.click('[data-testid=login-button]')

    // Create new payoff workflow
    await page.click('[data-testid=new-workflow]')
    await page.selectOption('[data-testid=workflow-type]', 'PAYOFF_REQUEST')
    
    // Fill workflow details
    await page.fill('[data-testid=property-address]', '123 Main St, City, ST 12345')
    await page.fill('[data-testid=loan-number]', 'LN123456789')
    await page.fill('[data-testid=borrower-name]', 'John Doe')
    
    await page.click('[data-testid=create-workflow]')

    // Verify workflow creation
    await expect(page.locator('[data-testid=workflow-status]')).toContainText('PENDING')

    // Monitor workflow progress
    await page.waitForSelector('[data-testid=nina-task]', { timeout: 30000 })
    await expect(page.locator('[data-testid=nina-status]')).toContainText('IN_PROGRESS')

    // Simulate agent completion
    await page.click('[data-testid=simulate-nina-completion]')
    await expect(page.locator('[data-testid=nina-status]')).toContainText('COMPLETED')

    // Verify next agent activation
    await expect(page.locator('[data-testid=mia-status]')).toContainText('IN_PROGRESS')
  })

  test('HIL intervention workflow', async ({ page }) => {
    // Navigate to workflow with interrupt
    await page.goto('/workflows/test-workflow-with-interrupt')

    // Verify interrupt notification
    await expect(page.locator('[data-testid=interrupt-alert]')).toBeVisible()
    await expect(page.locator('[data-testid=interrupt-severity]')).toContainText('HIGH')

    // Handle interrupt
    await page.click('[data-testid=handle-interrupt]')
    await page.fill('[data-testid=resolution-notes]', 'Resolved portal access issue')
    await page.click('[data-testid=resolve-interrupt]')

    // Verify workflow resumption
    await expect(page.locator('[data-testid=workflow-status]')).toContainText('IN_PROGRESS')
  })
})
```

#### 3.2 Real-time Features Testing
```typescript
// __tests__/e2e/real-time.test.ts
import { test, expect } from '@playwright/test'

test.describe('Real-time Features', () => {
  test('workflow status updates in real-time', async ({ page, context }) => {
    // Open two browser contexts (HIL operator and client)
    const hilPage = page
    const clientPage = await context.newPage()

    // HIL operator updates workflow
    await hilPage.goto('/workflows/test-workflow')
    await hilPage.click('[data-testid=update-status]')
    await hilPage.selectOption('[data-testid=new-status]', 'COMPLETED')
    await hilPage.click('[data-testid=save-status]')

    // Client sees update in real-time
    await clientPage.goto('/client/workflows/test-workflow')
    await expect(clientPage.locator('[data-testid=workflow-status]'))
      .toContainText('COMPLETED', { timeout: 5000 })
  })

  test('live chat functionality', async ({ page, context }) => {
    const hilPage = page
    const clientPage = await context.newPage()

    // Start chat session
    await hilPage.goto('/workflows/test-workflow/messages')
    await clientPage.goto('/client/workflows/test-workflow/messages')

    // HIL sends message
    await hilPage.fill('[data-testid=message-input]', 'Hello, how can I help?')
    await hilPage.click('[data-testid=send-message]')

    // Client receives message
    await expect(clientPage.locator('[data-testid=latest-message]'))
      .toContainText('Hello, how can I help?', { timeout: 5000 })

    // Client responds
    await clientPage.fill('[data-testid=message-input]', 'I need an update on my payoff request')
    await clientPage.click('[data-testid=send-message]')

    // HIL receives response
    await expect(hilPage.locator('[data-testid=latest-message]'))
      .toContainText('I need an update on my payoff request', { timeout: 5000 })
  })
})
```

### 4. Performance Testing

#### 4.1 Load Testing
```typescript
// __tests__/performance/load-test.ts
import { check } from 'k6'
import http from 'k6/http'

export let options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up
    { duration: '5m', target: 50 }, // Stay at 50 users
    { duration: '2m', target: 100 }, // Ramp to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.01'], // Error rate under 1%
  }
}

export default function() {
  // Test workflow creation endpoint (REST)
  let response = http.post('https://app.rexera.com/api/rest/workflows', {
    type: 'PAYOFF_REQUEST',
    clientId: 'test-client-id',
    payload: {
      propertyAddress: '123 Load Test St',
      loanNumber: 'LN' + Math.random().toString(36).substr(2, 9)
    }
  }, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + __ENV.TEST_JWT_TOKEN
    }
  })

  check(response, {
    'workflow created successfully': (r) => r.status === 201,
    'response time < 2s': (r) => r.timings.duration < 2000,
  })

  // Test workflow status endpoint (REST)
  if (response.status === 201) {
    let workflowId = response.json('id')
    let statusResponse = http.get(`https://app.rexera.com/api/rest/workflows/${workflowId}`)
    
    check(statusResponse, {
      'status retrieved successfully': (r) => r.status === 200,
      'response time < 1s': (r) => r.timings.duration < 1000,
    })
  }
}
```

#### 4.2 Database Performance Testing
```sql
-- __tests__/performance/database-performance.sql
-- Test query performance for critical operations

-- Workflow dashboard query performance
EXPLAIN ANALYZE
SELECT w.*, c.name as client_name, 
       COUNT(t.id) as task_count,
       COUNT(CASE WHEN t.status = 'COMPLETED' THEN 1 END) as completed_tasks
FROM workflows w
JOIN clients c ON w.client_id = c.id
LEFT JOIN tasks t ON w.id = t.workflow_id
WHERE w.status IN ('PENDING', 'IN_PROGRESS')
GROUP BY w.id, c.name
ORDER BY w.created_at DESC
LIMIT 50;

-- Task queue query performance
EXPLAIN ANALYZE
SELECT t.*, w.type as workflow_type, c.name as client_name
FROM tasks t
JOIN workflows w ON t.workflow_id = w.id
JOIN clients c ON w.client_id = c.id
WHERE t.status = 'PENDING'
  AND t.assigned_to = 'hil-user-id'
ORDER BY t.priority DESC, t.created_at ASC
LIMIT 20;

-- SLA monitoring query performance
EXPLAIN ANALYZE
SELECT t.*, 
       CASE 
         WHEN t.sla_deadline < NOW() THEN 'OVERDUE'
         WHEN t.sla_deadline < NOW() + INTERVAL '1 hour' THEN 'WARNING'
         ELSE 'OK'
       END as sla_status
FROM tasks t
JOIN workflows w ON t.workflow_id = w.id
WHERE w.status IN ('PENDING', 'IN_PROGRESS')
  AND t.status != 'COMPLETED'
ORDER BY t.sla_deadline ASC;
```

### 5. Security Testing

#### 5.1 Authentication & Authorization Testing
```typescript
// __tests__/security/auth.test.ts
import { test, expect } from '@playwright/test'

test.describe('Security Testing', () => {
  test('unauthorized access prevention', async ({ page }) => {
    // Attempt to access protected route without authentication
    const response = await page.goto('/workflows')
    expect(response?.status()).toBe(401)
  })

  test('role-based access control', async ({ page }) => {
    // Login as client user
    await page.goto('/login')
    await page.fill('[data-testid=email]', 'client@example.com')
    await page.fill('[data-testid=password]', 'client-password')
    await page.click('[data-testid=login-button]')

    // Attempt to access HIL-only features
    const response = await page.goto('/admin/workflows')
    expect(response?.status()).toBe(403)
  })

  test('SQL injection prevention', async ({ request }) => {
    // Attempt SQL injection in workflow search
    const response = await request.get('/api/workflows', {
      params: {
        search: "'; DROP TABLE workflows; --"
      }
    })

    expect(response.status()).toBe(400)
    expect(await response.text()).toContain('Invalid search parameter')
  })

  test('XSS prevention', async ({ page }) => {
    // Attempt XSS in message input
    await page.goto('/workflows/test-workflow/messages')
    await page.fill('[data-testid=message-input]', '<script>alert("XSS")</script>')
    await page.click('[data-testid=send-message]')

    // Verify script is escaped, not executed
    const messageContent = await page.locator('[data-testid=latest-message]').textContent()
    expect(messageContent).toContain('&lt;script&gt;')
    expect(messageContent).not.toContain('<script>')
  })
})
```

#### 5.2 Data Privacy Testing
```typescript
// __tests__/security/privacy.test.ts
import { test, expect } from '@playwright/test'

test.describe('Data Privacy', () => {
  test('PII data masking', async ({ page }) => {
    // Login as non-admin user
    await page.goto('/login')
    await page.fill('[data-testid=email]', 'user@rexera.com')
    await page.fill('[data-testid=password]', 'user-password')
    await page.click('[data-testid=login-button]')

    // View workflow with PII data
    await page.goto('/workflows/test-workflow-with-pii')

    // Verify SSN is masked
    const ssnElement = await page.locator('[data-testid=borrower-ssn]')
    expect(await ssnElement.textContent()).toMatch(/\*\*\*-\*\*-\d{4}/)

    // Verify phone number is partially masked
    const phoneElement = await page.locator('[data-testid=borrower-phone]')
    expect(await phoneElement.textContent()).toMatch(/\(\*\*\*\) \*\*\*-\d{4}/)
  })

  test('audit trail logging', async ({ page, request }) => {
    // Perform sensitive action
    await page.goto('/workflows/test-workflow')
    await page.click('[data-testid=view-sensitive-data]')

    // Verify audit log entry
    const auditResponse = await request.get('/api/audit-logs', {
      params: {
        action: 'VIEW_SENSITIVE_DATA',
        resource: 'test-workflow'
      }
    })

    expect(auditResponse.status()).toBe(200)
    const auditLogs = await auditResponse.json()
    expect(auditLogs.length).toBeGreaterThan(0)
    expect(auditLogs[0].action).toBe('VIEW_SENSITIVE_DATA')
  })
})
```

### 6. Accessibility Testing

#### 6.1 WCAG Compliance Testing
```typescript
// __tests__/accessibility/wcag.test.ts
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility Testing', () => {
  test('workflow dashboard accessibility', async ({ page }) => {
    await page.goto('/workflows')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('keyboard navigation', async ({ page }) => {
    await page.goto('/workflows')
    
    // Test tab navigation
    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toHaveAttribute('data-testid', 'new-workflow-button')
    
    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toHaveAttribute('data-testid', 'search-input')
    
    // Test Enter key activation
    await page.keyboard.press('Enter')
    await expect(page.locator('[data-testid=search-results]')).toBeVisible()
  })

  test('screen reader compatibility', async ({ page }) => {
    await page.goto('/workflows/test-workflow')
    
    // Verify ARIA labels
    await expect(page.locator('[data-testid=workflow-status]')).toHaveAttribute('aria-label')
    await expect(page.locator('[data-testid=task-list]')).toHaveAttribute('role', 'list')
    await expect(page.locator('[data-testid=task-item]').first()).toHaveAttribute('role', 'listitem')
  })
})
```

## Test Data Management

### Test Database Setup
```sql
-- test-data/setup.sql
-- Create test database with sample data

-- Test clients
INSERT INTO clients (id, name, email, phone) VALUES
('test-client-1', 'Test Client 1', 'client1@test.com', '555-0001'),
('test-client-2', 'Test Client 2', 'client2@test.com', '555-0002');

-- Test workflows
INSERT INTO workflows (id, type, status, client_id, payload) VALUES
('test-workflow-1', 'PAYOFF_REQUEST', 'IN_PROGRESS', 'test-client-1', '{"propertyAddress": "123 Test St"}'),
('test-workflow-2', 'MUNI_LIEN_SEARCH', 'PENDING', 'test-client-2', '{"propertyAddress": "456 Test Ave"}');

-- Test tasks
INSERT INTO tasks (id, workflow_id, type, status, agent_name, assigned_to) VALUES
('test-task-1', 'test-workflow-1', 'property_research', 'COMPLETED', 'Nina', 'hil-user-1'),
('test-task-2', 'test-workflow-1', 'send_email', 'IN_PROGRESS', 'Mia', 'hil-user-1');
```

### Mock Data Generators
```typescript
// test-utils/data-generators.ts
import { faker } from '@faker-js/faker'

export const generateWorkflow = (overrides = {}) => ({
  id: faker.string.uuid(),
  type: faker.helpers.arrayElement(['PAYOFF_REQUEST', 'MUNI_LIEN_SEARCH', 'HOA_ACQUISITION']),
  status: faker.helpers.arrayElement(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED']),
  clientId: faker.string.uuid(),
  payload: {
    propertyAddress: faker.location.streetAddress(),
    loanNumber: 'LN' + faker.string.numeric(9),
    borrowerName: faker.person.fullName()
  },
  createdAt: faker.date.recent(),
  ...overrides
})

export const generateTask = (workflowId: string, overrides = {}) => ({
  id: faker.string.uuid(),
  workflowId,
  type: faker.helpers.arrayElement(['property_research', 'send_email', 'make_call']),
  status: faker.helpers.arrayElement(['PENDING', 'IN_PROGRESS', 'COMPLETED']),
  agentName: faker.helpers.arrayElement(['Nina', 'Mia', 'Florian', 'Rex']),
  assignedTo: faker.string.uuid(),
  ...overrides
})
```

## Test Environment Configuration

### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/test-utils/setup.ts'],
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@rexera/types$': '<rootDir>/../rexera-types/src'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}
```

### Playwright Configuration
```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '__tests__/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    }
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI
  }
})
```

## Continuous Integration

### GitHub Actions Test Pipeline
```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:coverage
      
      - uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  security-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm audit --audit-level high
      - run: npx snyk test
        env:
          SNYK