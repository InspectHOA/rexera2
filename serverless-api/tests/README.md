# Rexera 2.0 API Test Suite

A comprehensive, robust test suite for the Rexera 2.0 API with CI/CD integration and Vercel deployment testing.

## 🏗️ Test Architecture

### Test Types

1. **Unit Tests** (`tests/unit/`)
   - Fast, isolated tests with no external dependencies
   - Mock database and external service calls
   - Run in parallel for maximum speed

2. **Integration Tests** (`tests/integration/`)
   - Full API endpoint testing with real database
   - Complete request/response validation
   - Proper test data setup and cleanup

3. **Smoke Tests** (`tests/smoke/`)
   - Quick health checks and basic functionality
   - Safe to run against any environment
   - Minimal data modification

4. **End-to-End Tests** (planned)
   - Full user workflow testing
   - Frontend + API + Database integration
   - User journey validation

### Test Framework Stack

- **Jest**: Primary testing framework with TypeScript support
- **Supertest**: HTTP assertion testing for API endpoints
- **Custom Test Helpers**: Database setup, teardown, and utilities
- **GitHub Actions**: CI/CD automation
- **Vercel Integration**: Deployment testing

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Access to Supabase instance (local or cloud)

### Installation

```bash
# Install dependencies
pnpm install

# Build shared packages
pnpm --filter @rexera/shared build

# Setup environment variables
cp .env.example .env
# Edit .env with your Supabase credentials
```

### Environment Variables

Required for testing:

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional: Test Environment Override
TEST_ENV=local  # local, ci, staging, production
API_BASE_URL=http://localhost:3001  # Override API base URL
```

## 🧪 Running Tests

### Local Development

```bash
# Run all tests
pnpm test

# Run specific test types
pnpm test:unit           # Unit tests only
pnpm test:integration    # Integration tests only
pnpm test:smoke          # Smoke tests only

# Development mode
pnpm test:watch          # Watch mode for active development

# Coverage reports
pnpm test:coverage       # Generate coverage report
```

### Test Configuration

Tests automatically detect the environment and adjust configuration:

- **Local**: Full test suite with cleanup
- **CI**: Stable configuration with retries
- **Staging**: Limited destructive tests
- **Production**: Read-only smoke tests only

### Manual Environment Override

```bash
# Test against specific environment
TEST_ENV=staging pnpm test:smoke

# Test against custom URL
API_BASE_URL=https://my-deployment.vercel.app pnpm test:smoke

# Run with specific timeout
JEST_TIMEOUT=60000 pnpm test:integration
```

## 📋 Test Categories

### Unit Tests Coverage

- [x] UUID formatting utilities
- [x] Request validation helpers
- [x] Response formatting
- [x] Date/time utilities
- [ ] Business logic functions
- [ ] Error handling utilities

### Integration Tests Coverage

- [x] **Workflows API** (`/api/workflows`)
  - List workflows with filtering, pagination
  - Get workflow by ID
  - Create, update, delete workflows
  - Include related data (client, tasks)

- [x] **Task Executions API** (`/api/taskExecutions`)
  - List and filter task executions
  - Get task execution by ID
  - Create and update task executions
  - Bulk task creation
  - Status transitions

- [x] **Agents API** (`/api/agents`)
  - List and filter agents
  - Get agent by ID
  - Create, update, delete agents
  - Performance metrics
  - Capability management

- [ ] **Communications API** (planned)
- [ ] **Documents API** (planned)
- [ ] **Cron Jobs** (planned)

### Performance Tests

- [x] Response time validation (< 3s for lists, < 2s for details)
- [x] Bulk operation efficiency
- [x] Concurrent request handling
- [ ] Database query optimization
- [ ] Memory usage monitoring

### Security Tests

- [x] Input validation and sanitization
- [x] UUID format validation
- [x] CORS headers validation
- [x] Basic SQL injection protection
- [ ] Authentication flow testing
- [ ] Rate limiting validation
- [ ] Authorization checks

## 🔄 CI/CD Integration

### GitHub Actions Workflows

1. **API Test Suite** (`.github/workflows/api-tests.yml`)
   - Triggered on API-related code changes
   - Runs unit, integration, and smoke tests
   - Generates coverage reports
   - Type checking and linting

2. **Vercel Deployment Tests** (`.github/workflows/vercel-deployment-tests.yml`)
   - Triggered on successful Vercel deployments
   - Health checks and smoke tests
   - Performance and security validation
   - Load testing for production deployments

### Test Environments

| Environment | Tests Run | Data Cleanup | Parallel |
|-------------|-----------|--------------|----------|
| Local       | All       | Yes          | Yes      |
| CI          | All       | Yes          | No       |
| Staging     | Smoke + Integration | No | Yes    |
| Production  | Smoke Only | No          | Yes      |

## 🛠️ Test Utilities

### Custom Jest Matchers

```typescript
// UUID validation
expect(response.body.data.id).toBeValidUUID();

// Timestamp validation
expect(response.body.data.created_at).toBeValidTimestamp();

// API response format validation
expect(response.body).toMatchApiResponseFormat();
```

### Test Helper Functions

```typescript
import { testHelper } from './tests/utils/test-helpers';

// Start/stop test server
const baseURL = await testHelper.startTestServer(3002);
await testHelper.stopTestServer();

// Create comprehensive test data
const testData = await testHelper.createTestDataSet();

// Cleanup all test data
await testHelper.cleanupTestData();

// Retry with backoff
await testHelper.retry(() => apiCall(), 3, 1000);
```

### Environment Configuration

```typescript
import { getTestEnvironment, TestEnvironmentUtils } from './tests/config/test-environments';

// Get current environment config
const config = getTestEnvironment();

// Environment checks
if (TestEnvironmentUtils.isProduction()) {
  // Skip destructive tests
}

// Environment-specific timeouts
jest.setTimeout(TestEnvironmentUtils.getTimeout());
```

## 📊 Test Data Management

### Test Data Isolation

- All test data is prefixed with timestamps
- Automatic cleanup after test completion
- Isolated test databases for parallel execution
- No interference with production data

### Test Data Sets

Each test suite creates:

- 2 test clients (different types)
- 2 test agents (different capabilities)
- 2 test workflows (different statuses)
- 2 test task executions (different states)

### Cleanup Strategy

```typescript
// Automatic cleanup order
1. task_executions (dependent data first)
2. workflows
3. agents
4. clients (base data last)
```

## 🔍 Debugging Tests

### Common Issues

1. **Database Connection Errors**
   ```bash
   # Check environment variables
   echo $SUPABASE_URL
   echo $SUPABASE_SERVICE_ROLE_KEY
   
   # Test connection manually
   curl -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_URL/rest/v1/"
   ```

2. **Test Server Port Conflicts**
   ```bash
   # Kill existing servers
   lsof -ti:3001,3002,3003,3004 | xargs kill -9
   
   # Or use different ports
   TEST_PORT=3005 pnpm test:integration
   ```

3. **Test Data Cleanup Issues**
   ```bash
   # Manual cleanup if needed
   pnpm tsx tests/utils/cleanup-test-data.ts
   ```

### Verbose Logging

```bash
# Enable debug logging
DEBUG=true pnpm test

# Jest verbose mode
pnpm test --verbose

# Show console logs
pnpm test --silent=false
```

## 📈 Coverage Reports

### Generating Reports

```bash
# Generate coverage report
pnpm test:coverage

# Open HTML report
open serverless-api/coverage/lcov-report/index.html
```

### Coverage Targets

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

### Excluded from Coverage

- Type definitions (`.d.ts`)
- Test files
- Configuration files
- Vercel deployment functions

## 🚀 Vercel Deployment Testing

### Automatic Testing

When a Vercel deployment succeeds:

1. **Health Check**: Wait for deployment readiness
2. **Smoke Tests**: Basic functionality validation
3. **Contract Tests**: API endpoint validation
4. **Performance Tests**: Response time validation
5. **Security Tests**: Headers and input validation
6. **Load Tests**: Basic concurrent request testing (production only)

### Manual Deployment Testing

```bash
# Test specific deployment
gh workflow run vercel-deployment-tests.yml \
  -f vercel_url=https://your-deployment.vercel.app \
  -f test_type=smoke
```

### Deployment Test Configuration

```yaml
# vercel.json - Run smoke tests during build
{
  "buildCommand": "pnpm --filter=@rexera/shared build && pnpm --filter=@rexera/api test:smoke"
}
```

## 🤝 Contributing

### Adding New Tests

1. **Unit Tests**: Add to `tests/unit/` with `.test.ts` suffix
2. **Integration Tests**: Add to `tests/integration/` with comprehensive coverage
3. **Test Helpers**: Extend `tests/utils/test-helpers.ts` for reusable functionality

### Test Naming Convention

```typescript
describe('API Endpoint Name', () => {
  describe('HTTP Method /path', () => {
    it('should behavior with specific conditions', () => {
      // Test implementation
    });
  });
});
```

### Test Tags and Categories

```typescript
// Use environment-specific test execution
if (!shouldRunTest([TEST_TAGS.DESTRUCTIVE])) {
  return; // Skip in production
}
```

## 🔗 Related Documentation

- [API Documentation](../docs/03_API_SPECIFICATIONS.md)
- [Database Schema](../docs/02_DATABASE_SCHEMA.md)
- [System Architecture](../docs/01_SYSTEM_ARCHITECTURE.md)
- [Deployment Guide](../README.md#deployment)

## 📞 Support

For test suite issues:

1. Check test logs and environment configuration
2. Verify database connectivity and permissions
3. Review recent changes to API endpoints
4. Create GitHub issue with test failure details