# E2E Tests with Stagehand

End-to-end tests for the Rexera frontend using Stagehand AI-powered browser automation.

## Quick Start

```bash
# Install dependencies
cd scripts/testing/e2e
pnpm install

# Run all E2E tests
pnpm test

# Run specific test suites
pnpm test:workflow  # Test workflow interaction only
pnpm test:login     # Test login flow only

# Run with browser visible (for debugging)
pnpm test:headful
```

## Test Suites

### 1. **workflow-interaction.test.ts**
Tests the complete user journey:
- ✅ Login with test credentials
- ✅ View workflows list 
- ✅ Click on a workflow to open details
- ✅ Verify workflow information is displayed
- ✅ Check task list functionality
- ✅ Navigate back to dashboard

## Configuration

Set environment variables:

```bash
# Required
export TEST_EMAIL="your-test-user@example.com"
export TEST_PASSWORD="your-test-password"

# Optional (defaults provided)
export FRONTEND_URL="http://localhost:3000"  # Frontend URL
export API_URL="http://localhost:3001"       # API URL  
export HEADLESS="true"                       # Run headless browser
```

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Run E2E Tests
  env:
    TEST_EMAIL: ${{ secrets.TEST_EMAIL }}
    TEST_PASSWORD: ${{ secrets.TEST_PASSWORD }}
    FRONTEND_URL: ${{ steps.deploy-preview.outputs.url }}
  run: |
    cd scripts/testing/e2e
    pnpm install
    pnpm test
```

### Local Pre-commit Hook

```bash
# In package.json scripts
"precommit": "pnpm test:api && pnpm test:e2e"
```

## Test Data Requirements

For tests to pass, ensure:

1. **Test user exists** with email/password credentials
2. **At least one workflow** exists in the system  
3. **Frontend and API** are running and accessible
4. **Database** is seeded with test data

## Debugging

### Run with Browser Visible
```bash
HEADLESS=false pnpm test
```

### View Screenshots
Failed tests automatically save screenshots to:
```
./test-failure-{timestamp}.png
```

### Stagehand Logs
Stagehand actions are logged with `🎭` prefix for easy filtering.

## Adding New Tests

1. Create new test file: `{feature-name}.test.ts`
2. Follow the existing pattern:
   ```typescript
   class MyFeatureE2ETests {
     private stagehand: Stagehand | null = null;
     
     async setup() { /* ... */ }
     async cleanup() { /* ... */ }
     async testMyFeature() { /* ... */ }
   }
   ```
3. Add to package.json scripts
4. Update this README

## Stagehand Best Practices

### Use Natural Language Actions
```typescript
// Good - Natural instructions
await stagehand.act({
  action: "Click on the first workflow in the table to open its details"
});

// Avoid - CSS selectors (unless necessary)
await stagehand.page.click('tr:first-child td:first-child a');
```

### Extract Structured Data
```typescript
const data = await stagehand.extract({
  instruction: "Get the workflow title and status",
  schema: z.object({
    title: z.string(),
    status: z.string()
  })
});
```

### Verify UI State
```typescript
const isVisible = await stagehand.observe({
  instruction: "Check if the workflow details are loaded and visible"
});
```

## Troubleshooting

### Common Issues

**No workflows found:**
- Ensure database is seeded: `pnpm seed`
- Check test user has access to workflows

**Login fails:**
- Verify TEST_EMAIL and TEST_PASSWORD are correct
- Check if user exists in Supabase Auth

**Timeouts:**
- Increase timeout in CONFIG object
- Check if frontend/API are running and responsive
- Verify network connectivity

**Stagehand initialization fails:**
- Check if required dependencies are installed
- Ensure proper Node.js version (18+)
- Try clearing node_modules and reinstalling