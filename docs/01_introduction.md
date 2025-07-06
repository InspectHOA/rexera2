# Introduction to Rexera 2.0

## 1. Project Vision

**Rexera 2.0** is an AI-powered platform designed to automate and streamline complex real estate and mortgage processing workflows. Our vision is to leverage intelligent automation and seamless human-in-the-loop (HIL) oversight to bring unprecedented efficiency, accuracy, and transparency to the real estate industry.

The system is built to handle workflows such as Municipal Lien Searches, HOA document acquisition, and mortgage payoff requests by coordinating a suite of specialized AI agents.

### Business Goals & Success Metrics

The primary business objectives for Rexera 2.0 are:
*   **Automation**: Automate 80% of routine processing tasks.
*   **Quality**: Reduce manual processing errors by 60%.
*   **Efficiency**: Improve workflow completion times by 40%.
*   **Satisfaction**: Maintain a 95% client satisfaction score.

Success is measured by technical performance (e.g., <500ms API responses, 99.9% uptime), business impact (e.g., user adoption, cost reduction), and operational excellence (e.g., SLA compliance).

## 2. Core Architectural Philosophy

The architecture is founded on a **dual-layer system** that separates the technical workflow orchestration from the business-level visibility and management.

*   **Technical Layer (n8n)**: The open-source workflow engine `n8n` is the single source of truth for *how* a workflow is executed. It manages the step-by-step logic, coordinates AI agents, handles errors, and performs the technical tasks required to move a workflow forward.

*   **Business Layer (Our Application)**: Our custom application provides the user-facing interfaces (dashboards, portals) and the business context. It answers the question of *what* work is being done and *why*. This layer is responsible for:
    *   Providing a human-friendly view of workflow progress.
    *   Managing tasks and escalations for Human-in-the-Loop (HIL) operators.
    *   Tracking Service Level Agreements (SLAs).
    *   Exposing a clean, secure API for clients and internal use.

The state is synchronized between these two layers. The `n8n` engine reports the completion of each technical step to our application's API, which then logs it as a `task_execution` in the database. The frontend reconstructs the full, real-time status of any workflow by combining the static "blueprint" of the workflow with the dynamic log of completed tasks.

### High-Level Diagram

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
    PostgreSQL_DB -- Real-time Updates --> User_Interfaces
```

## 3. Technology Stack

The platform is built on a modern, type-safe technology stack designed for scalability and developer experience.

*   **Frontend**: [Next.js](https://nextjs.org/) with TypeScript, [Tailwind CSS](https://tailwindcss.com/), and [shadcn/ui](https://ui.shadcn.com/) for components.
*   **Backend API**: A **REST API** built on **Vercel Serverless Functions**. It's written in TypeScript and uses Zod for validation.
*   **Database**: **Supabase Cloud** (PostgreSQL) for data storage, real-time updates via subscriptions, and authentication.
*   **Workflow Engine**: **n8n Cloud** for technical process orchestration.
*   **AI Agents**: A suite of specialized agents (e.g., document processing, email, web navigation) exposed as external REST APIs.
*   **Monorepo**: [PNPM workspaces](https://pnpm.io/workspaces) and [Turborepo](https://turbo.build/repo) for managing the codebase.
*   **Hosting**: [Vercel](https://vercel.com/) for the frontend and serverless API, and **Supabase Cloud** for the database.

## 4. Key Principles

*   **Separation of Concerns**: The technical complexity of workflows is isolated in `n8n`, while the business logic and user experience are managed by our core application.
*   **End-to-End Type Safety**: By using TypeScript across the stack with tRPC and Zod schemas, we minimize runtime errors and improve developer productivity.
*   **Real-Time by Default**: The UI is always up-to-date thanks to real-time subscriptions from the database, providing immediate feedback to users.
*   **Scalability**: The architecture is designed to scale horizontally. We can add more instances of our API, the `n8n` engine, or individual AI agents to handle increased load.
*   **Human-in-the-Loop**: The system is designed to augment, not replace, human operators. When automation fails or requires validation, tasks are seamlessly escalated to the HIL dashboard.