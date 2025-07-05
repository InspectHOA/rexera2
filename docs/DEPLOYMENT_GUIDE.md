# 🚀 Rexera 2.0 Deployment Guide - Complete Vercel Setup

This guide covers deploying the Rexera monorepo to Vercel with **two separate projects**: Frontend (Next.js 15) and API (Express.js with tRPC).

## 📋 Prerequisites

- ✅ GitHub repository with your monorepo
- ✅ Vercel account
- ✅ Supabase project setup
- ✅ All third-party API keys ready (see Environment Variables section)

---

## 🏗️ Architecture Overview

```
rexera2/
├── frontend/     → Vercel Project 1 (Next.js 15 + tRPC Client)
├── api/          → Vercel Project 2 (Express.js + tRPC Router)
└── packages/     → Shared code (imported via workspace:*)
```

**Key Changes:**
- **Pure tRPC Architecture**: Complete migration from hybrid REST/tRPC to tRPC-only API
- **Next.js 15**: Updated from Next.js 14 with enhanced tRPC integration
- **Clean Express.js Backend**: All Next.js dependencies removed from API layer
- **Monorepo Structure**: PNPM workspaces with Turborepo for build orchestration
- **End-to-End Type Safety**: tRPC procedures with Zod validation schemas

---

## 🚀 Step-by-Step Deployment

### ✅ 1. Push Monorepo to GitHub

Ensure your complete monorepo is committed and pushed:

```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### ✅ 2. Deploy Frontend Project

**Go to Vercel Dashboard → New Project**

1. **Select your repository**
2. **Configure project:**
   - **Project Name:** `rexera-frontend`
   - **Root Directory:** `frontend`
   - **Framework:** Next.js (auto-detected)
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next` (default)
   - **Node.js Version:** 18.x (recommended for Next.js 15)

3. **Deploy** (don't configure env vars yet)

**Result:** You'll get a URL like `https://rexera-frontend.vercel.app`

### ✅ 3. Deploy API Project

**Go to Vercel Dashboard → New Project**

1. **Select the same repository**
2. **Configure project:**
   - **Project Name:** `rexera-api`
   - **Root Directory:** `api`
   - **Framework:** Other
   - **Build Command:** `npm run build`
   - **Output Directory:** Leave empty
   - **Node.js Version:** 18.x
   - **Functions:** Uses `@vercel/node@5.3.2` runtime

3. **Deploy** (don't configure env vars yet)

**Result:** You'll get a URL like `https://rexera-api.vercel.app`

**Note:** The API uses Express.js with tRPC router and is deployed as Vercel serverless functions.

---

## 🔐 Environment Variables Configuration

### 🎯 Frontend Environment Variables

**Go to:** Vercel Dashboard → `rexera-frontend` → Settings → Environment Variables

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://wmgidablmqotriwlefhq.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Production, Preview, Development |
| `NEXT_PUBLIC_API_URL` | `https://rexera-api.vercel.app` | Production, Preview |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | Development |
| `NEXT_PUBLIC_POSTHOG_KEY` | `your_posthog_key_here` | Production, Preview |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://app.posthog.com` | Production, Preview |
| `NEXTAUTH_SECRET` | `your_nextauth_secret_here` | Production, Preview, Development |
| `NEXTAUTH_URL` | `https://rexera-frontend.vercel.app` | Production |
| `NEXTAUTH_URL` | `https://rexera-frontend-git-branch.vercel.app` | Preview |
| `NEXTAUTH_URL` | `http://localhost:3000` | Development |

### 🎯 API Environment Variables

**Go to:** Vercel Dashboard → `rexera-api` → Settings → Environment Variables

| Variable | Value | Environment |
|----------|-------|-------------|
| `SUPABASE_URL` | `https://wmgidablmqotriwlefhq.supabase.co` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Production, Preview, Development |
| `SUPABASE_JWT_SECRET` | `AOlGk8U99pTocVqeitNlJbouX/ba2SHi4N2hGiC2EwapWaFgkiNOkIZbmeb2ehOgmnJlSoUxrXpZDmlNnMkBnw==` | Production, Preview, Development |
| `INTERNAL_API_KEY` | `rexera-internal-api-key-2024` | Production, Preview, Development |
| `NODE_ENV` | `production` | Production |
| `NODE_ENV` | `development` | Development |
| `ENCRYPTION_KEY` | `your_32_character_encryption_key_here` | Production, Preview, Development |
| `JWT_SECRET` | `your_jwt_secret_here` | Production, Preview, Development |
| `SENTRY_DSN` | `your_sentry_dsn_here` | Production, Preview |
| `TURBO_TOKEN` | `your_turbo_token_here` | Production, Preview, Development |
| `TURBO_TEAM` | `your_turbo_team_here` | Production, Preview, Development |

### 🔧 Third-Party Service Variables (Add to API project)

#### Email Services
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@rexera.com
SMTP_PASSWORD=your_app_password_here
FROM_EMAIL=noreply@rexera.com
SENDGRID_API_KEY=your_sendgrid_api_key_here
```

#### SMS/Phone Services
```env
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

#### Document Processing
```env
GOOGLE_CLOUD_PROJECT_ID=your_gcp_project_id_here
GOOGLE_CLOUD_PRIVATE_KEY_ID=your_gcp_private_key_id_here
GOOGLE_CLOUD_PRIVATE_KEY=your_gcp_private_key_here
GOOGLE_CLOUD_CLIENT_EMAIL=your_service_account@your_project.iam.gserviceaccount.com
GOOGLE_CLOUD_CLIENT_ID=your_gcp_client_id_here
```

#### Web Scraping
```env
BROWSERLESS_API_KEY=your_browserless_api_key_here
BROWSERLESS_URL=https://chrome.browserless.io
```

#### Financial Services
```env
STRIPE_PUBLIC_KEY=pk_live_your_stripe_public_key_here
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret_here
```

#### AI Services
```env
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

**Note:** All AI agent functionality is now integrated into the API layer via tRPC procedures.

---

## 🔄 Update Cross-Service URLs

After both projects are deployed, update the environment variables with the actual URLs:

### Frontend Project
```env
NEXT_PUBLIC_API_URL=https://rexera-api.vercel.app
```

**Important:** After updating this URL, redeploy the frontend project to pick up the new environment variable.

---

## 🛠️ Local Development Setup

Create these files for local development:

### `frontend/.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=https://wmgidablmqotriwlefhq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
```

### `api/.env.local`
```env
SUPABASE_URL=https://wmgidablmqotriwlefhq.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
INTERNAL_API_KEY=rexera-internal-api-key-2024
NODE_ENV=development
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_32_character_encryption_key_here
```

### Development Commands

Start both services locally:

```bash
# Terminal 1 - Start API server
cd api && npm run dev

# Terminal 2 - Start frontend
cd frontend && npm run dev
```

The services will be available at:
- **Frontend:** http://localhost:3000
- **API:** http://localhost:3001

---

## 🚀 Deployment Commands

### Using Vercel CLI (Optional)

Install Vercel CLI:
```bash
npm i -g vercel
```

Deploy individual projects:
```bash
# Deploy frontend
vercel --cwd frontend

# Deploy API
vercel --cwd api
```

### Using GitHub Integration (Recommended)

1. **Connect GitHub:** Link your Vercel projects to GitHub branches
2. **Auto-deploy:** Push to `main` branch triggers production deployment
3. **Preview deploys:** Push to feature branches creates preview deployments

### Using Turborepo for Build Orchestration

The monorepo uses Turborepo for efficient builds:

```bash
# Build all projects
npm run build

# Build specific project
npm run build --filter=frontend
npm run build --filter=api

# Development mode
npm run dev
```

---

## 🧪 Testing Your Deployment

### 1. Health Check Endpoints

Test each service:

```bash
# Frontend
curl https://rexera-frontend.vercel.app

# API Health
curl https://rexera-api.vercel.app/api/health
```

### 2. tRPC API Testing

Test tRPC procedures:

```bash
# Test workflows list
curl -X POST https://rexera-api.vercel.app/api/trpc/workflows.list \
  -H "Content-Type: application/json" \
  -d '{"json":{"page":1,"limit":10}}'

# Test tasks list
curl -X POST https://rexera-api.vercel.app/api/trpc/tasks.list \
  -H "Content-Type: application/json" \
  -d '{"json":{"page":1,"limit":10}}'

# Test health check via tRPC
curl -X POST https://rexera-api.vercel.app/api/trpc/health.check \
  -H "Content-Type: application/json" \
  -d '{"json":{}}'
```

### 3. Frontend → API Communication

Visit your frontend URL and check:
- ✅ Login functionality
- ✅ Dashboard loads
- ✅ tRPC calls work in browser dev tools
- ✅ Type-safe API communication
- ✅ Real-time updates (if using tRPC subscriptions)

### 4. Development Testing

For local development testing:

```bash
# Test local API health
curl http://localhost:3001/api/health

# Test local tRPC procedures
curl -X POST http://localhost:3001/api/trpc/workflows.list \
  -H "Content-Type: application/json" \
  -d '{"json":{"page":1,"limit":5}}'
```

---

## 🔧 Troubleshooting

### Common Issues

**1. CORS Errors**
- Check `NEXT_PUBLIC_API_URL` in frontend
- Verify API CORS configuration

**2. Environment Variables Not Loading**
- Ensure variables are set for correct environment (Production/Preview/Development)
- Redeploy after adding new variables

**3. Build Failures**
- Check build logs in Vercel dashboard
- Verify all dependencies are in `package.json`
- Ensure TypeScript types are correct

**4. Function Timeouts**
- Agents functions have 5-10 minute timeouts configured
- Check function logs for performance issues

### Debug Commands

```bash
# Check environment in deployed function
curl https://rexera-api.vercel.app/api/debug/env

# View function logs
vercel logs https://rexera-api.vercel.app
```

---

## 🎯 Production Checklist

Before going live:

- [ ] All environment variables configured
- [ ] Health checks passing
- [ ] Cross-service communication working
- [ ] Database migrations applied
- [ ] Monitoring/logging configured
- [ ] Error tracking (Sentry) setup
- [ ] Analytics (PostHog) configured
- [ ] Domain names configured (if using custom domains)
- [ ] SSL certificates active
- [ ] Rate limiting configured
- [ ] Backup strategy in place

---

## 🔄 CI/CD with GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build projects
        run: npm run build
          
      - name: Deploy Frontend
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.FRONTEND_PROJECT_ID }}
          working-directory: ./frontend
          
      - name: Deploy API
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.API_PROJECT_ID }}
          working-directory: ./api
```

### Required GitHub Secrets

Add these secrets to your GitHub repository:

- `VERCEL_TOKEN`: Your Vercel API token
- `ORG_ID`: Your Vercel organization ID
- `FRONTEND_PROJECT_ID`: Frontend project ID from Vercel
- `API_PROJECT_ID`: API project ID from Vercel

---

## 📊 Monitoring & Observability

### Vercel Analytics
- Enable in both project settings
- Monitor performance and usage

### Error Tracking
- Sentry configured for both services
- Real-time error monitoring

### Logging
- Vercel function logs
- Custom logging with structured output

### Health Monitoring
- Automated health checks every 5 minutes
- tRPC procedure monitoring
- Database connection monitoring
- Daily cleanup jobs

### Performance Monitoring
- Next.js 15 performance metrics
- tRPC procedure execution times
- Database query performance
- Real-time error tracking

---

## 🎉 You're Live!

Your Rexera system is now deployed with:

- **Frontend:** `https://rexera-frontend.vercel.app` (Next.js 15 + tRPC Client)
- **API:** `https://rexera-api.vercel.app` (Express.js + tRPC Router)

Both services are connected with end-to-end type safety and ready to handle real estate workflows! 🏠✨

### Key Benefits of This Architecture:
- **Type Safety**: End-to-end TypeScript with tRPC
- **Performance**: Next.js 15 optimizations and efficient API calls
- **Scalability**: Serverless deployment on Vercel
- **Developer Experience**: Hot reloading, type checking, and modern tooling
- **Maintainability**: Clean separation of concerns and monorepo structure