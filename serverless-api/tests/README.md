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
- **Native Hono Testing**: Direct API endpoint testing using Hono's built-in test client
- **Custom Jest Matchers**: API response validation and UUID/timestamp testing
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

- [x] UUID formatting and validation utilities
- [x] Workflow ID resolution utilities  
- [x] Shared Zod schemas (workflows, filters, creation)
- [x] Response formatting helpers
- [x] Date/time calculation utilities

### Integration Tests Coverage

- [x] **Hono API Implementation** (`/api/*`)
  - Health check endpoint
  - OpenAPI documentation generation
  - Swagger UI serving
  - Root API information
  - CORS headers validation
  - 404 error handling

- [x] **Workflows API** (`/api/workflows`)
  - GET /api/workflows (with auth/database error handling)
  - POST /api/workflows (creation requests)

- [x] **Task Executions API** (`/api/taskExecutions`)
  - GET /api/taskExecutions (with auth/database error handling)

- [x] **Agents API** (`/api/agents`)
  - GET /api/agents (with auth/database error handling)

- [x] **Human-Readable ID Support**
  - UUID format handling in workflow endpoints
  - Human-readable ID format support

- [x] **Smoke Tests**
  - Basic API health validation

### Security & Validation Tests

- [x] Input validation via Zod schemas
- [x] UUID format validation
- [x] API response format validation
- [x] Error handling for invalid requests
- [x] CORS headers presence (basic check)

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

### Test Execution Modes

- **Local Development**: Full test suite with mocked dependencies
- **CI/CD**: Same test suite with TypeScript checking and linting
- **Smoke Testing**: Basic health checks safe for any environment

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

### Native Hono Test Client

```typescript
import { testClient } from '../utils/hono-test-client';
import { testApp } from '../../src/app-test';

// Create test client
const client = testClient(testApp);

// Make test requests
const response = await client.get('/api/workflows');
const postResponse = await client.post('/api/workflows', data);

// Built-in response validation
expect(response.status).toBe(200);
expect(response.body.success).toBe(true);
```

### Test Environment Setup

Tests automatically configure mock environments with:
- Mock Supabase URLs and service keys
- Global fetch mocking for external API calls
- Custom Jest matchers for API response validation
- Consistent test timeouts (30 seconds)

## 📊 Test Strategy

### Test Approach

- **Unit Tests**: Test individual functions and schemas with mocked dependencies
- **Integration Tests**: Test API endpoints with graceful error handling for auth/database failures
- **Smoke Tests**: Basic health checks that can run against any environment
- **Mock-First**: Tests use mocked external dependencies to ensure reliability and speed

### Test Environment Isolation

- Mock Supabase configuration for all tests
- Global fetch mocking to prevent external API calls
- No real database dependencies for fast, reliable testing
- Graceful handling of auth failures in integration tests

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

Current coverage is focused on testing the API layer and core utilities:
- **Route Handlers**: ~50% coverage
- **Middleware**: ~45% coverage  
- **Utilities**: ~60% coverage
- **Schemas**: 100% test coverage (unit tests)

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
2. **Integration Tests**: Add to `tests/integration/` using the Hono test client pattern
3. **Test Utilities**: Add reusable functionality to `tests/utils/hono-test-client.ts`

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