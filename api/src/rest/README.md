# REST API Documentation

This REST API provides external access to selected tRPC procedures for integration with external systems (Python scripts, etc.).

## Base URL
```
http://localhost:3002/api/rest
```

## Authentication
Currently, the REST API uses the same authentication context as the tRPC procedures. Ensure proper authentication headers are included if required by the underlying procedures.

## Endpoints

### Workflows

#### List Workflows
```http
GET /api/rest/workflows
```

**Query Parameters:**
- `workflow_type` (optional): Filter by workflow type (`MUNI_LIEN_SEARCH`, `HOA_ACQUISITION`, `PAYOFF`)
- `status` (optional): Filter by status (`PENDING`, `IN_PROGRESS`, `AWAITING_REVIEW`, `BLOCKED`, `COMPLETED`)
- `client_id` (optional): Filter by client ID
- `assigned_to` (optional): Filter by assigned user ID
- `priority` (optional): Filter by priority (`LOW`, `NORMAL`, `HIGH`, `URGENT`)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `include` (optional): Comma-separated list of related data to include (`client`, `tasks`, `assigned_user`)

**Example:**
```bash
curl "http://localhost:3002/api/rest/workflows?page=1&limit=5&include=client,tasks"
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 25,
    "totalPages": 5
  }
}
```

#### Get Workflow by ID
```http
GET /api/rest/workflows/:id
```

**Path Parameters:**
- `id`: Workflow ID

**Query Parameters:**
- `include` (optional): Comma-separated list of related data to include (`client`, `tasks`, `assigned_user`)

**Example:**
```bash
curl "http://localhost:3002/api/rest/workflows/123e4567-e89b-12d3-a456-426614174000?include=client,tasks"
```

#### Create Workflow
```http
POST /api/rest/workflows
```

**Request Body:**
```json
{
  "workflow_type": "MUNI_LIEN_SEARCH",
  "client_id": "client-uuid",
  "title": "Workflow Title",
  "description": "Optional description",
  "priority": "NORMAL",
  "metadata": {},
  "due_date": "2024-12-31T23:59:59Z",
  "created_by": "user-uuid"
}
```

**Required Fields:**
- `workflow_type`
- `client_id`
- `title`
- `created_by`

**Example:**
```bash
curl -X POST "http://localhost:3002/api/rest/workflows" \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_type": "MUNI_LIEN_SEARCH",
    "client_id": "client-123",
    "title": "New Workflow",
    "created_by": "user-123"
  }'
```

### Tasks

#### List Tasks
```http
GET /api/rest/tasks
```

**Query Parameters:**
- `workflow_id` (optional): Filter by workflow ID
- `status` (optional): Filter by status (`PENDING`, `AWAITING_REVIEW`, `COMPLETED`, `FAILED`)
- `executor_type` (optional): Filter by executor type (`AI`, `HIL`)
- `assigned_to` (optional): Filter by assigned user ID
- `priority` (optional): Filter by priority (`LOW`, `NORMAL`, `HIGH`, `URGENT`)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `include` (optional): Comma-separated list of related data to include (`assigned_user`, `executions`, `dependencies`, `workflow`)

**Example:**
```bash
curl "http://localhost:3002/api/rest/tasks?workflow_id=workflow-123&include=workflow,assigned_user"
```

#### Create Task
```http
POST /api/rest/tasks
```

**Request Body:**
```json
{
  "workflow_id": "workflow-uuid",
  "title": "Task Title",
  "description": "Optional description",
  "executor_type": "AI",
  "assigned_to": "user-uuid",
  "priority": "NORMAL",
  "metadata": {},
  "due_date": "2024-12-31T23:59:59Z"
}
```

**Required Fields:**
- `workflow_id`
- `title`
- `executor_type`

**Example:**
```bash
curl -X POST "http://localhost:3002/api/rest/tasks" \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_id": "workflow-123",
    "title": "New Task",
    "executor_type": "AI"
  }'
```

### Health

#### Health Check
```http
GET /api/rest/health
```

**Example:**
```bash
curl "http://localhost:3002/api/rest/health"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "data": {
      "environment": {
        "hasSupabaseUrl": true,
        "hasServiceKey": true
      },
      "database": {
        "workflows": {
          "accessible": true,
          "count": 1,
          "error": null
        },
        "clients": {
          "accessible": true,
          "count": 1,
          "error": null
        }
      }
    }
  }
}
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

**HTTP Status Codes:**
- `200`: Success
- `201`: Created (for POST requests)
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

## Integration Examples

### Python Example
```python
import requests

# List workflows
response = requests.get('http://localhost:3002/api/rest/workflows', params={
    'page': 1,
    'limit': 10,
    'include': 'client,tasks'
})

if response.status_code == 200:
    data = response.json()
    workflows = data['data']
    pagination = data['pagination']
else:
    print(f"Error: {response.json()['error']}")

# Create a new workflow
workflow_data = {
    'workflow_type': 'MUNI_LIEN_SEARCH',
    'client_id': 'client-123',
    'title': 'New Workflow from Python',
    'created_by': 'user-123'
}

response = requests.post('http://localhost:3002/api/rest/workflows', json=workflow_data)
if response.status_code == 201:
    new_workflow = response.json()['data']
    print(f"Created workflow: {new_workflow['id']}")
```

### cURL Examples
```bash
# Get all workflows with pagination
curl "http://localhost:3002/api/rest/workflows?page=1&limit=5"

# Get specific workflow with related data
curl "http://localhost:3002/api/rest/workflows/workflow-id?include=client,tasks"

# Create new workflow
curl -X POST "http://localhost:3002/api/rest/workflows" \
  -H "Content-Type: application/json" \
  -d '{"workflow_type":"MUNI_LIEN_SEARCH","client_id":"client-123","title":"Test Workflow","created_by":"user-123"}'

# List tasks for a specific workflow
curl "http://localhost:3002/api/rest/tasks?workflow_id=workflow-123"

# Health check
curl "http://localhost:3002/api/rest/health"
```

## Notes

- All REST endpoints are wrappers around existing tRPC procedures
- No existing tRPC code was modified - this is a pure wrapper layer
- The REST API maintains the same validation and business logic as tRPC
- Error handling follows tRPC error patterns but returns HTTP status codes
- All endpoints support the same filtering and inclusion options as their tRPC counterparts