# Rexera 2.0 Deployment Guide

## Environment Setup

### 1. Vercel Environment Variables

Set these in your Vercel dashboard (`Settings > Environment Variables`):

#### Production Environment
```bash
# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=https://wmgidablmqotriwlefhq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZ2lkYWJsbXFvdHJpd2xlZmhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzc5NjcsImV4cCI6MjA2NjcxMzk2N30.-a0ZOsgzuvApfxgsYIKQ0xduca5htQslPCNuUm7K2bw

# Required Secrets (get from Supabase dashboard)
SUPABASE_SERVICE_ROLE_KEY=[Get from Supabase > Settings > API]
SUPABASE_JWT_SECRET=[Get from Supabase > Settings > API]

# Authentication
NEXTAUTH_SECRET=[Generate: openssl rand -base64 32]
NEXTAUTH_URL=https://your-domain.vercel.app

# AI Agents (when you set up agent services)
AGENTS_API_KEY=[Your agents API key]
AGENTS_BASE_URL=https://api.rexera-agents.com

# n8n Workflows (when you set up n8n)
N8N_API_KEY=[Your n8n API key]
N8N_BASE_URL=https://workflows.rexera.com

# Security
JWT_SECRET=[Generate: openssl rand -base64 32]
ENCRYPTION_KEY=[Generate: openssl rand -base64 32]
```

### 2. Quick Deploy to Vercel

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy from project root
cd /path/to/rexera2
vercel --prod

# 4. Set environment variables in Vercel dashboard
# Go to https://vercel.com/dashboard
# Select your project > Settings > Environment Variables
# Add all the variables from .env.production
```

### 3. Local Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up database (if needed)
cd database
npm run migrate
npm run seed

# 3. Start development server
cd ../frontend
npm run dev

# 4. Start agent services (in separate terminals)
cd ../agents
npm run dev

# 5. Start workflow services
cd ../workflows
npm run dev
```

## Service URLs

### Development
- Frontend: http://localhost:3000
- Agents API: http://localhost:3001
- n8n Workflows: http://localhost:5678

### Production (After deployment)
- Frontend: https://your-app.vercel.app
- Agents API: https://api.rexera-agents.com
- n8n Workflows: https://workflows.rexera.com

## Environment Variables by Service

### Frontend (Next.js)
- `NEXT_PUBLIC_SUPABASE_URL` ✅ Set
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅ Set
- `NEXTAUTH_SECRET` ⚠️ Need to generate
- `NEXTAUTH_URL` ⚠️ Set after Vercel deployment

### Database (Supabase)
- `SUPABASE_SERVICE_ROLE_KEY` ⚠️ Get from Supabase dashboard
- `SUPABASE_JWT_SECRET` ⚠️ Get from Supabase dashboard

### AI Agents
- `AGENTS_API_KEY` ⚠️ Set when agent services are deployed
- `AGENTS_BASE_URL` ⚠️ Set when agent services are deployed

### n8n Workflows
- `N8N_API_KEY` ⚠️ Set when n8n is deployed
- `N8N_BASE_URL` ⚠️ Set when n8n is deployed

## Next Steps

1. **Deploy to Vercel** using the commands above
2. **Get missing environment variables** from service dashboards
3. **Set up Supabase database** using the schema files
4. **Deploy AI agent services** (separate deployment)
5. **Set up n8n instance** (can use n8n Cloud)
6. **Configure webhook endpoints** between services
7. **Test workflows** end-to-end

## Security Checklist

- [ ] All sensitive variables set in Vercel (not in code)
- [ ] Supabase RLS policies enabled
- [ ] API rate limiting configured
- [ ] CORS properly configured
- [ ] HTTPS enforced
- [ ] Authentication working
- [ ] Database backups enabled

## Monitoring Setup

Once deployed, set up:
- [ ] Sentry for error tracking
- [ ] PostHog for analytics
- [ ] Vercel Analytics
- [ ] Supabase monitoring
- [ ] Custom agent monitoring dashboards

## Domain Configuration

1. **Add custom domain in Vercel**
   - Go to Project Settings > Domains
   - Add your domain (e.g., app.rexera.com)
   - Update NEXTAUTH_URL environment variable

2. **Configure DNS**
   - Point your domain to Vercel
   - Set up subdomain for APIs if needed

3. **Update environment variables**
   - Update all URL references to use your custom domain
   - Redeploy to apply changes