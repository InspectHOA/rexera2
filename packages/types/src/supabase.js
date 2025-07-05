"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Constants = void 0;
exports.Constants = {
    graphql_public: {
        Enums: {},
    },
    public: {
        Enums: {
            alert_level: ["GREEN", "YELLOW", "ORANGE", "RED"],
            call_direction: ["INBOUND", "OUTBOUND"],
            counterparty_type: [
                "hoa",
                "lender",
                "municipality",
                "utility",
                "tax_authority",
            ],
            email_direction: ["INBOUND", "OUTBOUND"],
            email_status: ["SENT", "DELIVERED", "READ", "BOUNCED", "FAILED"],
            executor_type: ["AI", "HIL"],
            invoice_status: ["DRAFT", "FINALIZED", "PAID", "VOID"],
            notification_type: [
                "WORKFLOW_UPDATE",
                "TASK_INTERRUPT",
                "HIL_MENTION",
                "CLIENT_MESSAGE_RECEIVED",
                "COUNTERPARTY_MESSAGE_RECEIVED",
                "SLA_WARNING",
                "AGENT_FAILURE",
            ],
            priority_level: ["LOW", "NORMAL", "HIGH", "URGENT"],
            sender_type: ["CLIENT", "INTERNAL"],
            sla_status: ["ON_TIME", "AT_RISK", "BREACHED"],
            sla_tracking_status: ["ACTIVE", "COMPLETED", "BREACHED", "PAUSED"],
            task_status: ["PENDING", "AWAITING_REVIEW", "COMPLETED", "FAILED"],
            thread_status: ["ACTIVE", "RESOLVED", "ARCHIVED"],
            user_type: ["client_user", "hil_user"],
            workflow_counterparty_status: [
                "PENDING",
                "CONTACTED",
                "RESPONDED",
                "COMPLETED",
            ],
            workflow_status: [
                "PENDING",
                "IN_PROGRESS",
                "AWAITING_REVIEW",
                "BLOCKED",
                "COMPLETED",
            ],
            workflow_type: ["MUNI_LIEN_SEARCH", "HOA_ACQUISITION", "PAYOFF"],
        },
    },
};
