# Frontend, Logging, & State

This document explains the architecture of the Rexera 2.0 frontend, including its component structure, state management, and the underlying philosophy of how application state is tracked and displayed.

## 1. The Philosophy: A Stateful Log

A core architectural principle is the separation of the "plan" from the "log."

*   **The Plan (Static Blueprint)**: For each workflow type, a static JSON file defines the `taskSequence`—the complete, ordered list of all possible steps. This is the "to-do list" and the single source of truth for what a workflow *can* entail.

*   **The Log (Dynamic State)**: The application database, specifically the `task_executions` table, serves as the single source of truth for the *state* of the workflow. It is a stateful, append-only log of what has happened.

When a new workflow is initiated, the backend reads the static blueprint and **bulk-creates all possible tasks** for that workflow in the `task_executions` table, each with an initial status of `PENDING`.

As the `n8n` engine and AI agents perform work, they report back to the API, which **updates the status** of the corresponding `task_executions` record (e.g., to `IN_PROGRESS`, `COMPLETED`, or `FAILED`) and stores the results.

## 2. Frontend Architecture

The frontend is a [Next.js](https://nextjs.org/) application built with [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), and [Tailwind CSS](https://tailwindcss.com/).

### Display Logic

Because the database now holds the state for all tasks (pending, in-progress, or completed), the frontend's display logic is greatly simplified.

To render a workflow's task list, the frontend simply:
1.  Fetches all `task_executions` records associated with the given `workflow_id`.
2.  Renders the list, using the `status` of each record to determine its visual representation (e.g., a checkmark for 'COMPLETED', a spinner for 'IN_PROGRESS').

This approach eliminates the need for complex client-side merging logic and ensures the UI is always a direct reflection of the authoritative state in the database.

### Component Structure

The UI is built from a set of reusable components, primarily using [shadcn/ui](https://ui.shadcn.com/). The core of the Human-in-the-Loop (HIL) interface is the **Dashboard**, which is composed of several key components:

*   `TaskInterruptQueue`: The main inbox for HIL operators, displaying tasks that require manual intervention. It sorts interrupts by priority (`critical` > `standard`) and then by the SLA deadline.
*   `WorkflowOverview`: A high-level view of all active workflows.
*   `TaskProgressPanel`: Shows the status of ongoing, automated tasks.
*   `AgentStatusPanel`: Monitors the health and status of the AI agents.
*   `AgentTaskInterfaceFactory`: A dynamic component that renders the appropriate, specialized UI for a given agent when a HIL operator needs to handle a task. For example, it will show a document viewer and data entry form for an `Iris` task, or an email editor for a `Mia` task.
*   `TaskResolutionPanel`: A generic component embedded within the agent interfaces that provides a standardized way for HIL operators to resolve a task (e.g., complete, retry, escalate).

### State Management & Real-Time Updates

*   **State Management**: We use [Zustand](https://zustand-demo.pmnd.rs/) for managing global client-side state. It provides a simple, unopinionated, and scalable solution for managing UI state, user information, and the local cache of workflow data.
*   **Real-Time Updates**: The application uses **tRPC subscriptions** over WebSockets to receive real-time updates from the backend. A `InterruptWebSocketService` class manages the connection, handles incoming messages (e.g., `NEW_INTERRUPT`, `TASK_UPDATED`), and dispatches actions to the Zustand store to keep the UI in sync. This ensures the HIL dashboard is always live and requires no manual refreshing.

## 3. Universal Audit System

Every important action taken in the system is recorded in a single `audit_events` table. This provides a comprehensive and unified log for compliance, debugging, and analytics.

### What is Logged?

*   **Human Actions**: UI interactions like creating a workflow, updating a task, or viewing a sensitive document.
*   **Agent Actions**: Every task an agent starts, completes, or fails is logged with performance metrics (e.g., processing time, confidence score).
*   **System Actions**: Automated processes like SLA breach checks or database maintenance.
*   **Authentication**: All successful and failed login attempts.

### How it Works

*   **API Middleware**: An audit middleware automatically intercepts all non-GET API requests and logs the action, the actor (human or agent), and the affected resources.
*   **Agent SDK**: The base class for all AI agents includes built-in hooks to automatically log the start, success, or failure of every task they perform.
*   **Manual Logging**: For critical system events not captured by the API, we use a simple `logAuditEvent()` function.

This universal audit trail is invaluable for understanding exactly what happened in the system, who did it, and when.