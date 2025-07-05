# 🔐 Environment Variables Quick Reference

## 🎯 Frontend Project (`rexera-frontend`)

### Required for All Environments
```env
NEXT_PUBLIC_SUPABASE_URL=https://wmgidablmqotriwlefhq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZ2lkYWJsbXFvdHJpd2xlZmhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzc5NjcsImV4cCI6MjA2NjcxMzk2N30.-a0ZOsgzuvApfxgsYIKQ0xduca5htQslPCNuUm7K2bw
NEXTAUTH_SECRET=your_nextauth_secret_here
```

### Production/Preview
```env
NEXT_PUBLIC_API_URL=https://rexera-api.vercel.app
NEXT_PUBLIC_AGENTS_URL=https://rexera-agents.vercel.app
NEXTAUTH_URL=https://rexera-frontend.vercel.app
```

### Development
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_AGENTS_URL=http://localhost:3002
NEXTAUTH_URL=http://localhost:3000
```

---

## 🎯 API Project (`rexera-api`)

### Required for All Environments
```env
SUPABASE_URL=https://wmgidablmqotriwlefhq.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZ2lkYWJsbXFvdHJpd2xlZmhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTEzNzk2NywiZXhwIjoyMDY2NzEzOTY3fQ.viSjS9PV2aDSOIzayHv6zJG-rjmjOBOVMsHlm77h6ns
INTERNAL_API_KEY=rexera-internal-api-key-2024
ENCRYPTION_KEY=your_32_character_encryption_key_here
JWT_SECRET=your_jwt_secret_here
```

### Production/Preview
```env
NODE_ENV=production
AGENTS_BASE_URL=https://rexera-agents.vercel.app
```

### Development
```env
NODE_ENV=development
AGENTS_BASE_URL=http://localhost:3002
```

---

## 🎯 Agents Project (`rexera-agents`)

### Required for All Environments
```env
SUPABASE_URL=https://wmgidablmqotriwlefhq.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZ2lkYWJsbXFvdHJpd2xlZmhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTEzNzk2NywiZXhwIjoyMDY2NzEzOTY3fQ.viSjS9PV2aDSOIzayHv6zJG-rjmjOBOVMsHlm77h6ns
INTERNAL_API_KEY=rexera-internal-api-key-2024
```

### Production/Preview
```env
NODE_ENV=production
TURBO_TOKEN=your_turbo_token_here
TURBO_TEAM=your_turbo_team_here
```

### Development
```env
NODE_ENV=development
```

---

## 🔧 Optional Third-Party Services

### Email (Add to API + Agents)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@rexera.com
SMTP_PASSWORD=your_app_password_here
FROM_EMAIL=noreply@rexera.com
```

### SMS (Add to Agents)
```env
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

### Monitoring (Add to all projects)
```env
SENTRY_DSN=your_sentry_dsn_here
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

---

## 📋 Deployment Checklist

### Step 1: Create Projects
- [ ] Frontend project with root directory `frontend`
- [ ] API project with root directory `api`  
- [ ] Agents project with root directory `agents`

### Step 2: Set Environment Variables
- [ ] Frontend: Core variables + URLs
- [ ] API: Core variables + service URLs
- [ ] Agents: Core variables + build tokens

### Step 3: Update Cross-References
- [ ] Update `NEXT_PUBLIC_API_URL` with actual API URL
- [ ] Update `NEXT_PUBLIC_AGENTS_URL` with actual Agents URL
- [ ] Update `AGENTS_BASE_URL` in API with actual Agents URL

### Step 4: Test
- [ ] Frontend loads and authenticates
- [ ] API health check responds
- [ ] Agents health check responds
- [ ] Cross-service communication works

---

## 🚨 Security Notes

- **Never expose** `SUPABASE_SERVICE_ROLE_KEY` in frontend
- **Only use** `NEXT_PUBLIC_*` variables in frontend
- **Keep** `INTERNAL_API_KEY` secret and consistent across services
- **Generate strong** `NEXTAUTH_SECRET` and `JWT_SECRET`
- **Use environment-specific** URLs (prod vs dev)

---

## 🔄 Quick Commands

### Deploy via CLI
```bash
vercel --cwd frontend
vercel --cwd api  
vercel --cwd agents
```

### Test Health Endpoints
```bash
curl https://rexera-frontend.vercel.app
curl https://rexera-api.vercel.app/api/health
curl https://rexera-agents.vercel.app/api/agents/health