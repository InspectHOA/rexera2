/**
 * Shared n8n Node Definitions
 * Common node configurations and templates for Rexera 2.0 workflows
 */

export interface N8nNode {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters: Record<string, any>;
  credentials?: Record<string, string>;
  webhookId?: string;
  disabled?: boolean;
}

export interface N8nConnection {
  node: string;
  type: 'main' | 'ai';
  index: number;
}

export interface N8nWorkflow {
  id: string;
  name: string;
  nodes: N8nNode[];
  connections: Record<string, Record<string, N8nConnection[][]>>;
  active: boolean;
  settings: {
    executionOrder: 'v1';
    saveManualExecutions: boolean;
    callerPolicy: 'workflowsFromSameOwner';
    errorWorkflow?: string;
    timezone: string;
  };
  staticData: Record<string, any>;
  tags: string[];
  triggerCount: number;
  updatedAt: string;
  versionId: string;
}

/**
 * Common Node Templates
 */

// Webhook trigger node for workflow initiation
export const createWebhookTriggerNode = (
  id: string,
  path: string,
  httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST'
): N8nNode => ({
  id,
  name: 'Webhook Trigger',
  type: 'n8n-nodes-base.webhook',
  typeVersion: 2,
  position: [100, 100],
  webhookId: crypto.randomUUID(),
  parameters: {
    path,
    httpMethod,
    responseMode: 'responseNode',
    options: {
      rawBody: false,
    },
  },
});

// Database operations node
export const createDatabaseNode = (
  id: string,
  operation: 'insert' | 'update' | 'select' | 'delete',
  table: string,
  position: [number, number]
): N8nNode => ({
  id,
  name: `Database ${operation}`,
  type: 'n8n-nodes-base.supabase',
  typeVersion: 1,
  position,
  credentials: {
    supabaseApi: 'supabase_credentials',
  },
  parameters: {
    resource: 'row',
    operation,
    tableId: table,
    options: {},
  },
});

// Agent execution node
export const createAgentNode = (
  id: string,
  agentType: string,
  taskType: string,
  position: [number, number]
): N8nNode => ({
  id,
  name: `${agentType.charAt(0).toUpperCase() + agentType.slice(1)} Agent`,
  type: 'n8n-nodes-base.httpRequest',
  typeVersion: 4,
  position,
  parameters: {
    url: `={{$env.AGENTS_BASE_URL}}/${agentType}/execute`,
    authentication: 'genericCredentialType',
    genericAuthType: 'httpHeaderAuth',
    method: 'POST',
    sendHeaders: true,
    headerParameters: {
      parameters: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
    },
    sendBody: true,
    bodyParameters: {
      parameters: [
        {
          name: 'agent_type',
          value: agentType,
        },
        {
          name: 'task_type',
          value: taskType,
        },
        {
          name: 'task_id',
          value: '={{$workflow.id}}_{{$execution.id}}_{{$node.id}}',
        },
        {
          name: 'workflow_id',
          value: '={{$workflow.id}}',
        },
        {
          name: 'input_data',
          value: '={{$json}}',
        },
        {
          name: 'priority',
          value: 'normal',
        },
        {
          name: 'complexity',
          value: 'moderate',
        },
        {
          name: 'context',
          value: {
            workflow_context: '={{$workflow}}',
            execution_context: '={{$execution}}',
          },
        },
      ],
    },
    options: {
      timeout: 30000,
      retry: {
        enabled: true,
        maxTries: 3,
        retryInterval: 1000,
      },
    },
  },
  credentials: {
    httpHeaderAuth: 'agents_api_credentials',
  },
});

// Conditional logic node
export const createIfNode = (
  id: string,
  condition: string,
  position: [number, number]
): N8nNode => ({
  id,
  name: 'IF',
  type: 'n8n-nodes-base.if',
  typeVersion: 2,
  position,
  parameters: {
    conditions: {
      options: {
        caseSensitive: true,
        leftValue: '',
        typeValidation: 'strict',
      },
      conditions: [
        {
          id: crypto.randomUUID(),
          leftValue: condition,
          rightValue: true,
          operator: {
            type: 'boolean',
            operation: 'equal',
          },
        },
      ],
      combinator: 'and',
    },
  },
});

// Error handling node
export const createErrorHandlerNode = (
  id: string,
  position: [number, number]
): N8nNode => ({
  id,
  name: 'Error Handler',
  type: 'n8n-nodes-base.function',
  typeVersion: 1,
  position,
  parameters: {
    functionCode: `
// Handle workflow errors and notify appropriate channels
const error = $input.first();
const errorDetails = {
  workflow_id: $workflow.id,
  execution_id: $execution.id,
  error_message: error.message || 'Unknown error',
  error_stack: error.stack,
  node_name: error.node?.name,
  timestamp: new Date().toISOString(),
  context: $workflow.staticData
};

// Log error to database
$('Database Error Log').first().json = {
  workflow_id: errorDetails.workflow_id,
  execution_id: errorDetails.execution_id,
  error_message: errorDetails.error_message,
  error_details: JSON.stringify(errorDetails),
  created_at: errorDetails.timestamp
};

// Notify HIL dashboard
$('HIL Notification').first().json = {
  type: 'workflow_error',
  severity: 'high',
  message: \`Workflow \${$workflow.name} encountered an error\`,
  details: errorDetails,
  requires_intervention: true
};

return [$input.all()];
    `,
  },
});

// Human-in-the-loop intervention node
export const createHILInterventionNode = (
  id: string,
  reason: string,
  position: [number, number]
): N8nNode => ({
  id,
  name: 'HIL Intervention',
  type: 'n8n-nodes-base.httpRequest',
  typeVersion: 4,
  position,
  parameters: {
    url: `={{$env.FRONTEND_URL}}/api/hil/interventions`,
    method: 'POST',
    sendHeaders: true,
    headerParameters: {
      parameters: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
        {
          name: 'Authorization',
          value: 'Bearer {{$env.API_KEY}}',
        },
      ],
    },
    sendBody: true,
    bodyParameters: {
      parameters: [
        {
          name: 'workflow_id',
          value: '={{$workflow.id}}',
        },
        {
          name: 'execution_id',
          value: '={{$execution.id}}',
        },
        {
          name: 'reason',
          value: reason,
        },
        {
          name: 'data',
          value: '={{$json}}',
        },
        {
          name: 'priority',
          value: 'high',
        },
        {
          name: 'created_at',
          value: '={{new Date().toISOString()}}',
        },
      ],
    },
  },
});

// Wait for approval node
export const createWaitForApprovalNode = (
  id: string,
  position: [number, number]
): N8nNode => ({
  id,
  name: 'Wait for Approval',
  type: 'n8n-nodes-base.wait',
  typeVersion: 1,
  position,
  parameters: {
    resume: 'webhook',
    options: {
      ignoreSSLIssues: false,
    },
  },
});

// Response node for webhook workflows
export const createResponseNode = (
  id: string,
  responseData: Record<string, any>,
  position: [number, number]
): N8nNode => ({
  id,
  name: 'Response',
  type: 'n8n-nodes-base.respondToWebhook',
  typeVersion: 1,
  position,
  parameters: {
    options: {
      responseCode: 200,
    },
    responseBody: JSON.stringify(responseData),
    responseHeaders: {
      'Content-Type': 'application/json',
    },
  },
});

// Set workflow data node
export const createSetNode = (
  id: string,
  values: Record<string, any>,
  position: [number, number]
): N8nNode => ({
  id,
  name: 'Set Data',
  type: 'n8n-nodes-base.set',
  typeVersion: 3,
  position,
  parameters: {
    assignments: {
      assignments: Object.entries(values).map(([key, value]) => ({
        id: crypto.randomUUID(),
        name: key,
        value: typeof value === 'string' ? value : JSON.stringify(value),
        type: typeof value === 'string' ? 'string' : 'object',
      })),
    },
    options: {},
  },
});

// Quality check node using Cassy agent
export const createQualityCheckNode = (
  id: string,
  position: [number, number]
): N8nNode => ({
  id,
  name: 'Quality Check',
  type: 'n8n-nodes-base.function',
  typeVersion: 1,
  position,
  parameters: {
    functionCode: `
// Prepare data for Cassy (QA agent)
const workflowData = $input.all();
const qualityCheckData = {
  workflow_id: $workflow.id,
  workflow_type: $workflow.staticData.workflow_type,
  completion_data: {
    tasks: workflowData.map(item => ({
      id: item.json.task_id,
      status: item.json.status || 'completed',
      agentType: item.json.agent_type,
      confidence: item.json.confidence_score,
      executionTime: item.json.execution_time_ms
    })),
    outputs: workflowData.reduce((acc, item) => {
      if (item.json.result_data) {
        acc[item.json.agent_type] = item.json.result_data;
      }
      return acc;
    }, {}),
    metrics: {
      totalTime: workflowData.reduce((sum, item) => sum + (item.json.execution_time_ms || 0), 0),
      cost: workflowData.reduce((sum, item) => sum + (item.json.cost_cents || 0), 0),
      agentUtilization: {}
    }
  },
  quality_criteria: [
    { category: 'completeness', weight: 0.3, thresholds: { excellent: 95, good: 85, acceptable: 75 } },
    { category: 'accuracy', weight: 0.4, thresholds: { excellent: 98, good: 90, acceptable: 80 } },
    { category: 'efficiency', weight: 0.3, thresholds: { excellent: 90, good: 80, acceptable: 70 } }
  ]
};

return [{ json: qualityCheckData }];
    `,
  },
});

/**
 * Node connection utilities
 */
export const createConnection = (
  fromNode: string,
  toNode: string,
  outputIndex: number = 0,
  inputIndex: number = 0
): [string, Record<string, N8nConnection[][]>] => {
  return [
    fromNode,
    {
      main: [
        [
          {
            node: toNode,
            type: 'main',
            index: inputIndex,
          },
        ],
      ],
    },
  ];
};

export const createConditionalConnection = (
  fromNode: string,
  trueNode: string,
  falseNode: string
): [string, Record<string, N8nConnection[][]>] => {
  return [
    fromNode,
    {
      main: [
        [
          {
            node: trueNode,
            type: 'main',
            index: 0,
          },
        ],
        [
          {
            node: falseNode,
            type: 'main',
            index: 0,
          },
        ],
      ],
    },
  ];
};