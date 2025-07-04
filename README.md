# Rexera 2.0 - AI-Powered Real Estate Workflow Automation

A scalable, maintainable monorepo for AI-powered real estate workflow automation platform with clean separation between frontend UI, backend business logic, AI agents, and workflow orchestration.

## 🏗️ Architecture Overview

### Monorepo Structure

This architecture uses a modern monorepo approach with multiple specialized services:

- **Frontend Service**: Next.js 14 with App Router for user interface
- **API Service**: Express.js server with tRPC for type-safe APIs
- **AI Agents Service**: Specialized AI agents for real estate tasks
- **Workflows Service**: Workflow orchestration and automation
- **Shared Packages**: Common types, schemas, and utilities
- **Independent Scaling**: Scale each service based on different demand patterns
- **Team Collaboration**: Teams can work independently on different services
- **Technology Flexibility**: Easy to swap technologies without affecting other services

### Architecture Diagram

```
┌─────────────────┐    tRPC/HTTP      ┌─────────────────┐
│   Frontend      │ ──────────────► │   API Server    │
│   (Next.js 14)  │                  │ (Express+tRPC)  │
│   Port 3000     │                  │   Port 3002     │
└─────────────────┘                  └─────────────────┘
         │                                     │
         │                                     │
         ▼                                     ▼
┌─────────────────┐                  ┌─────────────────┐
│   AI Agents     │                  │   Workflows     │
│   Service       │                  │   Service       │
│   (Vercel)      │                  │   (Automation)  │
└─────────────────┘                  └─────────────────┘
         │                                     │
         └──────────── Supabase Database ──────┘
                      (PostgreSQL + Auth)
```

### Technology Stack

**Frontend:**
- Next.js 14 with App Router
- TypeScript for type safety
- Tailwind CSS + Radix UI for styling
- Supabase for authentication and real-time data
- TanStack Query (React Query) for state management
- tRPC for type-safe API calls

**API:**
- Express.js server with tRPC
- TypeScript for consistency
- Supabase for database operations
- CORS for cross-origin requests
- Zod for request validation

**AI Agents:**
- Specialized AI agents for real estate tasks
- Independent deployment on Vercel
- Integration with workflow orchestration

**Workflows:**
- Workflow automation and orchestration
- Task management and processing
- Integration with external services

**Shared Packages:**
- `@rexera/types`: Shared TypeScript types
- `@rexera/schemas`: Zod validation schemas

## 📁 Project Structure

```
📁 /rexera2/
├── 📁 frontend/              ← Next.js Frontend with App Router
│   ├── 📁 src/app/           ← App Router pages & layouts
│   │   ├── 📁 auth/          ← Authentication pages
│   │   ├── 📁 dashboard/     ← Main dashboard UI
│   │   └── 📁 workflow/      ← Workflow management UI
│   ├── 📁 src/components/    ← Reusable React components
│   │   ├── 📁 ui/            ← Base UI components (Radix UI)
│   │   ├── 📁 dashboard/     ← Dashboard-specific components
│   │   └── 📁 workflow/      ← Workflow-specific components
│   ├── 📁 src/lib/           ← Utilities, hooks, and integrations
│   │   ├── 📁 auth/          ← Authentication logic
│   │   ├── 📁 hooks/         ← Custom React hooks
│   │   ├── 📁 supabase/      ← Supabase client configuration
│   │   └── 📁 trpc/          ← tRPC client setup
│   ├── 📁 public/            ← Static assets (logos, images)
│   ├── vercel.json           ← Vercel deployment configuration
│   └── package.json          ← Frontend dependencies
├── 📁 api/                   ← Express API Server with tRPC
│   ├── 📁 src/               ← API source code
│   │   ├── server.ts         ← Express server entry point
│   │   ├── 📁 trpc/          ← tRPC router and context
│   │   ├── 📁 health/        ← Health check endpoints
│   │   ├── 📁 tasks/         ← Task management APIs
│   │   ├── 📁 workflows/     ← Workflow management APIs
│   │   └── 📁 test-db/       ← Database testing endpoints
│   ├── vercel.json           ← Vercel deployment configuration
│   ├── package.json          ← API dependencies
│   └── tsconfig.json         ← TypeScript configuration
├── 📁 agents/                ← AI Agents Service
│   ├── 📁 src/               ← Agent source code
│   │   ├── 📁 agents/        ← Individual AI agents
│   │   ├── agent-coordinator.ts ← Agent coordination logic
│   │   └── agent-sdk.ts      ← Agent SDK and utilities
│   ├── vercel.json           ← Vercel deployment configuration
│   └── package.json          ← Agents dependencies
├── 📁 workflows/             ← Workflow Orchestration Service
│   ├── 📁 src/               ← Workflow source code
│   │   ├── 📁 workflows/     ← Workflow definitions
│   │   ├── 📁 shared/        ← Shared workflow utilities
│   │   └── 📁 validation/    ← Workflow validation
│   └── package.json          ← Workflows dependencies
├── 📁 packages/              ← Shared Packages
│   ├── 📁 types/             ← Shared TypeScript types
│   │   └── 📁 src/           ← Type definitions
│   └── 📁 schemas/           ← Shared Zod schemas
│       └── 📁 src/           ← Schema definitions
├── 📁 supabase/              ← Database migrations & configuration
│   ├── 📁 migrations/        ← SQL migration files
│   └── config.toml           ← Supabase configuration
├── 📁 docs/                  ← Project documentation
├── package.json              ← Root package.json with workspaces
├── pnpm-workspace.yaml       ← PNPM workspace configuration
├── turbo.json                ← Turborepo configuration
└── README.md                 ← This documentation
```

### Key Files Explained

- **[`frontend/src/app/auth/login/page.tsx`](frontend/src/app/auth/login/page.tsx)**: Authentication with localhost bypass
- **[`api/src/server.ts`](api/src/server.ts)**: Express server with tRPC integration
- **[`frontend/vercel.json`](frontend/vercel.json)**: Frontend deployment configuration
- **[`api/vercel.json`](api/vercel.json)**: API deployment configuration
- **[`packages/types/src/`](packages/types/src/)**: Shared TypeScript types across services
- **[`packages/schemas/src/`](packages/schemas/src/)**: Shared Zod validation schemas
- **[`agents/src/`](agents/src/)**: AI agents for real estate automation
- **[`workflows/src/`](workflows/src/)**: Workflow orchestration and automation
- **[`turbo.json`](turbo.json)**: Turborepo build pipeline configuration
- **[`pnpm-workspace.yaml`](pnpm-workspace.yaml)**: PNPM workspace configuration

## 🚀 Development Setup

### Prerequisites

- **Node.js**: Version 18 or higher
- **PNPM**: Version 8 or higher (preferred package manager)
- **Supabase Account**: For database and authentication
- **Git**: For version control

### Step-by-Step Installation

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd rexera2
   ```

2. **Install Dependencies (All Workspaces)**
   ```bash
   # Install PNPM if not already installed
   npm install -g pnpm
   
   # Install all workspace dependencies
   pnpm install
   ```

3. **Set Up Database**
   ```bash
   # Install Supabase CLI if not already installed
   npm install -g @supabase/cli
   
   # Initialize Supabase (if needed)
   supabase init
   
   # Run migrations
   supabase db reset
   ```

4. **Build Shared Packages**
   ```bash
   # Build shared types and schemas
   pnpm run build
   ```

### Verification Steps

1. **Check Node.js and PNPM Version**
   ```bash
   node --version  # Should be 18+
   pnpm --version  # Should be 8+
   ```

2. **Verify Workspace Dependencies**
   ```bash
   # Check all workspaces
   pnpm list --depth=0
   
   # Verify specific workspace
   pnpm --filter @rexera/frontend list --depth=0
   pnpm --filter @rexera/api list --depth=0
   ```

3. **Verify Turborepo Setup**
   ```bash
   # Check if turbo is working
   pnpm turbo --version
   ```

## ⚙️ Environment Configuration

### Frontend Environment (`.env.local`)

Create `frontend/.env.local`:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3002

# Supabase Configuration (for real-time features)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Authentication
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Development Settings
NODE_ENV=development
```

### API Environment (`.env.local`)

Create `api/.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Server Configuration
PORT=3002
NODE_ENV=development

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend-domain.vercel.app

# Internal API Security
INTERNAL_API_KEY=rexera-internal-api-key-2024

# External Integrations
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://workflows.rexera.com/webhook
```

### Environment Variables Explained

| Variable | Purpose | Required |
|----------|---------|----------|
| `NEXT_PUBLIC_API_URL` | Frontend API endpoint | Yes |
| `SUPABASE_URL` | Database connection | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side database access | Yes |
| `ALLOWED_ORIGINS` | CORS security | Yes |
| `INTERNAL_API_KEY` | Service-to-service auth | Recommended |

### Development vs Production

**Development:**
- API URL: `http://localhost:3002`
- CORS: Allows localhost origins
- Auth: Localhost bypass enabled

**Production:**
- API URL: `https://your-api-domain.vercel.app`
- CORS: Restricted to production domains
- Auth: Full Google OAuth flow

## 🏃‍♂️ Running the Application

### Development Workflow

#### Option 1: Start All Services (Recommended)
```bash
# Start all services with Turborepo
pnpm dev
```

This will start:
- Frontend on http://localhost:3000
- API on http://localhost:3002
- All other services as configured

#### Option 2: Start Individual Services

1. **Start API Server (Terminal 1)**
   ```bash
   pnpm --filter @rexera/api dev
   ```
   
   Expected output:
   ```
   🚀 API Server running on http://localhost:3002
   📊 Health check: http://localhost:3002/health
   🔗 Workflows API: http://localhost:3002/api/workflows
   📋 Tasks API: http://localhost:3002/api/tasks
   ⚡ tRPC API: http://localhost:3002/api/trpc
   ```

2. **Start Frontend Server (Terminal 2)**
   ```bash
   pnpm --filter @rexera/frontend dev
   ```
   
   Expected output:
   ```
   ▲ Next.js 14.0.3
   - Local:        http://localhost:3000
   - Ready in 2.1s
   ```

3. **Start AI Agents Service (Terminal 3)**
   ```bash
   pnpm --filter @rexera/agents dev
   ```

4. **Start Workflows Service (Terminal 4)**
   ```bash
   pnpm --filter @rexera/workflows dev
   ```

### Verify Connection
- Frontend: http://localhost:3000
- API Health: http://localhost:3002/health
- API tRPC: http://localhost:3002/api/trpc
- API Workflows: http://localhost:3002/api/workflows

### Port Configuration

| Service | Default Port | Alternative |
|---------|--------------|-------------|
| Frontend | 3000 | 3001 |
| API | 3002 | 3003 |
| Agents | 3004 | 3005 |
| Workflows | 3006 | 3007 |

**Port Conflict Resolution:**
```bash
# If port 3000 is busy
PORT=3001 pnpm --filter @rexera/frontend dev

# If port 3002 is busy
PORT=3003 pnpm --filter @rexera/api dev

# Kill all ports and restart
pnpm run kill-ports
pnpm dev
```

### Development Features

- **Hot Reloading**: All services auto-reload on file changes
- **TypeScript**: Real-time type checking across all workspaces
- **tRPC**: Type-safe API calls between frontend and backend
- **Turborepo**: Optimized build pipeline with caching
- **CORS**: Pre-configured for local development
- **Auth Bypass**: Automatic login for localhost
- **Error Handling**: Detailed error messages in development
- **Shared Types**: Consistent types across all services

## 📡 API Documentation

### Base URLs

- **Development**: `http://localhost:3002`
- **Production**: `https://rexera-api.vercel.app`

### API Architecture

The API uses a hybrid approach:
- **tRPC**: Type-safe API calls at `/api/trpc`
- **REST**: Traditional REST endpoints for external integrations
- **Express**: Underlying server framework

### Health Check

**GET** `/health`

```bash
curl http://localhost:3002/health
```

Response:
```json
{
  "success": true,
  "message": "API server is running",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "development"
}
```

### tRPC API

**Endpoint**: `/api/trpc`

The tRPC API provides type-safe communication between frontend and backend:

```typescript
// Frontend usage example
import { trpc } from '@/lib/trpc/client';

// Get workflows with full type safety
const { data: workflows } = trpc.workflows.list.useQuery({
  status: 'active',
  limit: 10
});

// Create workflow with validation
const createWorkflow = trpc.workflows.create.useMutation();
```

### Workflows API

#### List Workflows

**GET** `/api/workflows`

Query Parameters:
- `status` (optional): Filter by workflow status
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset

```bash
curl "http://localhost:3002/api/workflows?status=active&limit=10"
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "wf_123",
      "title": "HOA Document Processing",
      "status": "active",
      "created_at": "2024-01-15T10:00:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z",
      "tasks_count": 5,
      "completed_tasks": 2
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 10,
    "offset": 0,
    "has_more": true
  }
}
```

#### Create Workflow

**POST** `/api/workflows`

Request Body:
```json
{
  "title": "New Workflow",
  "description": "Workflow description",
  "type": "hoa_acquisition"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "wf_456",
    "title": "New Workflow",
    "status": "pending",
    "created_at": "2024-01-15T11:00:00.000Z"
  }
}
```

#### Get Specific Workflow

**GET** `/api/workflows/:id`

```bash
curl http://localhost:3002/api/workflows/wf_123
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "wf_123",
    "title": "HOA Document Processing",
    "description": "Processing HOA financial documents",
    "status": "active",
    "tasks": [
      {
        "id": "task_789",
        "title": "Document Upload",
        "status": "completed",
        "assigned_agent": "mia"
      }
    ]
  }
}
```

### Tasks API

#### List Tasks

**GET** `/api/tasks`

Query Parameters:
- `workflow_id` (optional): Filter by workflow
- `status` (optional): Filter by task status
- `assigned_agent` (optional): Filter by agent

```bash
curl "http://localhost:3002/api/tasks?workflow_id=wf_123&status=pending"
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "task_789",
      "workflow_id": "wf_123",
      "title": "Review Documents",
      "description": "Review uploaded HOA documents",
      "status": "pending",
      "assigned_agent": "mia",
      "created_at": "2024-01-15T10:15:00.000Z",
      "due_date": "2024-01-16T10:15:00.000Z"
    }
  ]
}
```

#### Create Task

**POST** `/api/tasks`

Request Body:
```json
{
  "workflow_id": "wf_123",
  "title": "New Task",
  "description": "Task description",
  "assigned_agent": "mia"
}
```

### Error Handling

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "validation error details"
  }
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized
- `404`: Not Found
- `500`: Internal Server Error

## 🔐 Authentication System

### Google SSO Configuration

1. **Supabase Setup**
   - Enable Google OAuth in Supabase dashboard
   - Configure redirect URLs
   - Set up RLS policies

2. **Google Cloud Console**
   - Create OAuth 2.0 credentials
   - Add authorized domains
   - Configure consent screen

### Localhost Bypass Feature

For development convenience, authentication is automatically bypassed on localhost:

```typescript
// In frontend/src/app/auth/login/page.tsx
const isLocalhost = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const isDevelopment = process.env.NODE_ENV === 'development';
const shouldBypassAuth = isLocalhost && isDevelopment;

if (shouldBypassAuth) {
  // Automatically redirect to dashboard
  router.push('/dashboard');
}
```

### Authentication Flow

**Development (Localhost):**
1. Visit `/auth/login`
2. Automatic redirect to `/dashboard`
3. No Google OAuth required

**Production:**
1. Visit `/auth/login`
2. Click "Continue with Google"
3. Google OAuth flow
4. Redirect to `/auth/callback`
5. Process authentication
6. Redirect to `/dashboard`

### Security Considerations

- **API Keys**: Never expose service role keys in frontend
- **CORS**: Properly configured for production domains
- **Session Management**: Handled by Supabase
- **Token Refresh**: Automatic token refresh

## 🚀 Deployment Guide

### Vercel Configuration

Each service has its own `vercel.json` configuration file:

#### Frontend Deployment (`frontend/vercel.json`)

```json
{
  "version": 2,
  "name": "rexera-frontend",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "NEXT_PUBLIC_API_URL": "@api-url"
  }
}
```

#### API Deployment (`api/vercel.json`)

```json
{
  "version": 2,
  "name": "rexera-api",
  "builds": [
    {
      "src": "src/server.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/src/server.ts"
    }
  ],
  "env": {
    "SUPABASE_URL": "@supabase-url",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase-service-role-key"
  }
}
```

#### Agents Deployment (`agents/vercel.json`)

```json
{
  "version": 2,
  "name": "rexera-agents",
  "builds": [
    {
      "src": "src/index.ts",
      "use": "@vercel/node"
    }
  ]
}
```

### Deployment Steps

1. **Deploy API First**
   ```bash
   cd api
   vercel
   ```

2. **Deploy Agents Service**
   ```bash
   cd agents
   vercel
   ```

3. **Deploy Frontend**
   ```bash
   cd frontend
   vercel
   ```

4. **Deploy Workflows (if applicable)**
   ```bash
   cd workflows
   vercel
   ```

### Alternative: Turborepo Deployment

```bash
# Deploy all services using Turborepo
pnpm run deploy:staging  # For staging
pnpm run deploy:prod     # For production
```

### Environment Variables in Vercel

**Frontend Environment Variables:**
```
NEXT_PUBLIC_API_URL=https://rexera-api.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=https://rexera-frontend.vercel.app
```

**API Environment Variables:**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ALLOWED_ORIGINS=https://rexera-frontend.vercel.app
INTERNAL_API_KEY=your-secure-api-key
NODE_ENV=production
```

### Production URLs

- **Frontend**: `https://rexera-frontend.vercel.app`
- **API**: `https://rexera-api.vercel.app`
- **Health Check**: `https://rexera-api.vercel.app/health`

### Domain Configuration

1. **Custom Domains** (Optional)
   - Configure in Vercel dashboard
   - Update CORS settings
   - Update environment variables

2. **SSL Certificates**
   - Automatically handled by Vercel
   - Custom domains get free SSL

## 🎯 Key Features & Benefits

### Architectural Benefits

1. **Monorepo with Clear Separation**
   - Frontend focuses on user experience with Next.js 14
   - API handles business logic with Express + tRPC
   - AI Agents provide specialized automation
   - Workflows orchestrate complex processes
   - Shared packages ensure consistency

2. **Type Safety Across Services**
   - tRPC provides end-to-end type safety
   - Shared TypeScript types and Zod schemas
   - Compile-time error detection
   - Reduced runtime errors

3. **Independent Scaling**
   - Scale each service based on demand
   - Frontend optimized for UI delivery
   - API optimized for data processing
   - Agents optimized for AI workloads
   - Workflows optimized for orchestration

4. **Team Collaboration**
   - Teams can work independently on different services
   - Shared types ensure interface compatibility
   - Turborepo enables efficient builds and testing
   - Clear service boundaries

5. **Technology Flexibility**
   - Easy to swap technologies within service boundaries
   - API can serve multiple clients (web, mobile, external)
   - Independent deployment and upgrade paths
   - Microservices-ready architecture

### Performance Benefits

1. **Optimized Builds with Turborepo**
   - Intelligent caching across all services
   - Parallel builds and testing
   - Only rebuild what changed
   - Faster CI/CD pipelines

2. **Type-Safe Performance**
   - tRPC eliminates runtime type checking overhead
   - Compile-time optimization
   - Reduced bundle sizes through tree shaking

3. **Service-Specific Optimization**
   - Frontend: Static generation and edge caching
   - API: Efficient database queries and caching
   - Agents: Optimized for AI workloads
   - Workflows: Streamlined orchestration

### AI-Powered Features

1. **Specialized AI Agents**
   - Real estate document processing
   - Automated workflow execution
   - Intelligent task routing
   - Context-aware decision making

2. **Workflow Automation**
   - HOA document processing workflows
   - Lien processing automation
   - Payoff request handling
   - Custom workflow creation

### External Service Integration

External services can access the API through multiple interfaces:

**tRPC (Type-safe):**
```typescript
// For TypeScript clients
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@rexera/api';

const client = createTRPCProxyClient<AppRouter>({
  links: [httpBatchLink({ url: 'http://localhost:3002/api/trpc' })],
});
```

**REST API (External integrations):**
```bash
# Development
curl http://localhost:3002/api/workflows

# Production
curl https://rexera-api.vercel.app/api/workflows \
  -H "Authorization: Bearer your-api-key"
```

**Supported Integrations:**
- N8N workflow automation
- AI agent orchestration
- Webhook endpoints
- Third-party analytics
- External monitoring tools
- Real estate data providers

### Future-Proofing

1. **Microservices Architecture**
   - Already separated into distinct services
   - Easy to extract services to separate repositories
   - Service mesh ready with clear boundaries
   - Independent scaling and deployment

2. **Multi-Client Support**
   - Web application (current)
   - Mobile applications (future)
   - Desktop applications (future)
   - Partner API integrations
   - Third-party developer ecosystem

3. **Technology Migration Paths**
   - Frontend: Next.js → any React framework or other UI framework
   - API: Express + tRPC → FastAPI, NestJS, GraphQL, etc.
   - Agents: Current implementation → specialized AI frameworks
   - Workflows: Current orchestration → dedicated workflow engines
   - Database: Supabase → any PostgreSQL or other databases
   - Deployment: Vercel → AWS, GCP, Azure, or hybrid cloud

4. **AI/ML Evolution**
   - Modular AI agent architecture
   - Easy integration of new AI models
   - Workflow automation expansion
   - Machine learning pipeline integration

## 🛠️ Troubleshooting & Resources

### Common Issues

#### Port Conflicts
```bash
# Error: Port 3000 is already in use
# Solution: Kill ports and restart
pnpm run kill-ports
pnpm dev

# Or use alternative port
PORT=3001 pnpm --filter @rexera/frontend dev
```

#### CORS Errors
```bash
# Error: CORS policy blocks request
# Solution: Check ALLOWED_ORIGINS in API .env.local
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

#### Environment Variables Not Loading
```bash
# Error: API_URL is undefined
# Solution: Restart development server after .env changes
pnpm dev
```

#### Database Connection Issues
```bash
# Error: Failed to connect to Supabase
# Solution: Verify Supabase URL and keys
# Check: https://app.supabase.com/project/your-project/settings/api
```

#### Workspace Dependencies Issues
```bash
# Error: Module not found in workspace
# Solution: Reinstall dependencies
pnpm install

# Or rebuild shared packages
pnpm run build
```

#### tRPC Type Errors
```bash
# Error: tRPC types not found
# Solution: Rebuild API and restart frontend
pnpm --filter @rexera/api build
pnpm --filter @rexera/frontend dev
```

### Quick Fixes

1. **Clear All Caches**
   ```bash
   # Clear Turborepo cache
   pnpm turbo clean
   
   # Clear Next.js cache
   rm -rf frontend/.next
   
   # Clear TypeScript build cache
   rm -rf */tsconfig.tsbuildinfo
   ```

2. **Rebuild Everything**
   ```bash
   pnpm clean
   pnpm install
   pnpm build
   pnpm dev
   ```

3. **Reset Database**
   ```bash
   supabase db reset
   ```

4. **Verify All Services**
   ```bash
   # API Health
   curl http://localhost:3002/health
   
   # tRPC Health
   curl http://localhost:3002/api/trpc/health.check
   
   # Frontend
   curl http://localhost:3000
   ```

5. **Check Workspace Status**
   ```bash
   # List all workspaces
   pnpm list --depth=0
   
   # Check specific workspace
   pnpm --filter @rexera/frontend list
   ```

### Additional Documentation

- **[Project Documentation](./docs/)**: Complete project specifications and guides
- **[API Documentation](./docs/03_API_SPECIFICATIONS.md)**: Complete API specifications
- **[Database Schema](./docs/02_DB_SCHEMA.md)**: Database structure and design
- **[AI Agents Guide](./docs/05_AI_AGENTS.md)**: AI agents implementation
- **[Workflows Guide](./docs/06_WORKFLOWS.md)**: Workflow automation
- **[Authentication Setup](./docs/04_AUTHENTICATION.md)**: Authentication configuration
- **[Environment Variables](./docs/08_ENV_VARS.md)**: Environment configuration guide
- **[Deployment Plan](./docs/09_DEPLOYMENT_PLAN.md)**: Production deployment guide

### Support Resources

- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: Comprehensive guides in [`/docs`](./docs/) folder
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **tRPC Docs**: https://trpc.io/docs
- **Turborepo Docs**: https://turbo.build/repo/docs
- **Vercel Docs**: https://vercel.com/docs

### Development Best Practices

1. **Monorepo Management**
   - Use PNPM workspaces for dependency management
   - Leverage Turborepo for build optimization
   - Keep shared packages up to date
   - Use consistent naming conventions

2. **Type Safety**
   - Use tRPC for type-safe API communication
   - Share types through workspace packages
   - Validate data with Zod schemas
   - Enable strict TypeScript settings

3. **API Development**
   - Use tRPC for internal APIs
   - Provide REST endpoints for external integrations
   - Implement proper error handling
   - Use consistent response formats

4. **Frontend Development**
   - Keep components small and focused
   - Use TanStack Query for server state
   - Implement proper loading and error states
   - Follow Next.js App Router patterns

5. **Database Operations**
   - Use migrations for schema changes
   - Implement proper RLS policies
   - Test with realistic data volumes
   - Monitor query performance

6. **AI/Workflow Development**
   - Keep agents modular and focused
   - Implement proper error handling and retries
   - Log agent activities for debugging
   - Test workflows with various scenarios

---

**Built with ❤️ for AI-powered real estate automation.**

*This monorepo architecture provides the foundation for a robust, scalable AI-powered application that can grow with your needs while maintaining clean separation of concerns, type safety, and excellent developer experience.*