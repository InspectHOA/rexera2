'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { WorkflowHeader } from '@/components/workflow/workflow-header';
import { TaskList } from '@/components/workflow/task-list';
import { TabNavigation } from '@/components/workflow/tab-navigation';
import { TaskDetailView } from '@/components/workflow/task-detail-view';
import { FileUpload } from '@/components/workflow/file-upload';
import { DocumentList } from '@/components/workflow/document-list';
import { useWorkflow } from '@/lib/hooks/useWorkflows';
import { formatWorkflowIdWithType } from '@rexera/shared';
import type { WorkflowData } from '@/types/workflow';
import { EmailInterface } from '@/components/agents/mia/email-interface';
import { CounterpartySelector } from '@/components/agents/nina/counterparty-selector';
import { DocumentExtractor } from '@/components/agents/iris/document-extractor';

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

  const { workflow: workflowData, tasks: tasksData, loading, error } = useWorkflow(params.id as string);
  
  // Transform API data to component format
  const workflow: Workflow | null = workflowData ? {
    id: formatWorkflowIdWithType(workflowData.id, workflowData.workflow_type),
    title: workflowData.title || 'Workflow Details',
    subtitle: `${formatWorkflowIdWithType(workflowData.id, workflowData.workflow_type)} • ${getDisplayWorkflowType(workflowData.workflow_type || 'PAYOFF_REQUEST')} - ${workflowData.clients?.name || 'Unknown Client'}`,
    status: getDisplayStatus(workflowData.status || 'PENDING'),
    eta: formatDateTime(workflowData.due_date),
    due: formatDate(workflowData.due_date),
    closing: formatDate(workflowData.metadata?.closing_date),
    progress: `${tasksData?.filter((t: any) => t.status === 'COMPLETED').length || 0} of ${tasksData?.length || 0} tasks`
  } : null;

  // Update browser tab title with workflow address
  useEffect(() => {
    if (workflow?.title && workflow.title !== 'Workflow Details') {
      document.title = workflow.title;
    } else if (workflowData?.id) {
      document.title = `Workflow ${workflowData.id}`;
    }
    
    // Cleanup: restore default title when component unmounts
    return () => {
      document.title = 'Rexera HIL Dashboard';
    };
  }, [workflow?.title, workflowData?.id]);

  const tasks: Task[] = tasksData && tasksData.length > 0 ? tasksData.map((task: any) => ({
    id: task.id,
    name: task.title,
    agent: getAgentDisplay(task),
    status: getTaskStatus(task.status),
    meta: getTaskMeta(task),
    sla: getSlaStatus(task),
    conditional: task.metadata?.conditional || false
  })) : [];

  function getDisplayWorkflowType(type: string) {
    const typeMap: Record<string, string> = {
      'PAYOFF_REQUEST': 'Payoff Request',
      'HOA_ACQUISITION': 'HOA Documents', 
      'MUNI_LIEN_SEARCH': 'Municipal Lien'
    };
    return typeMap[type] || type;
  }

  function getDisplayStatus(status: string) {
    const statusMap: Record<string, string> = {
      'PENDING': 'Pending',
      'IN_PROGRESS': 'In Progress', 
      'AWAITING_REVIEW': 'Awaiting Review',
      'COMPLETED': 'Completed',
      'BLOCKED': 'Blocked'
    };
    return statusMap[status] || status;
  }

  function getTaskStatus(status: string) {
    const statusMap: Record<string, string> = {
      'COMPLETED': 'completed',
      'AWAITING_REVIEW': 'awaiting-review',
      'PENDING': 'pending',
      'IN_PROGRESS': 'pending',
      'FAILED': 'awaiting-review'
    };
    return statusMap[status] || 'pending';
  }

  function getAgentDisplay(task: any) {
    if (task.executor_type === 'HIL') {
      return 'HIL Monitor';
    }
    
    // Try to get agent name from included agent data first (note: it's "agents" not "agent")
    if (task.agents && task.agents.name) {
      return task.agents.name;
    }
    
    // Fallback to other possible locations for agent name
    const agentName = task.agent_name ||
                     task.metadata?.agent_name ||
                     task.assigned_agent ||
                     task.metadata?.assigned_agent ||
                     'Agent';
    
    return agentName;
  }

  function getTaskMeta(task: any) {
    if (task.status === 'COMPLETED' && task.completed_at) {
      return `Completed ${formatDateTime(task.completed_at)}`;
    }
    if (task.status === 'AWAITING_REVIEW') {
      return `Needs review • ${task.metadata?.failure_reason || 'Low confidence'}`;
    }
    if (task.due_date) {
      return `Due ${formatDate(task.due_date)}`;
    }
    return task.description || 'In progress';
  }

  function getSlaStatus(task: any) {
    if (!task.due_date) return 'SLA: TBD';
    
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96 text-gray-500">
        Loading workflow details...
      </div>
    );
  }

  if (error || !workflow) {
    return (
      <div className="flex justify-center items-center h-96 text-red-500">
        {error || 'Workflow not found'}
      </div>
    );
  }

  const handleBackClick = () => router.push('/dashboard');

  return (
    <div className="min-h-screen bg-rexera-gradient relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-noise-texture opacity-20" />
      <div className="relative z-10 p-4 flex flex-col h-screen">
        <WorkflowHeader workflow={workflow} onBackClick={handleBackClick} />
        <div className="relative flex-grow" style={{ height: 'calc(100vh - 120px)' }}>
          <button
            onClick={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
            className="absolute top-1/2 z-20 bg-white border border-gray-300 rounded-full p-1 shadow-md hover:bg-gray-100 transition-all duration-300 ease-in-out"
            style={{
              left: isLeftPanelCollapsed ? '24px' : '40%',
              transform: `translate(-50%, -50%) ${isLeftPanelCollapsed ? 'rotate(180deg)' : ''}`,
            }}
          >
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </button>

          <div className={`grid ${isLeftPanelCollapsed ? 'grid-cols-[0fr_1fr]' : 'grid-cols-[40%_1fr]'} h-full transition-all duration-300 ease-in-out gap-4`}>
            {/* Left Panel */}
            <div className="bg-white/80 backdrop-blur-sm shadow-2xl rounded-lg border border-gray-200/50 flex flex-col overflow-hidden">
              <div className="flex-shrink-0">
                <TaskList
                  tasks={tasks}
                  selectedTask={selectedTask}
                  onTaskClick={setSelectedTask}
                  progress={workflow.progress}
                />
              </div>
              <div className="flex-1 border-t border-gray-200/50 p-4 space-y-4 overflow-y-auto">
                <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
                <TabContent activeTab={activeTab} workflowData={workflowData} />
              </div>
            </div>

            {/* Right Panel */}
            <div className="bg-white/80 backdrop-blur-sm shadow-2xl rounded-lg border border-gray-200/50 flex flex-col overflow-hidden">
              {/* Right Panel Tabs */}
              <div className="px-4 py-2 border-b border-gray-200/50 bg-gray-100 flex-shrink-0 flex gap-6">
                <button
                  onClick={() => setRightPanelTab('task-details')}
                  className={`text-xs font-semibold uppercase tracking-wider transition-all duration-200 pb-2 border-b-2 ${
                    rightPanelTab === 'task-details'
                      ? 'text-gray-800 border-primary-600'
                      : 'text-gray-500 hover:text-gray-700 border-transparent'
                  }`}
                >
                  Task Details
                </button>
                <button
                  onClick={() => setRightPanelTab('agent-interface')}
                  className={`text-xs font-semibold uppercase tracking-wider transition-all duration-200 pb-2 border-b-2 ${
                    rightPanelTab === 'agent-interface'
                      ? 'text-gray-800 border-primary-600'
                      : 'text-gray-500 hover:text-gray-700 border-transparent'
                  }`}
                >
                  {selectedTask && tasks.find(t => t.id === selectedTask)?.agent ? `${tasks.find(t => t.id === selectedTask)?.agent} Interface` : 'Agent Interface'}
                </button>
              </div>
              
              {/* Right Panel Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {rightPanelTab === 'task-details' && (
                  <TaskDetailView selectedTask={selectedTask} tasks={tasks} />
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

function TabContent({ activeTab, workflowData }: { activeTab: string; workflowData?: WorkflowData }): JSX.Element | null {
  switch (activeTab) {
    case 'details':
      const detailFields = workflowData ? [
        { label: 'Borrower Name', value: workflowData.metadata?.borrower_name || 'Not specified' },
        { label: 'Lender Name', value: workflowData.clients?.name || 'Unknown' },
        { label: 'Loan Number', value: workflowData.metadata?.loan_number || 'Not specified', mono: true },
        { label: 'Payoff Date', value: workflowData.due_date ? new Date(workflowData.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not specified' },
        { label: 'Primary HIL', value: workflowData.assigned_user?.full_name || 'Unassigned' },
        { label: 'Client', value: workflowData.clients?.name || 'Unknown' }
      ] : [];
      
      return (
        <div className="grid grid-cols-2 gap-4">
          {detailFields.map((field) => (
            <div key={field.label} className="flex flex-col gap-1">
              <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                {field.label}
              </div>
              <div className={`text-sm text-gray-900 ${field.mono ? 'font-mono' : ''}`}>
                {field.value}
              </div>
            </div>
          ))}
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
      return <PlaceholderContent>Audit trail content would go here</PlaceholderContent>;
    
    case 'notes':
      return <PlaceholderContent>Notes content would go here</PlaceholderContent>;
    
    default:
      return null;
  }
}

function AgentInterfaceView({ selectedTask, tasks, workflowId }: { selectedTask: string | null; tasks: Task[]; workflowId: string }): JSX.Element {
  if (!selectedTask) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
            🤖
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Agent Interface</h3>
          <p className="text-sm text-gray-600">
            Select a task to view the associated agent interface.
          </p>
        </div>
      </div>
    );
  }

  const task = tasks.find(t => t.id === selectedTask);
  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
            🤖
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Agent Interface</h3>
          <p className="text-sm text-gray-600">
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
      
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
                🤖
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Agent Interface</h3>
              <p className="text-sm text-gray-600 mb-4">
                Connected to agent: <span className="font-medium">{task.agent}</span>
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600">
                  Interface not available for agent "{task.agent}".
                  <br />
                  Available agents: Mia, Nina, Iris
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
    <div className="text-gray-500 text-sm text-center py-5">
      {children}
    </div>
  );
}