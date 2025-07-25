// Task detail view component

import { Button } from '@/components/ui/button';
import { TaskStatusDropdown } from './task-status-dropdown';

interface Task {
  id: string;
  name: string;
  agent: string;
  status: string;
  meta: string;
  sla: string;
}

interface TaskDetailViewProps {
  selectedTask: string | null;
  tasks: Task[];
  workflowId?: string;
}

export function TaskDetailView({ selectedTask, tasks, workflowId }: TaskDetailViewProps) {
  if (!selectedTask) {
    return <EmptyState />;
  }

  const task = tasks.find(t => t.id === selectedTask);
  if (!task) return <EmptyState />;

  return (
    <div className="p-4 space-y-4">
      <TaskDetailHeader task={task} workflowId={workflowId} />
      <TaskInformation task={task} workflowId={workflowId} />
      <ExecutionLogs />
      <ResultSummary />
      <ActionButtons />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
      <div className="text-muted-foreground mb-3">
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="text-muted-foreground mb-1 text-xs font-medium">
        No Task Selected
      </h3>
      <p className="text-xs text-muted-foreground text-center px-4">
        Select a task from the workflow progress to view its details, logs, and results.
      </p>
    </div>
  );
}

function TaskDetailHeader({ task, workflowId }: { task: Task; workflowId?: string }) {
  // Get status color for the dot indicator
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'interrupted': return 'bg-destructive';
      case 'pending': return 'bg-blue-500';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="pb-3 border-b border-border flex justify-between items-start">
      <div className="text-xs font-medium text-foreground flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${getStatusColor(task.status)}`} />
        {task.name}
      </div>
      
      <TaskStatusDropdown 
        taskId={task.id}
        currentStatus={task.status}
        workflowId={workflowId}
        isCompact={true}
      />
    </div>
  );
}

function TaskInformation({ task, workflowId }: { task: Task; workflowId?: string }) {
  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Task Information</div>
      <div className="bg-muted border border-border p-3 space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <DetailItem label="Agent" value={task.agent} />
          <div>
            <div className="text-xs text-muted-foreground mb-1">Status</div>
            <TaskStatusDropdown 
              taskId={task.id}
              currentStatus={task.status}
              workflowId={workflowId}
              isCompact={true}
            />
          </div>
          <DetailItem label="SLA" value={task.sla} />
          <DetailItem label="Meta" value={task.meta} />
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-xs text-foreground font-medium">{value}</div>
    </div>
  );
}

function ExecutionLogs() {
  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Execution Logs</div>
      <div className="bg-card border border-border p-3 font-mono text-xs text-muted-foreground max-h-32 overflow-y-auto">
        <div className="space-y-1">
          <div>[13:30] Received payoff statement via email</div>
          <div>[13:31] Starting OCR processing on payoff_statement_fnb.pdf</div>
          <div>[13:33] OCR completed - Processing 1 page document</div>
          <div className="text-yellow-600 dark:text-yellow-400">[13:40] Extracting payoff amount - 67% confidence (LOW)</div>
          <div className="text-destructive">[13:45] Document processing completed with manual review flag</div>
        </div>
      </div>
    </div>
  );
}

function ResultSummary() {
  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Result Summary</div>
      <div className="bg-blue-50 border border-blue-200 p-3 text-xs text-foreground border-l-4 border-l-blue-500 dark:bg-blue-950 dark:border-blue-800 dark:border-l-blue-400">
        Document processed successfully. Low confidence (67%) on payoff amount extraction: <span className="font-semibold">$247,856.32</span>. Manual verification recommended.
      </div>
    </div>
  );
}

function ActionButtons() {
  return (
    <div className="flex gap-2 pt-2">
      <Button variant="outline" size="sm">
        Retry Task
      </Button>
    </div>
  );
}