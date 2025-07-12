# API Endpoint Audit Report

## Summary
Analysis of frontend API calls vs backend endpoint availability shows several critical mismatches.

## Current Development Server
- **Using**: `serverless-api/src/app.ts` (incomplete modular version)  
- **Issue**: Missing several endpoints that frontend expects

## Backend Endpoints Status

### ✅ Available Endpoints (in app.ts)
```
GET    /api/health                    - Health check
GET    /api/workflows                 - List workflows  
POST   /api/workflows                 - Create workflow
GET    /api/workflows/:id             - Get workflow by ID
GET    /api/taskExecutions            - List task executions
POST   /api/taskExecutions            - Create task execution  
PATCH  /api/taskExecutions/:id        - Update task execution
POST   /api/taskExecutions/bulk       - Bulk create tasks
GET    /api/agents                    - List agents
GET    /api/agents/:id                - Get agent by ID  
PATCH  /api/agents/:id                - Update agent
```

### ❌ Missing Endpoints (expected by frontend)
```
GET    /api/activities                - List activities
POST   /api/activities                - Create activity
GET    /api/interrupts                - List interrupts  
GET    /api/interrupts/:id            - Get interrupt by ID
POST   /api/interrupts                - Create interrupt
PUT    /api/interrupts/:id            - Update interrupt
GET    /api/communications            - List communications
POST   /api/communications            - Create communication  
POST   /api/incoming-email            - Process incoming email
GET    /api/workflows/:id/n8n-status  - Get n8n execution status
POST   /api/workflows/:id/cancel-n8n  - Cancel n8n execution
```

## Frontend API Client Calls (client.ts)

### Workflows API
- ✅ `GET /api/workflows` - List workflows
- ✅ `POST /api/workflows` - Create workflow  
- ✅ `GET /api/workflows/:id` - Get workflow by ID
- ❌ `GET /api/workflows/:id/n8n-status` - **Missing**
- ❌ `POST /api/workflows/:id/cancel-n8n` - **Missing**

### Task Executions API  
- ✅ `GET /api/taskExecutions` - List task executions
- ✅ `POST /api/taskExecutions` - Create task execution
- ✅ `PATCH /api/taskExecutions?id=:id` - Update task execution

### Agents API
- ✅ `GET /api/agents` - List agents
- ✅ `POST /api/agents?id=:id` - Update agent status

### Activities API
- ❌ `GET /api/activities` - **Missing** 
- ❌ `POST /api/activities` - **Missing**

### Interrupts API  
- ❌ `GET /api/interrupts` - **Missing**
- ❌ `GET /api/interrupts/:id` - **Missing**
- ❌ `POST /api/interrupts` - **Missing**
- ❌ `PUT /api/interrupts/:id` - **Missing**

### Communications API
- ❌ `GET /api/communications` - **Missing**
- ❌ `POST /api/communications` - **Missing**

### Incoming Email API
- ❌ `POST /api/incoming-email` - **Missing**

### Health API
- ✅ `GET /api/health` - Health check

## Critical Issues Found

### 1. Missing Route Modules
The modular `app.ts` only imports 3 route modules:
```javascript
import { agents, workflows, taskExecutions } from './routes';
```

**Missing route modules needed**:
- `activities`
- `interrupts` 
- `communications`
- `incoming-email`

### 2. App Version Confusion
Multiple app files exist:
- `app.ts` - Current (incomplete)
- `app-complete.ts` - Has all endpoints (not used)
- `app-test.ts` - Test version

### 3. Route Naming Inconsistency
- File: `routes/task-executions.ts` (with hyphens)
- Export: `taskExecutions` (camelCase)
- Mount: `/api/taskExecutions` (camelCase)
- This is actually working correctly now after our fix

## Solution Options

### Option 1: Use Complete App (Quick Fix)
Change `dev-server.ts` to use `app-complete.ts`:
```javascript
import app from './app-complete';
```

### Option 2: Complete Modular App (Recommended)
1. Create missing route modules
2. Add them to the modular app  
3. Keep clean separation of concerns

### Option 3: Hybrid Approach
Extract missing endpoints from `app-complete.ts` and create proper route modules.

## Immediate Actions Needed

1. **Test which endpoints frontend actually uses** in production
2. **Determine if app-complete.ts has all working endpoints**
3. **Choose between quick fix vs proper modular structure**
4. **Update dev-server to use complete app temporarily**

## Next Steps

1. Switch to complete app for immediate functionality
2. Create proper route modules for missing endpoints
3. Migrate back to modular structure
4. Update API documentation