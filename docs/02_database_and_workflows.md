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

The workflow system is built on a dynamic task sequence approach where n8n workflows first populate tasks, then execute them.

### Workflow Definitions

For each workflow type (e.g., `PAYOFF`, `HOA_ACQUISITION`), there are n8n workflow definitions stored in the `workflows/definitions/` folder. These contain the logic for determining what tasks need to be done for a specific workflow instance.

### Dynamic Task Population

When a workflow is triggered, the n8n workflow first populates a task sequence specific to that workflow instance. This task sequence is stored in n8n and defines the actual steps that will be executed.

**Example task sequence entry:**

```json
{
  "taskType": "identify_lender_contact",
  "defaultAgent": "Nina",
  "description": "Identifies the lender's payoff department contact details."
}
```

### The Execution Engine (n8n)

The technical execution is handled by **n8n**. When a new workflow is initiated, n8n:

1.  Populates the task sequence for that specific workflow instance
2.  Executes the tasks in the correct sequence
3.  Updates task statuses as they progress
4.  Calls the appropriate AI agents for each task
5.  Handles complex logic, branching (e.g., choosing between email or phone), and error retries
6.  Reports the result of each completed task back to our application's API

### Tying It Together: The `task_executions` Log

This is where the data model and workflow architecture meet.

1.  A user initiates a workflow in the UI.
2.  Our API creates a new record in the `workflows` table.
3.  The API triggers the `n8n` workflow, passing it the `workflow_id`.
4.  `n8n` immediately calls the "Bulk Create Tasks" endpoint, creating all task records for this workflow instance in the database with `PENDING` status.
5.  `n8n` then executes each task sequentially:
    - Updates task status to `RUNNING`
    - Calls the appropriate AI agent
    - Updates task status to `COMPLETED` or `FAILED` with result data
6.  The frontend provides real-time progress by querying the `task_executions` table, showing the full task list and current execution status.

### Why a Dual-Layer Architecture?

This separation of a technical orchestration layer (`n8n`) and a business visibility layer (our database and API) is a critical design decision.

*   **Without the Database Layer (n8n only)**, we would lose all business context. We would have no way to track SLAs, manage human-in-the-loop escalations, or provide clients with a clean, high-level view of their workflow's progress.
*   **Without the n8n Layer (Database only)**, we would have to build a complex and brittle workflow engine ourselves. We would lose the power of `n8n`'s visual editor, error handling, and pre-built connectors.

This dual-layer approach gives us the best of both worlds: a powerful, off-the-shelf technical engine and a custom, business-aware application layer.

## 3. Core Workflow Types

Below are the high-level task sequences for the three primary workflow types. These task sequences are dynamically populated by n8n workflows and stored in the `workflows/definitions/` folder.

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

| Step | `taskType` | Agent | Description |
|------|------------|-------|-------------|
| 1 | `identify_lender_contact` | Nina 🔍 | Research lender contact information and communication preferences |
| 2 | `send_payoff_request` | Max/Florian/Mia | Send the payoff request to the lender (IVR/Phone/Email based on preference) |
| 3 | `extract_payoff_data` | Iris 📄 | Extract data from the payoff statement (after lender response) |
| 4 | `generate_invoice` | Kosha 💰 | Generate an invoice for the payoff |
| 5 | `update_crm_record` | Ria 👩‍💼 | Update the CRM with the payoff information |
| 6 | `notify_client` | Mia 📧 | Notify the client that the payoff is complete |


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