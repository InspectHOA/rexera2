# Simplified Authentication System

## Overview

The Rexera 2.0 authentication system has been simplified to support just two modes:

1. **SSO Mode** - Full Google OAuth authentication with Supabase
2. **SKIP_AUTH Mode** - Hardcoded user for development/testing

## Configuration

### Frontend Configuration

Set in `frontend/.env.local`:

```bash
# SSO Mode (production)
NEXT_PUBLIC_SKIP_AUTH=false

# SKIP_AUTH Mode (development)
NEXT_PUBLIC_SKIP_AUTH=true
```

### Backend Configuration

Set in `serverless-api/.env`:

```bash
# SSO Mode (production)
SKIP_AUTH=false

# SKIP_AUTH Mode (development)
SKIP_AUTH=true
```

## How It Works

### SKIP_AUTH Mode (`SKIP_AUTH=true`)

**Frontend:**
- No login page shown
- Auto-redirects to dashboard
- Uses hardcoded user:
  - ID: `skip-auth-user-12345`
  - Email: `admin@rexera.com`
  - Name: `Admin User`
  - Role: `HIL_ADMIN`

**Backend:**
- All authenticated endpoints accept requests without Authorization header
- Sets hardcoded user context for all requests
- No database calls for authentication
- No JWT token validation

### SSO Mode (`SKIP_AUTH=false`)

**Frontend:**
- Shows Google OAuth login page
- Validates JWT tokens with Supabase
- Creates/updates user profiles automatically
- Full authentication flow

**Backend:**
- Requires `Authorization: Bearer <jwt-token>` header
- Validates JWT tokens with Supabase
- Loads user profiles from database
- Returns 401 for unauthenticated requests

## Environment Variables

| Variable | Values | Default | Description |
|----------|--------|---------|-------------|
| `NEXT_PUBLIC_SKIP_AUTH` | `true`/`false` | `false` | Frontend auth mode |
| `SKIP_AUTH` | `true`/`false` | `false` | Backend auth mode |

**Important:** Both frontend and backend must use the same mode!

## Deployment Examples

### Localhost Development
```bash
# Frontend .env.local
NEXT_PUBLIC_SKIP_AUTH=true

# Backend .env
SKIP_AUTH=true
```

### Vercel Production
```bash
# Vercel Environment Variables
NEXT_PUBLIC_SKIP_AUTH=false
SKIP_AUTH=false
```

### Testing Environment
```bash
# For automated testing
NEXT_PUBLIC_SKIP_AUTH=true
SKIP_AUTH=true
```

## API Behavior

### SKIP_AUTH Mode
```bash
# All these work without auth headers:
curl http://localhost:3001/api/workflows
curl http://localhost:3001/api/agents
curl http://localhost:3001/api/task-executions
```

### SSO Mode
```bash
# These require Authorization header:
curl -H "Authorization: Bearer <jwt-token>" http://localhost:3001/api/workflows

# These return 401 without auth:
curl http://localhost:3001/api/workflows
# {"success":false,"error":{"message":"Missing or invalid Authorization header"}}
```

## Testing

### Backend Tests
```bash
# Run auth middleware unit tests
npm test tests/unit/auth-middleware.test.ts

# Run auth integration tests  
npm test tests/integration/simplified-auth.test.ts
```

### Frontend Tests
```bash
# Run auth provider tests
npm test src/lib/auth/__tests__/simplified-auth.test.tsx
```

## Troubleshooting

### Issue: Frontend shows "User" then "Admin User"
**Solution:** Fixed in header component to show loading state

### Issue: CORS errors in production
**Solution:** OPTIONS requests bypass auth middleware

### Issue: Database connection errors in SKIP_AUTH mode
**Solution:** SKIP_AUTH mode doesn't use database for auth

### Issue: Environment variables not working
**Solution:** Ensure both frontend and backend use same mode

## Security Notes

- **SKIP_AUTH mode should NEVER be used in production**
- Always set `SKIP_AUTH=false` for production deployments
- The hardcoded user has full HIL_ADMIN privileges
- SKIP_AUTH mode bypasses all authentication and authorization

## Migration from Old Auth

### Removed Components
- Complex localhost detection
- Development environment detection  
- Multiple hardcoded user configurations
- HIL-only middleware restrictions
- Client data filtering middleware

### Simplified to
- Single environment variable control
- Two clear modes: SSO or SKIP_AUTH
- Consistent hardcoded user configuration
- Centralized auth logic

## Code Examples

### Frontend Auth Provider Usage
```typescript
import { useAuth } from '@/lib/auth/provider';

function MyComponent() {
  const { user, profile, loading, signOut } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <p>User: {profile?.full_name}</p>
      <p>Role: {profile?.role}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Backend Middleware Usage
```typescript
import { authMiddleware } from './middleware/auth';

// Apply to protected routes
app.use('/api/workflows', authMiddleware);
app.use('/api/agents', authMiddleware);

// Access user in route handler
app.get('/api/workflows', async (c) => {
  const user = c.get('user'); // AuthUser object
  // user.id, user.email, user.role, etc.
});
```

## Related Files

- Frontend config: `frontend/src/lib/auth/config.ts`
- Frontend provider: `frontend/src/lib/auth/provider.tsx`
- Backend middleware: `serverless-api/src/middleware/auth.ts`
- Frontend tests: `frontend/src/lib/auth/__tests__/simplified-auth.test.tsx`
- Backend tests: `serverless-api/tests/unit/auth-middleware.test.ts`