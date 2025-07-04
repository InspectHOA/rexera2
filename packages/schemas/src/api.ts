import { z } from 'zod';

// =====================================================
// COMMON API SCHEMAS
// =====================================================

// Generic API response schemas
export const ApiError = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    field: z.string().optional(),
    details: z.record(z.any()).optional()
  }),
  timestamp: z.string()
});

export const ApiSuccess = z.object({
  success: z.literal(true),
  data: z.any(),
  timestamp: z.string()
});

export const ApiResponse = z.union([ApiSuccess, ApiError]);

// Pagination schemas
export const PaginationParams = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20)
});

export const PaginationResponse = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number()
});

// =====================================================
// DASHBOARD API SCHEMAS
// =====================================================

export const DashboardStatsResponse = z.object({
  total_workflows: z.number(),
  active_workflows: z.number(),
  completed_workflows: z.number(),
  pending_hil_tasks: z.number(),
  agent_health: z.object({
    healthy: z.number(),
    degraded: z.number(),
    unhealthy: z.number()
  }),
  sla_metrics: z.object({
    on_time: z.number(),
    at_risk: z.number(),
    breached: z.number()
  })
});

export const InterruptQueueResponse = z.object({
  data: z.array(z.object({
    id: z.string(),
    workflow_id: z.string(),
    task_id: z.string(),
    priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
    created_at: z.string(),
    title: z.string(),
    description: z.string().optional(),
    workflow_title: z.string(),
    client_name: z.string()
  })),
  pagination: PaginationResponse
});

export const ActivityFeedResponse = z.object({
  data: z.array(z.object({
    id: z.string(),
    type: z.enum(['workflow_created', 'task_completed', 'hil_intervention', 'agent_error', 'sla_warning']),
    title: z.string(),
    description: z.string(),
    timestamp: z.string(),
    workflow_id: z.string().optional(),
    task_id: z.string().optional(),
    user_id: z.string().optional(),
    metadata: z.record(z.any()).optional()
  })),
  pagination: PaginationResponse
});

// =====================================================
// REAL-TIME API SCHEMAS
// =====================================================

export const WebSocketMessage = z.object({
  type: z.string(),
  payload: z.any(),
  timestamp: z.string()
});

export const SubscriptionRequest = z.object({
  event: z.string(),
  filters: z.record(z.any()).optional()
});

// =====================================================
// FILE UPLOAD SCHEMAS
// =====================================================

export const FileUploadRequest = z.object({
  workflow_id: z.string(),
  file_name: z.string(),
  file_type: z.string(),
  file_size: z.number().max(10 * 1024 * 1024), // 10MB max
  metadata: z.record(z.any()).optional()
});

export const FileUploadResponse = z.object({
  file_id: z.string(),
  upload_url: z.string(),
  expires_at: z.string()
});

// =====================================================
// SEARCH/FILTER SCHEMAS
// =====================================================

export const WorkflowQueryParams = z.object({
  workflow_type: z.enum(['HOA_ACQUISITION', 'MUNICIPAL_LIEN_SEARCH', 'PAYOFF_REQUEST']).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'AWAITING_REVIEW', 'COMPLETED', 'FAILED', 'CANCELLED']).optional(),
  client_id: z.string().uuid().optional(),
  assigned_to: z.string().uuid().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  created_after: z.string().optional(),
  created_before: z.string().optional(),
  include: z.array(z.enum(['client', 'tasks', 'assigned_user'])).default([])
}).merge(PaginationParams);

export const TaskQueryParams = z.object({
  workflow_id: z.string().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED', 'AWAITING_REVIEW']).optional(),
  executor_type: z.enum(['AI', 'HIL']).optional(),
  assigned_to: z.string().uuid().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  due_before: z.string().optional(),
  include: z.array(z.enum(['assigned_user', 'executions', 'dependencies', 'workflow'])).default([])
}).merge(PaginationParams);

// =====================================================
// TRPC ROUTER TYPES
// =====================================================

// Define AppRouter interface for tRPC client
export interface AppRouter {
  workflows: {
    list: {
      useQuery: (input: {
        workflow_type?: 'MUNI_LIEN_SEARCH' | 'HOA_ACQUISITION' | 'PAYOFF';
        status?: 'PENDING' | 'IN_PROGRESS' | 'AWAITING_REVIEW' | 'BLOCKED' | 'COMPLETED';
        client_id?: string;
        assigned_to?: string;
        priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
        page?: number;
        limit?: number;
        include?: string[];
      }) => {
        data: {
          data: any[];
          pagination: PaginationResponse;
        } | undefined;
        isLoading: boolean;
        error: any;
        refetch: () => void;
      };
    };
    byId: {
      useQuery: (
        input: {
          id: string;
          include?: string[];
        },
        options?: { enabled?: boolean }
      ) => {
        data: any;
        isLoading: boolean;
        error: any;
        refetch: () => void;
      };
    };
    create: {
      useMutation: () => any;
    };
  };
  tasks: {
    list: {
      useQuery: (
        input: {
          workflow_id?: string;
          status?: 'PENDING' | 'AWAITING_REVIEW' | 'COMPLETED' | 'FAILED';
          executor_type?: 'AI' | 'HIL';
          assigned_to?: string;
          priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
          page?: number;
          limit?: number;
          include?: string[];
        },
        options?: { enabled?: boolean }
      ) => {
        data: {
          data: any[];
          pagination: PaginationResponse;
        } | undefined;
        isLoading: boolean;
        error: any;
        refetch: () => void;
      };
    };
    create: {
      useMutation: () => any;
    };
  };
  health: {
    check: {
      useQuery: () => any;
    };
  };
}

// Type exports
export type ApiError = z.infer<typeof ApiError>;
export type ApiSuccess<T = any> = Omit<z.infer<typeof ApiSuccess>, 'data'> & { data: T };
export type ApiResponse<T = any> = ApiSuccess<T> | z.infer<typeof ApiError>;
export type PaginationParams = z.infer<typeof PaginationParams>;
export type PaginationResponse = z.infer<typeof PaginationResponse>;
export type DashboardStatsResponse = z.infer<typeof DashboardStatsResponse>;
export type InterruptQueueResponse = z.infer<typeof InterruptQueueResponse>;
export type ActivityFeedResponse = z.infer<typeof ActivityFeedResponse>;
export type WebSocketMessage = z.infer<typeof WebSocketMessage>;
export type SubscriptionRequest = z.infer<typeof SubscriptionRequest>;
export type FileUploadRequest = z.infer<typeof FileUploadRequest>;
export type FileUploadResponse = z.infer<typeof FileUploadResponse>;
export type WorkflowQueryParams = z.infer<typeof WorkflowQueryParams>;
export type TaskQueryParams = z.infer<typeof TaskQueryParams>;