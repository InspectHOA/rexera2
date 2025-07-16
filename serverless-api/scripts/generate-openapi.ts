#!/usr/bin/env tsx

/**
 * OpenAPI Specification Generator
 * 
 * Automatically generates OpenAPI spec from Hono route definitions
 * Run with: pnpm openapi:generate
 */

import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

async function generateOpenAPISpec() {
  try {
    // Load environment variables
    config();
    
    // Set mock environment variables for OpenAPI generation
    if (!process.env.SUPABASE_URL) {
      process.env.SUPABASE_URL = 'https://mock.supabase.co';
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key';
    }
    
    console.log('🔄 Generating OpenAPI specification...');

    // Create a basic OpenAPI spec manually since we're using regular Hono
    const spec = {
      openapi: '3.0.0',
      info: {
        title: 'Rexera API',
        version: '2.0.0',
        description: `# Rexera Real Estate Workflow Automation API

## Overview
Rexera is a dual-layer platform that combines:
- **PostgreSQL + Next.js**: Business visibility and workflow management
- **n8n Cloud**: Workflow orchestration and automation

## Authentication
All API endpoints (except health check) require JWT authentication via Supabase Auth.

Include the JWT token in the Authorization header:
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## Workflow Types
- **PAYOFF_REQUEST**: Mortgage payoff request processing
- **HOA_ACQUISITION**: HOA acquisition workflows  
- **MUNI_LIEN_SEARCH**: Municipal lien search processes`,
        contact: {
          name: 'Rexera API Support',
          email: 'support@rexera.com'
        }
      },
      servers: [
        {
          url: process.env.NODE_ENV === 'production' ? 'https://api.rexera.com' : 'http://localhost:3001',
          description: process.env.NODE_ENV === 'production' ? 'Production' : 'Development'
        }
      ],
      paths: {
        '/api/health': {
          get: {
            summary: 'Health Check',
            description: 'Returns the health status of the API',
            responses: {
              '200': {
                description: 'API is healthy',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        timestamp: { type: 'string' },
                        environment: { type: 'string' }
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
            summary: 'List Workflows',
            description: 'Get a list of workflows with optional filtering, sorting, and pagination',
            tags: ['Workflows'],
            parameters: [
              {
                name: 'page',
                in: 'query',
                description: 'Page number for pagination',
                schema: { type: 'integer', minimum: 1, default: 1 }
              },
              {
                name: 'limit',
                in: 'query',
                description: 'Number of items per page',
                schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
              },
              {
                name: 'workflow_type',
                in: 'query',
                description: 'Filter by workflow type',
                schema: { 
                  type: 'string',
                  enum: ['PAYOFF_REQUEST', 'HOA_ACQUISITION', 'MUNI_LIEN_SEARCH']
                }
              },
              {
                name: 'status',
                in: 'query',
                description: 'Filter by workflow status',
                schema: { 
                  type: 'string',
                  enum: ['PENDING', 'IN_PROGRESS', 'AWAITING_REVIEW', 'COMPLETED', 'FAILED']
                }
              },
              {
                name: 'client_id',
                in: 'query',
                description: 'Filter by client ID',
                schema: { type: 'string', format: 'uuid' }
              },
              {
                name: 'assigned_to',
                in: 'query',
                description: 'Filter by assigned user ID',
                schema: { type: 'string', format: 'uuid' }
              },
              {
                name: 'priority',
                in: 'query',
                description: 'Filter by priority level',
                schema: { 
                  type: 'string',
                  enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT']
                }
              },
              {
                name: 'sortBy',
                in: 'query',
                description: 'Field to sort by',
                schema: { 
                  type: 'string',
                  enum: ['created_at', 'updated_at', 'due_date', 'status', 'workflow_type', 'human_readable_id', 'title', 'client_id', 'interrupt_count']
                }
              },
              {
                name: 'sortDirection',
                in: 'query',
                description: 'Sort direction',
                schema: { 
                  type: 'string',
                  enum: ['asc', 'desc'],
                  default: 'desc'
                }
              },
              {
                name: 'include',
                in: 'query',
                description: 'Include related data (comma-separated)',
                schema: { 
                  type: 'string',
                  example: 'client,tasks'
                }
              }
            ],
            responses: {
              '200': {
                description: 'List of workflows with pagination',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        success: { type: 'boolean' },
                        data: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Workflow' }
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
            summary: 'Create Workflow',
            description: 'Create a new workflow',
            tags: ['Workflows'],
            requestBody: {
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/CreateWorkflow' }
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
                        success: { type: 'boolean' },
                        data: { $ref: '#/components/schemas/Workflow' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        '/api/workflows/{id}': {
          get: {
            summary: 'Get Single Workflow',
            description: 'Get a workflow by ID (UUID or human-readable ID)',
            tags: ['Workflows'],
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                description: 'Workflow ID (UUID) or human-readable ID',
                schema: { type: 'string' }
              },
              {
                name: 'include',
                in: 'query',
                description: 'Include related data (comma-separated)',
                schema: { 
                  type: 'string',
                  example: 'client,tasks'
                }
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
                        success: { type: 'boolean' },
                        data: { $ref: '#/components/schemas/Workflow' }
                      }
                    }
                  }
                }
              },
              '404': {
                description: 'Workflow not found'
              }
            }
          }
        },
        '/api/workflows/{id}/n8n-status': {
          get: {
            summary: 'Get N8N Execution Status',
            description: 'Get the n8n execution status for a workflow',
            tags: ['N8N'],
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                description: 'Workflow ID',
                schema: { type: 'string' }
              }
            ],
            responses: {
              '200': {
                description: 'N8N execution status',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        success: { type: 'boolean' },
                        data: {
                          type: 'object',
                          properties: {
                            workflow_id: { type: 'string' },
                            n8n_execution_id: { type: 'string' },
                            status: { type: 'string' },
                            last_execution: { type: 'string' }
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
        '/api/workflows/{id}/cancel-n8n': {
          post: {
            summary: 'Cancel N8N Execution',
            description: 'Cancel the n8n execution for a workflow',
            tags: ['N8N'],
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                description: 'Workflow ID',
                schema: { type: 'string' }
              }
            ],
            responses: {
              '200': {
                description: 'N8N execution cancellation requested',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        workflow_id: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        '/api/taskExecutions': {
          get: {
            summary: 'List Task Executions',
            description: 'Get a list of task executions with optional filtering',
            tags: ['Task Executions'],
            parameters: [
              {
                name: 'workflow_id',
                in: 'query',
                description: 'Filter by workflow ID',
                schema: { type: 'string', format: 'uuid' }
              },
              {
                name: 'agent_id',
                in: 'query',
                description: 'Filter by agent ID',
                schema: { type: 'string', format: 'uuid' }
              },
              {
                name: 'status',
                in: 'query',
                description: 'Filter by task status',
                schema: { 
                  type: 'string',
                  enum: ['PENDING', 'AWAITING_REVIEW', 'COMPLETED', 'FAILED']
                }
              },
              {
                name: 'executor_type',
                in: 'query',
                description: 'Filter by executor type',
                schema: { 
                  type: 'string',
                  enum: ['AI', 'HIL']
                }
              },
              {
                name: 'page',
                in: 'query',
                description: 'Page number for pagination',
                schema: { type: 'integer', minimum: 1, default: 1 }
              },
              {
                name: 'limit',
                in: 'query',
                description: 'Number of items per page',
                schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
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
                        success: { type: 'boolean' },
                        data: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/TaskExecution' }
                        },
                        pagination: { $ref: '#/components/schemas/Pagination' }
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
            summary: 'List Agents',
            description: 'Get a list of AI agents with optional filtering',
            tags: ['Agents'],
            parameters: [
              {
                name: 'type',
                in: 'query',
                description: 'Filter by agent type',
                schema: { type: 'string' }
              },
              {
                name: 'is_active',
                in: 'query',
                description: 'Filter by active status',
                schema: { type: 'boolean' }
              },
              {
                name: 'page',
                in: 'query',
                description: 'Page number for pagination',
                schema: { type: 'integer', minimum: 1, default: 1 }
              },
              {
                name: 'limit',
                in: 'query',
                description: 'Number of items per page',
                schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
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
                        success: { type: 'boolean' },
                        data: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Agent' }
                        },
                        pagination: { $ref: '#/components/schemas/Pagination' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        },
        schemas: {
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
          CreateWorkflow: {
            type: 'object',
            required: ['workflow_type', 'client_id', 'title'],
            properties: {
              workflow_type: { 
                type: 'string',
                enum: ['PAYOFF_REQUEST', 'HOA_ACQUISITION', 'MUNI_LIEN_SEARCH']
              },
              client_id: { type: 'string', format: 'uuid' },
              title: { type: 'string', maxLength: 200 },
              description: { type: 'string', maxLength: 1000 },
              priority: {
                type: 'string',
                enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
                default: 'NORMAL'
              },
              metadata: { type: 'object' },
              due_date: { type: 'string', format: 'date-time' },
              created_by: { type: 'string', format: 'uuid' }
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
                enum: ['MISSING_DOCUMENT', 'PAYMENT_REQUIRED', 'CLIENT_CLARIFICATION', 'MANUAL_VERIFICATION'],
                nullable: true,
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
          Pagination: {
            type: 'object',
            properties: {
              page: { type: 'integer', minimum: 1 },
              limit: { type: 'integer', minimum: 1 },
              total: { type: 'integer', minimum: 0 },
              totalPages: { type: 'integer', minimum: 0 }
            },
            required: ['page', 'limit', 'total', 'totalPages']
          }
        }
      }
    };

    // Ensure the output directory exists
    const outputDir = join(process.cwd(), 'generated');
    await fs.mkdir(outputDir, { recursive: true });

    // Write the spec to file
    const outputPath = join(outputDir, 'openapi.json');
    await fs.writeFile(outputPath, JSON.stringify(spec, null, 2));

    console.log('✅ OpenAPI specification generated successfully!');
    console.log(`📁 Output: ${outputPath}`);
    console.log(`📊 Routes: ${Object.keys(spec.paths || {}).length}`);
    console.log(`🏷️  Schemas: ${Object.keys(spec.components?.schemas || {}).length}`);
    
    // Also generate a TypeScript version for type safety
    const tsOutputPath = join(outputDir, 'openapi.ts');
    const tsContent = `// Auto-generated OpenAPI specification
// Generated at: ${new Date().toISOString()}
// Do not edit manually - run 'pnpm openapi:generate' to regenerate

export const openApiSpec = ${JSON.stringify(spec, null, 2)} as const;

export type OpenAPISpec = typeof openApiSpec;
`;
    
    await fs.writeFile(tsOutputPath, tsContent);
    console.log(`📝 TypeScript types: ${tsOutputPath}`);

  } catch (error) {
    console.error('❌ Failed to generate OpenAPI specification:', error);
    process.exit(1);
  }
}

// Run if called directly
generateOpenAPISpec();

export { generateOpenAPISpec };