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
    <div className="p-5 space-y-6">
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
    <div className="text-center p-10 text-gray-400">
      <h3 className="text-gray-500 mb-2 text-sm font-medium">
        No Task Selected
      </h3>
      <p className="text-xs">
        Click on a task from the workflow progress to view its details, logs, and results.
      </p>
    </div>
  );
}

function TaskDetailHeader({ task }: { task: Task }) {
  return (
    <div className="pb-4 border-b-2 border-blue-600 flex justify-between items-start mb-5">
      <div className="text-xs font-semibold text-gray-900 flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
        {task.name}
      </div>
      
      <span className="text-xs font-semibold px-1.5 py-0.5 uppercase tracking-wider bg-red-50 text-red-500 rounded">
        REVIEW REQUIRED
      </span>
    </div>
  );
}

function TaskInformation({ task }: { task: Task }) {
  return (
    <div className="mb-6">
      <div className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wider">Task Information</div>
      <div className="grid grid-cols-2 gap-3">
        <DetailItem label="Agent" value={task.agent} />
        <DetailItem label="Status" value="AWAITING REVIEW" />
        <DetailItem label="Completed" value="Dec 29, 1:45 PM" />
        <DetailItem label="Duration" value="15 minutes" />
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-xs">
      <div className="text-gray-500 mb-0.5">{label}</div>
      <div className="text-gray-900 font-medium">{value}</div>
    </div>
  );
}

function ExecutionLogs() {
  return (
    <div className="mb-6">
      <div className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wider">Execution Logs</div>
      <div className="p-3 font-mono text-xs text-gray-600 max-h-30 overflow-y-auto border-l-3 border-gray-300 pl-3 leading-relaxed">
        [13:30] Received payoff statement via email<br/>
        [13:31] Starting OCR processing on payoff_statement_fnb.pdf<br/>
        [13:33] OCR completed - Processing 1 page document<br/>
        [13:40] Extracting payoff amount - 67% confidence (LOW)<br/>
        [13:45] Document processing completed with manual review flag
      </div>
    </div>
  );
}

function ResultSummary() {
  return (
    <div className="mb-6">
      <div className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wider">Result Summary</div>
      <div className="p-3 text-xs text-gray-900 border-l-3 border-blue-600 pl-3 leading-relaxed">
        Document processed successfully. Low confidence (67%) on payoff amount extraction: $247,856.32. Manual verification recommended.
      </div>
    </div>
  );
}

function ActionButtons() {
  return (
    <div className="flex gap-2 mt-3">
      <button className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 hover:shadow-md transition-all duration-200">
        🔧 Open Agent Interface
      </button>
      
      <button className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors duration-200">
        🔄 Retry Task
      </button>
    </div>
  );
}