# 🚀 Rexera 2.0 Deployment Guide - Complete Vercel Setup

This guide covers deploying the Rexera monorepo to Vercel with **three separate projects**: Frontend, API, and Agents service.

## 📋 Prerequisites

- ✅ GitHub repository with your monorepo
- ✅ Vercel account
- ✅ Supabase project setup
- ✅ All third-party API keys ready (see Environment Variables section)

---

## 🏗️ Architecture Overview

```
rexera2/
├── frontend/     → Vercel Project 1 (Next.js App)
├── api/          → Vercel Project 2 (tRPC API)
├── agents/       → Vercel Project 3 (AI Agents Service)
└── packages/     → Shared code (imported via workspace:*)
```

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

3. **Deploy** (don't configure env vars yet)

**Result:** You'll get a URL like `https://rexera-api.vercel.app`

### ✅ 4. Deploy Agents Project

**Go to Vercel Dashboard → New Project**

1. **Select the same repository**
2. **Configure project:**
   - **Project Name:** `rexera-agents`
   - **Root Directory:** `agents`
   - **Framework:** Other
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

3. **Deploy** (don't configure env vars yet)

**Result:** You'll get a URL like `https://rexera-agents.vercel.app`

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
| `NEXT_PUBLIC_AGENTS_URL` | `https://rexera-agents.vercel.app` | Production, Preview |
| `NEXT_PUBLIC_AGENTS_URL` | `http://localhost:3002` | Development |
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
| `AGENTS_BASE_URL` | `https://rexera-agents.vercel.app` | Production, Preview |
| `AGENTS_BASE_URL` | `http://localhost:3002` | Development |
| `AGENTS_API_KEY` | `your_agents_api_key_here` | Production, Preview, Development |
| `ENCRYPTION_KEY` | `your_32_character_encryption_key_here` | Production, Preview, Development |
| `JWT_SECRET` | `your_jwt_secret_here` | Production, Preview, Development |
| `SENTRY_DSN` | `your_sentry_dsn_here` | Production, Preview |

### 🎯 Agents Environment Variables

**Go to:** Vercel Dashboard → `rexera-agents` → Settings → Environment Variables

| Variable | Value | Environment |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Production |
| `NODE_ENV` | `development` | Development |
| `SUPABASE_URL` | `https://wmgidablmqotriwlefhq.supabase.co` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Production, Preview, Development |
| `INTERNAL_API_KEY` | `rexera-internal-api-key-2024` | Production, Preview, Development |
| `TURBO_TOKEN` | `your_turbo_token_here` | Production, Preview, Development |
| `TURBO_TEAM` | `your_turbo_team_here` | Production, Preview, Development |

### 🔧 Third-Party Service Variables (Add to relevant projects)

#### Email Services (API + Agents)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@rexera.com
SMTP_PASSWORD=your_app_password_here
FROM_EMAIL=noreply@rexera.com
SENDGRID_API_KEY=your_sendgrid_api_key_here
```

#### SMS/Phone Services (Agents)
```env
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

#### Document Processing (Agents)
```env
GOOGLE_CLOUD_PROJECT_ID=your_gcp_project_id_here
GOOGLE_CLOUD_PRIVATE_KEY_ID=your_gcp_private_key_id_here
GOOGLE_CLOUD_PRIVATE_KEY=your_gcp_private_key_here
GOOGLE_CLOUD_CLIENT_EMAIL=your_service_account@your_project.iam.gserviceaccount.com
GOOGLE_CLOUD_CLIENT_ID=your_gcp_client_id_here
```

#### Web Scraping (Agents)
```env
BROWSERLESS_API_KEY=your_browserless_api_key_here
BROWSERLESS_URL=https://chrome.browserless.io
```

#### Financial Services (API + Agents)
```env
STRIPE_PUBLIC_KEY=pk_live_your_stripe_public_key_here
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret_here
```

---

## 🔄 Update Cross-Service URLs

After all three projects are deployed, update the environment variables with the actual URLs:

### Frontend Project
```env
NEXT_PUBLIC_API_URL=https://rexera-api.vercel.app
NEXT_PUBLIC_AGENTS_URL=https://rexera-agents.vercel.app
```

### API Project
```env
AGENTS_BASE_URL=https://rexera-agents.vercel.app
```

**Important:** After updating these URLs, redeploy all projects to pick up the new environment variables.

---

## 🛠️ Local Development Setup

Create these files for local development:

### `frontend/.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=https://wmgidablmqotriwlefhq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_AGENTS_URL=http://localhost:3002
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
```

### `api/.env.local`
```env
SUPABASE_URL=https://wmgidablmqotriwlefhq.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
INTERNAL_API_KEY=rexera-internal-api-key-2024
AGENTS_BASE_URL=http://localhost:3002
NODE_ENV=development
```

### `agents/.env.local`
```env
NODE_ENV=development
SUPABASE_URL=https://wmgidablmqotriwlefhq.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
INTERNAL_API_KEY=rexera-internal-api-key-2024
```

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

# Deploy agents
vercel --cwd agents
```

### Using GitHub Integration (Recommended)

1. **Connect GitHub:** Link your Vercel projects to GitHub branches
2. **Auto-deploy:** Push to `main` branch triggers production deployment
3. **Preview deploys:** Push to feature branches creates preview deployments

---

## 🧪 Testing Your Deployment

### 1. Health Check Endpoints

Test each service:

```bash
# Frontend
curl https://rexera-frontend.vercel.app

# API Health
curl https://rexera-api.vercel.app/api/health

# Agents Health
curl https://rexera-agents.vercel.app/api/agents/health
```

### 2. Cross-Service Communication

Test API → Agents communication:
```bash
curl -X POST https://rexera-api.vercel.app/api/workflows \
  -H "Content-Type: application/json" \
  -d '{"type": "test", "data": {}}'
```

### 3. Frontend → API Communication

Visit your frontend URL and check:
- ✅ Login functionality
- ✅ Dashboard loads
- ✅ API calls work in browser dev tools

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
      - uses: actions/checkout@v2
      
      - name: Deploy Frontend
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.FRONTEND_PROJECT_ID }}
          working-directory: ./frontend
          
      - name: Deploy API
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.API_PROJECT_ID }}
          working-directory: ./api
          
      - name: Deploy Agents
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.AGENTS_PROJECT_ID }}
          working-directory: ./agents
```

---

## 📊 Monitoring & Observability

### Vercel Analytics
- Enable in each project's settings
- Monitor performance and usage

### Error Tracking
- Sentry configured for all three services
- Real-time error monitoring

### Logging
- Vercel function logs
- Custom logging with LogTail

### Health Monitoring
- Automated health checks every 5 minutes
- Agent monitoring every 2 minutes
- Daily cleanup jobs

---

## 🎉 You're Live!

Your Rexera system is now deployed with:

- **Frontend:** `https://rexera-frontend.vercel.app`
- **API:** `https://rexera-api.vercel.app`
- **Agents:** `https://rexera-agents.vercel.app`

All three services are connected and ready to handle real estate workflows! 🏠✨