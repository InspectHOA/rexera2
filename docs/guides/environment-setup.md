# Environment Setup Guide

## Environment Structure

**Unified Configuration**: Single `.env.local` file for all local development needs.

```
rexera2/
├── .env.local                    # Local development (ALL variables)
├── .env.production.template      # Production reference
├── .env.example                  # Public template
```

## Required Variables

**Supabase (Required):**
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key  
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
SUPABASE_JWT_SECRET=your_jwt_secret
```

**Authentication:**
```bash
SKIP_AUTH=true                    # Development only
NEXT_PUBLIC_SKIP_AUTH=true        # Development only
JWT_SECRET=your_jwt_secret
```

**n8n Integration:**
```bash
N8N_WEBHOOK_URL=your_n8n_webhook
N8N_API_KEY=your_n8n_api_key
```

**Optional (Development):**
```bash
CRON_SECRET=test_secret           # For SLA monitoring
```

## Local Development

1. **Copy template:**
   ```bash
   cp .env.example .env.local
   # Fill in your Supabase values
   ```

2. **Start services:**
   ```bash
   pnpm dev
   # Frontend: http://localhost:3000
   # API: http://localhost:3001
   ```

3. **Verify setup:**
   - Visit frontend, should load dashboard
   - Check API health: http://localhost:3001/api/health
   - Swagger docs: http://localhost:3001/api-docs

## Production Deployment

**Two Vercel Projects:**
- Frontend project: Set `NEXT_PUBLIC_*` variables
- API project: Set all variables including service keys

**Critical Settings:**
- `SKIP_AUTH=false` in production
- `NEXT_PUBLIC_SKIP_AUTH=false` in production  
- Use real Supabase project (not local)

## Common Issues

**Supabase Connection:**
- Verify URL format (includes https://)
- Check anon key vs service role key usage
- Ensure project is not paused

**Authentication:**
- `SKIP_AUTH=true` only for development
- JWT_SECRET must be consistent across services
- Google OAuth setup required for production

**Port Conflicts:**
- Frontend default: 3000
- API default: 3001  
- Change in package.json if needed