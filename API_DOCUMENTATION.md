# Rexera API Documentation

## 🎉 Interactive API Documentation Available!

The Rexera API now includes comprehensive interactive documentation powered by OpenAPI and Swagger UI.

## 📍 Access Points

### 🌐 Interactive Documentation
- **URL**: `http://localhost:3001/api/docs`
- **Features**: 
  - Browse all endpoints with detailed descriptions
  - Test API calls directly from the browser
  - View request/response schemas
  - Authentication examples

### 📋 OpenAPI Specification
- **URL**: `http://localhost:3001/api/openapi.json`
- **Format**: OpenAPI 3.0 JSON specification
- **Use Cases**: Import into Postman, Insomnia, or other API tools

### ℹ️ API Information
- **URL**: `http://localhost:3001/`
- **Content**: Basic API information and endpoint listing

## 🔧 Key Features

### 📖 Comprehensive Coverage
- ✅ **System Endpoints**: Health checks and status
- ✅ **Workflows**: Complete workflow management
- ✅ **Task Executions**: Task tracking and updates
- ✅ **Agents**: AI agent management
- ✅ **Activities**: Activity logging (planned)
- ✅ **Communications**: Email management (planned)
- ✅ **Interrupts**: Workflow interruptions (planned)

### 🔐 Authentication Documentation
- JWT token authentication examples
- Bearer token format specifications
- Security schema definitions

### 📊 Request/Response Examples
- Complete schema definitions for all data models
- Example requests and responses
- Error response formats

### 🎯 Interactive Testing
- Test endpoints directly from the documentation
- Authentication support
- Real-time API exploration

## 🚀 Quick Start

1. **Start the API server**:
   ```bash
   cd serverless-api && pnpm dev
   ```

2. **Open documentation**:
   ```
   http://localhost:3001/api/docs
   ```

3. **Get your JWT token** from Supabase Auth

4. **Test endpoints** using the interactive documentation

## 📋 Available Endpoints

### System
- `GET /api/health` - Health check (no auth required)

### Workflows  
- `GET /api/workflows` - List workflows with filtering
- `POST /api/workflows` - Create new workflow
- `GET /api/workflows/{id}` - Get specific workflow

### Task Executions
- `GET /api/task-executions` - List task executions
- `POST /api/task-executions` - Create task execution
- `PATCH /api/task-executions/{id}` - Update task execution

### Agents
- `GET /api/agents` - List AI agents
- `POST /api/agents` - Update agent status

### Additional Endpoints
- Activities, Communications, Interrupts (implemented but documentation pending)

## 🛠️ Technical Details

### Architecture
- **Framework**: Hono with OpenAPI integration
- **Documentation**: Swagger UI + OpenAPI 3.0
- **Authentication**: Supabase JWT tokens
- **Database**: PostgreSQL via Supabase

### Schema Validation
- All endpoints include comprehensive schema validation
- Type-safe request/response handling
- Detailed error responses with codes and timestamps

### Environment Support
- Development: `http://localhost:3001`
- Production: `https://api.rexera.com`

## 📈 Next Steps

1. **Complete endpoint documentation** for all implemented features
2. **Add request/response examples** for complex operations
3. **Include authentication flows** in documentation
4. **Add webhook documentation** for n8n integrations
5. **Create client SDK generation** from OpenAPI spec

## 🎯 Benefits

✅ **Developer Experience**: Interactive docs make API integration easy  
✅ **Type Safety**: Complete schema definitions prevent errors  
✅ **Testing**: Built-in testing capabilities  
✅ **Standards**: OpenAPI 3.0 compliance for tool integration  
✅ **Maintenance**: Documentation stays in sync with implementation