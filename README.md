# Rexera 2.0 - AI-Powered Real Estate Automation

## Project Overview

Rexera 2.0 is a sophisticated AI-powered real estate workflow automation platform featuring:

- **10 Specialized AI Agents** for comprehensive task automation
- **Dual-layer Architecture** (n8n orchestration + PostgreSQL business visibility)
- **Real-time HIL Dashboard** for human oversight and intervention
- **3 Core Workflow Types**: Municipal Lien Search, HOA Acquisition, Payoff Request

## Technology Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui
- **Database**: Supabase (PostgreSQL) with Row-Level Security
- **Workflow Engine**: n8n Cloud Enterprise
- **Authentication**: Google SSO with JWT
- **Hosting**: Vercel Pro + Supabase Pro + n8n Cloud
- **Real-time**: WebSocket connections for live updates

## Repository Structure

```
rexera2/
├── frontend/           # Next.js application (UI components and pages)
├── apis/              # API routes and server logic (deploys with frontend)
├── database/           # Schema, migrations, and seed data
├── workflows/          # n8n workflow definitions
├── infrastructure/     # DevOps configurations
├── shared/            # Shared utilities and configurations
├── types/             # Shared TypeScript type definitions
├── agents/            # AI agent integration system
├── docs/              # Complete design documentation
└── tests/             # Comprehensive test suite
```

## Quick Start

1. **Environment Setup**
   ```bash
   cd frontend && npm install
   cd ../database && npm run setup
   ```

2. **Development**
   ```bash
   npm run dev          # Start all services
   npm run test         # Run test suite
   npm run build        # Build for production
   ```

3. **Production Deployment**
   ```bash
   npm run deploy:prod  # Deploy to production
   ```

## Key Features

- **Real-time Coordination**: Live workflow status updates
- **SLA Monitoring**: Business hours calculation with alerting
- **Email Threading**: Gmail-style conversation management
- **Agent Coordination**: 10 specialized AI agents working together
- **HIL Dashboard**: Human-in-the-loop oversight and intervention

## Documentation

Complete design documentation is available in the `/docs` folder:
- Project overview and architecture
- Database schema and API specifications
- Workflow definitions and agent coordination
- Deployment and testing procedures

---

Built with ❤️ for the future of real estate automation