# Deployment & Operations

This document provides a comprehensive guide to deploying, configuring, testing, and maintaining the Rexera 2.0 platform.

## 1. Deployment Architecture

The application is a monorepo deployed as two separate projects on Vercel:

*   **`rexera-frontend`**: The Next.js 15 frontend application, located in the `/frontend` directory.
*   **`rexera-api`**: The REST API running on Vercel Serverless Functions, located in the `/api` directory.

These projects are deployed independently but are designed to work together. The frontend communicates with the backend via standard REST API calls.

## 2. Environment Configuration

Proper environment variable setup is critical. Variables are managed in Vercel for production and preview environments, and in `.env.local` files for local development.

### Quick Reference

#### Frontend (`/frontend`)

| Variable | Local Value (`.env.local`) | Production Value (Vercel) |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://...` | `https://...` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `ey...` | `ey...` |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | `https://rexera-api.vercel.app` |
| `NEXTAUTH_URL` | `http://localhost:3000` | `https://rexera-frontend.vercel.app` |
| `NEXTAUTH_SECRET` | (generate a secret) | (generate a secret) |

#### API (`/api`)

| Variable | Local Value (`.env.local`) | Production Value (Vercel) |
| :--- | :--- | :--- |
| `SUPABASE_URL` | `https://...` | `https://...` |
| `SUPABASE_SERVICE_ROLE_KEY` | `ey...` | `ey...` |
| `SUPABASE_JWT_SECRET` | (from Supabase settings) | (from Supabase settings) |
| `INTERNAL_API_KEY` | `rexera-internal-api-key-2024` | (generate a secret) |
| `JWT_SECRET` | (generate a secret) | (generate a secret) |
| `ENCRYPTION_KEY` | (generate a 32-char secret) | (generate a 32-char secret) |

**Note**: `NEXT_PUBLIC_*` variables are exposed to the browser. All other variables are server-side only.

## 3. Deployment Guide

The recommended deployment method is via Vercel's GitHub integration. The process is phased to ensure stability.

1.  **Infrastructure Setup**: Configure Supabase Cloud, n8n Cloud, and obtain necessary API keys.
2.  **Database Deployment**: Deploy the database schema and run seed scripts.
3.  **Workflow Engine Deployment**: Import and configure the n8n workflows.
4.  **Backend and Frontend Deployment**:
    *   **Create Frontend Project**: In Vercel, create a new project from your repository, setting the **Root Directory** to `frontend`.
    *   **Create API Project**: Create another new project from the same repository, setting the **Root Directory** to `api` and the **Framework** to `Other`.
    *   **Configure Environment Variables**: In the Vercel dashboard for each project, add the production environment variables.
    *   **Deploy**: Trigger deployments for both projects.

## 4. Testing Strategy

Our testing strategy is multi-layered to ensure quality from individual components to the entire system.

*   **Unit Testing**:
    *   **Tools**: [Jest](https://jestjs.io/) and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/).
    *   **Scope**: Individual React components, utility functions, and API route handlers.
    *   **Goal**: Verify that each piece of code works correctly in isolation.

*   **Integration Testing**:
    *   **Tools**: Jest, [MSW (Mock Service Worker)](https://mswjs.io/), and a test database instance.
    *   **Scope**: Interactions between the API and the database, and between the API and external agent services (which are mocked).
    *   **Goal**: Ensure that different parts of the system work together as expected.

*   **End-to-End (E2E) Testing**:
    *   **Tool**: [Playwright](https://playwright.dev/).
    *   **Scope**: Simulates real user journeys through the entire application in a browser.
    *   **Goal**: Validate complete workflows from the user's perspective, ensuring that the frontend, backend, and database all function correctly together.

*   **Performance & Security**:
    *   **Load Testing**: We use [k6](https://k6.io/) to simulate high traffic and ensure the system remains performant under load.
    *   **Security Testing**: Automated scans (e.g., `npm audit`) and manual penetration testing are conducted to identify and fix vulnerabilities.
    *   **Accessibility Testing**: We use `axe-core` to ensure our application is compliant with WCAG standards.

## 5. CI/CD Pipeline

We use **GitHub Actions** to automate our testing and deployment process.

### CI/CD Workflow (`.github/workflows/deploy.yml`)

```yaml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run build
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID_FRONTEND }}
          vercel-args: '--prod'
          working-directory: ./frontend
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID_API }}
          vercel-args: '--prod'
          working-directory: ./api
```

This workflow ensures that every push to `main` is automatically tested and, if successful, deployed to production, guaranteeing that no code reaches users without passing our quality gates.

## 6. Production Readiness

Before a major launch or after significant changes, we follow a comprehensive checklist:

*   **Infrastructure**: Domains, SSL, and CDN are configured.
*   **Database**: Schema is deployed, RLS is active, and automated backups are confirmed.
*   **Workflow Engine**: n8n workflows are imported and the database connection is secure.
*   **Application**: Frontend and API are deployed with correct environment variables.
*   **Monitoring**: Health checks are passing, and error tracking/analytics are active.
*   **Security**: Access controls are verified, and no secrets are exposed in the codebase.
*   **Operations**: On-call rotations are set, and runbooks are up-to-date.

### Backup and Recovery

*   **Database**: Supabase provides automated daily backups with point-in-time recovery. Before any major deployment, a manual backup is also performed.
*   **Workflows**: n8n workflows are exported as JSON and stored in version control, allowing for quick restoration.
*   **Application**: Vercel's immutable deployments allow for instant rollbacks to any previous version with a single command.