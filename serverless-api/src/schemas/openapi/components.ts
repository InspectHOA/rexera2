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
          enum: ['NOT_STARTED', 'IN_PROGRESS', 'INTERRUPT', 'BLOCKED', 'WAITING_FOR_CLIENT', 'COMPLETED'],
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
          enum: ['NOT_STARTED', 'IN_PROGRESS', 'INTERRUPT', 'COMPLETED', 'FAILED'],
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
    AuditEvent: {
      type: 'object',
      properties: {
        id: { 
          type: 'string', 
          format: 'uuid',
          description: 'Unique identifier for the audit event'
        },
        actor_type: { 
          type: 'string', 
          enum: ['human', 'agent', 'system'],
          description: 'Type of actor that performed the action'
        },
        actor_id: { 
          type: 'string',
          description: 'Identifier of the actor (user ID, agent ID, etc.)'
        },
        actor_name: { 
          type: 'string', 
          nullable: true,
          description: 'Human-readable name of the actor'
        },
        event_type: { 
          type: 'string', 
          enum: [
            'workflow_management',
            'task_execution', 
            'task_intervention',
            'sla_management',
            'user_authentication',
            'document_management',
            'communication',
            'system_operation'
          ],
          description: 'Category of the audit event'
        },
        action: { 
          type: 'string', 
          enum: ['create', 'read', 'update', 'delete', 'execute', 'approve', 'reject', 'login', 'logout'],
          description: 'Specific action that was performed'
        },
        resource_type: { 
          type: 'string', 
          enum: [
            'workflow',
            'task_execution',
            'user_profile',
            'client',
            'agent',
            'document',
            'communication',
            'notification',
            'counterparty'
          ],
          description: 'Type of resource that was affected'
        },
        resource_id: { 
          type: 'string', 
          format: 'uuid',
          description: 'Identifier of the resource that was affected'
        },
        workflow_id: { 
          type: 'string', 
          format: 'uuid', 
          nullable: true,
          description: 'Associated workflow ID (if applicable)'
        },
        client_id: { 
          type: 'string', 
          format: 'uuid', 
          nullable: true,
          description: 'Associated client ID (if applicable)'
        },
        event_data: { 
          type: 'object',
          description: 'Additional event-specific metadata and context',
          additionalProperties: true,
          default: {}
        },
        created_at: { 
          type: 'string', 
          format: 'date-time',
          description: 'Timestamp when the audit event was created'
        }
      },
      required: ['actor_type', 'actor_id', 'event_type', 'action', 'resource_type', 'resource_id', 'created_at']
    },
    CreateAuditEvent: {
      type: 'object',
      properties: {
        actor_type: { 
          type: 'string', 
          enum: ['human', 'agent', 'system'],
          description: 'Type of actor performing the action'
        },
        actor_id: { 
          type: 'string',
          description: 'Identifier of the actor'
        },
        actor_name: { 
          type: 'string', 
          nullable: true,
          description: 'Human-readable name of the actor'
        },
        event_type: { 
          type: 'string', 
          enum: [
            'workflow_management',
            'task_execution', 
            'task_intervention',
            'sla_management',
            'user_authentication',
            'document_management',
            'communication',
            'system_operation'
          ],
          description: 'Category of the audit event'
        },
        action: { 
          type: 'string', 
          enum: ['create', 'read', 'update', 'delete', 'execute', 'approve', 'reject', 'login', 'logout'],
          description: 'Specific action being performed'
        },
        resource_type: { 
          type: 'string', 
          enum: [
            'workflow',
            'task_execution',
            'user_profile',
            'client',
            'agent',
            'document',
            'communication',
            'notification',
            'counterparty'
          ],
          description: 'Type of resource being affected'
        },
        resource_id: { 
          type: 'string', 
          format: 'uuid',
          description: 'Identifier of the resource being affected'
        },
        workflow_id: { 
          type: 'string', 
          format: 'uuid', 
          nullable: true,
          description: 'Associated workflow ID (optional)'
        },
        client_id: { 
          type: 'string', 
          format: 'uuid', 
          nullable: true,
          description: 'Associated client ID (optional)'
        },
        event_data: { 
          type: 'object',
          description: 'Additional event-specific metadata',
          additionalProperties: true,
          default: {}
        }
      },
      required: ['actor_type', 'actor_id', 'event_type', 'action', 'resource_type', 'resource_id']
    },
    AuditEventList: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/AuditEvent' },
          description: 'List of audit events'
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', description: 'Current page number' },
            per_page: { type: 'integer', description: 'Items per page' },
            total: { type: 'integer', description: 'Total number of items' },
            total_pages: { type: 'integer', description: 'Total number of pages' },
            has_next: { type: 'boolean', description: 'Whether there is a next page' },
            has_prev: { type: 'boolean', description: 'Whether there is a previous page' }
          },
          required: ['page', 'per_page', 'total', 'total_pages', 'has_next', 'has_prev']
        }
      },
      required: ['data', 'pagination']
    },
    AuditEventStats: {
      type: 'object',
      properties: {
        period: { 
          type: 'string',
          description: 'Time period for the statistics',
          example: '24_hours'
        },
        total_events: { 
          type: 'integer',
          description: 'Total number of events in the period'
        },
        events_by_type: {
          type: 'object',
          description: 'Count of events by event type',
          additionalProperties: { type: 'integer' }
        },
        events_by_actor: {
          type: 'object',
          description: 'Count of events by actor type',
          additionalProperties: { type: 'integer' }
        },
        generated_at: { 
          type: 'string', 
          format: 'date-time',
          description: 'When these statistics were generated'
        }
      },
      required: ['period', 'total_events', 'events_by_type', 'events_by_actor', 'generated_at']
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
          enum: ['email', 'phone', 'sms', 'client_chat'],
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
          enum: ['DRAFT', 'SENT', 'DELIVERED', 'READ', 'BOUNCED', 'FAILED'],
          nullable: true,
          description: 'Communication status (includes client chat status values)'
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
        },
        client_chat_metadata: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            communication_id: { type: 'string', format: 'uuid' },
            external_platform_type: { 
              type: 'string', 
              enum: ['qualia', 'gridbase', 'salesforce', 'custom'],
              nullable: true,
              description: 'External platform where the chat occurred'
            },
            external_platform_id: { 
              type: 'string',
              nullable: true,
              description: 'Platform-specific identifier for this communication'
            },
            cc_recipients: { 
              type: 'array', 
              items: { type: 'string', format: 'email' },
              description: 'Email addresses to CC on client chat communications'
            },
            bcc_recipients: { 
              type: 'array', 
              items: { type: 'string', format: 'email' },
              description: 'Email addresses to BCC on client chat communications'
            },
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
          enum: ['email', 'phone', 'sms', 'client_chat']
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
        },
        client_chat_metadata: {
          type: 'object',
          properties: {
            external_platform_type: { 
              type: 'string', 
              enum: ['qualia', 'gridbase', 'salesforce', 'custom'],
              description: 'External platform where the chat occurred'
            },
            external_platform_id: { 
              type: 'string',
              description: 'Platform-specific identifier for this communication'
            },
            cc_recipients: { 
              type: 'array', 
              items: { type: 'string', format: 'email' },
              description: 'Email addresses to CC on client chat communications'
            },
            bcc_recipients: { 
              type: 'array', 
              items: { type: 'string', format: 'email' },
              description: 'Email addresses to BCC on client chat communications'
            }
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
    },
    HilNote: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        workflow_id: { type: 'string', format: 'uuid' },
        author_id: { type: 'string', format: 'uuid' },
        content: { type: 'string', description: 'Note content, may include @mentions' },
        priority: { 
          type: 'string', 
          enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
          description: 'Note priority level'
        },
        is_resolved: { type: 'boolean', description: 'Whether the note has been resolved' },
        parent_note_id: { 
          type: 'string', 
          format: 'uuid', 
          nullable: true, 
          description: 'Parent note ID for threaded conversations' 
        },
        mentions: { 
          type: 'array',
          items: { type: 'string', format: 'uuid' },
          description: 'Array of user IDs mentioned in the note'
        },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' },
        author: {
          type: 'object',
          nullable: true,
          description: 'Author information (when included)',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' }
          }
        },
        replies: {
          type: 'array',
          nullable: true,
          description: 'Child notes (when included)',
          items: { $ref: '#/components/schemas/HilNote' }
        }
      }
    },
    CreateHilNote: {
      type: 'object',
      required: ['workflow_id', 'content'],
      properties: {
        workflow_id: { type: 'string', format: 'uuid' },
        content: { type: 'string', minLength: 1, description: 'Note content' },
        priority: { 
          type: 'string', 
          enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
          default: 'NORMAL',
          description: 'Note priority level'
        },
        mentions: { 
          type: 'array',
          items: { type: 'string', format: 'uuid' },
          default: [],
          description: 'Array of user IDs to mention'
        },
        parent_note_id: { 
          type: 'string', 
          format: 'uuid', 
          nullable: true, 
          description: 'Parent note ID for replies' 
        }
      }
    },
    UpdateHilNote: {
      type: 'object',
      properties: {
        content: { type: 'string', minLength: 1, description: 'Updated note content' },
        priority: { 
          type: 'string', 
          enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
          description: 'Updated priority level'
        },
        is_resolved: { type: 'boolean', description: 'Mark note as resolved/unresolved' },
        mentions: { 
          type: 'array',
          items: { type: 'string', format: 'uuid' },
          description: 'Updated array of mentioned user IDs'
        }
      }
    },
    ReplyHilNote: {
      type: 'object',
      required: ['content'],
      properties: {
        content: { type: 'string', minLength: 1, description: 'Reply content' },
        mentions: { 
          type: 'array',
          items: { type: 'string', format: 'uuid' },
          default: [],
          description: 'Array of user IDs to mention in reply'
        }
      }
    },
    Counterparty: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid', description: 'Unique identifier' },
        name: { type: 'string', description: 'Counterparty name' },
        type: {
          type: 'string',
          enum: ['hoa', 'lender', 'municipality', 'utility', 'tax_authority'],
          description: 'Type of counterparty'
        },
        email: { type: 'string', format: 'email', nullable: true, description: 'Contact email' },
        phone: { type: 'string', nullable: true, description: 'Contact phone number' },
        address: { type: 'string', nullable: true, description: 'Physical address' },
        contact_info: { 
          type: 'object', 
          description: 'Additional contact information and metadata',
          additionalProperties: true,
          default: {}
        },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' },
        workflows: {
          type: 'array',
          nullable: true,
          description: 'Associated workflow relationships (when included with ?include=workflows)',
          items: { $ref: '#/components/schemas/WorkflowRelationship' }
        }
      },
      required: ['id', 'name', 'type', 'created_at', 'updated_at']
    },
    CreateCounterparty: {
      type: 'object',
      required: ['name', 'type'],
      properties: {
        name: { 
          type: 'string', 
          minLength: 1, 
          maxLength: 255,
          description: 'Counterparty name' 
        },
        type: {
          type: 'string',
          enum: ['hoa', 'lender', 'municipality', 'utility', 'tax_authority'],
          description: 'Type of counterparty'
        },
        email: { 
          type: 'string', 
          format: 'email', 
          description: 'Contact email address' 
        },
        phone: { 
          type: 'string', 
          minLength: 1,
          description: 'Contact phone number' 
        },
        address: { 
          type: 'string', 
          minLength: 1,
          description: 'Physical address' 
        },
        contact_info: { 
          type: 'object', 
          description: 'Additional contact information',
          additionalProperties: true,
          default: {}
        }
      }
    },
    UpdateCounterparty: {
      type: 'object',
      properties: {
        name: { 
          type: 'string', 
          minLength: 1, 
          maxLength: 255,
          description: 'Updated counterparty name' 
        },
        type: {
          type: 'string',
          enum: ['hoa', 'lender', 'municipality', 'utility', 'tax_authority'],
          description: 'Updated counterparty type'
        },
        email: { 
          type: 'string', 
          format: 'email', 
          description: 'Updated contact email' 
        },
        phone: { 
          type: 'string', 
          minLength: 1,
          description: 'Updated contact phone number' 
        },
        address: { 
          type: 'string', 
          minLength: 1,
          description: 'Updated physical address' 
        },
        contact_info: { 
          type: 'object', 
          description: 'Updated additional contact information',
          additionalProperties: true
        }
      }
    },
    WorkflowCounterparty: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid', description: 'Unique relationship identifier' },
        workflow_id: { type: 'string', format: 'uuid', description: 'Associated workflow ID' },
        counterparty_id: { type: 'string', format: 'uuid', description: 'Associated counterparty ID' },
        status: {
          type: 'string',
          enum: ['PENDING', 'CONTACTED', 'RESPONDED', 'COMPLETED'],
          description: 'Status of the counterparty relationship in this workflow'
        },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' },
        counterparty: {
          $ref: '#/components/schemas/Counterparty',
          nullable: true,
          description: 'Counterparty details (when included)'
        },
        workflow: {
          type: 'object',
          nullable: true,
          description: 'Workflow details (when included)',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            status: { type: 'string' }
          }
        }
      },
      required: ['id', 'workflow_id', 'counterparty_id', 'status', 'created_at', 'updated_at']
    },
    WorkflowRelationship: {
      type: 'object',
      description: 'Lean workflow relationship for counterparty responses',
      properties: {
        workflow_id: { type: 'string', format: 'uuid', description: 'Associated workflow ID' },
        status: {
          type: 'string',
          enum: ['PENDING', 'CONTACTED', 'RESPONDED', 'COMPLETED'],
          description: 'Status of the counterparty relationship in this workflow'
        },
        created_at: { type: 'string', format: 'date-time', description: 'When relationship was created' },
        updated_at: { type: 'string', format: 'date-time', description: 'When relationship status was last updated' }
      },
      required: ['workflow_id', 'status', 'created_at', 'updated_at']
    },
    CreateWorkflowCounterparty: {
      type: 'object',
      required: ['counterparty_id'],
      properties: {
        counterparty_id: { 
          type: 'string', 
          format: 'uuid',
          description: 'ID of counterparty to associate with workflow'
        },
        status: {
          type: 'string',
          enum: ['PENDING', 'CONTACTED', 'RESPONDED', 'COMPLETED'],
          default: 'PENDING',
          description: 'Initial status of the relationship'
        }
      }
    },
    UpdateWorkflowCounterparty: {
      type: 'object',
      required: ['status'],
      properties: {
        status: {
          type: 'string',
          enum: ['PENDING', 'CONTACTED', 'RESPONDED', 'COMPLETED'],
          description: 'Updated status of the counterparty relationship'
        }
      }
    },
    CounterpartiesResponse: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/Counterparty' }
        },
        pagination: { $ref: '#/components/schemas/Pagination' }
      },
      required: ['success', 'data', 'pagination']
    },
    CounterpartyResponse: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: { $ref: '#/components/schemas/Counterparty' }
      },
      required: ['success', 'data']
    },
    WorkflowCounterpartiesResponse: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/WorkflowCounterparty' }
        }
      },
      required: ['success', 'data']
    },
    CounterpartySearchResponse: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              type: {
                type: 'string',
                enum: ['hoa', 'lender', 'municipality', 'utility', 'tax_authority']
              },
              email: { type: 'string', format: 'email', nullable: true },
              phone: { type: 'string', nullable: true },
              address: { type: 'string', nullable: true }
            },
            required: ['id', 'name', 'type']
          }
        },
        meta: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'The search query used' },
            type: { 
              type: 'string', 
              enum: ['hoa', 'lender', 'municipality', 'utility', 'tax_authority'],
              nullable: true,
              description: 'Type filter applied (if any)'
            },
            total: { type: 'integer', description: 'Total number of results found' },
            limit: { type: 'integer', description: 'Maximum results requested' }
          },
          required: ['query', 'type', 'total', 'limit']
        }
      },
      required: ['success', 'data', 'meta']
    },
    CounterpartyTypesResponse: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              value: {
                type: 'string',
                enum: ['hoa', 'lender', 'municipality', 'utility', 'tax_authority']
              },
              label: { type: 'string' }
            },
            required: ['value', 'label']
          }
        }
      },
      required: ['success', 'data']
    },
    CounterpartyContact: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid', description: 'Unique identifier' },
        counterparty_id: { type: 'string', format: 'uuid', description: 'Associated counterparty ID' },
        role: {
          type: 'string',
          enum: [
            'primary', 'billing', 'legal', 'operations', 'board_member', 
            'property_manager', 'loan_processor', 'underwriter', 'escrow_officer', 
            'clerk', 'assessor', 'collector', 'customer_service', 'technical', 'other'
          ],
          description: 'Contact role specific to counterparty type'
        },
        name: { type: 'string', description: 'Contact person name' },
        title: { type: 'string', nullable: true, description: 'Job title (e.g., "Senior Loan Officer", "Board President")' },
        department: { type: 'string', nullable: true, description: 'Department or division' },
        email: { type: 'string', format: 'email', nullable: true, description: 'Email address' },
        phone: { type: 'string', nullable: true, description: 'Phone number' },
        mobile_phone: { type: 'string', nullable: true, description: 'Mobile phone number' },
        fax: { type: 'string', nullable: true, description: 'Fax number' },
        extension: { type: 'string', nullable: true, description: 'Phone extension' },
        is_primary: { type: 'boolean', description: 'Whether this is the primary contact for the counterparty' },
        is_active: { type: 'boolean', description: 'Whether the contact is active' },
        preferred_contact_method: {
          type: 'string',
          enum: ['email', 'phone', 'mobile', 'fax', 'any'],
          description: 'Preferred method of contact'
        },
        preferred_contact_time: { type: 'string', nullable: true, description: 'Preferred contact time (e.g., "9AM-5PM EST")' },
        notes: { type: 'string', nullable: true, description: 'Additional notes about this contact' },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      },
      required: ['id', 'counterparty_id', 'role', 'name', 'is_primary', 'is_active', 'preferred_contact_method', 'created_at', 'updated_at']
    },
    CreateCounterpartyContact: {
      type: 'object',
      required: ['counterparty_id', 'role', 'name'],
      properties: {
        counterparty_id: { type: 'string', format: 'uuid', description: 'ID of counterparty to add contact to' },
        role: {
          type: 'string',
          enum: [
            'primary', 'billing', 'legal', 'operations', 'board_member', 
            'property_manager', 'loan_processor', 'underwriter', 'escrow_officer', 
            'clerk', 'assessor', 'collector', 'customer_service', 'technical', 'other'
          ],
          description: 'Contact role specific to counterparty type'
        },
        name: { type: 'string', minLength: 1, maxLength: 255, description: 'Contact person name' },
        title: { type: 'string', maxLength: 255, description: 'Job title' },
        department: { type: 'string', maxLength: 255, description: 'Department or division' },
        email: { type: 'string', format: 'email', description: 'Email address' },
        phone: { type: 'string', minLength: 1, description: 'Phone number' },
        mobile_phone: { type: 'string', minLength: 1, description: 'Mobile phone number' },
        fax: { type: 'string', minLength: 1, description: 'Fax number' },
        extension: { type: 'string', maxLength: 20, description: 'Phone extension' },
        is_primary: { type: 'boolean', default: false, description: 'Whether this is the primary contact' },
        is_active: { type: 'boolean', default: true, description: 'Whether the contact is active' },
        preferred_contact_method: {
          type: 'string',
          enum: ['email', 'phone', 'mobile', 'fax', 'any'],
          default: 'email',
          description: 'Preferred method of contact'
        },
        preferred_contact_time: { type: 'string', maxLength: 255, description: 'Preferred contact time' },
        notes: { type: 'string', maxLength: 1000, description: 'Additional notes' }
      },
      description: 'At least one contact method (email, phone, or mobile_phone) is required'
    },
    UpdateCounterpartyContact: {
      type: 'object',
      properties: {
        role: {
          type: 'string',
          enum: [
            'primary', 'billing', 'legal', 'operations', 'board_member', 
            'property_manager', 'loan_processor', 'underwriter', 'escrow_officer', 
            'clerk', 'assessor', 'collector', 'customer_service', 'technical', 'other'
          ],
          description: 'Updated contact role'
        },
        name: { type: 'string', minLength: 1, maxLength: 255, description: 'Updated contact name' },
        title: { type: 'string', maxLength: 255, description: 'Updated job title' },
        department: { type: 'string', maxLength: 255, description: 'Updated department' },
        email: { type: 'string', format: 'email', description: 'Updated email address' },
        phone: { type: 'string', minLength: 1, description: 'Updated phone number' },
        mobile_phone: { type: 'string', minLength: 1, description: 'Updated mobile phone' },
        fax: { type: 'string', minLength: 1, description: 'Updated fax number' },
        extension: { type: 'string', maxLength: 20, description: 'Updated phone extension' },
        is_primary: { type: 'boolean', description: 'Updated primary contact status' },
        is_active: { type: 'boolean', description: 'Updated active status' },
        preferred_contact_method: {
          type: 'string',
          enum: ['email', 'phone', 'mobile', 'fax', 'any'],
          description: 'Updated preferred contact method'
        },
        preferred_contact_time: { type: 'string', maxLength: 255, description: 'Updated preferred contact time' },
        notes: { type: 'string', maxLength: 1000, description: 'Updated notes' }
      }
    },
    CounterpartyWithContacts: {
      type: 'object',
      allOf: [
        { $ref: '#/components/schemas/Counterparty' },
        {
          type: 'object',
          properties: {
            contacts: {
              type: 'array',
              items: { $ref: '#/components/schemas/CounterpartyContact' },
              description: 'All contacts for this counterparty'
            },
            primary_contact: {
              $ref: '#/components/schemas/CounterpartyContact',
              nullable: true,
              description: 'Primary contact for this counterparty'
            }
          }
        }
      ]
    },
    CounterpartyContactResponse: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: { $ref: '#/components/schemas/CounterpartyContact' }
      },
      required: ['success', 'data']
    },
    CounterpartyContactsResponse: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/CounterpartyContact' }
        },
        pagination: { $ref: '#/components/schemas/Pagination' }
      },
      required: ['success', 'data']
    },
    CounterpartyWithContactsResponse: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: { $ref: '#/components/schemas/CounterpartyWithContacts' }
      },
      required: ['success', 'data']
    }
  }
} as const;