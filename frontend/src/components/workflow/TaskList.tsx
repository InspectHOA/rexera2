import { styles, colors, getTaskStatusColor, getSlaStatusStyle } from '@/styles/workflow-detail';

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

export function TaskList({ tasks, selectedTask, onTaskClick, progress }: TaskListProps) {
  return (
    <div style={{
      border: `1px solid ${colors.border.default}`,
      background: colors.background.tertiary,
      padding: '16px',
      marginBottom: '24px'
    }}>
      <div style={{
        fontSize: '12px',
        fontWeight: '600',
        color: colors.text.secondary,
        marginBottom: '12px',
        textTransform: 'uppercase'
      }}>
        Task Progress ({progress})
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
  const baseStyle = {
    ...styles.taskItem,
    ...(isSelected && styles.taskItemActive),
    ...(task.conditional && styles.taskItemConditional)
  };

  return (
    <div
      onClick={onClick}
      style={baseStyle}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = colors.background.secondary;
          e.currentTarget.style.borderColor = colors.primary;
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = task.conditional ? colors.background.tertiary : colors.background.surface;
          e.currentTarget.style.borderColor = colors.border.light;
        }
      }}
    >
      <div style={{
        ...styles.statusDot,
        background: getTaskStatusColor(task.status),
        ...(task.status === 'pending' && { border: `2px solid ${colors.text.tertiary}` })
      }} />
      
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '12px', fontWeight: '500', color: colors.text.primary, marginBottom: '2px' }}>
          {task.name}
        </div>
        <div style={{ fontSize: '10px', color: colors.text.secondary, lineHeight: 1.3 }}>
          {task.agent} • {task.meta}
        </div>
      </div>
      
      <div style={{
        fontSize: '9px',
        fontWeight: '600',
        padding: '2px 6px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        ...getSlaStatusStyle(task.sla)
      }}>
        {task.sla}
      </div>
    </div>
  );
}