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
    case 'interrupted': return 'bg-destructive';
    case 'pending': return 'bg-muted border-2 border-border';
    default: return 'bg-muted';
  }
};

const getTaskStatusStyle = (status: string) => {
  switch (status) {
    case 'completed':
      return 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-950';
    case 'interrupted':
      return 'text-destructive bg-destructive/10';
    case 'pending':
      return 'text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-950';
    default:
      return 'text-muted-foreground bg-muted/50';
  }
};

const getSlaStatusStyle = (sla: string) => {
  switch (sla) {
    case 'ON TIME':
      return 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-950';
    case 'LATE':
      return 'text-destructive bg-destructive/10';
    case 'DUE SOON':
      return 'text-orange-700 bg-orange-100 dark:text-orange-300 dark:bg-orange-950';
    case 'TBD':
      return 'text-muted-foreground bg-muted/50';
    default:
      return 'text-muted-foreground bg-muted/50';
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

function renderTaskName(name: string) {
  // Split on the first colon to separate agent name from task description
  const colonIndex = name.indexOf(':');
  if (colonIndex === -1) {
    return <span className="text-foreground">{name}</span>;
  }
  
  const agentName = name.substring(0, colonIndex);
  const taskDescription = name.substring(colonIndex + 1).trim();
  
  return (
    <>
      <span className="text-foreground">{agentName}</span>
      <span className="text-muted-foreground">: {taskDescription}</span>
    </>
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
            ? 'bg-muted border-l-2 border-l-yellow-400 hover:bg-muted/80 hover:border-primary'
            : 'hover:bg-muted/50 hover:border-primary'
        }
      `}
    >
      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getTaskStatusColor(task.status)}`} />
      
      <div className="text-xs font-medium truncate flex-1 min-w-0">
        {renderTaskName(task.name)}
      </div>
      
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className={`
          text-xs px-1.5 py-0.5 uppercase tracking-wide whitespace-nowrap rounded
          ${getTaskStatusStyle(task.status)}
        `}>
          {task.status}
        </div>
        
        <div className={`
          text-xs px-1.5 py-0.5 uppercase tracking-wide whitespace-nowrap rounded
          ${getSlaStatusStyle(task.sla)}
        `}>
          {task.sla}
        </div>
      </div>
    </div>
  );
}