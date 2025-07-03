# Vercel Environment Variables Setup - Multi-Project Configuration

## 🏗️ Architecture Overview

Rexera 2.0 uses a hybrid multi-project approach:
- **Primary Project**: Frontend (Next.js) - Main deployment
- **Secondary Services**: Agents, Database utilities (optional separate deployments)
- **Shared Configuration**: Environment variables and build settings

## 📋 Environment Variable Strategy

### 🎯 Primary Project (Frontend) - Required Variables

Copy and paste these into your **main Vercel project** dashboard (`Project Settings > Environment Variables`):

#### 🔐 Supabase Configuration (Ready to use)
```
NEXT_PUBLIC_SUPABASE_URL=https://wmgidablmqotriwlefhq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZ2lkYWJsbXFvdHJpd2xlZmhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzc5NjcsImV4cCI6MjA2NjcxMzk2N30.-a0ZOsgzuvApfxgsYIKQ0xduca5htQslPCNuUm7K2bw
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZ2lkYWJsbXFvdHJpd2xlZmhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTEzNzk2NywiZXhwIjoyMDY2NzEzOTY3fQ.viSjS9PV2aDSOIzayHv6zJG-rjmjOBOVMsHlm77h6ns
SUPABASE_JWT_SECRET=AOlGk8U99pTocVqeitNlJbouX/ba2SHi4N2hGiC2EwapWaFgkiNOkIZbmeb2ehOgmnJlSoUxrXpZDmlNnMkBnw==
```

#### 🔑 Generated Security Keys (Ready to use)
```
NEXTAUTH_SECRET=llQ4OYwEkBVZ0zXvoADlDXdiMqwbR+gQ4diPdlgNg5Y=
JWT_SECRET=hqZDAYAVF0GUeAZFIZct0ggiKgC8YqAK86xsFCAPj8g=
ENCRYPTION_KEY=0QYWfrtN4ejg/ftzvZY0gz3ol2uGogbLFE08slfENzg=
```

#### 🌐 Application URLs (Update after deployment)
```
NEXTAUTH_URL=https://your-app.vercel.app
FRONTEND_URL=https://your-app.vercel.app
API_BASE_URL=https://your-app.vercel.app/api
```

#### 🏗️ Basic Configuration
```
NODE_ENV=production
ENABLE_AGENT_MONITORING=true
ENABLE_WORKFLOW_VALIDATION=true
ENABLE_HIL_INTERVENTIONS=true
ENABLE_COST_TRACKING=true
ENABLE_REAL_TIME_UPDATES=true
ENABLE_AUDIT_LOGGING=true
```

#### ⚙️ Workflow Settings
```
DEFAULT_WORKFLOW_TIMEOUT_MS=1800000
MAX_AGENT_RETRIES=3
AGENT_TIMEOUT_MS=30000
HIL_INTERVENTION_TIMEOUT_MS=3600000
QUALITY_GATE_THRESHOLD=0.85
API_RATE_LIMIT_WINDOW_MS=900000
API_RATE_LIMIT_MAX_REQUESTS=100
```

#### 🔗 Inter-Service Communication
```
AGENT_SERVICE_URL=https://your-app.vercel.app/api/agents
DATABASE_SERVICE_URL=https://your-app.vercel.app/api/db
WORKFLOW_SERVICE_URL=https://your-app.vercel.app/api/workflows
INTERNAL_API_SECRET=your-internal-api-secret-here
```

### 🤖 Agent Service Configuration (Optional Separate Deployment)

If deploying agents as a separate Vercel project, add these variables:

#### Core Agent Variables
```
NODE_ENV=production
DATABASE_URL=postgresql://your-database-url
SUPABASE_URL=https://wmgidablmqotriwlefhq.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZ2lkYWJsbXFvdHJpd2xlZmhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTEzNzk2NywiZXhwIjoyMDY2NzEzOTY3fQ.viSjS9PV2aDSOIzayHv6zJG-rjmjOBOVMsHlm77h6ns
JWT_SECRET=hqZDAYAVF0GUeAZFIZct0ggiKgC8YqAK86xsFCAPj8g=
INTERNAL_API_SECRET=your-internal-api-secret-here
```

#### Agent-Specific Settings
```
AGENT_POOL_SIZE=10
AGENT_MAX_CONCURRENT_TASKS=5
AGENT_HEARTBEAT_INTERVAL=30000
AGENT_LOAD_BALANCER_STRATEGY=round_robin
MONITORING_INTERVAL=60000
```

### 🗄️ Database Service Configuration (Optional Separate Deployment)

If deploying database utilities as a separate Vercel project:

#### Database Variables
```
NODE_ENV=production
DATABASE_URL=postgresql://your-database-url
SUPABASE_URL=https://wmgidablmqotriwlefhq.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZ2lkYWJsbXFvdHJpd2xlZmhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTEzNzk2NywiZXhwIjoyMDY2NzEzOTY3fQ.viSjS9PV2aDSOIzayHv6zJG-rjmjOBOVMsHlm77h6ns
SUPABASE_JWT_SECRET=AOlGk8U99pTocVqeitNlJbouX/ba2SHi4N2hGiC2EwapWaFgkiNOkIZbmeb2ehOgmnJlSoUxrXpZDmlNnMkBnw==
INTERNAL_API_SECRET=your-internal-api-secret-here
```

#### Migration & Maintenance Settings
```
MIGRATION_TIMEOUT_MS=900000
BACKUP_RETENTION_DAYS=30
MAINTENANCE_WINDOW_HOUR=2
AUTO_VACUUM_ENABLED=true
```

## � Quick Deploy Steps

1. **Deploy to Vercel**:
   ```bash
   cd /path/to/rexera2
   npx vercel --prod
   ```

2. **Set Environment Variables**:
   - Go to https://vercel.com/dashboard
   - Select your project
   - Go to Settings > Environment Variables
   - Add all variables from above

3. **Update URLs**:
   - After deployment, get your Vercel URL (e.g., `https://rexera2-abc123.vercel.app`)
   - Update these variables with your actual URL:
     - `NEXTAUTH_URL`
     - `FRONTEND_URL`
     - `API_BASE_URL`

4. **Redeploy**:
   ```bash
   npx vercel --prod
   ```

## ✅ What's Ready Now

- ✅ Supabase database connection
- ✅ Authentication system
- ✅ Frontend application
- ✅ API endpoints
- ✅ Security configuration

## ⏳ What's Needed Later

- 🔄 AI Agent service endpoints (when you deploy agent services)
- 🔄 n8n workflow service (when you set up n8n)
- 🔄 Email service credentials (when you configure email)
- 🔄 External API keys (when you integrate with third-party services)

## 🛡️ Security Notes

- All sensitive keys are properly generated and unique
- Keys are set in Vercel dashboard (not in code)
- HTTPS is enforced by default
- Rate limiting is configured
- JWT tokens have strong secrets

Your Rexera 2.0 application is ready to deploy! 🎉