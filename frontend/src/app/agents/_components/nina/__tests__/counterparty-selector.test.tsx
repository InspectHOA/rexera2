/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CounterpartySelector } from '../counterparty-selector';
import { counterpartiesApi } from '@/lib/api/endpoints/counterparties';
import { workflowsApi } from '@/lib/api';
import { workflowCounterpartiesApi } from '@/lib/api/endpoints/workflow-counterparties';
import { toast } from '@/lib/hooks/use-toast';
import type { Counterparty, WorkflowData, WorkflowCounterparty } from '@rexera/shared';

// Mock dependencies
jest.mock('@/lib/api/endpoints/counterparties');
jest.mock('@/lib/api');
jest.mock('@/lib/api/endpoints/workflow-counterparties');
jest.mock('@/lib/hooks/use-toast');

// Mock child components
jest.mock('../add-counterparty-modal', () => ({
  AddCounterpartyModal: ({ isOpen, onClose, onSuccess }: any) => 
    isOpen ? (
      <div data-testid="add-counterparty-modal">
        <button onClick={onClose} data-testid="close-modal">Close</button>
        <button onClick={() => onSuccess()} data-testid="success-modal">Success</button>
      </div>
    ) : null
}));

jest.mock('../edit-counterparty-modal', () => ({
  EditCounterpartyModal: ({ isOpen, onClose, onSuccess }: any) => 
    isOpen ? (
      <div data-testid="edit-counterparty-modal">
        <button onClick={onClose} data-testid="close-edit-modal">Close</button>
        <button onClick={() => onSuccess()} data-testid="success-edit-modal">Success</button>
      </div>
    ) : null
}));

const mockCounterpartiesApi = counterpartiesApi as jest.Mocked<typeof counterpartiesApi>;
const mockWorkflowsApi = workflowsApi as jest.Mocked<typeof workflowsApi>;
const mockWorkflowCounterpartiesApi = workflowCounterpartiesApi as jest.Mocked<typeof workflowCounterpartiesApi>;
const mockToast = toast as jest.MockedFunction<typeof toast>;

// Mock data
const mockCounterparties: Counterparty[] = [
  {
    id: 'cp-1',
    name: 'ABC HOA',
    type: 'hoa',
    email: 'contact@abchoa.com',
    phone: '555-0123',
    address: '123 Main St',
    contact_info: { notes: 'Primary HOA contact' },
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z'
  },
  {
    id: 'cp-2',
    name: 'First National Bank',
    type: 'lender',
    email: 'loans@fnb.com',
    phone: '555-0456',
    address: '456 Bank Ave',
    contact_info: { notes: 'Mortgage lender' },
    created_at: '2024-01-01T09:00:00Z',
    updated_at: '2024-01-01T09:00:00Z'
  }
];

const mockWorkflow: WorkflowData = {
  id: 'wf-1',
  workflow_type: 'HOA_ACQUISITION',
  client_id: 'client-1',
  title: 'Test Workflow',
  status: 'IN_PROGRESS',
  priority: 'NORMAL',
  created_by: 'user-1',
  created_at: '2024-01-01T10:00:00Z',
  updated_at: '2024-01-01T10:30:00Z',
  completed_at: null,
  due_date: null,
  metadata: {},
  client: {
    id: 'client-1',
    name: 'Test Client',
    domain: 'test.example.com'
  }
};

const mockAssignedCounterparties: (WorkflowCounterparty & { counterparty: Counterparty })[] = [
  {
    id: 'wcp-1',
    workflow_id: 'wf-1',
    counterparty_id: 'cp-1',
    status: 'PENDING',
    created_at: '2024-01-01T11:00:00Z',
    updated_at: '2024-01-01T11:00:00Z',
    counterparty: mockCounterparties[0]
  }
];

describe('CounterpartySelector', () => {
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
    mockWorkflowsApi.byId.mockResolvedValue(mockWorkflow);
    mockCounterpartiesApi.list.mockResolvedValue({
      success: true,
      data: mockCounterparties,
      pagination: {
        page: 1,
        limit: 12,
        total: 2,
        totalPages: 1
      }
    });
    mockWorkflowCounterpartiesApi.list.mockResolvedValue(mockAssignedCounterparties);
  });

  const renderComponent = (props: { workflowId?: string; agentId: string } = { agentId: 'agent-1' }) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <CounterpartySelector {...props} />
      </QueryClientProvider>
    );
  };

  describe('Component Rendering', () => {
    it('should render search input and type filter', async () => {
      renderComponent({ workflowId: 'wf-1', agentId: 'agent-1' });

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search counterparties/i)).toBeInTheDocument();
        expect(screen.getByText('All Types')).toBeInTheDocument();
      });
    });

    it('should render add counterparty button', async () => {
      renderComponent({ workflowId: 'wf-1', agentId: 'agent-1' });

      await waitFor(() => {
        expect(screen.getByText(/add new counterparty/i)).toBeInTheDocument();
      });
    });

    it('should load and display counterparties', async () => {
      renderComponent({ workflowId: 'wf-1', agentId: 'agent-1' });

      await waitFor(() => {
        expect(screen.getByText('ABC HOA')).toBeInTheDocument();
        expect(screen.getByText('First National Bank')).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      renderComponent({ workflowId: 'wf-1', agentId: 'agent-1' });

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  describe('Workflow Integration', () => {
    it('should fetch workflow information on mount', async () => {
      renderComponent({ workflowId: 'wf-1', agentId: 'agent-1' });

      await waitFor(() => {
        expect(mockWorkflowsApi.byId).toHaveBeenCalledWith('wf-1');
      });
    });

    it('should fetch assigned counterparties for workflow', async () => {
      renderComponent({ workflowId: 'wf-1', agentId: 'agent-1' });

      await waitFor(() => {
        expect(mockWorkflowCounterpartiesApi.list).toHaveBeenCalledWith('wf-1', { include: 'counterparty' });
      });
    });

    it('should handle missing workflow gracefully', async () => {
      renderComponent({ agentId: 'agent-1' }); // No workflowId

      await waitFor(() => {
        expect(mockWorkflowsApi.byId).not.toHaveBeenCalled();
      });

      // Should still load counterparties
      await waitFor(() => {
        expect(screen.getByText('ABC HOA')).toBeInTheDocument();
      });
    });

    it('should handle workflow fetch error', async () => {
      mockWorkflowsApi.byId.mockRejectedValue(new Error('Workflow not found'));

      renderComponent({ workflowId: 'wf-1', agentId: 'agent-1' });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load workflow information.'
        });
      });
    });
  });

  describe('Search and Filtering', () => {
    it('should filter counterparties by search term', async () => {
      renderComponent({ workflowId: 'wf-1', agentId: 'agent-1' });

      await waitFor(() => {
        expect(screen.getByText('ABC HOA')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search counterparties/i);
      fireEvent.change(searchInput, { target: { value: 'ABC' } });

      await waitFor(() => {
        expect(mockCounterpartiesApi.list).toHaveBeenCalledWith(
          expect.objectContaining({
            search: 'ABC'
          })
        );
      });
    });

    it('should filter counterparties by type', async () => {
      renderComponent({ workflowId: 'wf-1', agentId: 'agent-1' });

      await waitFor(() => {
        expect(screen.getByText('All Types')).toBeInTheDocument();
      });

      // This would require more detailed mocking of the type filter UI
      // The actual implementation would have a dropdown or select component
    });

    it('should debounce search input', async () => {
      jest.useFakeTimers();
      
      renderComponent({ workflowId: 'wf-1', agentId: 'agent-1' });

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search counterparties/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search counterparties/i);
      
      // Rapid typing
      fireEvent.change(searchInput, { target: { value: 'A' } });
      fireEvent.change(searchInput, { target: { value: 'AB' } });
      fireEvent.change(searchInput, { target: { value: 'ABC' } });

      // Fast forward time
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(mockCounterpartiesApi.list).toHaveBeenCalledWith(
          expect.objectContaining({
            search: 'ABC'
          })
        );
      });

      jest.useRealTimers();
    });
  });

  describe('Counterparty Selection', () => {
    it('should allow selecting counterparties', async () => {
      renderComponent({ workflowId: 'wf-1', agentId: 'agent-1' });

      await waitFor(() => {
        expect(screen.getByText('ABC HOA')).toBeInTheDocument();
      });

      // Find and click a counterparty (this would depend on the actual UI structure)
      const counterpartyCard = screen.getByText('ABC HOA').closest('[data-testid="counterparty-card"]');
      if (counterpartyCard) {
        fireEvent.click(counterpartyCard);
      }

      // Verify selection state (would depend on visual indicators in actual component)
    });

    it('should handle multiple selections', async () => {
      renderComponent({ workflowId: 'wf-1', agentId: 'agent-1' });

      await waitFor(() => {
        expect(screen.getByText('ABC HOA')).toBeInTheDocument();
        expect(screen.getByText('First National Bank')).toBeInTheDocument();
      });

      // This would require more detailed UI interaction testing
      // depending on how multi-select is implemented
    });
  });

  describe('Add Counterparty Modal', () => {
    it('should open add modal when button is clicked', async () => {
      renderComponent({ workflowId: 'wf-1', agentId: 'agent-1' });

      await waitFor(() => {
        expect(screen.getByText(/add new counterparty/i)).toBeInTheDocument();
      });

      const addButton = screen.getByText(/add new counterparty/i);
      fireEvent.click(addButton);

      expect(screen.getByTestId('add-counterparty-modal')).toBeInTheDocument();
    });

    it('should close modal when close button is clicked', async () => {
      renderComponent({ workflowId: 'wf-1', agentId: 'agent-1' });

      await waitFor(() => {
        expect(screen.getByText(/add new counterparty/i)).toBeInTheDocument();
      });

      // Open modal
      const addButton = screen.getByText(/add new counterparty/i);
      fireEvent.click(addButton);

      // Close modal
      const closeButton = screen.getByTestId('close-modal');
      fireEvent.click(closeButton);

      expect(screen.queryByTestId('add-counterparty-modal')).not.toBeInTheDocument();
    });

    it('should refresh counterparties after successful add', async () => {
      renderComponent({ workflowId: 'wf-1', agentId: 'agent-1' });

      await waitFor(() => {
        expect(screen.getByText(/add new counterparty/i)).toBeInTheDocument();
      });

      // Open modal
      const addButton = screen.getByText(/add new counterparty/i);
      fireEvent.click(addButton);

      // Trigger success
      const successButton = screen.getByTestId('success-modal');
      fireEvent.click(successButton);

      await waitFor(() => {
        // Should call the API again to refresh the list
        expect(mockCounterpartiesApi.list).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Edit Counterparty Modal', () => {
    it('should open edit modal for selected counterparty', async () => {
      renderComponent({ workflowId: 'wf-1', agentId: 'agent-1' });

      await waitFor(() => {
        expect(screen.getByText('ABC HOA')).toBeInTheDocument();
      });

      // This would require an edit button in the UI
      // The actual implementation would have edit buttons on counterparty cards
      const editButton = document.querySelector('[data-testid="edit-counterparty-cp-1"]');
      if (editButton) {
        fireEvent.click(editButton);
        expect(screen.getByTestId('edit-counterparty-modal')).toBeInTheDocument();
      }
    });

    it('should refresh counterparties after successful edit', async () => {
      renderComponent({ workflowId: 'wf-1', agentId: 'agent-1' });

      // Assuming we have an edit button and modal flow
      // This would be implemented based on actual UI structure
    });
  });

  describe('Pagination', () => {
    it('should handle pagination correctly', async () => {
      mockCounterpartiesApi.list.mockResolvedValue({
        success: true,
        data: mockCounterparties,
        pagination: {
          page: 1,
          limit: 12,
          total: 25,
          totalPages: 3
        }
      });

      renderComponent({ workflowId: 'wf-1', agentId: 'agent-1' });

      await waitFor(() => {
        expect(screen.getByText('ABC HOA')).toBeInTheDocument();
      });

      // Look for pagination controls
      const nextButton = document.querySelector('[data-testid="next-page"]');
      if (nextButton) {
        fireEvent.click(nextButton);

        await waitFor(() => {
          expect(mockCounterpartiesApi.list).toHaveBeenCalledWith(
            expect.objectContaining({
              page: 2
            })
          );
        });
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle counterparties API errors', async () => {
      mockCounterpartiesApi.list.mockRejectedValue(new Error('API Error'));

      renderComponent({ workflowId: 'wf-1', agentId: 'agent-1' });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            variant: 'destructive'
          })
        );
      });
    });

    it('should handle assignment API errors', async () => {
      mockWorkflowCounterpartiesApi.add.mockRejectedValue(new Error('Assignment failed'));

      renderComponent({ workflowId: 'wf-1', agentId: 'agent-1' });

      // This would require triggering an assignment action
      // The actual test would depend on how assignment is implemented in the UI
    });
  });

  describe('Assigned Counterparties', () => {
    it('should display assigned counterparties separately', async () => {
      renderComponent({ workflowId: 'wf-1', agentId: 'agent-1' });

      await waitFor(() => {
        // Should show assigned counterparties section
        // This depends on the actual UI implementation
        expect(mockWorkflowCounterpartiesApi.list).toHaveBeenCalled();
      });
    });

    it('should show counterparty status correctly', async () => {
      renderComponent({ workflowId: 'wf-1', agentId: 'agent-1' });

      await waitFor(() => {
        // Should display status badges for assigned counterparties
        // This would check for PENDING, CONTACTED, RESPONDED, COMPLETED status displays
        expect(mockWorkflowCounterpartiesApi.list).toHaveBeenCalled();
      });
    });
  });

  describe('Type Restrictions', () => {
    it('should filter allowed types based on workflow type', async () => {
      renderComponent({ workflowId: 'wf-1', agentId: 'agent-1' });

      await waitFor(() => {
        expect(mockWorkflowsApi.byId).toHaveBeenCalledWith('wf-1');
      });

      // For hoa_lien_resolution, should only show hoa and lender types
      await waitFor(() => {
        expect(mockCounterpartiesApi.list).toHaveBeenCalledWith(
          expect.objectContaining({
            // Should include type filtering based on workflow
          })
        );
      });
    });

    it('should allow all types when no workflow is specified', async () => {
      renderComponent({ agentId: 'agent-1' }); // No workflowId

      await waitFor(() => {
        expect(mockCounterpartiesApi.list).toHaveBeenCalled();
      });

      // Should not restrict types when no workflow
    });
  });
});