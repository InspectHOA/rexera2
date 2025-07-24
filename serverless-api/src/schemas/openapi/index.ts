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

## Complete Endpoint Coverage

### 🏢 **Core Business Entities**
- **Workflows**: Complete CRUD with filtering, pagination, and lifecycle management
- **Task Executions**: Full lifecycle management with bulk operations and status updates
- **Counterparties**: Entity management with relationship tracking and contact organization
- **Counterparty Contacts**: Role-based contact management with comprehensive filtering

### 👥 **User & Agent Management**
- **Agents**: Agent listing, details, and heartbeat/status updates
- **Users**: User profile and authentication management
- **Clients**: Client organization and workflow association

### 📝 **Communication & Documentation**
- **Communications**: Complete email/phone/SMS tracking with thread management, reply, and forward capabilities
- **Documents**: File management, deliverables, version control, and tag-based categorization
- **Tags**: Predefined document categorization labels with search and filtering capabilities
- **HIL Notes**: Human-in-the-loop collaborative notes with threading, mentions, and priority management
- **Notifications**: Real-time notification delivery and management

### 🔍 **Audit & Monitoring**
- **Audit Events**: Comprehensive activity logs and audit trails with filtering and statistics
- **System**: Health checks and API documentation

### 🔗 **Relationship Management**
- **Workflow Counterparties**: Many-to-many relationship management with status tracking
- **Workflow Documents**: Document association and organization
- **Communication Threads**: Email thread organization and management

## Authentication
All API endpoints (except health check) require JWT authentication via Supabase Auth.

**Development Mode**: Set \`SKIP_AUTH=true\` to use hardcoded test user.
**Production Mode**: Requires valid JWT token in Authorization header.

## Workflow Types
- **PAYOFF_REQUEST**: Mortgage payoff request processing
- **HOA_ACQUISITION**: HOA acquisition workflows  
- **MUNI_LIEN_SEARCH**: Municipal lien search processes

## API Features
- **Pagination**: All list endpoints support page/limit parameters
- **Filtering**: Advanced filtering capabilities across all resource types
- **Include Parameters**: Relationship loading with ?include= query parameter
- **Search**: Full-text search capabilities for names, emails, and addresses
- **Real-time**: Supabase-powered real-time subscriptions for live updates
- **Audit Logging**: Comprehensive activity tracking for compliance and monitoring`,
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