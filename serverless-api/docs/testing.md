# Rexera 2.0 API Integration Tests

This directory contains comprehensive integration tests for the Rexera 2.0 API endpoints.

## Overview

The test suite covers:
- ✅ Health check endpoint
- ✅ Workflows list (with and without includes)
- ✅ Individual workflow lookup (UUID and human readable ID)
- ✅ Task executions (with filtering and includes)
- ✅ Agents endpoint
- ✅ Error handling (404s)
- ✅ Performance testing
- ✅ Data integrity and relationships

## Running Tests

### Prerequisites
1. API server must be running on `localhost:3001`
2. Database must be accessible
3. Node.js 18+ required

### Quick Start
```bash
# From the serverless-api directory
npm run test

# Or run directly
node test-runner.js
```

### Manual Test Run
```bash
# Run the integration test file directly
node tests/api.integration.test.js
```

## Test Structure

### Test Data Management
- **Setup**: Creates isolated test data (clients, agents, workflows, tasks)
- **Execution**: Runs all test suites against real API endpoints
- **Cleanup**: Removes all test data after completion

### Test Categories

#### 1. Health & Basic Connectivity
- Tests `/api/health` endpoint
- Verifies API server is responding

#### 2. Workflows API
- `GET /api/workflows` - List all workflows
- `GET /api/workflows?include=client` - List with client data
- `GET /api/workflows/:uuid` - Get by UUID
- `GET /api/workflows/:human-id` - Get by human readable ID (e.g., PAY-250706-001)
- `GET /api/workflows/nonexistent` - 404 handling

#### 3. Task Executions API
- `GET /api/taskExecutions` - List all tasks
- `GET /api/taskExecutions?workflowId=:id` - Filter by workflow
- `GET /api/taskExecutions?include=agent` - Include agent data

#### 4. Agents API
- `GET /api/agents` - List all agents

#### 5. Performance Testing
- Response time validation (< 5 seconds)
- Complex query performance

## Test Data

Each test run creates:
- 2 test clients
- 2 test agents  
- 2 test workflows (different types and statuses)
- 2 test task executions

All test data is prefixed with "Test API" to avoid conflicts.

## Configuration

### Environment Variables
- `API_BASE_URL` - API server URL (default: http://localhost:3001/api)
- `SUPABASE_URL` - Database URL
- `SUPABASE_SERVICE_ROLE_KEY` - Database service role key

### Test Workflow IDs
- `TEST-API-001` - PAYOFF workflow (IN_PROGRESS)
- `TEST-API-002` - HOA_ACQUISITION workflow (COMPLETED)

## CI/CD Integration

The test suite is designed for CI/CD integration:

```yaml
# Example GitHub Actions
- name: Run API Tests
  run: |
    cd serverless-api
    npm install
    npm run test
```

## Extending Tests

To add new test cases:

1. Add test function to `api.integration.test.js`
2. Include in the `tests` array in `runAllTests()`
3. Follow the existing pattern:
   ```javascript
   async function testNewFeature() {
     console.log('\\n🔧 Testing New Feature...');
     
     const { response, data } = await apiRequest('/new-endpoint');
     
     assertEqual(response.status, 200, 'Should return 200');
     assertTrue(data.success, 'Should return success=true');
     
     console.log('✅ New feature tests passed');
   }
   ```

## Troubleshooting

### Common Issues

**API Server Not Running**
```
❌ API server is not accessible
```
**Solution**: Start the API server with `npm run dev` or `node simple-api-server.js`

**Database Connection Issues**
```
❌ Failed to setup test data
```
**Solution**: Check Supabase credentials and network connectivity

**Test Data Conflicts**
```
❌ unique constraint violation
```
**Solution**: Manually clean up test data or check for orphaned records

### Manual Cleanup
If tests fail to cleanup properly:
```sql
DELETE FROM task_executions WHERE title LIKE 'Test Task%';
DELETE FROM workflows WHERE title LIKE 'Test API Workflow%';
DELETE FROM agents WHERE name LIKE 'test-%';
DELETE FROM clients WHERE name LIKE 'Test Client API%';
```

## Success Criteria

All tests should pass with:
- ✅ 11/11 tests passed
- ⏱️ Response time < 5 seconds
- 🧹 Clean data cleanup
- 📊 No errors or warnings