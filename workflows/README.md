# n8n Workflows

This directory contains n8n workflow definitions and management utilities for Rexera 2.0.

## Directory Structure

```
workflows/
├── definitions/            # n8n workflow JSON files
│   └── payoff-request.json # Mortgage payoff workflow
├── utils/                  # Workflow management utilities
│   └── workflow-manager.ts # Core n8n API client
├── cli/                    # Command-line interface
│   └── workflow-cli.ts     # CLI commands
├── index.ts                # Main exports
└── README.md               # Documentation
```

## TypeScript Utilities

The workflows package now includes TypeScript utilities for managing n8n workflows programmatically:

### WorkflowManager Class

```typescript
import { createWorkflowManager } from '@rexera/workflows';

const manager = createWorkflowManager();

// List all workflows
const workflows = await manager.getAllWorkflows();

// Import a workflow
await manager.importWorkflow('./payoff-request.json');

// Test connection
const result = await manager.testConnection();
```

### CLI Commands

Use the TypeScript CLI for workflow management:

```bash
# List all workflows
npm run workflow:list

# Test n8n connection
npm run workflow:test

# Import payoff workflow
npm run workflow:import-payoff

# Test payoff workflow
npm run workflow:test-payoff

# Custom commands
npm run workflow -- <command> [args]
```

Available CLI commands:
- `list` - List all workflows
- `get <id>` - Get workflow details
- `import <file>` - Import workflow from JSON
- `import-payoff` - Import the payoff workflow
- `export <id> <file>` - Export workflow to JSON
- `delete <id>` - Delete workflow
- `activate <id>` - Activate workflow
- `deactivate <id>` - Deactivate workflow
- `executions <id>` - Get workflow executions
- `test` - Test n8n connection
- `test-payoff` - Test payoff workflow with sample data
- `find <name>` - Find workflow by name

## Environment Variables

Required environment variables for n8n integration:

```bash
N8N_API_KEY=your_n8n_api_key
N8N_BASE_URL=https://your-n8n-instance.com
N8N_PAYOFF_WORKFLOW_ID=workflow_id_here  # Optional
```

## Workflow Development

### Creating New Workflows

1. **Design in n8n UI**: Create and test your workflow in the n8n interface
2. **Export JSON**: Export the workflow as JSON from n8n
3. **Save to Repository**: Place the JSON file in the appropriate subdirectory
4. **Version Control**: Commit the workflow JSON to version control

### Workflow Structure

Each workflow JSON file should follow the n8n format:

```json
{
  "name": "Workflow Name",
  "nodes": [...],
  "connections": {...},
  "active": false,
  "settings": {...},
  "tags": [{"name": "tag1"}]
}
```

### Best Practices

1. **Naming Convention**: Use descriptive names with kebab-case
2. **Documentation**: Include workflow purpose in the name and tags
3. **Environment Agnostic**: Use environment variables for URLs and credentials
4. **Error Handling**: Include proper error handling nodes
5. **Logging**: Add logging for debugging and monitoring

## Legacy Scripts

The `scripts/` directory contains legacy JavaScript files:
- `backup-workflows.js` - Creates timestamped backups
- `validate-workflows.js` - Validates workflow JSON files
- `create-payoff-workflow.js` - Creates payoff workflow programmatically

These are being migrated to TypeScript utilities in the `src/` directory.

## Integration with Rexera

The workflows integrate with the Rexera system through:

1. **Webhook Triggers**: n8n workflows are triggered via webhooks from the Rexera API
2. **Database Updates**: Workflows update task status in the Rexera database
3. **Agent Coordination**: Workflows coordinate between different AI agents
4. **SLA Monitoring**: Workflows track and enforce SLA requirements

## Development Workflow

1. **Local Development**: Use the CLI tools to test workflows locally
2. **Staging**: Deploy workflows to staging n8n instance
3. **Testing**: Run automated tests using the test utilities
4. **Production**: Deploy to production n8n instance
5. **Monitoring**: Monitor workflow executions and performance

## Troubleshooting

### Common Issues

1. **Connection Failed**: Check N8N_API_KEY and N8N_BASE_URL
2. **Workflow Not Found**: Verify workflow ID or name
3. **Import Failed**: Check JSON format and n8n compatibility
4. **Execution Failed**: Check workflow logs in n8n interface

### Debug Commands

```bash
# Test connection
npm run workflow:test

# List workflows to verify import
npm run workflow:list

# Check specific workflow
npm run workflow -- get <workflow-id>

# View recent executions
npm run workflow -- executions <workflow-id>
```

## Future Enhancements

- [ ] Workflow versioning and rollback
- [ ] Automated testing framework
- [ ] Performance monitoring
- [ ] Workflow templates and generators
- [ ] Integration with CI/CD pipeline
- [ ] Workflow dependency management