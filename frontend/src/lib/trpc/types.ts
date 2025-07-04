// Local AppRouter type definition to avoid build-time import issues
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
          pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
          };
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
          pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
          };
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