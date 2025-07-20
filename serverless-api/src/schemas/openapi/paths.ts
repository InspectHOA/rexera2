/**
 * OpenAPI Paths Configuration
 * Extracted from main app.ts for better organization
 */

export const openApiPaths = {
  '/api/health': {
    get: {
      tags: ['System'],
      summary: 'Health check endpoint',
      description: 'Returns the current status of the API',
      security: [],
      responses: {
        '200': {
          description: 'API is healthy',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Rexera API is running' },
                  timestamp: { type: 'string', format: 'date-time' },
                  environment: { type: 'string' },
                  version: { type: 'string', example: '2.0.0' }
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/workflows': {
    get: {
      tags: ['Workflows'],
      summary: 'List workflows',
      description: 'Retrieve a paginated list of workflows with optional filters',
      parameters: [
        {
          name: 'workflow_type',
          in: 'query',
          schema: { type: 'string' },
          description: 'Filter by workflow type'
        },
        {
          name: 'status',
          in: 'query',
          schema: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'INTERRUPTED', 'BLOCKED', 'COMPLETED'] },
          description: 'Filter by status'
        },
        {
          name: 'client_id',
          in: 'query',
          schema: { type: 'string', format: 'uuid' },
          description: 'Filter by client ID'
        },
        {
          name: 'priority',
          in: 'query',
          schema: { type: 'string', enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'] },
          description: 'Filter by priority'
        },
        {
          name: 'page',
          in: 'query',
          schema: { type: 'integer', minimum: 1, default: 1 },
          description: 'Page number'
        },
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          description: 'Number of items per page'
        },
        {
          name: 'include',
          in: 'query',
          schema: { type: 'string' },
          description: 'Comma-separated list of related data to include (client, tasks)'
        },
        {
          name: 'sortBy',
          in: 'query',
          schema: { type: 'string', default: 'created_at' },
          description: 'Field to sort by'
        },
        {
          name: 'sortDirection',
          in: 'query',
          schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
          description: 'Sort direction'
        }
      ],
      responses: {
        '200': {
          description: 'List of workflows',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Workflow' }
                  },
                  pagination: {
                    type: 'object',
                    properties: {
                      page: { type: 'integer' },
                      limit: { type: 'integer' },
                      total: { type: 'integer' },
                      totalPages: { type: 'integer' }
                    }
                  }
                }
              }
            }
          }
        },
        '400': {
          description: 'Invalid query parameters',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    post: {
      tags: ['Workflows'],
      summary: 'Create workflow',
      description: 'Create a new workflow',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['workflow_type', 'client_id', 'title'],
              properties: {
                workflow_type: { type: 'string' },
                client_id: { type: 'string', format: 'uuid' },
                title: { type: 'string' },
                description: { type: 'string' },
                priority: { type: 'string', enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'], default: 'NORMAL' },
                metadata: { type: 'object' }
              }
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Workflow created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/Workflow' }
                }
              }
            }
          }
        },
        '400': {
          description: 'Invalid request body',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  '/api/workflows/{id}': {
    get: {
      tags: ['Workflows'],
      summary: 'Get workflow',
      description: 'Retrieve a single workflow by ID or human-readable ID',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Workflow UUID or human-readable ID'
        }
      ],
      responses: {
        '200': {
          description: 'Workflow details',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/Workflow' }
                }
              }
            }
          }
        },
        '404': {
          description: 'Workflow not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  '/api/taskExecutions': {
    get: {
      tags: ['Task Executions'],
      summary: 'List task executions',
      description: 'Retrieve a paginated list of task executions with optional filters',
      parameters: [
        {
          name: 'workflow_id',
          in: 'query',
          schema: { type: 'string', format: 'uuid' },
          description: 'Filter by workflow ID'
        },
        {
          name: 'agent_id',
          in: 'query',
          schema: { type: 'string', format: 'uuid' },
          description: 'Filter by agent ID'
        },
        {
          name: 'status',
          in: 'query',
          schema: { type: 'string', enum: ['PENDING', 'INTERRUPTED', 'COMPLETED', 'FAILED'] },
          description: 'Filter by status'
        },
        {
          name: 'page',
          in: 'query',
          schema: { type: 'integer', minimum: 1, default: 1 },
          description: 'Page number'
        },
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          description: 'Number of items per page'
        }
      ],
      responses: {
        '200': {
          description: 'List of task executions',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/TaskExecution' }
                  },
                  pagination: {
                    type: 'object',
                    properties: {
                      page: { type: 'integer' },
                      limit: { type: 'integer' },
                      total: { type: 'integer' },
                      totalPages: { type: 'integer' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/taskExecutions/bulk': {
    post: {
      tags: ['Task Executions'],
      summary: 'Create multiple task executions',
      description: 'Create multiple task executions in a single request',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['task_executions'],
              properties: {
                task_executions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['workflow_id', 'agent_id', 'task_type'],
                    properties: {
                      workflow_id: { type: 'string', format: 'uuid' },
                      agent_id: { type: 'string', format: 'uuid' },
                      task_type: { type: 'string' },
                      status: { type: 'string', enum: ['PENDING', 'INTERRUPTED', 'COMPLETED', 'FAILED'], default: 'PENDING' },
                      metadata: { type: 'object' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Task executions created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/TaskExecution' }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/taskExecutions/{id}': {
    patch: {
      tags: ['Task Executions'],
      summary: 'Update task execution',
      description: 'Update an existing task execution',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Task execution UUID'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                status: { type: 'string', enum: ['PENDING', 'INTERRUPTED', 'COMPLETED', 'FAILED'] },
                metadata: { type: 'object' },
                started_at: { type: 'string', format: 'date-time' },
                completed_at: { type: 'string', format: 'date-time' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Task execution updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/TaskExecution' }
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/agents': {
    get: {
      tags: ['Agents'],
      summary: 'List agents',
      description: 'Retrieve a paginated list of agents with optional filters',
      parameters: [
        {
          name: 'is_active',
          in: 'query',
          schema: { type: 'boolean' },
          description: 'Filter by active status'
        },
        {
          name: 'type',
          in: 'query',
          schema: { type: 'string' },
          description: 'Filter by agent type'
        },
        {
          name: 'page',
          in: 'query',
          schema: { type: 'integer', minimum: 1, default: 1 },
          description: 'Page number'
        },
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          description: 'Number of items per page'
        }
      ],
      responses: {
        '200': {
          description: 'List of agents',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Agent' }
                  },
                  pagination: {
                    type: 'object',
                    properties: {
                      page: { type: 'integer' },
                      limit: { type: 'integer' },
                      total: { type: 'integer' },
                      totalPages: { type: 'integer' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    post: {
      tags: ['Agents'],
      summary: 'Update agent status (heartbeat)',
      description: 'Update agent status and last heartbeat. Used by agents to report their current status.',
      parameters: [
        {
          name: 'id',
          in: 'query',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Agent UUID'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                status: { 
                  type: 'string', 
                  enum: ['ONLINE', 'BUSY', 'OFFLINE', 'ERROR'],
                  description: 'Current agent status'
                },
                is_active: { 
                  type: 'boolean',
                  description: 'Whether agent is active'
                },
                metadata: { 
                  type: 'object',
                  description: 'Additional agent metadata'
                },
                last_heartbeat: { 
                  type: 'string', 
                  format: 'date-time',
                  description: 'Heartbeat timestamp (auto-generated if not provided)'
                }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Agent status updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/Agent' }
                }
              }
            }
          }
        },
        '404': {
          description: 'Agent not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  '/api/agents/{id}': {
    get: {
      tags: ['Agents'],
      summary: 'Get agent',
      description: 'Retrieve a single agent by ID',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Agent UUID'
        }
      ],
      responses: {
        '200': {
          description: 'Agent details',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/Agent' }
                }
              }
            }
          }
        },
        '404': {
          description: 'Agent not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  '/api/communications': {
    get: {
      tags: ['Communications'],
      summary: 'List communications',
      description: 'Retrieve a paginated list of communications with optional filters',
      parameters: [
        {
          name: 'workflow_id',
          in: 'query',
          schema: { type: 'string', format: 'uuid' },
          description: 'Filter by workflow ID'
        },
        {
          name: 'thread_id',
          in: 'query',
          schema: { type: 'string', format: 'uuid' },
          description: 'Filter by thread ID'
        },
        {
          name: 'communication_type',
          in: 'query',
          schema: { type: 'string', enum: ['email', 'phone', 'sms', 'internal_note'] },
          description: 'Filter by communication type'
        },
        {
          name: 'direction',
          in: 'query',
          schema: { type: 'string', enum: ['INBOUND', 'OUTBOUND'] },
          description: 'Filter by direction'
        },
        {
          name: 'status',
          in: 'query',
          schema: { type: 'string', enum: ['SENT', 'DELIVERED', 'READ', 'BOUNCED', 'FAILED'] },
          description: 'Filter by status'
        },
        {
          name: 'page',
          in: 'query',
          schema: { type: 'integer', minimum: 1, default: 1 },
          description: 'Page number'
        },
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          description: 'Items per page'
        },
        {
          name: 'include',
          in: 'query',
          schema: { type: 'string' },
          description: 'Comma-separated list of related data to include (email_metadata, phone_metadata, sender, workflow)'
        }
      ],
      responses: {
        '200': {
          description: 'List of communications',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Communication' }
                  },
                  pagination: { $ref: '#/components/schemas/Pagination' }
                }
              }
            }
          }
        }
      }
    },
    post: {
      tags: ['Communications'],
      summary: 'Create communication',
      description: 'Create a new communication (email, phone call, SMS, or internal note)',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateCommunication' }
          }
        }
      },
      responses: {
        '201': {
          description: 'Communication created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/Communication' }
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/communications/threads': {
    get: {
      tags: ['Communications'],
      summary: 'Get email threads',
      description: 'Retrieve email threads summary for a workflow',
      parameters: [
        {
          name: 'workflow_id',
          in: 'query',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Workflow ID to get threads for'
        }
      ],
      responses: {
        '200': {
          description: 'List of email threads',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/EmailThread' }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/communications/{id}': {
    get: {
      tags: ['Communications'],
      summary: 'Get communication',
      description: 'Retrieve a single communication by ID',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Communication ID'
        }
      ],
      responses: {
        '200': {
          description: 'Communication details',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/Communication' }
                }
              }
            }
          }
        },
        '404': {
          description: 'Communication not found'
        }
      }
    },
    patch: {
      tags: ['Communications'],
      summary: 'Update communication',
      description: 'Update communication status and metadata',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Communication ID'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  enum: ['SENT', 'DELIVERED', 'READ', 'BOUNCED', 'FAILED']
                },
                metadata: { type: 'object' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Communication updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/Communication' }
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/communications/{id}/reply': {
    post: {
      tags: ['Communications'],
      summary: 'Reply to communication',
      description: 'Create a reply to an existing communication',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Original communication ID'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ReplyCommunication' }
          }
        }
      },
      responses: {
        '201': {
          description: 'Reply created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/Communication' }
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/communications/{id}/forward': {
    post: {
      tags: ['Communications'],
      summary: 'Forward communication',
      description: 'Create a forward of an existing communication',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Original communication ID'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ForwardCommunication' }
          }
        }
      },
      responses: {
        '201': {
          description: 'Forward created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/Communication' }
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/documents': {
    get: {
      tags: ['Documents'],
      summary: 'List documents',
      description: 'Retrieve a paginated list of documents with optional filters',
      parameters: [
        {
          name: 'workflow_id',
          in: 'query',
          schema: { type: 'string', format: 'uuid' },
          description: 'Filter by workflow ID'
        },
        {
          name: 'document_type',
          in: 'query',
          schema: { type: 'string', enum: ['WORKING', 'DELIVERABLE'] },
          description: 'Filter by document type'
        },
        {
          name: 'tags',
          in: 'query',
          schema: { type: 'string' },
          description: 'Comma-separated list of tags to filter by'
        },
        {
          name: 'status',
          in: 'query',
          schema: { type: 'string', enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'] },
          description: 'Filter by status'
        },
        {
          name: 'page',
          in: 'query',
          schema: { type: 'integer', minimum: 1, default: 1 },
          description: 'Page number'
        },
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          description: 'Items per page'
        },
        {
          name: 'include',
          in: 'query',
          schema: { type: 'string' },
          description: 'Comma-separated list of related data to include (workflow, created_by_user)'
        },
        {
          name: 'sortBy',
          in: 'query',
          schema: { type: 'string', enum: ['created_at', 'updated_at', 'filename', 'file_size_bytes'], default: 'created_at' },
          description: 'Field to sort by'
        },
        {
          name: 'sortDirection',
          in: 'query',
          schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
          description: 'Sort direction'
        }
      ],
      responses: {
        '200': {
          description: 'List of documents',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Document' }
                  },
                  pagination: { $ref: '#/components/schemas/Pagination' }
                }
              }
            }
          }
        }
      }
    },
    post: {
      tags: ['Documents'],
      summary: 'Create document',
      description: 'Upload a new document or create a document reference',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateDocument' }
          }
        }
      },
      responses: {
        '201': {
          description: 'Document created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/Document' }
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/documents/{id}': {
    get: {
      tags: ['Documents'],
      summary: 'Get document',
      description: 'Retrieve a single document by ID',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Document UUID'
        },
        {
          name: 'include',
          in: 'query',
          schema: { type: 'string' },
          description: 'Comma-separated list of related data to include (workflow, created_by_user)'
        }
      ],
      responses: {
        '200': {
          description: 'Document details',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/Document' }
                }
              }
            }
          }
        },
        '404': {
          description: 'Document not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    patch: {
      tags: ['Documents'],
      summary: 'Update document',
      description: 'Update document metadata and properties',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Document UUID'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateDocument' }
          }
        }
      },
      responses: {
        '200': {
          description: 'Document updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/Document' }
                }
              }
            }
          }
        }
      }
    },
    delete: {
      tags: ['Documents'],
      summary: 'Delete document',
      description: 'Delete a document and its metadata',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Document UUID'
        }
      ],
      responses: {
        '200': {
          description: 'Document deleted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Document deleted successfully' }
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/documents/{id}/versions': {
    post: {
      tags: ['Documents'],
      summary: 'Create document version',
      description: 'Create a new version of an existing document',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Document UUID'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateDocumentVersion' }
          }
        }
      },
      responses: {
        '201': {
          description: 'Document version created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/Document' }
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/documents/by-workflow/{workflowId}': {
    get: {
      tags: ['Documents'],
      summary: 'Get workflow documents',
      description: 'Get all documents for a specific workflow',
      parameters: [
        {
          name: 'workflowId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Workflow UUID'
        },
        {
          name: 'document_type',
          in: 'query',
          schema: { type: 'string', enum: ['WORKING', 'DELIVERABLE'] },
          description: 'Filter by document type'
        },
        {
          name: 'tags',
          in: 'query',
          schema: { type: 'string' },
          description: 'Comma-separated list of tags to filter by'
        },
        {
          name: 'status',
          in: 'query',
          schema: { type: 'string', enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'] },
          description: 'Filter by status'
        },
        {
          name: 'include',
          in: 'query',
          schema: { type: 'string' },
          description: 'Comma-separated list of related data to include (created_by_user)'
        }
      ],
      responses: {
        '200': {
          description: 'List of workflow documents',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Document' }
                  },
                  workflow: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      title: { type: 'string' },
                      client_id: { type: 'string', format: 'uuid' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
} as const;