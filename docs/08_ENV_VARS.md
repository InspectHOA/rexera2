# 08_ENV_VARS.md

<!-- 
This document provides comprehensive environment variable configuration for Rexera 2.0, including development, staging, and production environments across all services.
-->

## Environment Configuration Overview

Rexera 2.0 requires environment variables across **multiple services** and **deployment environments**:

- **Next.js Frontend** - Client and server-side configuration
- **Supabase Database** - Authentication and database connection
- **n8n Workflows** - Agent endpoints and webhook configuration
- **AI Agents** - Service URLs and API keys
- **External Services** - Google OAuth, monitoring, and analytics

### Environment Files Structure

```bash
rexera2-frontend/
├── .env.example          # Template with all variables
├── .env.local           # Local development (gitignored)
├── .env.development     # Development environment
├── .env.staging         # Staging environment  
├── .env.production      # Production environment (secure vault)
└── .env.test           # Testing environment
```

## Core Service Configuration

### Supabase Database

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your-jwt-secret-key

# Database Connection (for direct access)
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
```

**Security Notes:**
- `NEXT_PUBLIC_*` variables are exposed to the client
- `SUPABASE_SERVICE_ROLE_KEY` is server-side only
- `SUPABASE_JWT_SECRET` used for token verification

### n8n Workflow Engine

```bash
# n8n Integration
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://workflows.rexera.com/webhook
N8N_API_KEY=your_n8n_enterprise_api_key
N8N_INSTANCE_URL=https://rexera.app.n8n.cloud

# Webhook Endpoints
N8N_PAYOFF_WEBHOOK=/webhook/payoff
N8N_HOA_WEBHOOK=/webhook/hoa
N8N_LIEN_WEBHOOK=/webhook/lien
```

**Usage:**
- Webhook URLs for triggering workflows
- API key for n8n management operations
- Instance URL for workflow administration

### AI Agent Endpoints

```bash
# AI Agent URLs (Production)
NEXT_PUBLIC_NINA_AGENT_URL=https://api.rexera-agents.com/nina
NEXT_PUBLIC_MIA_AGENT_URL=https://api.rexera-agents.com/mia
NEXT_PUBLIC_FLORIAN_AGENT_URL=https://api.rexera-agents.com/florian
NEXT_PUBLIC_REX_AGENT_URL=https://api.rexera-agents.com/rex
NEXT_PUBLIC_IRIS_AGENT_URL=https://api.rexera-agents.com/iris
NEXT_PUBLIC_RIA_AGENT_URL=https://api.rexera-agents.com/ria
NEXT_PUBLIC_KOSHA_AGENT_URL=https://api.rexera-agents.com/kosha
NEXT_PUBLIC_CASSY_AGENT_URL=https://api.rexera-agents.com/cassy
NEXT_PUBLIC_MAX_AGENT_URL=https://api.rexera-agents.com/max
NEXT_PUBLIC_COREY_AGENT_URL=https://api.rexera-agents.com/corey

# Agent Authentication
AGENT_API_KEY=your_agent_api_key
AGENT_TIMEOUT_MS=30000
```

**Agent Descriptions:**
- **Nina** 🔍 - Research and data gathering
- **Mia** 📧 - Email communication
- **Florian** 📞 - Phone communication
- **Rex** 🌐 - Web portal automation
- **Iris** 📄 - Document processing
- **Ria** 👩‍💼 - Client relationship management
- **Kosha** 💰 - Financial operations
- **Cassy** ✅ - Quality assurance
- **Max** 🤖 - IVR system interaction
- **Corey** 🏢 - HOA specialist

## Authentication & Security

### Google OAuth Configuration

```bash
# Google OAuth (for Supabase Auth)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=https://app.rexera.com/auth/callback

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_minimum_32_characters
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d
```

### Application URLs

```bash
# Site Configuration
NEXT_PUBLIC_SITE_URL=https://app.rexera.com
NEXT_PUBLIC_API_URL=https://app.rexera.com/api
NEXT_PUBLIC_WS_URL=wss://app.rexera.com/ws

# Domain Configuration
NEXT_PUBLIC_DOMAIN=rexera.com
NEXT_PUBLIC_SUBDOMAIN_APP=app
NEXT_PUBLIC_SUBDOMAIN_WORKFLOWS=workflows
NEXT_PUBLIC_SUBDOMAIN_DB=db
```

## Feature Flags & Configuration

### Application Features

```bash
# Feature Flags
NEXT_PUBLIC_ENABLE_REAL_TIME=true
NEXT_PUBLIC_ENABLE_BETA_FEATURES=false
NEXT_PUBLIC_ENABLE_DEBUG_MODE=false
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_UNIFIED_API=true

# Performance Configuration
NEXT_PUBLIC_MAX_CONCURRENT_WORKFLOWS=100
NEXT_PUBLIC_MAX_FILE_SIZE_MB=50
NEXT_PUBLIC_REQUEST_TIMEOUT_MS=30000
NEXT_PUBLIC_WEBSOCKET_RECONNECT_ATTEMPTS=5
NEXT_PUBLIC_API_BATCH_SIZE=50

# UI Configuration
NEXT_PUBLIC_DEFAULT_THEME=light
NEXT_PUBLIC_ENABLE_DARK_MODE=true
NEXT_PUBLIC_PAGINATION_SIZE=20
```

### Business Configuration

```bash
# Business Hours (for SLA calculations)
BUSINESS_TIMEZONE=America/New_York
BUSINESS_HOURS_START=09:00
BUSINESS_HOURS_END=17:00
BUSINESS_DAYS=1,2,3,4,5  # Monday-Friday

# SLA Configuration
DEFAULT_SLA_HOURS=24
CRITICAL_SLA_HOURS=4
HIGH_PRIORITY_SLA_HOURS=8
NORMAL_PRIORITY_SLA_HOURS=24
```

## External Services

### Monitoring & Analytics

```bash
# Analytics
NEXT_PUBLIC_ANALYTICS_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX

# Error Monitoring
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
SENTRY_ORG=rexera
SENTRY_PROJECT=rexera2-frontend
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production

# Performance Monitoring
NEXT_PUBLIC_VERCEL_ANALYTICS=true
VERCEL_ANALYTICS_ID=your_vercel_analytics_id
```

### Email & Communication

```bash
# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@rexera.com
SMTP_PASSWORD=your_app_password
FROM_EMAIL=noreply@rexera.com

# Slack Integration (for HIL alerts)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
SLACK_CHANNEL=#rexera-alerts
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
```

### File Storage

```bash
# AWS S3 (for document storage)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=rexera-documents
AWS_S3_PUBLIC_BUCKET=rexera-public-assets

# Cloudinary (for image processing)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Environment-Specific Configurations

### Development Environment

```bash
# .env.development
NODE_ENV=development
NEXT_PUBLIC_APP_ENV=development

# Local Services
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_N8N_WEBHOOK_URL=http://localhost:5678/webhook

# Agent URLs (Local/Staging)
NEXT_PUBLIC_NINA_AGENT_URL=http://localhost:3001/nina
NEXT_PUBLIC_MIA_AGENT_URL=http://localhost:3002/mia
# ... other agents

# Debug Configuration
NEXT_PUBLIC_ENABLE_DEBUG_MODE=true
NEXT_PUBLIC_LOG_LEVEL=debug
NEXT_PUBLIC_ENABLE_MOCK_AGENTS=true
NEXT_PUBLIC_ENABLE_UNIFIED_API_MODE=true
```

### Staging Environment

```bash
# .env.staging
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=staging

# Staging Services
NEXT_PUBLIC_SUPABASE_URL=https://staging-project.supabase.co
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://staging-workflows.rexera.com/webhook
NEXT_PUBLIC_SITE_URL=https://staging.rexera.com

# Staging Agent URLs
NEXT_PUBLIC_NINA_AGENT_URL=https://staging-api.rexera-agents.com/nina
# ... other staging agents

# Staging Configuration
NEXT_PUBLIC_ENABLE_BETA_FEATURES=true
NEXT_PUBLIC_MAX_CONCURRENT_WORKFLOWS=10
```

### Production Environment

```bash
# .env.production
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production

# Production Services
NEXT_PUBLIC_SUPABASE_URL=https://rexera-prod.supabase.co
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://workflows.rexera.com/webhook
NEXT_PUBLIC_SITE_URL=https://app.rexera.com

# Production Agent URLs
NEXT_PUBLIC_NINA_AGENT_URL=https://api.rexera-agents.com/nina
# ... other production agents

# Production Configuration
NEXT_PUBLIC_ENABLE_DEBUG_MODE=false
NEXT_PUBLIC_ENABLE_BETA_FEATURES=false
NEXT_PUBLIC_MAX_CONCURRENT_WORKFLOWS=100
```

## Security Best Practices

### Environment Variable Security

```bash
# Secure Storage (use environment-specific vaults)
# Development: .env.local (gitignored)
# Staging: Vercel environment variables
# Production: Vercel environment variables + secret management

# Never commit these to Git:
.env.local
.env.production
.env.staging
*.key
*.pem
```

### Variable Validation

```typescript
// lib/config/env-validation.ts
import { z } from 'zod';

const envSchema = z.object({
  // Required variables
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  
  // Optional with defaults
  NEXT_PUBLIC_MAX_CONCURRENT_WORKFLOWS: z.coerce.number().default(100),
  NEXT_PUBLIC_REQUEST_TIMEOUT_MS: z.coerce.number().default(30000),
  
  // Environment-specific
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  NEXT_PUBLIC_APP_ENV: z.enum(['development', 'staging', 'production']),
});

export const env = envSchema.parse(process.env);

// Validate on application startup
export function validateEnvironment() {
  try {
    envSchema.parse(process.env);
    console.log('✅ Environment variables validated');
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    process.exit(1);
  }
}
```

### Runtime Configuration

```typescript
// lib/config/runtime-config.ts
export const config = {
  // Public configuration (safe for client)
  public: {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL!,
    environment: process.env.NEXT_PUBLIC_APP_ENV!,
    
    // Agent URLs
    agents: {
      nina: process.env.NEXT_PUBLIC_NINA_AGENT_URL!,
      mia: process.env.NEXT_PUBLIC_MIA_AGENT_URL!,
      florian: process.env.NEXT_PUBLIC_FLORIAN_AGENT_URL!,
      rex: process.env.NEXT_PUBLIC_REX_AGENT_URL!,
      iris: process.env.NEXT_PUBLIC_IRIS_AGENT_URL!,
      ria: process.env.NEXT_PUBLIC_RIA_AGENT_URL!,
      kosha: process.env.NEXT_PUBLIC_KOSHA_AGENT_URL!,
      cassy: process.env.NEXT_PUBLIC_CASSY_AGENT_URL!,
      max: process.env.NEXT_PUBLIC_MAX_AGENT_URL!,
      corey: process.env.NEXT_PUBLIC_COREY_AGENT_URL!,
    },
    
    // Feature flags
    features: {
      realTime: process.env.NEXT_PUBLIC_ENABLE_REAL_TIME === 'true',
      betaFeatures: process.env.NEXT_PUBLIC_ENABLE_BETA_FEATURES === 'true',
      debugMode: process.env.NEXT_PUBLIC_ENABLE_DEBUG_MODE === 'true',
      analytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
    },
  },
  
  // Private configuration (server-side only)
  private: {
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    jwtSecret: process.env.JWT_SECRET!,
    agentApiKey: process.env.AGENT_API_KEY!,
    n8nApiKey: process.env.N8N_API_KEY!,
    
    // External services
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    sentryDsn: process.env.SENTRY_DSN,
    slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
    
    // AWS credentials
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
};

// Type-safe environment access
export type PublicConfig = typeof config.public;
export type PrivateConfig = typeof config.private;
```

## Deployment Configuration

### Vercel Environment Variables

```bash
# Set via Vercel CLI or Dashboard
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add JWT_SECRET production

# Bulk import from file
vercel env pull .env.vercel.local
```

### Docker Environment

```dockerfile
# Dockerfile environment handling
FROM node:18-alpine

# Build-time environment variables
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

# Runtime environment variables
ENV NODE_ENV=production
ENV NEXT_PUBLIC_APP_ENV=production

# Copy environment files
COPY .env.production .env.production
COPY .env.example .env.example

# Build application with environment variables
RUN npm run build
```

### Environment File Template

```bash
# .env.example - Template for all environments
# Copy to .env.local and fill in actual values

# =============================================================================
# CORE SERVICES
# =============================================================================

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret

# n8n Workflow Engine
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://workflows.rexera.com/webhook
N8N_API_KEY=your_n8n_api_key

# =============================================================================
# AI AGENTS
# =============================================================================

NEXT_PUBLIC_NINA_AGENT_URL=https://api.rexera-agents.com/nina
NEXT_PUBLIC_MIA_AGENT_URL=https://api.rexera-agents.com/mia
NEXT_PUBLIC_FLORIAN_AGENT_URL=https://api.rexera-agents.com/florian
NEXT_PUBLIC_REX_AGENT_URL=https://api.rexera-agents.com/rex
NEXT_PUBLIC_IRIS_AGENT_URL=https://api.rexera-agents.com/iris
NEXT_PUBLIC_RIA_AGENT_URL=https://api.rexera-agents.com/ria
NEXT_PUBLIC_KOSHA_AGENT_URL=https://api.rexera-agents.com/kosha
NEXT_PUBLIC_CASSY_AGENT_URL=https://api.rexera-agents.com/cassy
NEXT_PUBLIC_MAX_AGENT_URL=https://api.rexera-agents.com/max
NEXT_PUBLIC_COREY_AGENT_URL=https://api.rexera-agents.com/corey
AGENT_API_KEY=your_agent_api_key

# =============================================================================
# AUTHENTICATION
# =============================================================================

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
JWT_SECRET=your_jwt_secret_minimum_32_characters

# =============================================================================
# APPLICATION CONFIGURATION
# =============================================================================

NEXT_PUBLIC_SITE_URL=https://app.rexera.com
NEXT_PUBLIC_APP_ENV=production
NODE_ENV=production

# Feature Flags
NEXT_PUBLIC_ENABLE_REAL_TIME=true
NEXT_PUBLIC_ENABLE_BETA_FEATURES=false
NEXT_PUBLIC_ENABLE_DEBUG_MODE=false
NEXT_PUBLIC_MAX_CONCURRENT_WORKFLOWS=100

# =============================================================================
# EXTERNAL SERVICES (Optional)
# =============================================================================

# Analytics & Monitoring
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
SENTRY_DSN=your_sentry_dsn

# Communication
SLACK_WEBHOOK_URL=your_slack_webhook_url
FROM_EMAIL=noreply@rexera.com

# File Storage
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET=rexera-documents
```

---

*This environment configuration ensures secure, scalable deployment across all Rexera 2.0 services with proper separation of concerns between public and private variables.*