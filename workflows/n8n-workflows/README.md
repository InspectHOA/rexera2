# n8n Workflow Files

This directory will contain n8n workflow JSON files exported from the n8n interface.

## Structure

Organize workflows by category:

```
n8n-workflows/
├── real-estate/          # Real estate specific workflows
├── communication/        # Client and agent communication workflows  
├── utilities/           # Utility and helper workflows
└── templates/           # Reusable workflow templates
```

## Naming Convention

Use descriptive names with versions:
- `hoa-acquisition-v1.json`
- `municipal-lien-search-v2.json`
- `client-notification-template-v1.json`

## Usage

1. Create workflows in n8n interface
2. Export as JSON files
3. Place in appropriate subdirectory
4. Commit to version control
5. Import into production n8n instance

## Example Workflow Structure

n8n workflows are JSON files with this general structure:

```json
{
  "name": "Workflow Name",
  "nodes": [...],
  "connections": {...},
  "active": true,
  "settings": {...},
  "staticData": {...}
}
```

See [n8n documentation](https://docs.n8n.io/) for complete workflow format details.