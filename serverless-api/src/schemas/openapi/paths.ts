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
          schema: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'AWAITING_REVIEW', 'BLOCKED', 'COMPLETED'] },
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
          schema: { type: 'string', enum: ['PENDING', 'AWAITING_REVIEW', 'COMPLETED', 'FAILED'] },
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
                      status: { type: 'string', enum: ['PENDING', 'AWAITING_REVIEW', 'COMPLETED', 'FAILED'], default: 'PENDING' },
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
                status: { type: 'string', enum: ['PENDING', 'AWAITING_REVIEW', 'COMPLETED', 'FAILED'] },
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
  }
} as const;