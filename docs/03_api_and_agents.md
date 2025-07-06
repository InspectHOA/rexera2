# API, Agents, & Authentication

This document provides a comprehensive overview of the Rexera 2.0 API, the AI agents that power its workflows, and the security model that protects it.

## 1. API Architecture

The platform uses a **REST API** built on **Vercel Serverless Functions**. This provides a scalable, robust, and easy-to-maintain backend for all our services.

The API is designed around standard RESTful principles:

*   **Resources**: Core data entities (e.g., `workflows`, `tasks`, `documents`) are exposed as resources.
*   **Endpoints**: Standard HTTP methods (`GET`, `POST`, `PUT`, `DELETE`) are used to interact with these resources.
*   **Validation**: [Zod](https://zod.dev/) is used for rigorous schema validation on all incoming requests and outgoing responses, ensuring data integrity.

### Example API Call

```bash
# Example: Fetching in-progress workflows
curl -X GET "https://api.rexera.com/workflows?status=IN_PROGRESS&limit=20" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

**Example Request Body Schema (Zod):**
```typescript
// For POST /workflows
z.object({
  type: z.enum(['MUNI_LIEN_SEARCH', 'HOA_ACQUISITION', 'PAYOFF']),
  clientId: z.string(),
  payload: z.object({
    // ... workflow specific data
  })
})
```

## 2. The AI Agent Ecosystem

The core of Rexera's automation is a suite of 10 specialized AI agents. Each agent is an independent service with a well-defined role, and they are coordinated by the `n8n` workflow engine.

### Agent Roster

*   **Research & Discovery**
    *   **Nina 🔍**: Researches and discovers contact information for counterparties (lenders, HOAs, etc.).
    *   **Rex 🌐**: Navigates web portals to find and download documents.

*   **Communication**
    *   **Mia 📧**: Composes and sends context-aware emails.
    *   **Florian 🗣️**: Conducts automated phone calls.
    *   **Max 📞**: Navigates complex Interactive Voice Response (IVR) phone systems.

*   **Document Processing**
    *   **Iris 📄**: Performs OCR and extracts structured data from documents.
    *   **Corey 🏢**: A specialist agent that analyzes HOA-specific documents.

*   **Quality & Finance**
    *   **Cassy ✓**: Performs quality assurance and validation on data extracted by other agents.
    *   **Kosha 💰**: Tracks costs and generates billing information.

*   **Client Relations**
    *   **Ria 👩‍💼**: Manages client-facing communication and status updates.

### Agent Integration

Agents are treated as external systems. The `n8n` workflow makes a standard HTTPS request to the agent's API endpoint, passing a payload with the `workflow_id`, `task_id`, and any necessary input data. The agent then uses its own API key to securely call back into the Rexera API to fetch any additional context it needs or to post its results.

This decoupled approach allows agents to be developed, deployed, and scaled independently of the core platform.

### Agent Performance Monitoring

The performance of each agent is continuously monitored to ensure reliability and efficiency. Key metrics include:
*   **Success Rate**: Percentage of tasks completed successfully.
*   **Processing Time**: Average time taken per task.
*   **Confidence Score**: The agent's own assessment of its result quality.
*   **Cost Efficiency**: The cost per task, typically measured in tokens used.
*   **SLA Compliance**: The percentage of tasks completed within their defined service-level agreement.

These metrics are collected and exposed via a dedicated `/performance` REST endpoint, allowing for real-time dashboards and proactive issue resolution.

## 3. Authentication & Authorization

Security is built on two primary pillars: **Supabase Auth** for authentication and **Row-Level Security (RLS)** for authorization.

### Authentication

*   **Provider**: We use Supabase's built-in authentication, which handles user registration, login, and session management.
*   **Method**: Authentication is handled via JWT (JSON Web Tokens). When a user logs in, they receive a JWT, which must be included in the `Authorization` header of all subsequent API requests.
*   **JWT Structure**: The JWT contains standard claims (`sub`, `exp`, etc.) as well as custom claims stored in the `user_metadata` object. These custom claims include the user's `role`, `userType`, and `companyId`, which are essential for the authorization logic.
*   **Middleware**: Next.js middleware validates the JWT for all protected API routes and frontend pages.

### Authorization

*   **User Roles**: The system defines several user roles (e.g., `HIL User`, `Manager`, `Client`, `Admin`). A user's role is stored in their JWT and is used to determine their permissions.
*   **Row-Level Security (RLS)**: We use PostgreSQL's RLS feature extensively. RLS policies are rules defined directly in the database that restrict which rows a user can access or modify based on their user ID and role from the JWT. This is our primary mechanism for data isolation and ensuring users can only see what they're supposed to see.

**Example RLS Policy:**

```sql
-- A client user can only see workflows that belong to them.
CREATE POLICY "client_workflow_access"
ON workflows FOR SELECT
USING (
  auth.uid() = client_user_id AND
  (auth.jwt() ->> 'role') = 'client'
);
```

This multi-layered approach ensures that the platform is secure from the edge all the way down to the database row.