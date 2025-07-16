/**
 * OpenAPI Specification Builder
 * Consolidated OpenAPI spec construction
 */

import { openApiComponents } from './components';
import { openApiPaths } from './paths';

export function buildOpenApiSpec() {
  return {
    openapi: '3.0.0',
    info: {
      title: 'Rexera API',
      version: '2.0.0',
      description: `# Rexera Real Estate Workflow Automation API

## Overview
Rexera is a dual-layer platform that combines:
- **PostgreSQL + Next.js**: Business visibility and workflow management  
- **n8n Cloud**: Workflow orchestration and automation

## Current Implementation Status

### ✅ **Fully Implemented Endpoints**
- **Workflows**: Complete CRUD operations with filtering, pagination, and human-readable ID support
- **Task Executions**: Full lifecycle management with bulk operations and status updates
- **Agents**: Agent listing, details, and heartbeat/status updates
- **System**: Health checks and API documentation

### 🚧 **Planned Endpoints** (Database Schema Ready)
- **Communications**: Email/phone/SMS tracking (database table exists)
- **Documents**: File management and deliverables (database table exists)
- **Costs**: Financial tracking and invoicing (database table exists)
- **Audit Events**: Activity logs and audit trails (database table exists)

## Authentication
All API endpoints (except health check) require JWT authentication via Supabase Auth.

**Development Mode**: Set \`SKIP_AUTH=true\` to use hardcoded test user.
**Production Mode**: Requires valid JWT token in Authorization header.

## Workflow Types
- **PAYOFF_REQUEST**: Mortgage payoff request processing
- **HOA_ACQUISITION**: HOA acquisition workflows  
- **MUNI_LIEN_SEARCH**: Municipal lien search processes`,
      contact: {
        name: 'Rexera Support',
        email: 'support@rexera.com'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api-three-omega-56.vercel.app' 
          : 'http://localhost:3001',
        description: process.env.NODE_ENV === 'production' ? 'Production' : 'Development'
      }
    ],
    components: openApiComponents,
    security: [
      {
        bearerAuth: []
      }
    ],
    paths: openApiPaths
  };
}

export { openApiComponents, openApiPaths };