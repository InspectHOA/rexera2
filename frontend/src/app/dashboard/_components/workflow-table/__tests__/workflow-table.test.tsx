/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WorkflowTable } from '../workflow-table';
import { useWorkflows } from '@/lib/hooks/use-workflows';
import { useWorkflowTableState } from '@/lib/hooks/use-workflow-table-state';
import { useWorkflowTransformation } from '@/lib/hooks/use-workflow-transformation';
import type { WorkflowData } from '@rexera/shared';

// Mock dependencies
jest.mock('@/lib/hooks/use-workflows');
jest.mock('@/lib/hooks/use-workflow-table-state');
jest.mock('@/lib/hooks/use-workflow-transformation');

// Mock child components
jest.mock('../workflow-filters', () => ({
  WorkflowFilters: ({ onClearFilters }: any) => (
    <div data-testid="workflow-filters">
      <button onClick={onClearFilters} data-testid="clear-filters">Clear Filters</button>
    </div>
  )
}));

jest.mock('../workflow-table-header', () => ({
  WorkflowTableHeader: ({ onSort }: any) => (
    <thead data-testid="workflow-table-header">
      <tr>
        <th>
          <button onClick={() => onSort('created_at')} data-testid="sort-created">
            Created At
          </button>
        </th>
      </tr>
    </thead>
  )
}));

jest.mock('../workflow-row', () => ({
  WorkflowRow: ({ workflow, isEven }: any) => (
    <tr data-testid={`workflow-row-${workflow.workflowId}`} className={isEven ? 'even' : 'odd'}>
      <td>{workflow.workflowId}</td>
      <td>{workflow.workflowType}</td>
      <td>{workflow.status}</td>
    </tr>
  )
}));

jest.mock('../workflow-pagination', () => ({
  WorkflowPagination: ({ onPageChange, currentPage }: any) => (
    <div data-testid="workflow-pagination">
      <button onClick={() => onPageChange(2)} data-testid="page-2">
        Page 2
      </button>
      <span>Current: {currentPage}</span>
    </div>
  )
}));

const mockUseWorkflows = useWorkflows as jest.MockedFunction<typeof useWorkflows>;
const mockUseWorkflowTableState = useWorkflowTableState as jest.MockedFunction<typeof useWorkflowTableState>;
const mockUseWorkflowTransformation = useWorkflowTransformation as jest.MockedFunction<typeof useWorkflowTransformation>;

// Mock workflow data
const mockWorkflowData: WorkflowData[] = [
  {
    id: 'wf-1',
    workflow_type: 'HOA_ACQUISITION',
    client_id: 'client-1',
    title: 'Test Workflow 1',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    created_by: 'user-1',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:30:00Z',
    completed_at: null,
    due_date: null,
    metadata: {},
    client: {
      id: 'client-1',
      name: 'Test Client 1',
      domain: 'test1.example.com'
    }
  },
  {
    id: 'wf-2',
    workflow_type: 'MUNI_LIEN_SEARCH',
    client_id: 'client-2',
    title: 'Test Workflow 2',
    status: 'COMPLETED',
    priority: 'NORMAL',
    created_by: 'user-1',
    created_at: '2024-01-01T09:00:00Z',
    updated_at: '2024-01-01T11:00:00Z',
    completed_at: '2024-01-01T11:00:00Z',
    due_date: null,
    metadata: {},
    client: {
      id: 'client-2',
      name: 'Test Client 2',
      domain: 'test2.example.com'
    }
  }
];

const mockTransformedWorkflows = [
  {
    workflowId: 'wf-1',
    workflowType: 'HOA Lien Resolution',
    status: 'RUNNING',
    priority: 'HIGH',
    clientName: 'Test Client 1',
    created_at: '2024-01-01T10:00:00Z'
  },
  {
    workflowId: 'wf-2',
    workflowType: 'Municipal Lien Resolution',
    status: 'COMPLETED',
    priority: 'NORMAL',
    clientName: 'Test Client 2',
    created_at: '2024-01-01T09:00:00Z'
  }
];

const mockPagination = {
  page: 1,
  limit: 20,
  total: 2,
  totalPages: 1
};

// Mock table state handlers
const mockHandlers = {
  handleSort: jest.fn(),
  handleFilterTypeChange: jest.fn(),
  handleFilterStatusChange: jest.fn(),
  handleFilterInterruptsChange: jest.fn(),
  handleSearchChange: jest.fn(),
  handleClearFilters: jest.fn(),
  handlePageChange: jest.fn(),
  getBackendFilters: jest.fn(() => ({})),
  getSortIndicator: jest.fn(() => null)
};

describe('WorkflowTable', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    // Default mock implementations
    mockUseWorkflowTableState.mockReturnValue({
      filterType: '',
      filterStatus: '',
      filterInterrupts: '',
      searchQuery: '',
      currentPage: 1,
      ...mockHandlers
    } as any);

    mockUseWorkflows.mockReturnValue({
      workflows: mockWorkflowData,
      loading: false,
      error: null,
      pagination: mockPagination
    } as any);

    mockUseWorkflowTransformation.mockReturnValue(mockTransformedWorkflows as any);
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <WorkflowTable />
      </QueryClientProvider>
    );
  };

  describe('Component Rendering', () => {
    it('should render workflow table with data', () => {
      renderComponent();

      expect(screen.getByTestId('workflow-filters')).toBeInTheDocument();
      expect(screen.getByTestId('workflow-table-header')).toBeInTheDocument();
      expect(screen.getByTestId('workflow-row-wf-1')).toBeInTheDocument();
      expect(screen.getByTestId('workflow-row-wf-2')).toBeInTheDocument();
      expect(screen.getByTestId('workflow-pagination')).toBeInTheDocument();
    });

    it('should render workflow rows with correct alternating styling', () => {
      renderComponent();

      const firstRow = screen.getByTestId('workflow-row-wf-1');
      const secondRow = screen.getByTestId('workflow-row-wf-2');

      expect(firstRow).toHaveClass('even');
      expect(secondRow).toHaveClass('odd');
    });

    it('should pass correct props to child components', () => {
      renderComponent();

      // Verify filters component receives state
      expect(screen.getByTestId('workflow-filters')).toBeInTheDocument();

      // Verify pagination shows current page
      expect(screen.getByText('Current: 1')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading skeleton when workflows are loading', () => {
      mockUseWorkflows.mockReturnValue({
        workflows: null,
        loading: true,
        error: null,
        pagination: null
      } as any);

      renderComponent();

      // Check for shimmer elements in skeleton
      const shimmerElements = document.querySelectorAll('.shimmer');
      expect(shimmerElements.length).toBeGreaterThan(0);
    });

    it('should show skeleton with correct structure', () => {
      mockUseWorkflows.mockReturnValue({
        workflows: null,
        loading: true,
        error: null,
        pagination: null
      } as any);

      const { container } = renderComponent();

      // Check skeleton has proper layout
      const skeleton = container.querySelector('.bg-background.rounded-lg.border');
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error message when workflows fail to load', () => {
      mockUseWorkflows.mockReturnValue({
        workflows: null,
        loading: false,
        error: 'Database connection failed',
        pagination: null
      } as any);

      renderComponent();

      expect(screen.getByText('Error loading workflows')).toBeInTheDocument();
      expect(screen.getByText('Database connection failed')).toBeInTheDocument();
    });

    it('should style error message correctly', () => {
      mockUseWorkflows.mockReturnValue({
        workflows: null,
        loading: false,
        error: 'Network error',
        pagination: null
      } as any);

      renderComponent();

      const errorTitle = screen.getByText('Error loading workflows');
      expect(errorTitle).toHaveClass('text-destructive');
      expect(errorTitle).toHaveClass('text-lg');
      expect(errorTitle).toHaveClass('font-medium');
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no workflows exist', () => {
      mockUseWorkflows.mockReturnValue({
        workflows: [],
        loading: false,
        error: null,
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
      } as any);

      mockUseWorkflowTransformation.mockReturnValue([]);

      renderComponent();

      expect(screen.getByText('No workflows found')).toBeInTheDocument();
      expect(screen.getByText('Workflows will appear here once they are created.')).toBeInTheDocument();
    });

    it('should show filtered empty state when filters are active', () => {
      mockUseWorkflowTableState.mockReturnValue({
        filterType: 'hoa_lien_resolution',
        filterStatus: '',
        filterInterrupts: '',
        searchQuery: 'test',
        currentPage: 1,
        ...mockHandlers
      } as any);

      mockUseWorkflows.mockReturnValue({
        workflows: [],
        loading: false,
        error: null,
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
      } as any);

      mockUseWorkflowTransformation.mockReturnValue([]);

      renderComponent();

      expect(screen.getByText('No workflows match your filters')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search criteria or clearing filters.')).toBeInTheDocument();
      expect(screen.getByText('Clear all filters')).toBeInTheDocument();
    });

    it('should clear filters when clear button is clicked', () => {
      mockUseWorkflowTableState.mockReturnValue({
        filterType: 'hoa_lien_resolution',
        filterStatus: 'RUNNING',
        filterInterrupts: '',
        searchQuery: 'test',
        currentPage: 1,
        ...mockHandlers
      } as any);

      mockUseWorkflows.mockReturnValue({
        workflows: [],
        loading: false,
        error: null,
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
      } as any);

      mockUseWorkflowTransformation.mockReturnValue([]);

      renderComponent();

      const clearButton = screen.getByText('Clear all filters');
      fireEvent.click(clearButton);

      expect(mockHandlers.handleClearFilters).toHaveBeenCalled();
    });
  });

  describe('Filtering and Sorting', () => {
    it('should handle sort actions', () => {
      renderComponent();

      const sortButton = screen.getByTestId('sort-created');
      fireEvent.click(sortButton);

      expect(mockHandlers.handleSort).toHaveBeenCalledWith('created_at');
    });

    it('should handle filter clearing', () => {
      renderComponent();

      const clearFiltersButton = screen.getByTestId('clear-filters');
      fireEvent.click(clearFiltersButton);

      expect(mockHandlers.handleClearFilters).toHaveBeenCalled();
    });
  });

  describe('Pagination', () => {
    it('should handle page changes', () => {
      renderComponent();

      const pageButton = screen.getByTestId('page-2');
      fireEvent.click(pageButton);

      expect(mockHandlers.handlePageChange).toHaveBeenCalledWith(2);
    });

    it('should not show pagination when no pagination data', () => {
      mockUseWorkflows.mockReturnValue({
        workflows: mockWorkflowData,
        loading: false,
        error: null,
        pagination: null
      } as any);

      renderComponent();

      expect(screen.queryByTestId('workflow-pagination')).not.toBeInTheDocument();
    });
  });

  describe('Data Integration', () => {
    it('should call useWorkflows with backend filters', () => {
      const mockFilters = { type: 'hoa_lien_resolution', status: 'RUNNING' };
      mockHandlers.getBackendFilters.mockReturnValue(mockFilters);

      renderComponent();

      expect(mockUseWorkflows).toHaveBeenCalledWith(mockFilters);
    });

    it('should transform workflows correctly', () => {
      renderComponent();

      expect(mockUseWorkflowTransformation).toHaveBeenCalledWith(
        mockWorkflowData,
        '', // filterInterrupts
        '', // searchQuery
        ''  // filterStatus
      );
    });

    it('should handle non-array workflow data gracefully', () => {
      mockUseWorkflows.mockReturnValue({
        workflows: null,
        loading: false,
        error: null,
        pagination: mockPagination
      } as any);

      renderComponent();

      expect(mockUseWorkflowTransformation).toHaveBeenCalledWith(
        [], // Should pass empty array for null data
        '', '', ''
      );
    });
  });

  describe('Table Structure', () => {
    it('should have proper table markup', () => {
      renderComponent();

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      expect(table).toHaveClass('min-w-full');
      expect(table).toHaveClass('divide-y');
      expect(table).toHaveClass('divide-border');
    });

    it('should have proper table body styling', () => {
      renderComponent();

      const tbody = document.querySelector('tbody');
      expect(tbody).toHaveClass('bg-background');
      expect(tbody).toHaveClass('divide-y');
      expect(tbody).toHaveClass('divide-border/50');
    });

    it('should handle overflow with scroll', () => {
      renderComponent();

      const tableContainer = document.querySelector('.overflow-x-auto');
      expect(tableContainer).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive container styling', () => {
      renderComponent();

      const container = document.querySelector('.bg-background.rounded-lg.border');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('border-border');
    });

    it('should handle table overflow on small screens', () => {
      renderComponent();

      const scrollContainer = document.querySelector('.overflow-x-auto');
      expect(scrollContainer).toBeInTheDocument();
    });
  });

  describe('Integration with Hooks', () => {
    it('should integrate with workflow table state hook', () => {
      renderComponent();

      expect(mockUseWorkflowTableState).toHaveBeenCalled();
    });

    it('should integrate with workflows hook', () => {
      renderComponent();

      expect(mockUseWorkflows).toHaveBeenCalled();
    });

    it('should integrate with workflow transformation hook', () => {
      renderComponent();

      expect(mockUseWorkflowTransformation).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('should use workflow ID as React key for rows', () => {
      renderComponent();

      const firstRow = screen.getByTestId('workflow-row-wf-1');
      const secondRow = screen.getByTestId('workflow-row-wf-2');

      expect(firstRow).toBeInTheDocument();
      expect(secondRow).toBeInTheDocument();
    });

    it('should calculate even/odd rows correctly', () => {
      const manyWorkflows = Array.from({ length: 5 }, (_, i) => ({
        workflowId: `wf-${i}`,
        workflowType: 'Test Type',
        status: 'RUNNING',
        priority: 'NORMAL',
        clientName: `Client ${i}`,
        created_at: '2024-01-01T10:00:00Z'
      }));

      mockUseWorkflowTransformation.mockReturnValue(manyWorkflows as any);

      renderComponent();

      // Check alternating pattern
      expect(screen.getByTestId('workflow-row-wf-0')).toHaveClass('even');
      expect(screen.getByTestId('workflow-row-wf-1')).toHaveClass('odd');
      expect(screen.getByTestId('workflow-row-wf-2')).toHaveClass('even');
      expect(screen.getByTestId('workflow-row-wf-3')).toHaveClass('odd');
      expect(screen.getByTestId('workflow-row-wf-4')).toHaveClass('even');
    });
  });
});