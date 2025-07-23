# Authentication System

## Overview

Simplified authentication system supporting Google OAuth (production) and SKIP_AUTH mode (development).

## Authentication Modes

### SSO Mode (Production)
- **Google OAuth** via Supabase Auth
- **User profiles** stored in database
- **Role-based access** (HIL vs Client users)

### SKIP_AUTH Mode (Development)
- **Hardcoded test user** for development
- **Bypasses OAuth** for local testing
- **Same permission system** applies

## Configuration

**Frontend** (`.env.local`):
```bash
# Production
NEXT_PUBLIC_SKIP_AUTH=false

# Development  
NEXT_PUBLIC_SKIP_AUTH=true
```

**Backend** (`.env.local`):
```bash
# Production
SKIP_AUTH=false

# Development
SKIP_AUTH=true
```

## User Types

**HIL Users:**
- Internal operators who manage workflows
- Can access all client data (within company scope)
- Receive notifications and interrupts

**Client Users:**
- External customers who initiate workflows
- Limited to their own company's data
- Can view workflow progress and upload documents

## Database Schema

**Core Tables**: `user_profiles`, `user_preferences`

Key fields:
- `user_type`: 'hil_user' | 'client_user'
- `role`: User role within organization
- `company_id`: For client user access control
- `theme`: Dark/light mode preference

## Frontend Integration

**Auth Context:**
```typescript
// Get current user
const { user, loading } = useAuth();

// User object contains:
// - id, email, user_type, role
// - company_id (for client users)
```

**Protected Routes:**
- Automatic redirect to login if not authenticated
- Role-based component rendering
- Company-scoped data access

## API Security

**Middleware:**
- Bearer token validation
- User context injection
- Company-level access control

**Request Flow:**
1. Client sends JWT token
2. Middleware validates and extracts user
3. Route handlers access user via `c.get('user')`
4. Database queries filtered by user permissions