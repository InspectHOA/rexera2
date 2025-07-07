# Scripts Directory

This directory contains utility scripts for development, testing, and database management.

## 📁 Directory Structure

```
scripts/
├── testing/           # Testing and integration scripts
│   ├── test-webhook-direct.ts        # Direct n8n webhook testing
│   ├── test-n8n-integration.ts       # End-to-end n8n workflow testing  
│   ├── test-api-integration.ts       # API endpoint integration testing
│   ├── test-single-task.ts          # Single task creation testing
│   └── import-workflow.ts            # Import workflow definitions to n8n
├── background/        # Background monitoring and maintenance
│   └── sla-monitor.ts                # SLA breach monitoring and notifications
└── db/                # Database utilities
    ├── add-tasks-script.ts           # Bulk task creation for testing
    └── add-more-tasks.sql            # SQL script for adding test tasks

```

## 🧪 Testing Scripts

### `testing/test-webhook-direct.ts`
**Purpose**: Tests n8n webhook endpoints directly  
**Usage**: `tsx scripts/testing/test-webhook-direct.ts`  
**Description**: Sends test payloads directly to n8n webhook URLs to verify webhook functionality.

### `testing/test-n8n-integration.ts` 
**Purpose**: End-to-end n8n workflow integration testing  
**Usage**: `tsx scripts/testing/test-n8n-integration.ts`  
**Requirements**: N8N_BASE_URL and N8N_API_KEY environment variables  
**Description**: Tests complete workflow from n8n trigger through API calls to completion.

### `testing/test-api-integration.ts`
**Purpose**: API endpoint integration testing (simulates n8n calls)  
**Usage**: `tsx scripts/testing/test-api-integration.ts`  
**Requirements**: Local API server running on port 3001  
**Description**: Tests API endpoints by simulating the same calls n8n workflows would make.

### `testing/test-single-task.ts`
**Purpose**: Single task creation and testing  
**Usage**: `tsx scripts/testing/test-single-task.ts`  
**Description**: Creates and tests individual tasks to verify task execution API.

### `testing/import-workflow.ts`
**Purpose**: Import workflow definitions to n8n  
**Usage**: `tsx scripts/testing/import-workflow.ts`  
**Requirements**: N8N_BASE_URL and N8N_API_KEY environment variables  
**Description**: Imports workflow JSON definitions from `/workflows/definitions/` to n8n Cloud.

## 🔄 Background Scripts

### `background/sla-monitor.ts`
**Purpose**: Monitor tasks for SLA breaches and send notifications  
**Usage**: `tsx scripts/background/sla-monitor.ts`  
**Schedule**: Run every 15-30 minutes via cron or GitHub Actions  
**Description**: Checks for tasks that have exceeded their SLA deadlines, updates their status to 'BREACHED', and creates HIL notifications using the existing notification system.

## 🗄️ Database Scripts

### `db/add-tasks-script.ts`
**Purpose**: Bulk task creation for testing workflows  
**Usage**: `tsx scripts/db/add-tasks-script.ts`  
**Description**: Creates multiple tasks for a specific workflow with predefined agent assignments for testing purposes.

### `db/add-more-tasks.sql`
**Purpose**: SQL script for adding test task executions  
**Usage**: Run directly in database or via Supabase dashboard  
**Description**: PostgreSQL script that adds multiple task executions to a specific workflow for UI testing and development.

## 🔧 Setup Requirements

Most scripts require environment variables. Ensure you have:

1. **Local API Server**: Start with `cd serverless-api && pnpm dev`
2. **Environment Variables**: Create `.env` file in `serverless-api/` with:
   ```
   N8N_BASE_URL=https://your-n8n-instance.app.n8n.cloud
   N8N_API_KEY=your-n8n-api-key
   SUPABASE_URL=your-supabase-url
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

## 🚀 Usage Examples

```bash
# Test n8n webhook functionality
tsx scripts/testing/test-webhook-direct.ts

# Run full integration test
tsx scripts/testing/test-n8n-integration.ts

# Test API endpoints locally
tsx scripts/testing/test-api-integration.ts

# Add test tasks to existing workflow
tsx scripts/db/add-tasks-script.ts

# Import workflow to n8n
tsx scripts/testing/import-workflow.ts

# Monitor SLA breaches (run manually or via cron)
tsx scripts/background/sla-monitor.ts
```

## ⚠️ Important Notes

- These scripts are for **development and testing only**
- Scripts may create test data in your database
- Ensure proper environment setup before running
- Scripts use hardcoded workflow IDs and agent IDs for testing
- Clean up test data as needed after testing