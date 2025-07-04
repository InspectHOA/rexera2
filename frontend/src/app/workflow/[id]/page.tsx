'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { WorkflowHeader } from '@/components/workflow/workflow-header';
import { TaskList } from '@/components/workflow/task-list';
import { TabNavigation } from '@/components/workflow/tab-navigation';
import { TaskDetailView } from '@/components/workflow/task-detail-view';
import { FileUpload } from '@/components/workflow/file-upload';
import { DocumentList } from '@/components/workflow/document-list';
import { useWorkflowTRPC } from '@/lib/hooks/useWorkflowsTRPC';

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

  const { workflow: workflowData, tasks: tasksData, loading, error } = useWorkflowTRPC(params.id as string);
  
  // Transform API data to component format
  const workflow: Workflow | null = workflowData ? {
    id: workflowData.id,
    title: workflowData.title || 'Workflow Details',
    subtitle: `${workflowData.id} • ${getDisplayWorkflowType(workflowData.workflow_type)} - ${workflowData.client?.name || 'Unknown Client'}`,
    status: getDisplayStatus(workflowData.status),
    eta: formatDateTime(workflowData.due_date),
    due: formatDate(workflowData.due_date),
    closing: formatDate(workflowData.metadata?.closing_date),
    progress: `${tasksData?.filter(t => t.status === 'COMPLETED').length || 0} of ${tasksData?.length || 0} tasks`
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

  const tasks = tasksData?.map((task: any) => ({
    id: task.id,
    name: task.title,
    agent: getAgentDisplay(task),
    status: getTaskStatus(task.status),
    meta: getTaskMeta(task),
    sla: getSlaStatus(task),
    conditional: task.metadata?.conditional || false
  })) || [];

  function getDisplayWorkflowType(type: string) {
    const typeMap: Record<string, string> = {
      'PAYOFF': 'Payoff Request',
      'HOA_ACQUISITION': 'HOA Documents', 
      'MUNI_LIEN_SEARCH': 'Municipal Lien'
    };
    return typeMap[type] || type;
  }

  function getDisplayStatus(status: string) {
    const statusMap: Record<string, string> = {
      'PENDING': 'In Progress',
      'IN_PROGRESS': 'In Progress', 
      'AWAITING_REVIEW': 'Urgent',
      'COMPLETED': 'Completed',
      'BLOCKED': 'Urgent'
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
      return '👤 HIL Monitor';
    }
    
    const agentName = task.metadata?.agent_name || 'Agent';
    const agentIcons: Record<string, string> = {
      'Nina': '🔍 Nina',
      'Mia': '📧 Mia', 
      'Florian': '🗣️ Florian',
      'Rex': '🌐 Rex',
      'Iris': '📄 Iris',
      'Ria': '🤝 Ria',
      'Kosha': '💰 Kosha',
      'Cassy': '✓ Cassy',
      'Max': '📞 Max',
      'Corey': '🏢 Corey'
    };
    
    return agentIcons[agentName] || `🤖 ${agentName}`;
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
    <div className="page-container">
      <WorkflowHeader workflow={workflow} onBackClick={handleBackClick} />
      
      <div className="main-grid">
        {/* Left Panel */}
        <div className="panel border-r overflow-y-auto custom-scrollbar">
          <div className="panel-header">
            📋 Workflow Details
          </div>
          
          <div className="content-padding space-y-6">
            <TaskList
              tasks={tasks}
              selectedTask={selectedTask}
              onTaskClick={setSelectedTask}
              progress={workflow.progress}
            />
            
            <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
            
            <TabContent activeTab={activeTab} workflow={workflowData} />
          </div>
        </div>

        {/* Right Panel */}
        <div className="panel overflow-y-auto custom-scrollbar">
          <div className="panel-header">
            📋 Task Details
            <span className="text-gray-400 text-xs font-normal normal-case tracking-normal">
              {selectedTask ? 'Task selected' : 'Select a task to view details'}
            </span>
          </div>
          
          <TaskDetailView selectedTask={selectedTask} tasks={tasks} />
        </div>
      </div>
    </div>
  );
}

function TabContent({ activeTab, workflow }: { activeTab: string; workflow?: any }) {
  switch (activeTab) {
    case 'details':
      const detailFields = workflow ? [
        { label: 'Borrower Name', value: workflow.metadata?.borrower_name || 'Not specified' },
        { label: 'Lender Name', value: workflow.client?.name || 'Unknown' },
        { label: 'Loan Number', value: workflow.metadata?.loan_number || 'Not specified', mono: true },
        { label: 'Payoff Date', value: workflow.due_date ? new Date(workflow.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not specified' },
        { label: 'Primary HIL', value: workflow.assigned_user?.full_name || 'Unassigned' },
        { label: 'Client', value: workflow.client?.name || 'Unknown' }
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
            workflowId={workflow?.id || ''}
            onUploadComplete={() => {}}
          />
          <DocumentList
            workflowId={workflow?.id || ''}
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

function PlaceholderContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-gray-500 text-sm text-center py-5">
      {children}
    </div>
  );
}