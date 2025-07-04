interface Task {
  id: string;
  name: string;
  agent: string;
  status: string;
  meta: string;
  sla: string;
  conditional?: boolean;
}

interface TaskListProps {
  tasks: Task[];
  selectedTask: string | null;
  onTaskClick: (taskId: string) => void;
  progress: string;
}

const getTaskStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-500';
    case 'awaiting-review': return 'bg-red-500';
    case 'pending': return 'bg-gray-400 border-2 border-gray-300';
    default: return 'bg-gray-400';
  }
};

const getSlaStatusStyle = (sla: string) => {
  switch (sla) {
    case 'ON TIME':
      return 'text-green-600 bg-green-50';
    case 'LATE':
      return 'text-red-600 bg-red-50';
    case 'DUE SOON':
      return 'text-yellow-600 bg-yellow-50';
    default:
      return 'text-gray-400 bg-transparent';
  }
};

export function TaskList({ tasks, selectedTask, onTaskClick, progress }: TaskListProps) {
  return (
    <div className="card">
      <div className="card-header">
        <div className="label">
          Task Progress ({progress})
        </div>
      </div>
      
      <div className="p-4 space-y-2">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            isSelected={selectedTask === task.id}
            onClick={() => onTaskClick(task.id)}
          />
        ))}
      </div>
    </div>
  );
}

function TaskItem({ task, isSelected, onClick }: { 
  task: Task; 
  isSelected: boolean; 
  onClick: () => void; 
}) {
  return (
    <div
      onClick={onClick}
      className={`
        flex items-center gap-3 p-2 bg-white border border-gray-100 transition-all duration-200 cursor-pointer
        ${isSelected 
          ? 'bg-primary-100 border-primary-600' 
          : task.conditional 
            ? 'bg-gray-50 border-l-4 border-l-yellow-400 hover:bg-gray-100 hover:border-primary-600' 
            : 'hover:bg-gray-50 hover:border-primary-600'
        }
      `}
    >
      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getTaskStatusColor(task.status)}`} />
      
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-gray-900 mb-0.5">
          {task.name}
        </div>
        <div className="text-xs text-gray-500 leading-tight">
          {task.agent} • {task.meta}
        </div>
      </div>
      
      <div className={`
        text-xs font-semibold px-1.5 py-0.5 uppercase tracking-wider whitespace-nowrap flex-shrink-0 rounded
        ${getSlaStatusStyle(task.sla)}
      `}>
        {task.sla}
      </div>
    </div>
  );
}