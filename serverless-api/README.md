# Rexera 2.0 API

API layer for the Rexera real estate workflow automation platform.

## 📁 Project Structure

```
serverless-api/
├── api/                     # Vercel serverless functions
│   ├── workflows.js         # Workflow endpoints
│   ├── taskExecutions.js    # Task execution endpoints
│   ├── agents.js           # Agent endpoints
│   ├── health.js           # Health check
│   └── webhooks/           # Webhook handlers
├── src/                    # Source code
│   ├── server/             # Development server
│   │   └── express-server.js # Express server for local dev
│   ├── utils/              # Shared utilities
│   │   ├── database.js     # Database client
│   │   └── errors.js       # Error handling
│   └── types/              # Type definitions
├── tests/                  # Test suite
│   ├── api.integration.test.js # Full integration tests
│   ├── smoke.test.js       # Quick health checks
│   └── scripts/            # Test utilities
│       └── test-runner.js  # Test orchestration
├── scripts/                # Development scripts
│   └── seed-database.js    # Database seeding
├── docs/                   # Documentation
│   └── testing.md         # Testing guide
└── package.json           # Project configuration
```

## 🚀 Quick Start

### Development Server
```bash
# Start local development server on localhost:3001
npm run dev
```

### Production (Vercel)
```bash
# Deploy to Vercel with serverless functions
npm run start
```

## 🧪 Testing

### Quick Health Check (5 seconds)
```bash
npm run test:smoke
```

### Full Integration Tests (15 seconds)
```bash
npm run test
```

### Individual Test Types
```bash
npm run test:integration  # Comprehensive API testing
npm run test:smoke       # Basic endpoint health
```

## 🗄️ Database

### Seeding
```bash
npm run seed
```

### Connection
Uses Supabase PostgreSQL with environment variables:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## 📋 API Endpoints

### Core Endpoints
- `GET /api/health` - Service health check
- `GET /api/workflows` - List workflows
- `GET /api/workflows/:id` - Get workflow (UUID or human ID)
- `GET /api/taskExecutions` - List task executions
- `GET /api/agents` - List AI agents

### Query Parameters
- `include=client,tasks` - Include related data
- `workflowId=:id` - Filter by workflow
- `limit=50&offset=0` - Pagination

### Human Readable IDs
Workflows support friendly URLs:
- `/api/workflows/PAY-250706-001` ✅
- `/api/workflows/uuid-string` ✅

## 🔧 Development

### Project Commands
```bash
npm run dev          # Start development server
npm run test         # Run all tests
npm run seed         # Seed database
npm run lint         # Lint code
npm run type-check   # TypeScript validation
npm run clean        # Clean build artifacts
```

### Environment Setup
```bash
# Required environment variables
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional
API_BASE_URL=http://localhost:3001/api
PORT=3001
```

## 🏗️ Architecture

### Dual Deployment Model
- **Development**: Express server (`src/server/express-server.js`)
- **Production**: Vercel serverless functions (`api/`)

### Data Flow
```
Frontend → API Routes → Database Utils → Supabase PostgreSQL
```

### Key Features
- ✅ **Human Readable IDs**: PAY-250706-001, HOA-250706-003
- ✅ **Include Parameters**: Related data fetching
- ✅ **Error Handling**: Proper HTTP status codes
- ✅ **Performance**: Response time monitoring
- ✅ **Type Safety**: Zod validation schemas

## 📚 Documentation

- [Testing Guide](docs/testing.md) - Comprehensive testing documentation
- [API Reference](../API_TESTING_GUIDE.md) - Full API documentation

## 🔧 Troubleshooting

### Common Issues

**Server Won't Start**
```bash
# Check if port is in use
lsof -i :3001

# Use different port
PORT=3002 npm run dev
```

**Database Connection**
```bash
# Test database connectivity
npm run test:smoke
```

**Test Failures**
```bash
# Check API server status
curl http://localhost:3001/api/health
```

## 🚢 Deployment

### Vercel (Production)
```bash
# Deploy to Vercel
vercel deploy

# Production deployment
vercel --prod
```

### Environment Variables
Set in Vercel dashboard:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## 🤝 Contributing

1. **Code Style**: Follow existing patterns
2. **Testing**: Add tests for new endpoints
3. **Documentation**: Update README for new features
4. **Type Safety**: Use Zod schemas for validation

---

**🎯 This API powers the Rexera 2.0 workflow automation platform with reliable, tested endpoints for managing real estate workflows.**