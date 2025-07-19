# Environment Variables Setup Guide

## 🏗️ Monorepo Environment Structure

This monorepo uses a unified environment variable system that works across both Vercel deployments:
- **Frontend**: Next.js app deployed to Vercel
- **API**: Serverless functions deployed to separate Vercel project

## 📁 Environment Files Structure

```
rexera2/
├── .env.local                    # 🔧 Local development (ALL variables)
├── .env.production.template      # 📋 Production reference template  
├── .env.example                  # 📖 Public template (legacy)
├── frontend/
│   └── vercel.json              # Frontend deployment config
└── serverless-api/
    └── vercel.json              # API deployment config
```

## 🔧 Local Development Setup

1. **Copy the unified environment file:**
   ```bash
   # The .env.local file contains ALL variables for local development
   # No need for separate files in frontend/ or serverless-api/
   ```

2. **Start development servers:**
   ```bash
   pnpm dev  # Starts both frontend (3000) and API (3001)
   ```

## 🚀 Production Deployment Setup

### Vercel Dashboard Configuration

**Frontend Project Environment Variables:**
```bash
# Supabase (Public)
NEXT_PUBLIC_SUPABASE_URL=https://wmgidablmqotriwlefhq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# URLs (Public)
NEXT_PUBLIC_API_URL=https://api-rexera.vercel.app
NEXT_PUBLIC_APP_URL=https://app-rexera.vercel.app
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://api-rexera.vercel.app/api/webhooks/n8n

# Auth (Public)
NEXT_PUBLIC_SKIP_AUTH=false

# Environment
NODE_ENV=production
```

**API Project Environment Variables:**
```bash
# Supabase (Server-side)
SUPABASE_URL=https://wmgidablmqotriwlefhq.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[SENSITIVE - Set in Vercel Dashboard]
SUPABASE_JWT_SECRET=[SENSITIVE - Set in Vercel Dashboard]

# Auth (Server-side)
SKIP_AUTH=false

# CORS
ALLOWED_ORIGINS=https://app-rexera.vercel.app

# N8N (Server-side)
N8N_ENABLED=true
N8N_API_KEY=[SENSITIVE - Set in Vercel Dashboard]
N8N_BASE_URL=https://rexera2.app.n8n.cloud
N8N_PAYOFF_WORKFLOW_ID=payoff-request

# Environment
NODE_ENV=production
```

## 🔒 Security Best Practices

### ✅ What to Check In (Public)
- `.env.local` (development only, with real dev values)
- `.env.production.template` (template with placeholder values)
- `.env.example` (public documentation)

### ❌ What NOT to Check In
- Production secrets in plain text
- Service role keys in any file
- API keys in any file

### 🛡️ Vercel Dashboard Setup
1. **Frontend Project**: Set all `NEXT_PUBLIC_*` variables
2. **API Project**: Set all server-side variables (without `NEXT_PUBLIC_` prefix)
3. **Sensitive Variables**: Always set these only in Vercel dashboard:
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_JWT_SECRET`
   - `N8N_API_KEY`

## 🔄 Environment Variable Flow

```
Development:
.env.local → Both frontend and API (local)

Production:
Vercel Dashboard (Frontend) → NEXT_PUBLIC_* variables → Browser
Vercel Dashboard (API) → Server variables → Serverless functions
```

## 🆔 Variable Naming Convention

- **`NEXT_PUBLIC_*`**: Client-side variables (exposed to browser)
- **No prefix**: Server-side only variables
- **Same base name**: Use same variable name with/without prefix for consistency

Example:
```bash
# Frontend (.env or Vercel)
NEXT_PUBLIC_API_URL=https://api-rexera.vercel.app

# API (.env or Vercel) 
API_URL=https://api-rexera.vercel.app  # If needed server-side
```

## 🔧 VSCode Configuration

The `.vscode/settings.json` file is configured to:
- Handle TypeScript across the monorepo
- Provide intellisense for environment files
- Set up proper ESLint working directories
- Hide build artifacts and node_modules

## 🚨 Migration from Old Setup

If you have existing environment files:
1. **Remove old files:**
   ```bash
   rm frontend/.env.local
   rm serverless-api/.env
   ```
2. **Use the unified `.env.local`** in the root for development
3. **Set production variables in Vercel dashboard** (not in files)

## 📋 Deployment Checklist

- [ ] Set all `NEXT_PUBLIC_*` variables in frontend Vercel project
- [ ] Set all server variables in API Vercel project  
- [ ] Verify `NEXT_PUBLIC_API_URL` points to API deployment URL
- [ ] Verify `ALLOWED_ORIGINS` includes frontend deployment URL
- [ ] Test authentication flow with `SKIP_AUTH=false`
- [ ] Verify database connectivity with production credentials