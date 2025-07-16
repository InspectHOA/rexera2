/**
 * OpenAPI Components (Schemas, Security, etc.)
 * Extracted from main app.ts for better organization
 */

export const openApiComponents = {
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT'
    }
  },
  schemas: {
    Error: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: { type: 'string' },
        details: { type: 'string' }
      }
    },
    Workflow: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        workflow_type: { 
          type: 'string', 
          enum: ['MUNI_LIEN_SEARCH', 'HOA_ACQUISITION', 'PAYOFF_REQUEST'],
          description: 'Type of workflow process'
        },
        client_id: { type: 'string', format: 'uuid' },
        title: { type: 'string' },
        description: { type: 'string', nullable: true },
        status: { 
          type: 'string', 
          enum: ['PENDING', 'IN_PROGRESS', 'AWAITING_REVIEW', 'BLOCKED', 'COMPLETED'],
          description: 'Current workflow status'
        },
        priority: { 
          type: 'string', 
          enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
          description: 'Workflow priority level'
        },
        metadata: { type: 'object', description: 'Workflow-specific data' },
        created_by: { type: 'string', format: 'uuid' },
        assigned_to: { type: 'string', format: 'uuid', nullable: true },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' },
        completed_at: { type: 'string', format: 'date-time', nullable: true },
        due_date: { type: 'string', format: 'date-time', nullable: true },
        n8n_execution_id: { type: 'string', nullable: true, description: 'n8n Cloud execution ID for correlation and monitoring' },
        n8n_started_at: { type: 'string', format: 'date-time', nullable: true, description: 'Timestamp when n8n workflow execution was triggered' },
        n8n_status: { 
          type: 'string', 
          enum: ['not_started', 'running', 'success', 'error', 'canceled', 'crashed', 'waiting'],
          description: 'Current n8n execution status'
        }
      }
    },
    TaskExecution: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        workflow_id: { type: 'string', format: 'uuid' },
        agent_id: { type: 'string', format: 'uuid', nullable: true, description: 'Null if executed by HIL user' },
        title: { type: 'string' },
        description: { type: 'string', nullable: true },
        sequence_order: { type: 'integer', description: 'Order of execution in workflow' },
        task_type: { type: 'string', description: 'Stable task identifier' },
        status: { 
          type: 'string', 
          enum: ['PENDING', 'AWAITING_REVIEW', 'COMPLETED', 'FAILED'],
          description: 'Current task status'
        },
        interrupt_type: {
          type: 'string',
          nullable: true,
          enum: ['MISSING_DOCUMENT', 'PAYMENT_REQUIRED', 'CLIENT_CLARIFICATION', 'MANUAL_VERIFICATION'],
          description: 'Type of human intervention required'
        },
        executor_type: { 
          type: 'string', 
          enum: ['AI', 'HIL'],
          description: 'Whether executed by AI agent or human'
        },
        priority: { 
          type: 'string', 
          enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
          description: 'Task priority level'
        },
        input_data: { type: 'object', description: 'Task input parameters' },
        output_data: { type: 'object', nullable: true, description: 'Task execution results' },
        error_message: { type: 'string', nullable: true },
        started_at: { type: 'string', format: 'date-time', nullable: true },
        completed_at: { type: 'string', format: 'date-time', nullable: true },
        execution_time_ms: { type: 'integer', nullable: true },
        retry_count: { type: 'integer', default: 0 },
        sla_hours: { type: 'integer', description: 'SLA deadline in hours' },
        sla_due_at: { type: 'string', format: 'date-time', nullable: true },
        sla_status: { 
          type: 'string', 
          enum: ['ON_TIME', 'AT_RISK', 'BREACHED'],
          description: 'SLA compliance status'
        },
        read_by_users: { 
          type: 'object', 
          description: 'JSON object tracking which users have read this task notification',
          additionalProperties: { type: 'boolean' }
        },
        created_at: { type: 'string', format: 'date-time' }
      }
    },
    Agent: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string', description: 'Unique agent name' },
        type: { type: 'string', description: 'Agent type or category' },
        description: { type: 'string', nullable: true },
        capabilities: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'List of agent capabilities',
          default: []
        },
        api_endpoint: { type: 'string', nullable: true, description: 'Agent API endpoint URL' },
        configuration: { type: 'object', description: 'Agent configuration settings', default: {} },
        is_active: { type: 'boolean', description: 'Whether agent is active', default: true },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    },
    Client: {
      type: 'object',
      properties: {
        id: { 
          type: 'string', 
          format: 'uuid',
          description: 'Unique identifier for the client'
        },
        name: { 
          type: 'string',
          description: 'Client company name'
        },
        domain: { 
          type: 'string', 
          nullable: true,
          description: 'Client domain name (unique)'
        },
        created_at: { 
          type: 'string', 
          format: 'date-time',
          description: 'When the client was created'
        },
        updated_at: { 
          type: 'string', 
          format: 'date-time',
          description: 'When the client was last updated'
        }
      },
      required: ['id', 'name', 'created_at', 'updated_at']
    }
  }
} as const;