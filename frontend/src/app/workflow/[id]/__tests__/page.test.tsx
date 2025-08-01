/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import WorkflowDetailPage from '../page';
import { useWorkflow } from '@/lib/hooks/use-workflows';
import { api } from '@/lib/api/client';
import type { WorkflowData, TaskExecution } from '@rexera/shared';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn()
}));
jest.mock('@/lib/hooks/use-workflows');
jest.mock('@/lib/api/client');

// Mock child components
jest.mock('../../_components/workflow-header', () => ({
  WorkflowHeader: ({ workflow, onBackClick }: any) => (
    <div data-testid="workflow-header">
      <h1>{workflow.title}</h1>
      <button onClick={onBackClick} data-testid="back-button">Back</button>
    </div>
  )
}));

jest.mock('../../_components/task-list', () => ({
  TaskList: ({ tasks, selectedTask, onTaskClick, progress }: any) => (
    <div data-testid="task-list">
      <div data-testid="progress">{progress}</div>
      {tasks.map((task: any) => (
        <div
          key={task.id}
          data-testid={`task-${task.id}`}
          className={selectedTask === task.id ? 'selected' : ''}
          onClick={() => onTaskClick(task.id)}
        >
          {task.name} - {task.status}
        </div>
      ))}
    </div>
  )
}));

jest.mock('../../_components/tab-navigation', () => ({
  TabNavigation: ({ activeTab, onTabChange }: any) => (
    <div data-testid="tab-navigation">
      {['details', 'files', 'audit', 'notes'].map(tab => (
        <button
          key={tab}
          data-testid={`tab-${tab}`}
          className={activeTab === tab ? 'active' : ''}
          onClick={() => onTabChange(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}));

jest.mock('../../_components/task-detail-view', () => ({
  TaskDetailView: ({ selectedTask, tasks }: any) => (
    <div data-testid="task-detail-view">
      {selectedTask ? `Task Details: ${selectedTask}` : 'No task selected'}
    </div>
  )
}));

jest.mock('../../_components/file-upload', () => ({
  FileUpload: ({ workflowId }: any) => (
    <div data-testid="file-upload">Upload files for {workflowId}</div>
  )
}));

jest.mock('../../_components/document-list', () => ({
  DocumentList: ({ workflowId }: any) => (
    <div data-testid="document-list">Documents for {workflowId}</div>
  )
}));

jest.mock('../../_components/notes/notes-tab', () => ({
  NotesTab: ({ workflowId }: any) => (
    <div data-testid="notes-tab">Notes for {workflowId}</div>
  )
}));

jest.mock('../../../dashboard/_components/activity-feed', () => ({
  ActivityFeed: ({ workflowId }: any) => (
    <div data-testid="activity-feed">Activity for {workflowId}</div>
  )
}));

jest.mock('../../../agents/_components/mia/email-interface', () => ({
  EmailInterface: ({ agentId, workflowId }: any) => (
    <div data-testid="email-interface">Email interface for {agentId} - {workflowId}</div>
  )
}));

jest.mock('../../../agents/_components/nina/counterparty-selector', () => ({
  CounterpartySelector: ({ agentId, workflowId }: any) => (
    <div data-testid="counterparty-selector">Counterparty selector for {agentId} - {workflowId}</div>
  )
}));

jest.mock('../../../agents/_components/iris/document-extractor', () => ({
  DocumentExtractor: ({ agentId, workflowId }: any) => (
    <div data-testid="document-extractor">Document extractor for {agentId} - {workflowId}</div>
  )
}));

jest.mock('../../../agents/_components/ria/chat-interface', () => ({
  ChatInterface: ({ agentId, workflowId }: any) => (
    <div data-testid="chat-interface">Chat interface for {agentId} - {workflowId}</div>
  )
}));

const mockUseParams = useParams as jest.MockedFunction<typeof useParams>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseWorkflow = useWorkflow as jest.MockedFunction<typeof useWorkflow>;
const mockApi = api as jest.Mocked<typeof api>;

// Mock data
const mockWorkflowData: WorkflowData = {
  id: 'wf-123',
  workflow_type: 'HOA_ACQUISITION',
  client_id: 'client-1',
  title: 'Test Workflow Title',
  status: 'IN_PROGRESS',
  priority: 'HIGH',
  created_by: 'user-1',
  created_at: '2024-01-01T10:00:00Z',
  updated_at: '2024-01-01T11:00:00Z',
  completed_at: null,
  due_date: '2024-01-15T10:00:00Z',
  metadata: {
    borrower_name: 'John Doe',
    loan_number: 'LOAN123456',
    ssn: '1234',
    closing_date: '2024-01-20T10:00:00Z'
  },
  client: {
    id: 'client-1',
    name: 'Test Bank',
    domain: 'testbank.com'
  },
  assigned_user: {
    id: 'user-1',
    full_name: 'Jane Smith',
    email: 'jane@example.com'
  }
};

const mockTaskExecutions = [
  {
    id: 'task-1',
    workflow_id: 'wf-123',
    agent_id: 'mia',
    title: 'Send Email',
    description: 'Send initial email to client',
    sequence_order: 1,
    task_type: 'email',
    status: 'COMPLETED',
    interrupt_type: null,
    executor_type: 'AI',
    priority: 'HIGH',
    input_data: {},
    output_data: null,
    error_message: null,
    started_at: '2024-01-01T10:00:00Z',
    completed_at: '2024-01-01T10:30:00Z',
    execution_time_ms: 1800000,
    retry_count: 0,
    created_at: '2024-01-01T10:00:00Z',
    sla_hours: 24,
    sla_due_at: '2024-01-02T10:00:00Z',
    sla_status: 'ON_TIME',
    agents: {
      id: 'mia',
      name: 'Mia',
      type: 'email'
    }
  },
  {
    id: 'task-2',
    workflow_id: 'wf-123',
    agent_id: 'nina',
    title: 'Contact Counterparty',
    description: 'Reach out to HOA',
    sequence_order: 2,
    task_type: 'counterparty',
    status: 'INTERRUPT',
    interrupt_type: 'MANUAL_VERIFICATION',
    executor_type: 'AI',
    priority: 'HIGH',
    input_data: {},
    output_data: null,
    error_message: 'Contact information needed',
    started_at: '2024-01-01T11:00:00Z',
    completed_at: null,
    execution_time_ms: null,
    retry_count: 1,
    created_at: '2024-01-01T10:00:00Z',
    sla_hours: 48,
    sla_due_at: '2024-01-03T10:00:00Z',
    sla_status: 'AT_RISK',
    agents: {
      id: 'nina',
      name: 'Nina',
      type: 'counterparty'
    },
    metadata: {
      failure_reason: 'Missing contact details'
    }
  }
] as any[];

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn()
};

describe('WorkflowDetailPage', () => {
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
    mockUseParams.mockReturnValue({ id: 'wf-123' });
    mockUseRouter.mockReturnValue(mockRouter);
    mockUseWorkflow.mockReturnValue({
      workflow: mockWorkflowData,
      taskExecutions: mockTaskExecutions,
      loading: false,
      error: null,
      refetch: jest.fn(),
      createTaskExecution: jest.fn(),
      createTaskExecutionAsync: jest.fn(),
      isCreatingTaskExecution: false
    });

    // Mock API
    mockApi.workflows = {
      triggerN8nWorkflow: jest.fn().mockResolvedValue({ success: true })
    } as any;

    // Mock timers for loading delay
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <WorkflowDetailPage />
      </QueryClientProvider>
    );
  };

  describe('Component Rendering', () => {
    it('should render loading state initially', () => {
      mockUseWorkflow.mockReturnValue({
        workflow: undefined,
        taskExecutions: [],
        loading: true,
        error: null,
        refetch: jest.fn(),
        createTaskExecution: jest.fn(),
        createTaskExecutionAsync: jest.fn(),
        isCreatingTaskExecution: false
      });

      renderComponent();

      expect(screen.getByText('Loading Workflow...')).toBeInTheDocument();
    });

    it('should render workflow content after loading', async () => {
      renderComponent();

      // Fast forward the loading delay
      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByTestId('workflow-header')).toBeInTheDocument();
        expect(screen.getByText('Test Workflow Title')).toBeInTheDocument();
      });
    });

    it('should render error state when workflow fails to load', async () => {
      mockUseWorkflow.mockReturnValue({
        workflow: undefined,
        taskExecutions: [],
        loading: false,
        error: 'Workflow not found',
        refetch: jest.fn(),
        createTaskExecution: jest.fn(),
        createTaskExecutionAsync: jest.fn(),
        isCreatingTaskExecution: false
      });

      renderComponent();

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByText('Workflow not found')).toBeInTheDocument();
      });
    });
  });

  describe('Task List Integration', () => {
    it('should render task list with correct task data', async () => {
      renderComponent();

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByTestId('task-list')).toBeInTheDocument();
        expect(screen.getByTestId('task-task-1')).toBeInTheDocument();
        expect(screen.getByTestId('task-task-2')).toBeInTheDocument();
      });

      expect(screen.getByText('Send Email - completed')).toBeInTheDocument();
      expect(screen.getByText('Contact Counterparty - interrupted')).toBeInTheDocument();
    });

    it('should show correct progress information', async () => {
      renderComponent();

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByTestId('progress')).toHaveTextContent('1 of 2 task executions');
      });
    });

    it('should handle task selection', async () => {
      renderComponent();

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByTestId('task-task-1')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('task-task-1'));

      await waitFor(() => {
        expect(screen.getByTestId('task-task-1')).toHaveClass('selected');
      });
    });
  });

  describe('Tab Navigation', () => {
    it('should render all tabs', async () => {
      renderComponent();

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByTestId('tab-details')).toBeInTheDocument();
        expect(screen.getByTestId('tab-files')).toBeInTheDocument();
        expect(screen.getByTestId('tab-audit')).toBeInTheDocument();
        expect(screen.getByTestId('tab-notes')).toBeInTheDocument();
      });
    });

    it('should switch between tabs', async () => {
      renderComponent();

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByTestId('tab-details')).toHaveClass('active');
      });

      fireEvent.click(screen.getByTestId('tab-files'));

      await waitFor(() => {
        expect(screen.getByTestId('tab-files')).toHaveClass('active');
        expect(screen.getByTestId('file-upload')).toBeInTheDocument();
        expect(screen.getByTestId('document-list')).toBeInTheDocument();
      });
    });

    it('should show correct content for each tab', async () => {
      renderComponent();

      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Details tab (default)
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument(); // borrower_name
        expect(screen.getByText('LOAN123456')).toBeInTheDocument(); // loan_number
      });

      // Files tab
      fireEvent.click(screen.getByTestId('tab-files'));
      await waitFor(() => {
        expect(screen.getByTestId('file-upload')).toBeInTheDocument();
        expect(screen.getByTestId('document-list')).toBeInTheDocument();
      });

      // Audit tab
      fireEvent.click(screen.getByTestId('tab-audit'));
      await waitFor(() => {
        expect(screen.getByTestId('activity-feed')).toBeInTheDocument();
      });

      // Notes tab
      fireEvent.click(screen.getByTestId('tab-notes'));
      await waitFor(() => {
        expect(screen.getByTestId('notes-tab')).toBeInTheDocument();
      });
    });
  });

  describe('Right Panel - Agent Interface', () => {
    it('should show no task selected message initially', async () => {
      renderComponent();

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByText('Agent Interface')).toBeInTheDocument();
      });
    });

    it('should show agent interface when task is selected', async () => {
      renderComponent();

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByTestId('task-task-1')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('task-task-1'));

      // Switch to agent interface tab (should now show "Mia Interface")
      await waitFor(() => {
        expect(screen.getByText('Mia Interface')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Mia Interface'));

      await waitFor(() => {
        expect(screen.getByTestId('email-interface')).toBeInTheDocument();
      });
    });

    it('should show correct agent interfaces for different agents', async () => {
      renderComponent();

      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Select Mia task
      await waitFor(() => {
        expect(screen.getByTestId('task-task-1')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('task-task-1'));
      await waitFor(() => {
        expect(screen.getByText('Mia Interface')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Mia Interface'));
      await waitFor(() => {
        expect(screen.getByTestId('email-interface')).toBeInTheDocument();
      });

      // Select Nina task
      fireEvent.click(screen.getByTestId('task-task-2'));
      await waitFor(() => {
        expect(screen.getByText('Nina Interface')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Nina Interface'));
      await waitFor(() => {
        expect(screen.getByTestId('counterparty-selector')).toBeInTheDocument();
      });
    });
  });

  describe('N8n Workflow Integration', () => {
    it('should render n8n workflow controls', async () => {
      renderComponent();

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByText('n8n Workflow Automation')).toBeInTheDocument();
        expect(screen.getByText('Start Workflow')).toBeInTheDocument();
      });
    });

    it('should trigger n8n workflow when button is clicked', async () => {
      renderComponent();

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByText('Start Workflow')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Start Workflow'));

      await waitFor(() => {
        expect(mockApi.workflows.triggerN8nWorkflow).toHaveBeenCalledWith(
          'wf-123',
          'HOA_ACQUISITION'
        );
      });
    });

    it('should show error when n8n trigger fails', async () => {
      (mockApi.workflows.triggerN8nWorkflow as jest.Mock).mockRejectedValue(new Error('Network error'));

      renderComponent();

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByText('Start Workflow')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Start Workflow'));

      await waitFor(() => {
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Navigation', () => {
    it('should navigate back to dashboard when back button is clicked', async () => {
      renderComponent();

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByTestId('back-button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('back-button'));

      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('Document Title Management', () => {
    it('should update document title with workflow title', async () => {
      renderComponent();

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(document.title).toBe('Test Workflow Title');
      });
    });

    it('should restore default title on unmount', async () => {
      const { unmount } = renderComponent();

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(document.title).toBe('Test Workflow Title');
      });

      unmount();

      expect(document.title).toBe('Rexera HIL Dashboard');
    });
  });

  describe('Real-time Updates', () => {
    it('should call useWorkflow hook with correct workflow ID', () => {
      renderComponent();

      expect(mockUseWorkflow).toHaveBeenCalledWith('wf-123');
    });

    it('should invalidate queries after successful n8n trigger', async () => {
      const invalidateQueries = jest.spyOn(queryClient, 'invalidateQueries');

      renderComponent();

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByText('Start Workflow')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Start Workflow'));

      await waitFor(() => {
        expect(invalidateQueries).toHaveBeenCalled();
        expect(invalidateQueries).toHaveBeenCalledWith(
          expect.objectContaining({
            queryKey: expect.arrayContaining(['workflow', 'wf-123'])
          })
        );
      });
    });
  });
});