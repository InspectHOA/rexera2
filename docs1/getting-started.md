# Getting Started

## Prerequisites

- Node.js 18+
- pnpm
- Supabase account

## Setup

1. **Clone and Install**
   ```bash
   git clone <repo>
   cd rexera2
   pnpm install
   ```

2. **Environment Variables**
   ```bash
   cp .env.example .env.local
   # Fill in Supabase URL and keys
   ```

3. **Database Setup**
   ```bash
   # Apply migrations (if needed)
   npx supabase db reset
   
   # Seed test data
   npx tsx scripts/db/seed.ts
   ```

4. **Start Development**
   ```bash
   pnpm dev
   ```
   - Frontend: http://localhost:3000
   - API: http://localhost:3001
   - Swagger: http://localhost:3001/api-docs

## Test the Setup

1. Visit http://localhost:3000
2. Login with test credentials (see seed script output)
3. Create a test workflow
4. Check API docs at http://localhost:3001/api-docs

## Common Issues

- **Port conflicts**: Change ports in `package.json` dev scripts
- **Supabase errors**: Check environment variables
- **Type errors**: Run `pnpm type-check` to see issues