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
    case 'completed': return 'bg-green-500 dark:bg-green-600';
    case 'awaiting-review': return 'bg-destructive';
    case 'pending': return 'bg-muted border-2 border-border';
    default: return 'bg-muted';
  }
};

const getSlaStatusStyle = (sla: string) => {
  switch (sla) {
    case 'ON TIME':
      return 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-950';
    case 'LATE':
      return 'text-destructive bg-destructive/10';
    case 'DUE SOON':
      return 'text-yellow-700 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-950';
    default:
      return 'text-muted-foreground bg-transparent';
  }
};

export function TaskList({ tasks, selectedTask, onTaskClick, progress }: TaskListProps) {
  return (
    <div className="h-[30vh] flex flex-col">
      <div className="px-4 py-2 border-b border-border/50 bg-muted flex-shrink-0 text-xs font-semibold text-foreground uppercase tracking-wider flex items-center h-10">
        Tasks ({progress})
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
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
        flex items-center gap-2 px-2 py-1.5 bg-card border border-border transition-all duration-200 cursor-pointer
        ${isSelected
          ? 'bg-primary/10 border-primary'
          : task.conditional
            ? 'bg-muted border-l-2 border-l-yellow-400 dark:border-l-yellow-500 hover:bg-muted/80 hover:border-primary'
            : 'hover:bg-muted/50 hover:border-primary'
        }
      `}
    >
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getTaskStatusColor(task.status)}`} />
      
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <div className="text-xs font-medium text-foreground truncate">
          {task.name}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {task.agent} • {task.meta}
        </div>
      </div>
      
      <div className={`
        text-xs font-medium px-1 py-0.5 uppercase tracking-wide whitespace-nowrap flex-shrink-0 rounded text-center min-w-[3rem]
        ${getSlaStatusStyle(task.sla)}
      `}>
        {task.sla}
      </div>
    </div>
  );
}