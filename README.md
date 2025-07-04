# Rexera 2.0 - Dual Deployment Architecture

A scalable, maintainable monorepo with clean separation between frontend UI and backend business logic, deployed as independent services for maximum flexibility and performance.

## 🏗️ Architecture Overview

### Why Dual Deployment?

This architecture separates concerns by deploying the frontend and API as independent services:

- **Frontend Service**: Pure Next.js UI focused solely on user experience
- **API Service**: Express.js server handling all business logic and data operations
- **Clean Separation**: No mixing of UI and business logic in a single deployment
- **Independent Scaling**: Scale frontend and API based on different demand patterns
- **Team Collaboration**: Frontend and backend teams can work independently
- **Technology Flexibility**: Easy to swap technologies without affecting other services

### Architecture Diagram

```
┌─────────────────┐    HTTP/HTTPS     ┌─────────────────┐
│   Frontend      │ ──────────────► │   API Server    │
│   (Next.js)     │                  │   (Express.js)  │
│   Port 3000     │                  │   Port 3002     │
└─────────────────┘                  └─────────────────┘
         │                                     │
         │                                     │
         ▼                                     ▼
┌─────────────────┐                  ┌─────────────────┐
│   Vercel        │                  │   Vercel        │
│   Frontend      │                  │   API           │
│   Deployment    │                  │   Deployment    │
└─────────────────┘                  └─────────────────┘
         │                                     │
         └──────────── External Services ──────┘
                      (N8N, AI Agents, etc.)
```

### Technology Stack

**Frontend:**
- Next.js 14 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- Supabase for real-time data
- React Query for state management

**API:**
- Express.js server
- TypeScript for consistency
- Supabase for database operations
- CORS for cross-origin requests
- Zod for request validation

## 📁 Project Structure

```
📁 /rexera2/
├── 📁 frontend/              ← Pure Next.js Frontend (UI Only)
│   ├── 📁 src/app/           ← App Router pages & layouts
│   │   ├── 📁 auth/          ← Authentication pages
│   │   ├── 📁 dashboard/     ← Main dashboard UI
│   │   └── 📁 workflow/      ← Workflow management UI
│   ├── 📁 src/components/    ← Reusable React components
│   │   ├── 📁 ui/            ← Base UI components
│   │   ├── 📁 dashboard/     ← Dashboard-specific components
│   │   └── 📁 workflow/      ← Workflow-specific components
│   ├── 📁 src/lib/           ← Utilities, hooks, and integrations
│   │   ├── 📁 auth/          ← Authentication logic
│   │   ├── 📁 hooks/         ← Custom React hooks
│   │   └── 📁 supabase/      ← Supabase client configuration
│   ├── 📁 public/            ← Static assets (logos, images)
│   ├── next.config.js        ← Next.js configuration
│   ├── package.json          ← Frontend dependencies
│   └── .env.local            ← Frontend environment variables
├── 📁 api/                   ← Standalone Express API Server
│   ├── 📁 src/               ← API source code
│   │   ├── server.ts         ← Express server entry point
│   │   ├── 📁 health/        ← Health check endpoints
│   │   ├── 📁 tasks/         ← Task management APIs
│   │   ├── 📁 workflows/     ← Workflow management APIs
│   │   └── 📁 test-db/       ← Database testing endpoints
│   ├── package.json          ← API dependencies
│   ├── tsconfig.json         ← TypeScript configuration
│   └── .env.local            ← API environment variables
├── 📁 types/                 ← Shared TypeScript types
│   └── 📁 src/               ← Type definitions used by both services
├── 📁 supabase/              ← Database migrations & configuration
│   ├── 📁 migrations/        ← SQL migration files
│   └── config.toml           ← Supabase configuration
├── vercel-frontend.json      ← Frontend deployment configuration
├── vercel-api.json           ← API deployment configuration
└── README.md                 ← This documentation
```

### Key Files Explained

- **[`frontend/src/app/auth/login/page.tsx`](frontend/src/app/auth/login/page.tsx)**: Authentication with localhost bypass
- **[`api/src/server.ts`](api/src/server.ts)**: Express server wrapping Next.js API routes
- **[`vercel-frontend.json`](vercel-frontend.json)**: Frontend deployment configuration
- **[`vercel-api.json`](vercel-api.json)**: API deployment configuration
- **[`types/src/`](types/src/)**: Shared TypeScript types across services

## 🚀 Development Setup

### Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: Version 8 or higher (or yarn equivalent)
- **Supabase Account**: For database and authentication
- **Git**: For version control

### Step-by-Step Installation

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd rexera2
   ```

2. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

3. **Install API Dependencies**
   ```bash
   cd api
   npm install
   cd ..
   ```

4. **Install Shared Types**
   ```bash
   cd types
   npm install
   cd ..
   ```

5. **Set Up Database**
   ```bash
   # Install Supabase CLI if not already installed
   npm install -g @supabase/cli
   
   # Initialize Supabase (if needed)
   supabase init
   
   # Run migrations
   supabase db reset
   ```

### Verification Steps

1. **Check Node.js Version**
   ```bash
   node --version  # Should be 18+
   npm --version   # Should be 8+
   ```

2. **Verify Dependencies**
   ```bash
   # Frontend
   cd frontend && npm list --depth=0
   
   # API
   cd ../api && npm list --depth=0
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

1. **Start API Server (Terminal 1)**
   ```bash
   cd api
   npm run dev
   ```
   
   Expected output:
   ```
   🚀 API Server running on http://localhost:3002
   📊 Health check: http://localhost:3002/health
   🔗 Workflows API: http://localhost:3002/api/workflows
   📋 Tasks API: http://localhost:3002/api/tasks
   ```

2. **Start Frontend Server (Terminal 2)**
   ```bash
   cd frontend
   npm run dev
   ```
   
   Expected output:
   ```
   ▲ Next.js 14.0.3
   - Local:        http://localhost:3000
   - Ready in 2.1s
   ```

3. **Verify Connection**
   - Frontend: http://localhost:3000
   - API Health: http://localhost:3002/health
   - API Docs: http://localhost:3002/api/workflows

### Port Configuration

| Service | Default Port | Alternative |
|---------|--------------|-------------|
| Frontend | 3000 | 3001 |
| API | 3002 | 3003 |

**Port Conflict Resolution:**
```bash
# If port 3000 is busy
cd frontend
PORT=3001 npm run dev

# If port 3002 is busy
cd api
PORT=3003 npm run dev
```

### Development Features

- **Hot Reloading**: Both services auto-reload on file changes
- **TypeScript**: Real-time type checking
- **CORS**: Pre-configured for local development
- **Auth Bypass**: Automatic login for localhost
- **Error Handling**: Detailed error messages in development

## 📡 API Documentation

### Base URLs

- **Development**: `http://localhost:3002`
- **Production**: `https://rexera-api.vercel.app`

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

#### Frontend Deployment (`vercel-frontend.json`)

```json
{
  "version": 2,
  "name": "rexera-frontend",
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/.next",
  "installCommand": "cd frontend && npm install",
  "env": {
    "NEXT_PUBLIC_API_URL": "https://rexera-api.vercel.app"
  }
}
```

#### API Deployment (`vercel-api.json`)

```json
{
  "version": 2,
  "name": "rexera-api",
  "buildCommand": "cd api && npm run build",
  "outputDirectory": "api/dist",
  "installCommand": "cd api && npm install",
  "functions": {
    "api/dist/server.js": {
      "runtime": "nodejs18.x"
    }
  },
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/api/dist/server.js"
    }
  ]
}
```

### Deployment Steps

1. **Deploy API First**
   ```bash
   vercel --config vercel-api.json
   ```

2. **Update Frontend Environment**
   ```bash
   # Update NEXT_PUBLIC_API_URL in vercel-frontend.json
   # or set in Vercel dashboard
   ```

3. **Deploy Frontend**
   ```bash
   vercel --config vercel-frontend.json
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

1. **Clear Separation of Concerns**
   - Frontend focuses purely on user experience
   - API handles all business logic and data operations
   - No mixing of UI and backend code

2. **Independent Scaling**
   - Scale frontend based on user traffic
   - Scale API based on data processing needs
   - Different resource allocation strategies

3. **Team Collaboration**
   - Frontend team works independently on UI/UX
   - Backend team focuses on APIs and business logic
   - Parallel development workflows

4. **Technology Flexibility**
   - Easy to swap frontend framework (React → Vue, etc.)
   - API can serve multiple clients (web, mobile, external)
   - Independent technology upgrade paths

### Performance Benefits

1. **Optimized Deployments**
   - Frontend optimized for static content delivery
   - API optimized for server-side processing
   - Reduced bundle sizes

2. **Caching Strategies**
   - Frontend: Static asset caching
   - API: Database query caching
   - CDN optimization

3. **Load Distribution**
   - Frontend served from edge locations
   - API processing distributed across regions
   - Reduced latency

### External Service Integration

External services can directly access the API:

**Development:**
```bash
curl http://localhost:3002/api/workflows
```

**Production:**
```bash
curl https://rexera-api.vercel.app/api/workflows \
  -H "Authorization: Bearer your-api-key"
```

**Supported Integrations:**
- N8N workflow automation
- AI agent systems
- Webhook endpoints
- Third-party analytics
- External monitoring tools

### Future-Proofing

1. **Microservices Ready**
   - Easy to split API into smaller services
   - Database per service pattern
   - Service mesh integration

2. **Multi-Client Support**
   - Web application (current)
   - Mobile applications (future)
   - Desktop applications (future)
   - Partner integrations

3. **Technology Migration**
   - Frontend: Next.js → any React framework
   - API: Express → FastAPI, NestJS, etc.
   - Database: Supabase → any PostgreSQL
   - Deployment: Vercel → AWS, GCP, Azure

## 🛠️ Troubleshooting & Resources

### Common Issues

#### Port Conflicts
```bash
# Error: Port 3000 is already in use
# Solution: Use alternative port
PORT=3001 npm run dev
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
npm run dev
```

#### Database Connection Issues
```bash
# Error: Failed to connect to Supabase
# Solution: Verify Supabase URL and keys
# Check: https://app.supabase.com/project/your-project/settings/api
```

### Quick Fixes

1. **Clear Next.js Cache**
   ```bash
   cd frontend
   rm -rf .next
   npm run dev
   ```

2. **Rebuild TypeScript**
   ```bash
   cd api
   npm run build
   npm run dev
   ```

3. **Reset Database**
   ```bash
   supabase db reset
   ```

4. **Verify API Health**
   ```bash
   curl http://localhost:3002/health
   ```

### Additional Documentation

- **[Dual Deployment Guide](./DUAL_DEPLOYMENT_GUIDE.md)**: Detailed deployment instructions
- **[API Documentation](./docs/)**: Complete API specifications
- **[Database Schema](./supabase/migrations/)**: Database structure and migrations
- **[Google OAuth Setup](./GOOGLE_OAUTH_SETUP.md)**: Authentication configuration
- **[Vercel Environment Setup](./VERCEL_ENV_SETUP.md)**: Production environment guide

### Support Resources

- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: Comprehensive guides in `/docs` folder
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Vercel Docs**: https://vercel.com/docs

### Development Best Practices

1. **Environment Management**
   - Keep `.env.local` files out of version control
   - Use `.env.example` for documentation
   - Validate environment variables on startup

2. **API Development**
   - Always return consistent response formats
   - Implement proper error handling
   - Use TypeScript for type safety

3. **Frontend Development**
   - Keep components small and focused
   - Use React Query for API state management
   - Implement proper loading and error states

4. **Database Operations**
   - Use migrations for schema changes
   - Implement proper RLS policies
   - Test with realistic data volumes

---

**Built with ❤️ for scalable, maintainable architecture.**

*This dual deployment strategy provides the foundation for a robust, scalable application that can grow with your needs while maintaining clean separation of concerns and excellent developer experience.*