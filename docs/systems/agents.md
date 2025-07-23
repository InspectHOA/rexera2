# AI Agents System

## Overview

AI agents execute workflow tasks with specialized interfaces for human-in-loop (HIL) intervention when needed.

## Agent Types

- **Mia**: Email communication agent
- **Nina**: Counterparty management
- **Iris**: Document extraction and processing
- **Rex**: Workflow orchestration
- **Others**: Florian, Ria, Kosha, Cassy, Max, Corey

## Architecture

```
n8n Cloud                 Rexera Platform
┌─────────────┐          ┌─────────────────┐
│ Agent runs  │─────────►│ Task status:    │
│ task logic  │          │ RUNNING         │
│             │          │                 │
│ Needs help? │◄─────────│ Status:         │
│             │          │ INTERRUPT       │
│             │          │                 │
│ HIL approves│─────────►│ Agent continues │
└─────────────┘          └─────────────────┘
```

## Task Execution Flow

1. **n8n triggers task** execution by agent
2. **Agent processes** using AI capabilities  
3. **If uncertain**: Agent sets task to `INTERRUPT` status
4. **HIL intervention**: Human reviews via agent interface
5. **Approval/rejection**: HIL provides guidance
6. **Agent continues** with human input

## Agent Interfaces

Each agent has a specialized React component for HIL interaction:

```typescript
// Mia - Email Interface
<EmailInterface agentId="mia" workflowId={id} />

// Nina - Counterparty Selector  
<CounterpartySelector agentId="nina" workflowId={id} />

// Iris - Document Extractor
<DocumentExtractor agentId="iris" workflowId={id} />
```

## Database Integration

**Tasks Table**: `task_executions`
- `executor_type`: 'AI' | 'HIL' 
- `interrupt_type`: Reason for human intervention
- `agent_id`: Which agent is assigned

**Agents Table**: `agents`
- `name`: Agent identifier
- `capabilities`: What the agent can do
- `is_active`: Enable/disable agents

## Key Features

- **Dynamic routing**: Frontend automatically loads correct agent interface
- **Interrupt handling**: Seamless handoff to HIL operators
- **Context preservation**: All task data available to both agent and human
- **Audit logging**: Complete trail of agent and human actions