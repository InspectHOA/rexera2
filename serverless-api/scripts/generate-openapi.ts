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
            description: 'Get a list of workflows with optional filtering',
            security: [{ bearerAuth: [] }],
            parameters: [
              {
                name: 'page',
                in: 'query',
                schema: { type: 'integer', minimum: 1, default: 1 }
              },
              {
                name: 'limit',
                in: 'query',
                schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
              },
              {
                name: 'workflow_type',
                in: 'query',
                schema: { 
                  type: 'string',
                  enum: ['PAYOFF_REQUEST', 'HOA_ACQUISITION', 'MUNI_LIEN_SEARCH']
                }
              },
              {
                name: 'status',
                in: 'query',
                schema: { 
                  type: 'string',
                  enum: ['PENDING', 'IN_PROGRESS', 'AWAITING_REVIEW', 'COMPLETED', 'FAILED']
                }
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
                        success: { type: 'boolean' },
                        data: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Workflow' }
                        }
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
            security: [{ bearerAuth: [] }],
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
                enum: ['PAYOFF_REQUEST', 'HOA_ACQUISITION', 'MUNI_LIEN_SEARCH']
              },
              title: { type: 'string' },
              description: { type: 'string' },
              status: {
                type: 'string',
                enum: ['PENDING', 'IN_PROGRESS', 'AWAITING_REVIEW', 'COMPLETED', 'FAILED']
              },
              priority: {
                type: 'string',
                enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT']
              },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
              human_readable_id: { type: 'string' }
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
              }
            }
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