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
  },
  '/api/audit-events': {
    get: {
      tags: ['Audit'],
      summary: 'List audit events',
      description: 'Retrieve a paginated list of audit events with optional filters',
      parameters: [
        {
          name: 'workflow_id',
          in: 'query',
          schema: { type: 'string', format: 'uuid' },
          description: 'Filter by workflow ID'
        },
        {
          name: 'client_id',
          in: 'query',
          schema: { type: 'string', format: 'uuid' },
          description: 'Filter by client ID'
        },
        {
          name: 'actor_type',
          in: 'query',
          schema: { type: 'string', enum: ['human', 'agent', 'system'] },
          description: 'Filter by actor type'
        },
        {
          name: 'actor_id',
          in: 'query',
          schema: { type: 'string' },
          description: 'Filter by actor ID'
        },
        {
          name: 'event_type',
          in: 'query',
          schema: { 
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
            ]
          },
          description: 'Filter by event type'
        },
        {
          name: 'action',
          in: 'query',
          schema: { 
            type: 'string', 
            enum: ['create', 'read', 'update', 'delete', 'execute', 'approve', 'reject', 'login', 'logout']
          },
          description: 'Filter by action'
        },
        {
          name: 'resource_type',
          in: 'query',
          schema: { 
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
            ]
          },
          description: 'Filter by resource type'
        },
        {
          name: 'resource_id',
          in: 'query',
          schema: { type: 'string', format: 'uuid' },
          description: 'Filter by resource ID'
        },
        {
          name: 'from_date',
          in: 'query',
          schema: { type: 'string', format: 'date-time' },
          description: 'Filter events from this date'
        },
        {
          name: 'to_date',
          in: 'query',
          schema: { type: 'string', format: 'date-time' },
          description: 'Filter events until this date'
        },
        {
          name: 'page',
          in: 'query',
          schema: { type: 'integer', minimum: 1, default: 1 },
          description: 'Page number for pagination'
        },
        {
          name: 'per_page',
          in: 'query',
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
          description: 'Number of items per page'
        }
      ],
      responses: {
        '200': {
          description: 'Audit events retrieved successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuditEventList' }
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
        },
        '500': {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    post: {
      tags: ['Audit'],
      summary: 'Create audit event',
      description: 'Manually create an audit event for specific scenarios',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateAuditEvent' }
          }
        }
      },
      responses: {
        '201': {
          description: 'Audit event created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string', example: 'Audit event created successfully' },
                  event: { $ref: '#/components/schemas/CreateAuditEvent' }
                }
              }
            }
          }
        },
        '400': {
          description: 'Invalid audit event data',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        '500': {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  '/api/audit-events/batch': {
    post: {
      tags: ['Audit'],
      summary: 'Create multiple audit events',
      description: 'Create multiple audit events in a single batch operation',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: { $ref: '#/components/schemas/CreateAuditEvent' },
              description: 'Array of audit events to create'
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Audit events batch created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string', example: 'Audit events batch created successfully' },
                  count: { type: 'integer', description: 'Number of events created' }
                }
              }
            }
          }
        },
        '400': {
          description: 'Invalid audit events in batch',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'string' },
                  details: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        index: { type: 'integer' },
                        errors: { type: 'array', items: { type: 'object' } }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        '500': {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  '/api/audit-events/workflow/{id}': {
    get: {
      tags: ['Audit'],
      summary: 'Get workflow audit trail',
      description: 'Retrieve the complete audit trail for a specific workflow',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Workflow ID'
        }
      ],
      responses: {
        '200': {
          description: 'Workflow audit trail retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  workflow_id: { type: 'string', format: 'uuid' },
                  audit_trail: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/AuditEvent' }
                  }
                }
              }
            }
          }
        },
        '400': {
          description: 'Invalid workflow ID format',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        '500': {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  '/api/audit-events/stats': {
    get: {
      tags: ['Audit'],
      summary: 'Get audit event statistics',
      description: 'Retrieve summary statistics for audit events (last 24 hours)',
      responses: {
        '200': {
          description: 'Audit statistics retrieved successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuditEventStats' }
            }
          }
        },
        '500': {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  '/api/hil-notes': {
    get: {
      tags: ['HIL Notes'],
      summary: 'List HIL notes for a workflow',
      description: 'Retrieve HIL notes for a specific workflow with optional filters',
      parameters: [
        {
          name: 'workflow_id',
          in: 'query',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Workflow ID to get notes for'
        },
        {
          name: 'is_resolved',
          in: 'query',
          schema: { type: 'boolean' },
          description: 'Filter by resolved status'
        },
        {
          name: 'priority',
          in: 'query',
          schema: { type: 'string', enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'] },
          description: 'Filter by priority level'
        },
        {
          name: 'author_id',
          in: 'query',
          schema: { type: 'string', format: 'uuid' },
          description: 'Filter by author'
        },
        {
          name: 'parent_note_id',
          in: 'query',
          schema: { type: 'string', format: 'uuid' },
          description: 'Filter by parent note (for threaded conversations)'
        },
        {
          name: 'include',
          in: 'query',
          schema: { type: 'string' },
          description: 'Comma-separated list of relations to include (author,replies)'
        }
      ],
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'HIL notes retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/HilNote' }
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
        },
        '401': {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        '500': {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    post: {
      tags: ['HIL Notes'],
      summary: 'Create a new HIL note',
      description: 'Create a new HIL note with optional mentions and priority',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateHilNote' }
          }
        }
      },
      responses: {
        '201': {
          description: 'HIL note created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/HilNote' }
                }
              }
            }
          }
        },
        '400': {
          description: 'Invalid request data',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        '401': {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        '500': {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  '/api/hil-notes/{id}': {
    patch: {
      tags: ['HIL Notes'],
      summary: 'Update a HIL note',
      description: 'Update an existing HIL note (only author can update)',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'HIL note ID'
        }
      ],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateHilNote' }
          }
        }
      },
      responses: {
        '200': {
          description: 'HIL note updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/HilNote' }
                }
              }
            }
          }
        },
        '400': {
          description: 'Invalid request data',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        '401': {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        '403': {
          description: 'Forbidden - only author can update note',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        '404': {
          description: 'HIL note not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        '500': {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    delete: {
      tags: ['HIL Notes'],
      summary: 'Delete a HIL note',
      description: 'Delete an existing HIL note (only author can delete)',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'HIL note ID'
        }
      ],
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'HIL note deleted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Note deleted successfully' }
                }
              }
            }
          }
        },
        '401': {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        '403': {
          description: 'Forbidden - only author can delete note',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        '404': {
          description: 'HIL note not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        '500': {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  '/api/hil-notes/{id}/reply': {
    post: {
      tags: ['HIL Notes'],
      summary: 'Reply to a HIL note',
      description: 'Create a threaded reply to an existing HIL note',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Parent HIL note ID'
        }
      ],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ReplyHilNote' }
          }
        }
      },
      responses: {
        '201': {
          description: 'HIL note reply created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/HilNote' }
                }
              }
            }
          }
        },
        '400': {
          description: 'Invalid request data',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        '401': {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        '404': {
          description: 'Parent HIL note not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        '500': {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  '/api/counterparties': {
    get: {
      tags: ['Counterparties'],
      summary: 'List counterparties',
      description: 'Retrieve a paginated list of counterparties with optional filters',
      parameters: [
        {
          name: 'type',
          in: 'query',
          schema: { 
            type: 'string', 
            enum: ['hoa', 'lender', 'municipality', 'utility', 'tax_authority']
          },
          description: 'Filter by counterparty type'
        },
        {
          name: 'search',
          in: 'query',
          schema: { type: 'string' },
          description: 'Search in counterparty name and email'
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
          name: 'sort',
          in: 'query',
          schema: { type: 'string', enum: ['name', 'type', 'created_at'], default: 'name' },
          description: 'Field to sort by'
        },
        {
          name: 'order',
          in: 'query',
          schema: { type: 'string', enum: ['asc', 'desc'], default: 'asc' },
          description: 'Sort order'
        },
        {
          name: 'include',
          in: 'query',
          schema: { type: 'string', enum: ['workflows'] },
          description: 'Include related workflow relationships'
        }
      ],
      responses: {
        '200': {
          description: 'List of counterparties',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CounterpartiesResponse' }
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
      tags: ['Counterparties'],
      summary: 'Create counterparty',
      description: 'Create a new counterparty',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateCounterparty' }
          }
        }
      },
      responses: {
        '201': {
          description: 'Counterparty created successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CounterpartyResponse' }
            }
          }
        },
        '400': {
          description: 'Invalid request data',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  '/api/counterparties/{id}': {
    get: {
      tags: ['Counterparties'],
      summary: 'Get counterparty',
      description: 'Retrieve a single counterparty by ID',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Counterparty UUID'
        },
        {
          name: 'include',
          in: 'query',
          schema: { type: 'string', enum: ['workflows'] },
          description: 'Include related workflow relationships'
        }
      ],
      responses: {
        '200': {
          description: 'Counterparty details',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CounterpartyResponse' }
            }
          }
        },
        '404': {
          description: 'Counterparty not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    patch: {
      tags: ['Counterparties'],
      summary: 'Update counterparty',
      description: 'Update an existing counterparty',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Counterparty UUID'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateCounterparty' }
          }
        }
      },
      responses: {
        '200': {
          description: 'Counterparty updated successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CounterpartyResponse' }
            }
          }
        },
        '400': {
          description: 'Invalid request data',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        '404': {
          description: 'Counterparty not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    delete: {
      tags: ['Counterparties'],
      summary: 'Delete counterparty',
      description: 'Delete a counterparty (only if no active workflow relationships exist)',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Counterparty UUID'
        }
      ],
      responses: {
        '200': {
          description: 'Counterparty deleted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Counterparty deleted successfully' }
                }
              }
            }
          }
        },
        '404': {
          description: 'Counterparty not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        '409': {
          description: 'Cannot delete counterparty with active workflow relationships',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  '/api/counterparties/search': {
    get: {
      tags: ['Counterparties'],
      summary: 'Search counterparties',
      description: 'Search counterparties by query string with type filtering and relevance ranking',
      parameters: [
        {
          name: 'q',
          in: 'query',
          required: true,
          schema: { type: 'string', minLength: 1 },
          description: 'Search query string (searches name, email, and address)'
        },
        {
          name: 'type',
          in: 'query',
          schema: { 
            type: 'string', 
            enum: ['hoa', 'lender', 'municipality', 'utility', 'tax_authority']
          },
          description: 'Filter results by counterparty type'
        },
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', minimum: 1, maximum: 50, default: 10 },
          description: 'Maximum number of results to return'
        }
      ],
      responses: {
        '200': {
          description: 'Search results with relevance ranking',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CounterpartySearchResponse' }
            }
          }
        },
        '400': {
          description: 'Invalid search parameters',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  '/api/counterparties/types': {
    get: {
      tags: ['Counterparties'],
      summary: 'Get counterparty types',
      description: 'Retrieve available counterparty types and their labels',
      responses: {
        '200': {
          description: 'List of counterparty types',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CounterpartyTypesResponse' }
            }
          }
        }
      }
    }
  },
  '/api/workflows/{workflowId}/counterparties': {
    get: {
      tags: ['Workflow Counterparties'],
      summary: 'Get workflow counterparties',
      description: 'Retrieve counterparties associated with a specific workflow',
      parameters: [
        {
          name: 'workflowId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Workflow UUID or human-readable ID'
        },
        {
          name: 'status',
          in: 'query',
          schema: { 
            type: 'string', 
            enum: ['PENDING', 'CONTACTED', 'RESPONDED', 'COMPLETED'] 
          },
          description: 'Filter by relationship status'
        },
        {
          name: 'include',
          in: 'query',
          schema: { type: 'string', enum: ['counterparty'] },
          description: 'Include counterparty details'
        }
      ],
      responses: {
        '200': {
          description: 'List of workflow counterparties',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/WorkflowCounterpartiesResponse' }
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
    },
    post: {
      tags: ['Workflow Counterparties'],
      summary: 'Add counterparty to workflow',
      description: 'Associate a counterparty with a workflow',
      parameters: [
        {
          name: 'workflowId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Workflow UUID or human-readable ID'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateWorkflowCounterparty' }
          }
        }
      },
      responses: {
        '201': {
          description: 'Counterparty added to workflow successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/WorkflowCounterparty' }
                }
              }
            }
          }
        },
        '404': {
          description: 'Workflow or counterparty not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        '409': {
          description: 'Counterparty already associated with this workflow',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  '/api/workflows/{workflowId}/counterparties/{id}': {
    patch: {
      tags: ['Workflow Counterparties'],
      summary: 'Update workflow counterparty status',
      description: 'Update the status of a counterparty relationship within a workflow',
      parameters: [
        {
          name: 'workflowId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Workflow UUID or human-readable ID'
        },
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Workflow counterparty relationship UUID'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateWorkflowCounterparty' }
          }
        }
      },
      responses: {
        '200': {
          description: 'Workflow counterparty status updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/WorkflowCounterparty' }
                }
              }
            }
          }
        },
        '404': {
          description: 'Workflow counterparty relationship not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    delete: {
      tags: ['Workflow Counterparties'],
      summary: 'Remove counterparty from workflow',
      description: 'Remove the association between a counterparty and a workflow',
      parameters: [
        {
          name: 'workflowId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Workflow UUID or human-readable ID'
        },
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Workflow counterparty relationship UUID'
        }
      ],
      responses: {
        '200': {
          description: 'Counterparty removed from workflow successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Counterparty removed from workflow successfully' }
                }
              }
            }
          }
        },
        '404': {
          description: 'Workflow counterparty relationship not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  }
} as const;