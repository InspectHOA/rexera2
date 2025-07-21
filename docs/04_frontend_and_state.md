# Frontend, Logging, & State

This document explains the architecture of the Rexera 2.0 frontend, including its component structure, state management, and the underlying philosophy of how application state is tracked and displayed.

## 1. The Philosophy: A Stateful Log

A core architectural principle is the separation of the "plan" from the "log."

*   **The Log (Dynamic State)**: The application database, specifically the `task_executions` table, serves as the single source of truth for the *plan* and *state* of the workflow. It is a stateful, append-only log of what will happen and has happened.

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

*   `InterruptQueue`: The main inbox for HIL operators, displaying notifications that require manual intervention. It filters notifications by type (`TASK_INTERRUPT`, `SLA_WARNING`) and displays them with priority styling.
*   `DashboardHeader`: Contains the notification tray with bell icon, unread count, and 24-hour notification history.
*   `WorkflowTable`: A comprehensive view of all active workflows with sorting, filtering, and search capabilities.
*   `AgentTaskInterfaceFactory`: A dynamic component that renders the appropriate, specialized UI for a given agent when a HIL operator needs to handle a task. For example, it will show a document viewer and data entry form for an `Iris` task, or an email editor for a `Mia` task.
*   `TaskResolutionPanel`: A generic component embedded within the agent interfaces that provides a standardized way for HIL operators to resolve a task (e.g., complete, retry, escalate).

**Document Management Components:**
*   `DocumentManager`: Advanced document management with pagination, bulk operations, filtering, and inline tag editing.
*   `DocumentList`: Simple document listing for basic workflows with essential operations.
*   `FileUploadWithTags`: Enhanced file upload with drag-and-drop, multi-file selection, and predefined tag assignment.
*   `PredefinedTagSelector`: Reusable tag selection component with search, keyboard navigation, and validation.
*   `DocumentTagEditor`: Inline and full-mode tag editing for existing documents with real-time updates.

**HIL Notes Components:**
*   `NotesTab`: Main notes interface in workflow detail view with threading, mentions, and priority management.
*   `MentionInput`: Advanced text input with @username autocomplete, user search, and mention parsing.
*   Integrates with `useUnifiedNotifications` for real-time `HIL_MENTION` delivery and toast notifications.

**Notification System Components:**
*   `NotificationProvider`: Global provider that initializes real-time toast notifications
*   Uses `usePersistentNotifications` for 24-hour notification persistence
*   Uses `useNotifications` for immediate toast feedback (5-second duration, 3 toast limit)

### State Management & Real-Time Updates

*   **State Management**: We use [Zustand](https://zustand-demo.pmnd.rs/) for managing global client-side state. It provides a simple, unopinionated, and scalable solution for managing UI state, user information, and the local cache of workflow data.
*   **Real-Time Updates**: The application uses Supabase Realtime subscriptions to receive live updates from the database. These subscriptions automatically trigger UI updates when tasks change status or new interrupts are created, ensuring the HIL dashboard is always current without manual refreshing.

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