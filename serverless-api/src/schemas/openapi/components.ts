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
    },
    Communication: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        workflow_id: { type: 'string', format: 'uuid', nullable: true },
        thread_id: { type: 'string', format: 'uuid', nullable: true },
        sender_id: { type: 'string', format: 'uuid', nullable: true },
        recipient_email: { type: 'string', format: 'email', nullable: true },
        subject: { type: 'string', nullable: true },
        body: { type: 'string', nullable: true },
        communication_type: {
          type: 'string',
          enum: ['email', 'phone', 'sms', 'internal_note'],
          description: 'Type of communication'
        },
        direction: {
          type: 'string',
          enum: ['INBOUND', 'OUTBOUND'],
          nullable: true,
          description: 'Communication direction'
        },
        status: {
          type: 'string',
          enum: ['SENT', 'DELIVERED', 'READ', 'BOUNCED', 'FAILED'],
          nullable: true,
          description: 'Communication status'
        },
        metadata: { type: 'object', description: 'Additional communication data' },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' },
        
        // Related data (when included)
        email_metadata: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            communication_id: { type: 'string', format: 'uuid' },
            message_id: { type: 'string', nullable: true },
            in_reply_to: { type: 'string', nullable: true },
            email_references: { type: 'array', items: { type: 'string' } },
            attachments: { type: 'array', items: { type: 'object' } },
            headers: { type: 'object' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        phone_metadata: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            communication_id: { type: 'string', format: 'uuid' },
            phone_number: { type: 'string', nullable: true },
            duration_seconds: { type: 'integer', nullable: true },
            call_recording_url: { type: 'string', format: 'uri', nullable: true },
            transcript: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    CreateCommunication: {
      type: 'object',
      required: ['recipient_email', 'subject', 'body', 'communication_type', 'direction'],
      properties: {
        workflow_id: { type: 'string', format: 'uuid' },
        thread_id: { type: 'string', format: 'uuid' },
        recipient_email: { type: 'string', format: 'email' },
        subject: { type: 'string', minLength: 1 },
        body: { type: 'string', minLength: 1 },
        communication_type: {
          type: 'string',
          enum: ['email', 'phone', 'sms', 'internal_note']
        },
        direction: {
          type: 'string',
          enum: ['INBOUND', 'OUTBOUND']
        },
        metadata: { type: 'object' },
        email_metadata: {
          type: 'object',
          properties: {
            message_id: { type: 'string' },
            in_reply_to: { type: 'string' },
            email_references: { type: 'array', items: { type: 'string' } },
            attachments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  filename: { type: 'string' },
                  content_type: { type: 'string' },
                  size: { type: 'number' },
                  url: { type: 'string', format: 'uri' }
                }
              }
            },
            headers: { type: 'object' }
          }
        },
        phone_metadata: {
          type: 'object',
          properties: {
            phone_number: { type: 'string' },
            duration_seconds: { type: 'integer', minimum: 1 },
            call_recording_url: { type: 'string', format: 'uri' },
            transcript: { type: 'string' }
          }
        }
      }
    },
    EmailThread: {
      type: 'object',
      properties: {
        thread_id: { type: 'string', format: 'uuid', nullable: true },
        subject: { type: 'string' },
        communication_count: { type: 'integer' },
        last_activity: { type: 'string', format: 'date-time' },
        participants: { type: 'array', items: { type: 'string', format: 'email' } },
        has_unread: { type: 'boolean' },
        workflow_id: { type: 'string', format: 'uuid', nullable: true }
      }
    },
    ReplyCommunication: {
      type: 'object',
      required: ['recipient_email', 'body'],
      properties: {
        recipient_email: { type: 'string', format: 'email' },
        body: { type: 'string', minLength: 1 },
        include_team: { type: 'boolean', default: false },
        metadata: { type: 'object' }
      }
    },
    ForwardCommunication: {
      type: 'object',
      required: ['recipient_email', 'subject', 'body'],
      properties: {
        recipient_email: { type: 'string', format: 'email' },
        subject: { type: 'string', minLength: 1 },
        body: { type: 'string', minLength: 1 },
        include_team: { type: 'boolean', default: false },
        metadata: { type: 'object' }
      }
    },
    Pagination: {
      type: 'object',
      properties: {
        page: { type: 'integer', description: 'Current page number' },
        limit: { type: 'integer', description: 'Items per page' },
        total: { type: 'integer', description: 'Total number of items' },
        totalPages: { type: 'integer', description: 'Total number of pages' }
      }
    },
    Document: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        workflow_id: { type: 'string', format: 'uuid' },
        filename: { type: 'string' },
        url: { type: 'string', format: 'uri' },
        file_size_bytes: { type: 'integer', nullable: true },
        mime_type: { type: 'string', nullable: true },
        document_type: { 
          type: 'string', 
          enum: ['WORKING', 'DELIVERABLE'],
          default: 'WORKING',
          description: 'Type of document'
        },
        tags: { 
          type: 'array', 
          items: { type: 'string' },
          default: [],
          description: 'Document tags for categorization'
        },
        upload_source: { type: 'string', nullable: true },
        status: { 
          type: 'string', 
          enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
          default: 'PENDING',
          description: 'Document processing status'
        },
        metadata: { 
          type: 'object', 
          default: {},
          description: 'Additional document metadata'
        },
        deliverable_data: { 
          type: 'object', 
          default: {},
          description: 'Structured data when document is a deliverable'
        },
        version: { type: 'integer', default: 1, description: 'Document version number' },
        change_summary: { type: 'string', nullable: true, description: 'Summary of changes in this version' },
        created_by: { type: 'string', format: 'uuid', nullable: true },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' },
        workflow: {
          type: 'object',
          nullable: true,
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            client_id: { type: 'string', format: 'uuid' },
            status: { type: 'string' }
          }
        },
        created_by_user: {
          type: 'object',
          nullable: true,
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            user_type: { type: 'string' }
          }
        }
      }
    },
    CreateDocument: {
      type: 'object',
      required: ['workflow_id', 'filename', 'url'],
      properties: {
        workflow_id: { type: 'string', format: 'uuid' },
        filename: { type: 'string', minLength: 1 },
        url: { type: 'string', format: 'uri' },
        file_size_bytes: { type: 'integer', minimum: 1 },
        mime_type: { type: 'string' },
        document_type: { 
          type: 'string', 
          enum: ['WORKING', 'DELIVERABLE'],
          default: 'WORKING'
        },
        tags: { 
          type: 'array', 
          items: { type: 'string' },
          default: []
        },
        upload_source: { type: 'string' },
        metadata: { type: 'object', default: {} },
        deliverable_data: { type: 'object', default: {} }
      }
    },
    UpdateDocument: {
      type: 'object',
      properties: {
        filename: { type: 'string', minLength: 1 },
        document_type: { 
          type: 'string', 
          enum: ['WORKING', 'DELIVERABLE']
        },
        tags: { 
          type: 'array', 
          items: { type: 'string' }
        },
        status: { 
          type: 'string', 
          enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']
        },
        metadata: { type: 'object' },
        deliverable_data: { type: 'object' },
        change_summary: { type: 'string' }
      }
    },
    CreateDocumentVersion: {
      type: 'object',
      required: ['url', 'change_summary'],
      properties: {
        url: { type: 'string', format: 'uri' },
        filename: { type: 'string', minLength: 1 },
        file_size_bytes: { type: 'integer', minimum: 1 },
        mime_type: { type: 'string' },
        change_summary: { type: 'string', minLength: 1 },
        metadata: { type: 'object', default: {} }
      }
    }
  }
} as const;