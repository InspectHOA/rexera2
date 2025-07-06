# Database & Workflows

This document outlines the data model and workflow architecture that form the backbone of Rexera 2.0. Understanding these concepts is crucial for any engineer working on the platform.

## 1. Data Model Overview

The database is the single source of truth for the *state* of all business objects. It is designed to be a clear, normalized, and performant log of all activities.

### Core Tables

While the full schema contains over 30 tables, the following are the most critical to understand:

*   `workflows`: This is the central table, representing a single instance of a business process (e.g., one Payoff Request). It holds the overall status, priority, and metadata for the workflow.
*   `task_executions`: This table is an immutable log of every step taken within a workflow. Each time an agent or human performs an action, a new record is created here. It answers the question "What work has been done?".
*   `communications`: A unified table for all interactions (emails, calls, internal messages). It uses a hybrid approach with type-specific metadata tables (`email_metadata`, `call_metadata`, `message_metadata`) to ensure type safety and performance while providing a single point of query for all communication events.
*   `documents`: Stores metadata for all files, from working documents to final deliverables. This table now also handles what was formerly in `workflow_outputs`, using a `document_type` of 'DELIVERABLE'.
*   `counterparties`: A directory of external organizations (e.g., Lenders, HOAs) that the system interacts with.
*   `user_profiles`: Contains information for both internal (HIL) and external (client) users, linking to Supabase's `auth.users` table.
*   `audit_events`: A universal, append-only log of every significant action taken in the system by any actor (human, agent, or system process). This is the source of truth for compliance, debugging, and analytics.
*   `sla_tracking`: Tracks the status of tasks against their defined Service Level Agreements, including their current alert level (`GREEN`, `YELLOW`, `ORANGE`, `RED`, `BREACHED`).
*   `invoices` and `cost_items`: Manages the financial aspects of workflows, tracking costs incurred and generating invoices for clients.

### Key Design Principles

*   **Immutable Log**: The `task_executions` table is treated as an append-only log. We record what happened, but we don't typically mutate past events.
*   **Normalized Data**: We avoid data duplication. For example, information about a lender is stored once in `counterparties` and referenced by many workflows.
*   **JSONB for Flexibility**: We use `JSONB` columns (e.g., `workflows.metadata`, `task_executions.output_data`) to store flexible, semi-structured data without needing constant schema migrations.
*   **Row-Level Security (RLS)**: Supabase's RLS is used extensively to ensure that users can only access data they are permitted to see.

## 2. Workflow Architecture

The workflow system is built on a simple but powerful premise: separating the *definition* of a workflow from its *execution*.

### The Static Blueprint

For each workflow type (e.g., `PAYOFF`, `HOA_ACQUISITION`), there is a static JSON file that acts as a **blueprint**. This file defines the complete "to-do list" for that workflow.

The most important part of this blueprint is the `taskSequence`, which is an array of objects, each defining a potential step in the workflow.

**Example `taskSequence` entry:**

```json
{
  "taskType": "identify_lender_contact",
  "defaultAgent": "Nina",
  "description": "Identifies the lender's payoff department contact details."
}
```

This blueprint is the single source of truth for what *can* happen in a workflow.

### The Execution Engine (n8n)

The technical execution of the workflow is handled by **n8n**, an open-source workflow automation tool. When a new workflow is initiated in our application, we trigger a corresponding workflow in n8n.

The n8n workflow is responsible for:
1.  Reading the static JSON blueprint.
2.  Executing the tasks in the correct sequence.
3.  Calling the appropriate AI agents for each task.
4.  Handling complex logic, branching (e.g., choosing between email or phone), and error retries.
5.  Reporting the result of each completed task back to our application's API.

### Tying It Together: The `task_executions` Log

This is where the data model and workflow architecture meet.

1.  A user initiates a workflow in the UI.
2.  Our API creates a new record in the `workflows` table.
3.  The API triggers the `n8n` workflow, passing it the `workflow_id`.
4.  `n8n` begins executing steps from the static blueprint.
5.  After each step is completed by an AI agent, `n8n` calls our API.
6.  Our API creates a new record in the `task_executions` table with the `workflow_id`, the `taskType` from the blueprint, the `status` ('COMPLETED' or 'FAILED'), and the `output_data` from the agent.

The frontend then provides a real-time view of the workflow's progress by querying the `task_executions` table for that `workflow_id` and comparing the log of completed tasks against the static blueprint's full list of tasks. This allows the UI to show what's done, what's in progress, and what's still to come.

### Why a Dual-Layer Architecture?

This separation of a technical orchestration layer (`n8n`) and a business visibility layer (our database and API) is a critical design decision.

*   **Without the Database Layer (n8n only)**, we would lose all business context. We would have no way to track SLAs, manage human-in-the-loop escalations, or provide clients with a clean, high-level view of their workflow's progress.
*   **Without the n8n Layer (Database only)**, we would have to build a complex and brittle workflow engine ourselves. We would lose the power of `n8n`'s visual editor, error handling, and pre-built connectors.

This dual-layer approach gives us the best of both worlds: a powerful, off-the-shelf technical engine and a custom, business-aware application layer.

## 3. Core Workflow Blueprints

Below are the high-level task sequences for the three primary workflow types. These are defined in static JSON blueprints and executed by n8n.

### Municipal Lien Search

| Step | `taskType` | Default Agent | Description |
|------|------------|---------------|-------------|
| 1 | `research_municipality` | Nina 🔍 | Researches the target municipality to identify relevant portals and contact points. |
| 2 | `portal_access` | Rex 🌐 | Accesses online portals to search for lien information. |
| 3 | `process_documents` | Iris 📄 | Extracts data from retrieved documents. |
| 4 | `quality_validation` | Cassy ✓ | Validates the accuracy and completeness of the extracted data. |
| 5 | `generate_invoice` | Kosha 💰 | Generates an invoice for the completed search. |

### HOA Acquisition

| Step | `taskType` | Default Agent | Description |
|------|------------|---------------|-------------|
| 1 | `research_hoa_contact` | Nina 🔍 | Finds the correct contact information for the HOA. |
| 2 | `send_request` | Mia/Florian | Sends the document request via email or phone. |
| 3 | `await_documents` | - | A waiting step, managed by n8n, for the HOA to respond. |
| 4 | `analyze_hoa_docs` | Corey 🏢 | Analyzes the received HOA documents for key information. |
| 5 | `quality_validation` | Cassy ✓ | Performs a quality check on the analysis. |

### Payoff Request

| Step | `taskType` | Default Agent | Description |
|------|------------|---------------|-------------|
| 1 | `identify_lender_contact` | Nina 🔍 | Identifies the lender's payoff department contact details. |
| 2 | `send_payoff_request` | Max/Florian/Mia | Contacts the lender to request the payoff statement. |
| 3 | `await_statement` | - | A waiting step for the lender to provide the statement. |
| 4 | `extract_payoff_data` | Iris 📄 | Extracts all relevant figures from the payoff statement. |
| 5 | `generate_invoice` | Kosha 💰 | Generates an invoice for the service. |


## 4. SLA Monitoring

The system actively monitors Service Level Agreements (SLAs) to ensure timely workflow completion. This is handled by the `sla_tracking` table, which is created for tasks with defined time limits.

### SLA Alert Levels

SLA status is tracked with a color-coded alert system to provide immediate visibility into tasks that are at risk.

| Alert Level | Threshold | Action Required |
|-------------|-----------|-----------------|
| **GREEN** | 0-60% of SLA time elapsed | Monitor |
| **YELLOW** | 60-80% of SLA time elapsed | Prepare for escalation |
| **ORANGE** | 80-95% of SLA time elapsed | Alert HIL team |
| **RED** | 95-100% of SLA time elapsed | Immediate escalation |
| **BREACHED** | >100% of SLA time elapsed | Manager notification |

This system allows the operations team to proactively address potential delays before they impact clients.