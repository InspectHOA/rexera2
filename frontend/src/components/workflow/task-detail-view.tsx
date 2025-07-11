// Task detail view component

interface Task {
  id: string;
  name: string;
  agent: string;
  status: string;
}

interface TaskDetailViewProps {
  selectedTask: string | null;
  tasks: Task[];
}

export function TaskDetailView({ selectedTask, tasks }: TaskDetailViewProps) {
  if (!selectedTask) {
    return <EmptyState />;
  }

  const task = tasks.find(t => t.id === selectedTask);
  if (!task) return <EmptyState />;

  return (
    <div className="p-4 space-y-4">
      <TaskDetailHeader task={task} />
      <TaskInformation task={task} />
      <ExecutionLogs />
      <ResultSummary />
      <ActionButtons />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
      <div className="text-gray-300 mb-3">
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="text-gray-500 mb-1 text-xs font-medium">
        No Task Selected
      </h3>
      <p className="text-xs text-gray-400 text-center px-4">
        Select a task from the workflow progress to view its details, logs, and results.
      </p>
    </div>
  );
}

function TaskDetailHeader({ task }: { task: Task }) {
  return (
    <div className="pb-3 border-b border-gray-200 flex justify-between items-start">
      <div className="text-xs font-medium text-gray-900 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-red-500" />
        {task.name}
      </div>
      
      <span className="px-2 py-1 text-xs font-medium uppercase tracking-wider bg-red-50 text-red-600 border border-red-200 rounded">
        AWAITING REVIEW
      </span>
    </div>
  );
}

function TaskInformation({ task }: { task: Task }) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider">Task Information</div>
      <div className="bg-gray-50 border border-gray-200 p-3 space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <DetailItem label="Agent" value={task.agent} />
          <DetailItem label="Status" value="Awaiting Review" />
          <DetailItem label="Completed" value="Dec 29, 1:45 PM" />
          <DetailItem label="Duration" value="15 minutes" />
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-xs text-gray-900 font-medium">{value}</div>
    </div>
  );
}

function ExecutionLogs() {
  return (
    <div>
      <div className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider">Execution Logs</div>
      <div className="bg-white border border-gray-200 p-3 font-mono text-xs text-gray-600 max-h-32 overflow-y-auto">
        <div className="space-y-1">
          <div>[13:30] Received payoff statement via email</div>
          <div>[13:31] Starting OCR processing on payoff_statement_fnb.pdf</div>
          <div>[13:33] OCR completed - Processing 1 page document</div>
          <div className="text-yellow-600">[13:40] Extracting payoff amount - 67% confidence (LOW)</div>
          <div className="text-red-600">[13:45] Document processing completed with manual review flag</div>
        </div>
      </div>
    </div>
  );
}

function ResultSummary() {
  return (
    <div>
      <div className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider">Result Summary</div>
      <div className="bg-blue-50 border border-blue-200 p-3 text-xs text-gray-900 border-l-4 border-l-blue-500">
        Document processed successfully. Low confidence (67%) on payoff amount extraction: <span className="font-semibold">$247,856.32</span>. Manual verification recommended.
      </div>
    </div>
  );
}

function ActionButtons() {
  return (
    <div className="flex gap-2 pt-2">
      <button className="px-3 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors duration-200">
        Retry Task
      </button>
    </div>
  );
}