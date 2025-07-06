# Reply to Lender Workflow (Stateful)

```mermaid
graph TD
    subgraph "Workflow Initialization"
        A[Incoming Email Trigger] --> B_init[Bulk Create Tasks];
    end

    subgraph "Task 1: Process Lender Email"
        B_init --> B_pre[Update Task to RUNNING];
        B_pre --> B[Mia: Process Email Response];
        B --> B_post[Update Task to COMPLETED/FAILED];
    end

    subgraph "Workflow Completion"
        B_post --> D[Resume Main Workflow];
        D --> E[Webhook Response];
    end