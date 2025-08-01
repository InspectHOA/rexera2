'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Play, Clock, CheckCircle, XCircle } from 'lucide-react';

import { formatWorkflowIdWithType, type WorkflowStatus, type TaskStatus } from '@rexera/shared';

import { api } from '@/lib/api/client';
import { useWorkflow, taskExecutionKeys } from '@/lib/hooks/use-workflows';
import type { WorkflowData } from '@/types/workflow';
import { WorkflowHeader } from '@/app/workflow/_components/workflow-header';
import { TaskList } from '@/app/workflow/_components/task-list';
import { TabNavigation } from '@/app/workflow/_components/tab-navigation';
import { TaskDetailView } from '@/app/workflow/_components/task-detail-view';
import { FileUpload } from '@/app/workflow/_components/file-upload';
import { DocumentList } from '@/app/workflow/_components/document-list';
import { NotesTab } from '@/app/workflow/_components/notes/notes-tab';
import { ActivityFeed } from '@/app/dashboard/_components/activity-feed';
import { EmailInterface } from '@/app/agents/_components/mia/email-interface';
import { CounterpartySelector } from '@/app/agents/_components/nina/counterparty-selector';
import { DocumentExtractor } from '@/app/agents/_components/iris/document-extractor';
import { ChatInterface } from '@/app/agents/_components/ria/chat-interface';

// Types
interface Task {
  id: string;
  name: string;
  agent: string;
  status: string;
  meta: string;
  sla: string;
  conditional?: boolean;
}

interface Workflow {
  id: string;
  rawId?: string;
  title: string;
  subtitle: string;
  status: string;
  eta: string;
  due: string;
  closing: string;
  progress: string;
}

export default function WorkflowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [rightPanelTab, setRightPanelTab] = useState('task-details');
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [n8nError, setN8nError] = useState<string | null>(null);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);

  const queryClient = useQueryClient();
  const { workflow: workflowData, taskExecutions: taskExecutionsData, loading, error } = useWorkflow(params.id as string);

  // n8n workflow trigger mutation - must be at top level to follow Rules of Hooks
  const triggerN8nMutation = useMutation({
    mutationFn: async () => {
      const workflowTyped = workflowData as WorkflowData | undefined;
      if (!workflowTyped?.id) throw new Error('No workflow ID');
      return api.workflows.triggerN8nWorkflow(
        workflowTyped.id,
        workflowTyped.workflow_type || 'BASIC_TEST'
      );
    },
    onSuccess: () => {
      // Invalidate queries for real-time updates - consistent with useWorkflow pattern
      queryClient.invalidateQueries({ queryKey: ['workflow', params.id] });
      queryClient.invalidateQueries({ queryKey: taskExecutionKeys.list({ workflow_id: params.id as string }) });
      setN8nError(null);
    },
    onError: (error) => {
      console.error('Failed to start n8n workflow:', error);
      setN8nError(error instanceof Error ? error.message : 'Failed to start n8n workflow');
    }
  });
  
  // Track when we've initially loaded to prevent flashing
  useEffect(() => {
    if (!loading && (workflowData || error)) {
      const timer = setTimeout(() => {
        setHasInitiallyLoaded(true);
      }, 300); // Small delay to ensure smooth transition
      return () => clearTimeout(timer);
    }
  }, [loading, workflowData, error]);

  
  // Transform API data to component format
  const workflowTyped = workflowData as WorkflowData | undefined;
  const workflow: Workflow | null = workflowTyped ? {
    id: formatWorkflowIdWithType(workflowTyped.id, workflowTyped.workflow_type),
    rawId: workflowTyped.id, // Add the raw UUID for API calls
    title: workflowTyped.title || 'Workflow Details',
    subtitle: `${formatWorkflowIdWithType(workflowTyped.id, workflowTyped.workflow_type)} • ${getDisplayWorkflowType(workflowTyped.workflow_type || 'PAYOFF_REQUEST')} - ${workflowTyped.client?.name || 'Unknown Client'}`,
    status: workflowTyped.status || 'PENDING', // Use raw status for dropdown
    eta: formatDateTime(workflowTyped.due_date),
    due: formatDate(workflowTyped.due_date),
    closing: formatDate(workflowTyped.metadata?.closing_date || null),
    progress: `${taskExecutionsData?.filter((t: any) => t.status === 'COMPLETED').length || 0} of ${taskExecutionsData?.length || 0} task executions${taskExecutionsData ? '' : ' (loading...)'}`
  } : null;

  // Update browser tab title with workflow address
  useEffect(() => {
    if (workflow?.title && workflow.title !== 'Workflow Details') {
      document.title = workflow.title;
    } else if (workflowTyped?.id) {
      document.title = `Workflow ${workflowTyped.id}`;
    }
    
    // Cleanup: restore default title when component unmounts
    return () => {
      document.title = 'Rexera HIL Dashboard';
    };
  }, [workflow?.title, workflowTyped?.id]);

  const tasks: Task[] = taskExecutionsData && taskExecutionsData.length > 0 ? taskExecutionsData.map((task: any) => ({
    id: task.id,
    name: cleanTaskName(task.title),
    agent: getAgentDisplay(task),
    status: getTaskStatus(task.status),
    meta: getTaskMeta(task),
    sla: getSlaStatus(task),
    conditional: task.metadata?.conditional || false
  })) : [];

  function cleanTaskName(title: string) {
    // Remove "Task 1 - ", "Task 2 - ", etc. from the beginning
    let cleaned = title.replace(/^Task \d+\s*-\s*/, '');
    // Remove "Agent " prefix (e.g., "Agent Nina: Research" → "Nina: Research")
    cleaned = cleaned.replace(/^Agent\s+/, '');
    return cleaned;
  }

  function getDisplayWorkflowType(type: string) {
    const typeMap: Record<string, string> = {
      'PAYOFF_REQUEST': 'Payoff Request',
      'HOA_ACQUISITION': 'HOA Documents', 
      'MUNI_LIEN_SEARCH': 'Municipal Lien'
    };
    return typeMap[type] || type;
  }

  function getDisplayStatus(status: string) {
    const statusMap: Record<WorkflowStatus, string> = {
      'NOT_STARTED': 'Not Started',
      'IN_PROGRESS': 'In Progress', 
      'BLOCKED': 'Blocked',
      'WAITING_FOR_CLIENT': 'Waiting for Client',
      'COMPLETED': 'Completed'
    };
    return statusMap[status as WorkflowStatus] || status;
  }

  function getTaskStatus(status: string) {
    const statusMap: Record<TaskStatus, string> = {
      'COMPLETED': 'completed',
      'INTERRUPT': 'interrupted',
      'NOT_STARTED': 'pending',
      'IN_PROGRESS': 'pending',
      'FAILED': 'interrupted'
    };
    return statusMap[status as TaskStatus] || 'pending';
  }

  function getAgentDisplay(task: any) {
    // Extract agent name from the agents relationship or task metadata
    if (task.agents?.name) {
      return task.agents.name.toLowerCase();
    }
    
    // Fallback: extract from title if it contains agent name
    const title = task.title || '';
    if (title.includes('Mia') || title.includes('mia')) return 'mia';
    if (title.includes('Nina') || title.includes('nina')) return 'nina';
    if (title.includes('Iris') || title.includes('iris')) return 'iris';
    if (title.includes('Ria') || title.includes('ria')) return 'ria';
    if (title.includes('Rex') || title.includes('rex')) return 'rex';
    
    return 'unknown';
  }

  function getTaskMeta(task: any) {
    const COMPLETED_STATUS: TaskStatus = 'COMPLETED';
    const INTERRUPT_STATUS: TaskStatus = 'INTERRUPT';
    
    if (task.status === COMPLETED_STATUS && task.completed_at) {
      return `Completed ${formatDateTime(task.completed_at)}`;
    }
    if (task.status === INTERRUPT_STATUS) {
      return `INTERRUPT • ${task.metadata?.failure_reason || ' No Details'}`;
    }
    if (task.due_date) {
      return `Due ${formatDate(task.due_date)}`;
    }
    return task.description || 'In progress';
  }

  function getSlaStatus(task: any) {
    if (!task.due_date) return 'TBD';
    
    const due = new Date(task.due_date);
    const now = new Date();
    
    if (task.status === 'COMPLETED') {
      return task.completed_at && new Date(task.completed_at) <= due ? 'ON TIME' : 'LATE';
    }
    
    if (now > due) return 'LATE';
    
    const hoursLeft = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60));
    if (hoursLeft <= 2) return 'DUE SOON';
    
    return 'ON TIME';
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return 'TBD';
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  }

  function formatDateTime(dateStr: string | null) {
    if (!dateStr) return 'TBD';
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  if (loading || !hasInitiallyLoaded) {
    return (
      <div className="min-h-[600px] flex items-center justify-center bg-background">
        <div className="text-center space-y-6 animate-fade-in">
          <div className="w-16 h-16 mx-auto relative">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-spin"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin" style={{ animationDuration: '1s' }}></div>
            <div className="absolute inset-2 bg-primary/10 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Play className="w-6 h-6 text-primary animate-pulse" />
            </div>
          </div>
          <h3 className="text-lg font-medium text-foreground animate-pulse">
            Loading Workflow...
          </h3>
        </div>
      </div>
    );
  }

  if (error || !workflow) {
    return (
      <div className="flex justify-center items-center h-96 text-destructive">
        {error || 'Workflow not found'}
      </div>
    );
  }

  const handleStartN8nWorkflow = () => {
    setN8nError(null);
    triggerN8nMutation.mutate();
  };

  const handleBackClick = () => router.push('/dashboard' as any);

  return (
    <div className="min-h-screen bg-rexera-gradient relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-noise-texture opacity-20" />
      <div className="relative z-10 p-4 flex flex-col h-screen">
        <WorkflowHeader workflow={workflow} onBackClick={handleBackClick} />
        <div className="relative flex-grow" style={{ height: 'calc(100vh - 120px)' }}>
          <button
            onClick={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
            className="absolute top-1/2 z-20 bg-background border border-border rounded-full p-1 shadow-md hover:bg-muted transition-all duration-300 ease-in-out"
            style={{
              left: isLeftPanelCollapsed ? '24px' : '40%',
              transform: `translate(-50%, -50%) ${isLeftPanelCollapsed ? 'rotate(180deg)' : ''}`,
            }}
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>

          <div className={`grid ${isLeftPanelCollapsed ? 'grid-cols-[0fr_1fr]' : 'grid-cols-[40%_1fr]'} h-full transition-all duration-300 ease-in-out gap-4`}>
            {/* Left Panel */}
            <div className="bg-background/80 backdrop-blur-sm shadow-2xl rounded-lg border border-border/50 flex flex-col overflow-hidden">
              <div className="flex-shrink-0">
                <TaskList
                  tasks={tasks}
                  selectedTask={selectedTask}
                  onTaskClick={setSelectedTask}
                  progress={workflow.progress}
                />
              </div>
              <div className="flex-1 border-t border-border/50 p-4 space-y-4 overflow-y-auto">
                <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
                <TabContent
                  activeTab={activeTab}
                  workflowData={workflowTyped}
                  onStartN8nWorkflow={handleStartN8nWorkflow}
                  isStartingN8n={triggerN8nMutation.isPending}
                  n8nError={n8nError}
                />
              </div>
            </div>

            {/* Right Panel */}
            <div className="bg-background/80 backdrop-blur-sm shadow-2xl rounded-lg border border-border/50 flex flex-col overflow-hidden">
              {/* Right Panel Tabs */}
              <div className="px-4 py-2 border-b border-border/50 bg-muted flex-shrink-0 flex gap-6">
                <button
                  onClick={() => setRightPanelTab('agent-interface')}
                  className={`text-xs font-semibold uppercase tracking-wider transition-all duration-200 pb-2 border-b-2 ${
                    rightPanelTab === 'agent-interface'
                      ? 'text-foreground border-primary'
                      : 'text-muted-foreground hover:text-foreground border-transparent'
                  }`}
                >
                  {selectedTask && tasks.find(t => t.id === selectedTask)?.agent ? `${tasks.find(t => t.id === selectedTask)?.agent} Interface` : 'Agent Interface'}
                </button>
                <button
                  onClick={() => setRightPanelTab('task-details')}
                  className={`text-xs font-semibold uppercase tracking-wider transition-all duration-200 pb-2 border-b-2 ${
                    rightPanelTab === 'task-details'
                      ? 'text-foreground border-primary'
                      : 'text-muted-foreground hover:text-foreground border-transparent'
                  }`}
                >
                  Task Details
                </button>
              </div>
              
              {/* Right Panel Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {rightPanelTab === 'task-details' && (
                  <TaskDetailView 
                    selectedTask={selectedTask} 
                    tasks={taskExecutionsData || []} 
                    workflowId={workflowTyped?.id}
                  />
                )}
                {rightPanelTab === 'agent-interface' && (
                  <AgentInterfaceView selectedTask={selectedTask} tasks={tasks} workflowId={params.id as string} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabContent({
  activeTab,
  workflowData,
  onStartN8nWorkflow,
  isStartingN8n,
  n8nError
}: {
  activeTab: string;
  workflowData?: WorkflowData;
  onStartN8nWorkflow: () => void;
  isStartingN8n: boolean;
  n8nError: string | null;
}): JSX.Element | null {
  switch (activeTab) {
    case 'details':
      const detailFields = workflowData ? [
        { label: 'Borrower Name', value: workflowData?.metadata?.borrower_name || 'Not specified' },
        { label: 'Lender Name', value: workflowData?.client?.name || 'Unknown' },
        { label: 'Loan Number', value: workflowData?.metadata?.loan_number || 'Not specified', mono: true },
        { label: 'Payoff Date', value: workflowData?.due_date ? new Date(workflowData.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not specified' },
        { label: 'Primary HIL', value: workflowData?.assigned_user?.full_name || 'Unassigned' },
        { label: 'Client', value: workflowData?.client?.name || 'Unknown' }
      ] : [];

      const n8nStatus = (workflowData as any)?.n8n_status || 'not_started';
      const n8nStartedAt = (workflowData as any)?.n8n_started_at;
      
      return (
        <div className="space-y-6">
          {/* Workflow Details */}
          <div className="grid grid-cols-2 gap-4">
            {detailFields.map((field) => (
              <div key={field.label} className="flex flex-col gap-1">
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  {field.label}
                </div>
                <div className={`text-sm text-foreground ${field.mono ? 'font-mono' : ''}`}>
                  {field.value}
                </div>
              </div>
            ))}
          </div>

          {/* n8n Workflow Controls */}
          <div className="border-t border-border pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-foreground">n8n Workflow Automation</h3>
              <div className="flex items-center gap-2">
                {n8nStatus === 'not_started' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                    Not Started
                  </span>
                )}
                {n8nStatus === 'running' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    <Clock className="w-3 h-3 mr-1" />
                    Running
                  </span>
                )}
                {n8nStatus === 'success' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Completed
                  </span>
                )}
                {n8nStatus === 'error' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
                    <XCircle className="w-3 h-3 mr-1" />
                    Error
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col gap-1">
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  n8n Status
                </div>
                <div className="text-sm text-foreground capitalize">
                  {n8nStatus.replace('_', ' ')}
                </div>
              </div>
              {n8nStartedAt && (
                <div className="flex flex-col gap-1">
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    n8n Started At
                  </div>
                  <div className="text-sm text-foreground">
                    {new Date(n8nStartedAt).toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            {n8nError && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <div className="text-sm text-destructive">
                  <strong>Error:</strong> {n8nError}
                </div>
              </div>
            )}

            <button
              onClick={onStartN8nWorkflow}
              disabled={isStartingN8n || n8nStatus === 'running' || n8nStatus === 'success'}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-foreground transition-colors ${
                isStartingN8n || n8nStatus === 'running' || n8nStatus === 'success'
                  ? 'bg-muted cursor-not-allowed'
                  : 'bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary'
              }`}
            >
              {isStartingN8n ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Starting n8n Workflow...
                </>
              ) : n8nStatus === 'running' ? (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  n8n Workflow Running
                </>
              ) : n8nStatus === 'success' ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  n8n Workflow Completed
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Workflow
                </>
              )}
            </button>
          </div>
        </div>
      );
    
    case 'files':
      return (
        <div className="space-y-5">
          <FileUpload
            workflowId={workflowData?.id || ''}
            onUploadComplete={() => {}}
          />
          <DocumentList
            workflowId={workflowData?.id || ''}
            onDocumentDeleted={() => {}}
          />
        </div>
      );
    
    case 'audit':
      return <ActivityFeed workflowId={workflowData?.id} />;
    
    case 'notes':
      return <NotesTab workflowId={workflowData?.id || ''} />;
    
    default:
      return null;
  }
}

function AgentInterfaceView({ selectedTask, tasks, workflowId }: { selectedTask: string | null; tasks: Task[]; workflowId: string }): JSX.Element {
  if (!selectedTask) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-3">
            🤖
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">Agent Interface</h3>
          <p className="text-sm text-muted-foreground">
            Select a task to view the associated agent interface.
          </p>
        </div>
      </div>
    );
  }

  const task = tasks.find(t => t.id === selectedTask);
  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-3">
            🤖
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">Agent Interface</h3>
          <p className="text-sm text-muted-foreground">
            Task not found.
          </p>
        </div>
      </div>
    );
  }

  // Get the agent name and normalize it for comparison
  const agentName = task.agent.toLowerCase();

  // Route to appropriate agent interface based on agent name
  const renderAgentInterface = () => {
    switch (agentName) {
      case 'mia':
        return (
          <EmailInterface
            agentId="mia"
            workflowId={workflowId}
          />
        );
      
      case 'nina':
        return (
          <CounterpartySelector
            agentId="nina"
            workflowId={workflowId}
          />
        );
      
      case 'iris':
        return (
          <DocumentExtractor
            agentId="iris"
            workflowId={workflowId}
          />
        );
      
      case 'ria':
        return (
          <ChatInterface
            agentId="ria"
            workflowId={workflowId}
          />
        );
      
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-3">
                🤖
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">Agent Interface</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Connected to agent: <span className="font-medium">{task.agent}</span>
              </p>
              <div className="bg-muted border border-border rounded-lg p-4">
                <div className="text-sm text-muted-foreground">
                  Interface not available for agent &quot;{task.agent}&quot;.
                  <br />
                  Available agents: Mia, Nina, Iris, Ria
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col">
      {renderAgentInterface()}
    </div>
  );
}

function PlaceholderContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-muted-foreground text-sm text-center py-5">
      {children}
    </div>
  );
}