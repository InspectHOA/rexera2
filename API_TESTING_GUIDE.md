# Rexera 2.0 API Testing Guide

## Overview

This guide covers the comprehensive test suite for the Rexera 2.0 API, designed to ensure all endpoints work correctly with real data scenarios.

## Test Types

### 1. 💨 Smoke Tests
**Purpose**: Quick verification that API is responding  
**Duration**: ~5 seconds  
**Use Case**: Before development, after deployments, health checks

```bash
npm run test:smoke
```

**Tests**:
- Health endpoint responsiveness
- Basic endpoint availability
- Data structure validation
- Uses existing data (no setup/cleanup)

### 2. 🧪 Integration Tests
**Purpose**: Comprehensive endpoint testing with real scenarios  
**Duration**: ~15 seconds  
**Use Case**: CI/CD, feature validation, regression testing

```bash
npm run test
# or
npm run test:integration
```

**Tests**:
- Full CRUD operations
- Data relationships and includes
- Error handling (404s, validation)
- Performance benchmarks
- Creates and cleans up test data

## API Endpoints Tested

### Core Endpoints
✅ `GET /api/health` - Health check  
✅ `GET /api/workflows` - List workflows  
✅ `GET /api/workflows?include=client` - List with relationships  
✅ `GET /api/workflows/:uuid` - Get by UUID  
✅ `GET /api/workflows/:human-id` - Get by human readable ID  
✅ `GET /api/taskExecutions` - List task executions  
✅ `GET /api/taskExecutions?workflowId=:id` - Filter by workflow  
✅ `GET /api/taskExecutions?include=agent` - Include agent data  
✅ `GET /api/agents` - List agents

### Advanced Features Tested
✅ **Human Readable IDs**: `PAY-250706-001`, `HOA-250706-003`  
✅ **Include Parameters**: Client and agent relationship data  
✅ **Filtering**: Workflow-specific task filtering  
✅ **Error Handling**: 404 responses for missing resources  
✅ **Performance**: Response time validation (< 5 seconds)

## Test Data Scenarios

### Integration Test Data
- **2 Test Clients**: Different domains and names
- **2 Test Agents**: Research and communication types  
- **2 Test Workflows**: Different types (PAYOFF, HOA_ACQUISITION) and statuses
- **2 Test Tasks**: Different statuses and agents

### Real Data Scenarios
- **5 Production Workflows**: Various types and statuses
- **10 Production Agents**: All agent types (nina, mia, corey, etc.)
- **8 Production Tasks**: Different execution states

## Running Tests

### Prerequisites
```bash
# 1. Start API server
cd serverless-api
npm run dev   # or node simple-api-server.js

# 2. Ensure database is accessible
# 3. Node.js 18+ required
```

### Quick Health Check
```bash
npm run test:smoke
```

### Full Test Suite
```bash
npm run test
```

### Manual Test Run
```bash
# Direct test execution
node tests/api.integration.test.js
node tests/smoke.test.js
```

## Test Results Example

### Successful Run
```
📊 Test Results:
✅ Passed: 11
❌ Failed: 0
⏱️  Total time: 14351ms

🎉 All tests passed! API is working correctly.
```

### Test Coverage
- **Health & Connectivity**: 1 test
- **Workflows API**: 5 tests (list, includes, individual, not found)
- **Task Executions API**: 3 tests (list, filtering, includes)
- **Agents API**: 1 test
- **Performance**: 1 test

## CI/CD Integration

### GitHub Actions Example
```yaml
name: API Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd serverless-api
          npm install
      
      - name: Start API server
        run: |
          cd serverless-api
          npm run dev &
          sleep 5
      
      - name: Run smoke tests
        run: |
          cd serverless-api
          npm run test:smoke
      
      - name: Run integration tests
        run: |
          cd serverless-api
          npm run test:integration
```

### Docker Integration
```dockerfile
# Add to API Dockerfile
RUN npm run test:smoke
```

## Configuration

### Environment Variables
```bash
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional
API_BASE_URL=http://localhost:3001/api  # Default
```

### Test Data Prefixes
- Clients: `Test Client API *`
- Agents: `test-*`
- Workflows: `Test API Workflow *`
- Human IDs: `TEST-API-*`

## Troubleshooting

### Common Issues

**API Server Not Running**
```bash
❌ API server is not accessible
```
**Solution**: `npm run dev` in serverless-api directory

**Database Connection**
```bash
❌ Failed to setup test data
```
**Solution**: Check Supabase credentials and network

**Test Data Conflicts**
```bash
❌ unique constraint violation
```
**Solution**: Manual cleanup or check for orphaned test records

### Manual Cleanup
```sql
-- If tests fail to cleanup
DELETE FROM task_executions WHERE title LIKE 'Test Task%';
DELETE FROM workflows WHERE title LIKE 'Test API Workflow%';
DELETE FROM agents WHERE name LIKE 'test-%';
DELETE FROM clients WHERE name LIKE 'Test Client API%';
```

## Extending Tests

### Adding New Endpoints
1. Add test function to `api.integration.test.js`
2. Include in `tests` array
3. Follow existing patterns:

```javascript
async function testNewEndpoint() {
  console.log('\n🔧 Testing New Endpoint...');
  
  const { response, data } = await apiRequest('/new-endpoint');
  
  assertEqual(response.status, 200, 'Should return 200');
  assertTrue(data.success, 'Should return success=true');
  
  console.log('✅ New endpoint tests passed');
}
```

### Adding Test Data
```javascript
// In setupTestData()
const { data: newData, error } = await supabase
  .from('new_table')
  .insert([{ test: 'data' }])
  .select();

testData.newData = newData;
```

## Best Practices

### Test Design
- ✅ **Isolated**: Each test is independent
- ✅ **Atomic**: Setup → Test → Cleanup
- ✅ **Realistic**: Uses production-like data
- ✅ **Fast**: Complete suite under 30 seconds
- ✅ **Reliable**: Consistent results

### Data Management
- ✅ **Prefixed**: All test data clearly marked
- ✅ **Cleanup**: Automatic removal after tests
- ✅ **Non-destructive**: Never modifies production data
- ✅ **Isolated**: Separate from real workflows

### Error Handling
- ✅ **Graceful**: Tests continue on individual failures
- ✅ **Detailed**: Clear error messages
- ✅ **Recoverable**: Cleanup runs even on failures

## Success Metrics

### Integration Tests
- **All endpoints respond**: 200 status codes
- **Data integrity**: Correct relationships and filtering
- **Performance**: Response times under limits
- **Error handling**: Proper 404 responses
- **Cleanup**: No test data left behind

### Smoke Tests
- **Basic connectivity**: All major endpoints accessible
- **Data availability**: Existing workflows and tasks
- **Quick validation**: Under 10 seconds total

## Monitoring in Production

Use smoke tests for:
- **Health monitoring**: Regular endpoint checks
- **Deployment validation**: Post-deploy verification  
- **Load balancer checks**: Service availability
- **Alerting**: Failed test notifications

---

**🎯 Goal**: Ensure the Rexera 2.0 API is reliable, performant, and correctly handles all workflow management scenarios.