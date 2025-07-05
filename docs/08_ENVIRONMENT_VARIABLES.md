# 08_ENVIRONMENT_VARIABLES.md

<!-- 
This document provides comprehensive environment variable configuration for Rexera 2.0, including development, staging, and production environments across all services.
-->

## Environment Configuration Overview

Rexera 2.0 requires environment variables across **multiple services** and **deployment environments**:

- **Next.js 15 Frontend** - Client and server-side configuration with tRPC client
- **Express.js API** - Hybrid tRPC + REST API with integrated AI agents
- **Supabase Database** - Authentication and database connection
- **External Services** - Google OAuth, monitoring, and analytics

### Environment Files Structure

```bash
rexera2/
├── frontend/
│   ├── .env.example          # Frontend template
│   ├── .env.local           # Local development (gitignored)
│   └── .env.production      # Production environment
├── api/
│   ├── .env.example          # API template
│   ├── .env.local           # Local development (gitignored)
│   └── .env.production      # Production environment
└── packages/                 # Shared configuration
```

## Core Service Configuration

### Frontend Environment Variables

```bash
# Frontend (Next.js 15) Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_API_URL=https://rexera-api.vercel.app
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=https://rexera-frontend.vercel.app
```

**Security Notes:**
- `NEXT_PUBLIC_*` variables are exposed to the client
- `NEXTAUTH_SECRET` is server-side only for authentication

### API Environment Variables

```bash
# API (Express.js + Hybrid tRPC + REST) Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your-jwt-secret-key
INTERNAL_API_KEY=rexera-internal-api-key-2024
NODE_ENV=production
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_32_character_encryption_key_here

# Database Connection (for direct access)
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
```

**Security Notes:**
- All API variables are server-side only
- `SUPABASE_SERVICE_ROLE_KEY` provides admin database access
- `INTERNAL_API_KEY` for internal service communication

### AI Agent Integration

```bash
# AI Services (integrated into API layer)
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
AGENT_TIMEOUT_MS=30000
```

**Agent Integration:**
All AI agents are integrated into the API layer via tRPC procedures, with REST endpoints available for external systems:
- **Nina** 🔍 - Research and data gathering (`agents.nina.*`)
- **Mia** 📧 - Email communication (`agents.mia.*`)
- **Florian** 📞 - Phone communication (`agents.florian.*`)
- **Rex** 🌐 - Web portal automation (`agents.rex.*`)
- **Iris** 📄 - Document processing (`agents.iris.*`)
- **Ria** 👩‍💼 - Client relationship management (`agents.ria.*`)
- **Kosha** 💰 - Financial operations (`agents.kosha.*`)
- **Cassy** ✅ - Quality assurance (`agents.cassy.*`)
- **Max** 🤖 - IVR system interaction (`agents.max.*`)
- **Corey** 🏢 - HOA specialist (`agents.corey.*`)

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
NEXT_PUBLIC_SITE_URL=https://rexera-frontend.vercel.app
NEXT_PUBLIC_API_URL=https://rexera-api.vercel.app

# Domain Configuration (if using custom domains)
NEXT_PUBLIC_DOMAIN=rexera.com
NEXT_PUBLIC_SUBDOMAIN_APP=app
NEXT_PUBLIC_SUBDOMAIN_API=api
```

## Feature Flags & Configuration

### Application Features

```bash
# Feature Flags
NEXT_PUBLIC_ENABLE_REAL_TIME=true
NEXT_PUBLIC_ENABLE_BETA_FEATURES=false
NEXT_PUBLIC_ENABLE_DEBUG_MODE=false
NEXT_PUBLIC_ENABLE_ANALYTICS=true

# Performance Configuration
NEXT_PUBLIC_MAX_CONCURRENT_WORKFLOWS=100
NEXT_PUBLIC_MAX_FILE_SIZE_MB=50
NEXT_PUBLIC_REQUEST_TIMEOUT_MS=30000
NEXT_PUBLIC_TRPC_BATCH_SIZE=50

# UI Configuration
NEXT_PUBLIC_DEFAULT_THEME=light
NEXT_PUBLIC_ENABLE_DARK_MODE=true
NEXT_PUBLIC_PAGINATION_SIZE=20

# tRPC Configuration
NEXT_PUBLIC_TRPC_BATCH_ENABLED=true
NEXT_PUBLIC_TRPC_SUBSCRIPTION_ENABLED=true
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

#### Frontend (.env.local)
```bash
NODE_ENV=development
NEXT_PUBLIC_APP_ENV=development

# Local API Connection
NEXT_PUBLIC_API_URL=http://localhost:3001

# Supabase (can use local or remote)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# Debug Configuration
NEXT_PUBLIC_ENABLE_DEBUG_MODE=true
NEXT_PUBLIC_LOG_LEVEL=debug
```

#### API (.env.local)
```bash
NODE_ENV=development

# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret

# Internal Configuration
INTERNAL_API_KEY=rexera-internal-api-key-2024
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_32_character_encryption_key_here

# AI Services
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
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

#### Frontend Production
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production

# Production Services
NEXT_PUBLIC_SUPABASE_URL=https://rexera-prod.supabase.co
NEXT_PUBLIC_API_URL=https://rexera-api.vercel.app
NEXT_PUBLIC_SITE_URL=https://rexera-frontend.vercel.app

# Authentication
NEXTAUTH_SECRET=your_production_nextauth_secret
NEXTAUTH_URL=https://rexera-frontend.vercel.app

# Production Configuration
NEXT_PUBLIC_ENABLE_DEBUG_MODE=false
NEXT_PUBLIC_ENABLE_BETA_FEATURES=false
NEXT_PUBLIC_MAX_CONCURRENT_WORKFLOWS=100
```

#### API Production
```bash
NODE_ENV=production

# Database
SUPABASE_URL=https://rexera-prod.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
SUPABASE_JWT_SECRET=your_production_jwt_secret

# Security
INTERNAL_API_KEY=your_production_internal_api_key
JWT_SECRET=your_production_jwt_secret
ENCRYPTION_KEY=your_production_encryption_key

# AI Services
OPENAI_API_KEY=your_production_openai_key
ANTHROPIC_API_KEY=your_production_anthropic_key

# Monitoring
SENTRY_DSN=your_sentry_dsn
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

### Environment File Templates

#### Frontend (.env.example)

```bash
# =============================================================================
# FRONTEND ENVIRONMENT VARIABLES
# =============================================================================

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# API Configuration
NEXT_PUBLIC_API_URL=https://rexera-api.vercel.app

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=https://rexera-frontend.vercel.app

# Application Configuration
NEXT_PUBLIC_APP_ENV=production
NODE_ENV=production

# Feature Flags
NEXT_PUBLIC_ENABLE_REAL_TIME=true
NEXT_PUBLIC_ENABLE_BETA_FEATURES=false
NEXT_PUBLIC_ENABLE_DEBUG_MODE=false
NEXT_PUBLIC_MAX_CONCURRENT_WORKFLOWS=100

# tRPC Configuration
NEXT_PUBLIC_TRPC_BATCH_ENABLED=true
NEXT_PUBLIC_TRPC_SUBSCRIPTION_ENABLED=true

# Analytics & Monitoring (Optional)
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
```

#### API (.env.example)

```bash
# =============================================================================
# API ENVIRONMENT VARIABLES
# =============================================================================

# Database Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret

# Security
INTERNAL_API_KEY=rexera-internal-api-key-2024
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_32_character_encryption_key_here

# Application Configuration
NODE_ENV=production

# AI Services
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# External Services (Optional)
SENTRY_DSN=your_sentry_dsn
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@rexera.com
SMTP_PASSWORD=your_app_password
FROM_EMAIL=noreply@rexera.com

# File Storage (Optional)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET=rexera-documents

# Build System (Optional)
TURBO_TOKEN=your_turbo_token_here
TURBO_TEAM=your_turbo_team_here
```

---

*This environment configuration ensures secure, scalable deployment across all Rexera 2.0 services with proper separation of concerns between public and private variables.*