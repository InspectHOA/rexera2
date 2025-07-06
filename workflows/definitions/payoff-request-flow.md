# Payoff Request Workflow (Stateful)

```mermaid
graph TD
    subgraph "Workflow Initialization"
        A[Payoff Request Trigger] --> B_init[Bulk Create Tasks];
    end

    subgraph "Task 1: Identify Lender Contact"
        B_init --> B_pre[Update Task to RUNNING];
        B_pre --> B[Nina: Identify Lender Contact];
        B --> B_post[Update Task to COMPLETED/FAILED];
    end

    subgraph "Task 2: Send Payoff Request"
        B_post --> D{Communication Method Switch};
        D --> E_pre[Update Task to RUNNING];
        E_pre --> E[Max: IVR Request];
        E --> E_post[Update Task to COMPLETED/FAILED];

        D --> F_pre[Update Task to RUNNING];
        F_pre --> F[Florian: Phone Request];
        F --> F_post[Update Task to COMPLETED/FAILED];

        D --> G_pre[Update Task to RUNNING];
        G_pre --> G[Mia: Email Request];
        G --> G_post[Update Task to COMPLETED/FAILED];

        E_post --> H_join;
        F_post --> H_join;
        G_post --> H_join;
    end

    subgraph "Task 3: Extract Payoff Data"
        H_join --> I[Wait for Lender Response];
        I --> J_pre[Update Task to RUNNING];
        J_pre --> J[Iris: Extract Payoff Data];
        J --> J_post[Update Task to COMPLETED/FAILED];
    end

    subgraph "Task 4: Generate Invoice"
        J_post --> L_pre[Update Task to RUNNING];
        L_pre --> L[Kosha: Generate Invoice];
        L --> L_post[Update Task to COMPLETED/FAILED];
    end

    subgraph "Task 5: Update CRM"
        L_post --> N_pre[Update Task to RUNNING];
        N_pre --> N[Ria: Update CRM];
        N --> N_post[Update Task to COMPLETED/FAILED];
    end

    subgraph "Task 6: Notify Client"
        N_post --> P_pre[Update Task to RUNNING];
        P_pre --> P[Mia: Notify Client];
        P --> P_post[Update Task to COMPLETED/FAILED];
    end

    subgraph "Workflow Completion"
        P_post --> R[Workflow Response];
    end