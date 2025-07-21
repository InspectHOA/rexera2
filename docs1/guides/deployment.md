# Deployment Guide

## Production Architecture

Two separate Vercel projects:
- **Frontend**: `rexera-frontend` (Next.js app)
- **API**: `rexera-api` (Serverless functions)

## Environment Variables

**Required for both projects:**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_URL=your_supabase_url  
SUPABASE_SERVICE_ROLE_KEY=your_service_key
SUPABASE_JWT_SECRET=your_jwt_secret

# n8n Integration
N8N_WEBHOOK_URL=your_n8n_webhook_url
N8N_API_KEY=your_n8n_api_key

# Authentication
JWT_SECRET=your_jwt_secret
SKIP_AUTH=false  # Set to true for development only

# Cron (API only)
CRON_SECRET=your_cron_secret
```

## Database Setup

1. **Create Supabase Project**
   - New project in Supabase dashboard
   - Note URL and keys

2. **Run Migrations**
   ```bash
   npx supabase link --project-ref your_project_ref
   npx supabase db push
   ```

3. **Seed Production Data**
   ```bash
   # Create production clients/users
   npx tsx scripts/db/production-seed.ts
   ```

## Vercel Deployment

### Frontend Project
```bash
# Connect GitHub repo
vercel --prod

# Set environment variables in Vercel dashboard
# Deploy from main branch
```

### API Project  
```bash
# Deploy API separately
cd serverless-api
vercel --prod

# Configure custom domain if needed
```

## Cron Jobs Setup

**SLA Monitoring** (runs every 15 minutes):
- Endpoint: `POST /api/cron/sla-monitor`
- Auth: Bearer token with `CRON_SECRET`
- Configure in Vercel dashboard or external cron service

## Domain Configuration

1. **Custom Domains** in Vercel dashboard
2. **CORS Settings** in API for frontend domain
3. **SSL Certificates** (automatic with Vercel)

## Monitoring

**Health Checks:**
- Frontend: `/` should load dashboard
- API: `/api/health` returns status
- Database: Check Supabase dashboard

**Key Metrics:**
- Response times
- Error rates  
- Database connections
- Cron job success rates

## Security Checklist

- [ ] Environment variables set in Vercel (not in code)
- [ ] `SKIP_AUTH=false` in production
- [ ] Supabase RLS policies enabled
- [ ] API rate limiting configured
- [ ] CORS properly configured
- [ ] SSL/HTTPS enforced

## Rollback Plan

1. **Revert deployment** in Vercel dashboard
2. **Database rollback** via Supabase (if schema changes)
3. **Monitor** for issues after rollback

## Post-Deployment

1. **Test critical paths** (create workflow, trigger n8n)
2. **Monitor logs** for errors
3. **Verify cron jobs** are running
4. **Check real-time features** work