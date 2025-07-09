# Rexera 2.0

[![License](https://img.shields.io/badge/license-UNLICENSED-red.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.2.0-blue.svg)](https://www.typescriptlang.org/)

**Rexera 2.0** is an AI-powered platform designed to automate and streamline complex operational workflows in real estate and other industries. The system leverages intelligent automation and seamless human-in-the-loop (HIL) oversight to bring unprecedented efficiency, accuracy, and transparency to operational processes.

## 🎯 Project Vision

Rexera 2.0 automates operational workflows by about 95% while exceeding human speed and quality. The platform handles workflows such as Municipal Lien Searches, HOA document acquisition, and mortgage payoff requests by coordinating a suite of specialized AI agents.

## 🏗️ Architecture Overview

The platform is built on a **dual-layer architecture** that separates technical workflow orchestration from business-level visibility and management:

- **Technical Layer (n8n)**: Handles workflow definitions, execution logic, AI agent coordination, and complex decision-making
- **Business Layer (Our Application)**: Provides workflow-agnostic frontend, user management, progress tracking, SLA monitoring, and clean APIs

```mermaid
graph TD
    subgraph "User Interfaces (Next.js)"
        HIL_Dashboard
        Manager_Portal
        Client_Portal
    end

    subgraph "Application Backend (Vercel Serverless)"
        API_Layer[REST API]
    end

    subgraph "Database (Supabase Cloud)"
        PostgreSQL_DB
    end

    subgraph "Workflow Engine (n8n Cloud)"
        n8n_Engine
    end

    subgraph "AI Agents (External APIs)"
        AI_Agent_Suite
    end

    User_Interfaces --> API_Layer
    API_Layer --> PostgreSQL_DB
    API_Layer --> n8n_Engine
    n8n_Engine --> AI_Agent_Suite
    n8n_Engine --> API_Layer
    PostgreSQL_DB -- Supabase Realtime --> User_Interfaces
```

## 🛠️ Technology Stack

- **Frontend**: [Next.js 15](https://nextjs.org/) with TypeScript, [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/)
- **Backend API**: REST API on [Vercel Serverless Functions](https://vercel.com/docs/functions) with TypeScript and [Zod](https://zod.dev/) validation
- **Database**: [Supabase Cloud](https://supabase.com/) (PostgreSQL) with real-time subscriptions and Row-Level Security
- **Workflow Engine**: [n8n Cloud](https://n8n.io/) for technical process orchestration
- **AI Agents**: Suite of 10 specialized agents exposed as external REST APIs
- **Monorepo**: [PNPM workspaces](https://pnpm.io/workspaces) and [Turborepo](https://turbo.build/repo)
- **Hosting**: [Vercel](https://vercel.com/) for frontend and serverless API

## 🤖 AI Agent Ecosystem

The platform coordinates 10 specialized AI agents, each with a well-defined role:

### Research & Discovery
- **Nina 🔍**: Researches contact information for counterparties (lenders, HOAs, etc.)
- **Rex 🌐**: Navigates web portals to find and download documents

### Communication
- **Mia 📧**: Composes and sends context-aware emails
- **Florian 🗣️**: Conducts automated phone calls
- **Max 📞**: Navigates complex Interactive Voice Response (IVR) systems

### Document Processing
- **Iris 📄**: Performs OCR and extracts structured data from documents
- **Corey 🏢**: Analyzes HOA-specific documents

### Quality & Finance
- **Cassy ✓**: Performs quality assurance and validation
- **Kosha 💰**: Tracks costs and generates billing information

### Client Relations
- **Ria 👩‍💼**: Manages client-facing communication and status updates

## 📋 Core Workflow Types

### Municipal Lien Search
1. **Research Municipality** (Nina) → **Portal Access** (Rex) → **Process Documents** (Iris) → **Quality Validation** (Cassy) → **Generate Invoice** (Kosha)

### HOA Acquisition
1. **Research HOA Contact** (Nina) → **Send Request** (Mia/Florian) → **Await Documents** → **Analyze HOA Docs** (Corey) → **Quality Validation** (Cassy)

### Payoff Request
1. **Identify Lender Contact** (Nina) → **Send Payoff Request** (Max/Florian/Mia) → **Extract Payoff Data** (Iris) → **Generate Invoice** (Kosha) → **Update CRM** (Ria) → **Notify Client** (Mia)

## 🚀 Getting Started

### Prerequisites

- Node.js ≥18.0.0
- PNPM ≥8.0.0
- Supabase account
- n8n Cloud account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/InspectHOA/rexera2-complete.git
   cd rexera2-complete
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**
   
   Copy the example environment files and configure them:
   ```bash
   cp .env.example .env.local
   cp frontend/.env.example frontend/.env.local
   cp serverless-api/.env.example serverless-api/.env.local
   ```

4. **Database Setup**
   ```bash
   # Run database migrations
   pnpm db:migrate
   
   # Seed the database
   pnpm db:seed
   ```

5. **Start Development**
   ```bash
   pnpm dev
   ```

   This starts:
   - Frontend: http://localhost:3000
   - API: http://localhost:3001

## 📁 Project Structure

```
rexera2/
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   ├── components/      # React components
│   │   ├── lib/            # Utilities and hooks
│   │   └── hooks/          # Custom React hooks
├── serverless-api/         # Vercel serverless API
│   ├── api/                # API endpoints
│   ├── src/                # Shared utilities
│   └── tests/              # API tests
├── packages/shared/        # Shared TypeScript types and utilities
├── workflows/              # n8n workflow definitions
├── scripts/                # Database and utility scripts
├── supabase/              # Database migrations and seeds
└── docs/                  # Comprehensive documentation
```

## 🔧 Available Scripts

### Development
```bash
pnpm dev              # Start all services in development mode
pnpm dev:clean        # Clean start with port cleanup
pnpm build            # Build all packages
pnpm test             # Run all tests
pnpm lint             # Lint all packages
```

### Database
```bash
pnpm db:migrate       # Run database migrations
pnpm db:seed          # Seed database with test data
pnpm seed             # Alternative seed command
```

### Testing
```bash
pnpm test:smoke       # Run smoke tests
pnpm test:integration # Run integration tests
pnpm e2e              # Run end-to-end tests with Playwright
```

### Deployment
```bash
pnpm deploy:staging   # Deploy to staging environment
pnpm deploy:prod      # Deploy to production
```

### Workflows
```bash
pnpm workflows:validate  # Validate n8n workflow definitions
pnpm workflows:backup    # Backup workflow configurations
```

## 🔐 Authentication & Security

- **Authentication**: Supabase Auth with JWT tokens
- **Authorization**: Row-Level Security (RLS) policies in PostgreSQL
- **User Roles**: HIL User, Manager, Client, Admin
- **API Security**: JWT validation middleware on all protected routes
- **Data Isolation**: RLS ensures users only access permitted data

## 📊 Key Features

### Real-Time Dashboard
- Live workflow progress tracking
- Human-in-the-loop (HIL) task management
- SLA monitoring and breach alerts
- Comprehensive notification system

### Notification System
- **Real-time toasts**: 5-second immediate feedback
- **Persistent notifications**: 24-hour notification history
- **Priority-based styling**: Visual distinction for urgent items
- **Actionable notifications**: Direct links to relevant workflows

### SLA Monitoring
- Automatic SLA tracking with configurable timeouts
- Background monitoring with breach detection
- Escalation notifications for HIL operators
- Backward compatibility for deployments without SLA fields

### Audit System
- Universal audit trail for all system actions
- Human, agent, and system action logging
- Compliance and debugging support
- Performance metrics tracking

## 📚 Documentation

Comprehensive documentation is available in the [`docs/`](docs/) directory:

- **[Introduction](docs/01_introduction.md)**: Project vision and architecture overview
- **[Database & Workflows](docs/02_database_and_workflows.md)**: Data model and workflow architecture
- **[API & Agents](docs/03_api_and_agents.md)**: API design and AI agent ecosystem
- **[Frontend & State](docs/04_frontend_and_state.md)**: Frontend architecture and state management
- **[Deployment & Operations](docs/05_deployment_and_operations.md)**: Deployment guide and operations
- **[Notification System](docs/06_notification_system.md)**: Comprehensive notification system documentation
- **[Cleanup Changelog](docs/07_cleanup_changelog.md)**: Recent improvements and bug fixes

## 🚀 Deployment

The application deploys as two separate Vercel projects:

1. **Frontend** (`rexera-frontend`): Next.js application from `/frontend`
2. **API** (`rexera-api`): Serverless functions from `/serverless-api`

### Environment Variables

#### Frontend
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`

#### API
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `INTERNAL_API_KEY`
- `JWT_SECRET`
- `ENCRYPTION_KEY`

## 🧪 Testing Strategy

- **Unit Tests**: Jest and React Testing Library for components and utilities
- **Integration Tests**: API and database interaction testing with MSW
- **E2E Tests**: Playwright for complete user journey validation
- **Performance Tests**: k6 for load testing
- **Security Tests**: Automated vulnerability scanning

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under UNLICENSED - see the [LICENSE](LICENSE) file for details.

## 👥 Team

**InspectHOA Team** - Building the future of real estate workflow automation

---

For detailed technical documentation, deployment guides, and API references, please refer to the [`docs/`](docs/) directory.
