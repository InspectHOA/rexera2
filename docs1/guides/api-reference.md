# API Reference

## Base URLs

- **Development**: http://localhost:3001
- **Production**: https://your-api-domain.vercel.app

## Authentication

All endpoints require Bearer token authentication:
```bash
Authorization: Bearer <token>
```

## Interactive Documentation

**Swagger UI**: Visit `/api-docs` for complete interactive API documentation with:
- Request/response schemas
- Try-it-out functionality  
- Parameter descriptions
- Error code explanations

## Core Endpoints

### Workflows
```bash
GET    /api/workflows              # List workflows
POST   /api/workflows              # Create workflow
GET    /api/workflows/{id}         # Get workflow
PATCH  /api/workflows/{id}         # Update workflow
POST   /api/workflows/{id}/trigger-n8n  # Start n8n execution
```

### Task Executions
```bash
GET    /api/taskExecutions         # List tasks
POST   /api/taskExecutions/bulk    # Create all workflow tasks
PATCH  /api/taskExecutions/{id}    # Update task status
```

### Audit Events
```bash
GET    /api/audit-events           # List audit events
POST   /api/audit-events           # Create audit event
GET    /api/audit-events/workflow/{id}  # Workflow audit trail
GET    /api/audit-events/stats     # System statistics
```

### HIL Notes  
```bash
GET    /api/hil-notes              # List notes for workflow
POST   /api/hil-notes              # Create note
PATCH  /api/hil-notes/{id}         # Update note
POST   /api/hil-notes/{id}/reply   # Reply to note
```

### Notifications
```bash
GET    /api/notifications          # List user notifications
PATCH  /api/notifications/{id}/read  # Mark as read
POST   /api/notifications/mark-all-read  # Bulk mark read
```

## Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { /* response data */ }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional context"
}
```

## Common Parameters

**Pagination:**
- `page`: Page number (default: 1)
- `per_page`: Items per page (default: 20, max: 100)

**Filtering:**
- `workflow_id`: Filter by workflow UUID
- `client_id`: Filter by client UUID  
- `status`: Filter by status value

**Including Relations:**
- `include`: Comma-separated list (e.g., "author,replies")

## Rate Limits

- **General**: 100 requests per minute per IP
- **Authentication**: 10 requests per minute per IP

## Health Check

```bash
GET /api/health
```

Returns API status, version, and environment info.

## Database Schema

See `/supabase/migrations/` for complete database structure and relationships.