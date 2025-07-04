// tRPC router type definition for the frontend
// This would normally be imported from a shared package

export interface WorkflowsRouter {
  list: {
    query: (input: {
      workflow_type?: string;
      status?: string;
      client_id?: string;
      assigned_to?: string;
      priority?: string;
      page?: number;
      limit?: number;
      include?: string[];
    }) => Promise<{
      data: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>;
  };
  byId: {
    query: (input: {
      id: string;
      include?: string[];
    }) => Promise<any>;
  };
  create: {
    mutation: (input: any) => Promise<any>;
  };
}

export interface TasksRouter {
  list: {
    query: (input: {
      workflow_id?: string;
      status?: string;
      executor_type?: string;
      assigned_to?: string;
      priority?: string;
      page?: number;
      limit?: number;
      include?: string[];
    }) => Promise<{
      data: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>;
  };
  create: {
    mutation: (input: any) => Promise<any>;
  };
}

export interface HealthRouter {
  check: {
    query: () => Promise<{
      status: string;
      timestamp: string;
      data: any;
    }>;
  };
}

export interface AppRouter {
  workflows: WorkflowsRouter;
  tasks: TasksRouter;
  health: HealthRouter;
}