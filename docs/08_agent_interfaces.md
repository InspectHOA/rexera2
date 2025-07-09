# Agent Interfaces Architecture

## Overview

Agent interfaces provide specialized, purpose-built UI experiences for different AI agents in the Rexera platform. Each agent gets a tailored interface that matches their specific function and workflow.

## Agent Interface Types

### 1. Mia - Email Interface
- **Purpose**: Email communication management
- **Interface Style**: Gmail-like email client
- **Primary Functions**: Send, receive, organize emails
- **Data Sources**: `communications` table (email type)

### 2. Nina - Counterparty Selector
- **Purpose**: Counterparty identification and selection
- **Interface Style**: Search and selection interface
- **Primary Functions**: Search, filter, select counterparties
- **Data Sources**: `counterparties` table

### 3. Iris - Document Extractor
- **Purpose**: Document processing and data extraction
- **Interface Style**: File upload and analysis interface
- **Primary Functions**: Upload, extract, analyze documents
- **Data Sources**: `documents` table

## Architecture Principles

### Simplicity First
- **Frontend**: Pure React components with UI logic only
- **Backend**: Extend existing API endpoints
- **No Middleware**: Direct API calls from components
- **Minimal Dependencies**: Use existing shared components

### Component Structure
```
src/components/agents/
├── mia/
│   ├── EmailInterface.tsx       # Main email container
│   ├── EmailList.tsx           # Email list view
│   ├── EmailCompose.tsx        # Compose new email
│   └── EmailThread.tsx         # Email thread view
├── nina/
│   ├── CounterpartySelector.tsx # Main selector interface
│   ├── CounterpartySearch.tsx   # Search functionality
│   └── CounterpartyCard.tsx     # Individual counterparty display
├── iris/
│   ├── DocumentExtractor.tsx    # Main document interface
│   ├── DocumentUpload.tsx       # File upload component
│   └── DocumentAnalysis.tsx     # Analysis results display
└── shared/
    ├── AgentHeader.tsx          # Common agent header
    └── AgentLayout.tsx          # Shared layout wrapper
```

### Routing Strategy
```
/agents/mia     → Email Interface
/agents/nina    → Counterparty Selector
/agents/iris    → Document Extractor
```

## Data Integration

### Email Communications (Mia)
Uses existing `communications` table with `communication_type = 'email'`:
- **Inbox**: All inbound emails for workflow
- **Sent**: All outbound emails from workflow
- **Threads**: Group by `thread_id` for conversations
- **Attachments**: Stored in `email_metadata.attachments`

### Counterparty Management (Nina)
Uses existing `counterparties` and `workflow_counterparties` tables:
- **Search**: Full-text search across counterparty data
- **Filter**: By type (HOA, lender, municipality, etc.)
- **Selection**: Add counterparties to specific workflows
- **Status**: Track contact status per workflow

### Document Processing (Iris)
Uses existing `documents` table:
- **Upload**: Store documents with metadata
- **Extract**: Process and extract structured data
- **Analyze**: Generate insights and summaries
- **Version**: Track document versions and changes

## API Endpoints

### Mia Email APIs
- `GET /api/communications?type=email&workflow_id={id}` - Get emails
- `POST /api/communications` - Send new email
- `PUT /api/communications/{id}` - Update email status
- `GET /api/communications/{id}/thread` - Get email thread

### Nina Counterparty APIs
- `GET /api/counterparties?search={query}` - Search counterparties
- `POST /api/workflow-counterparties` - Add counterparty to workflow
- `PUT /api/workflow-counterparties/{id}` - Update counterparty status
- `GET /api/counterparties/{id}` - Get counterparty details

### Iris Document APIs
- `POST /api/documents` - Upload document
- `POST /api/documents/{id}/extract` - Extract document data
- `GET /api/documents/{id}/analysis` - Get analysis results
- `PUT /api/documents/{id}` - Update document metadata

## Component Props Pattern

All agent interfaces follow a consistent props pattern:

```typescript
interface AgentInterfaceProps {
  workflowId?: string;    // Optional workflow context
  agentId: string;        // Agent identifier
  onAction?: (action: AgentAction) => void; // Action callback
}

interface AgentAction {
  type: string;
  payload: any;
  timestamp: Date;
}
```

## Implementation Guidelines

### 1. Start Simple
- Build basic layouts first
- Add functionality incrementally
- Use existing UI components where possible

### 2. Follow Patterns
- Use existing API patterns from the codebase
- Follow established TypeScript conventions
- Maintain consistent styling with shadcn/ui

### 3. Performance Considerations
- Lazy load agent interfaces
- Cache API responses where appropriate
- Optimize for mobile responsiveness

### 4. Error Handling
- Graceful degradation for API failures
- User-friendly error messages
- Retry mechanisms for failed operations

## Future Extensibility

The architecture supports easy addition of new agents:

1. **Create Interface**: Add new agent folder with components
2. **Add Route**: Register route in agent routing
3. **Extend APIs**: Add new endpoints as needed
4. **Update Navigation**: Add agent to main navigation

This modular approach ensures each agent can evolve independently while maintaining system cohesion.