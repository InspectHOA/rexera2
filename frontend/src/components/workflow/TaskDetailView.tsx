import { styles, colors } from '@/styles/workflow-detail';

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
    <div style={{ margin: '16px 20px' }}>
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
    <div style={{ textAlign: 'center', padding: '40px 20px', color: colors.text.tertiary }}>
      <h3 style={{ color: colors.text.secondary, marginBottom: '8px', fontSize: '14px' }}>
        No Task Selected
      </h3>
      <p style={{ fontSize: '12px' }}>
        Click on a task from the workflow progress to view its details, logs, and results.
      </p>
    </div>
  );
}

function TaskDetailHeader({ task }: { task: Task }) {
  return (
    <div style={{
      paddingBottom: '16px',
      borderBottom: `2px solid ${colors.primary}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '20px'
    }}>
      <div style={{
        fontSize: '13px',
        fontWeight: '600',
        color: colors.text.primary,
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <div style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          background: colors.status.error
        }} />
        {task.name}
      </div>
      
      <span style={{
        fontSize: '9px',
        fontWeight: '600',
        padding: '3px 6px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        background: '#fef2f2',
        color: colors.status.error
      }}>
        REVIEW REQUIRED
      </span>
    </div>
  );
}

function TaskInformation({ task }: { task: Task }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={styles.sectionTitle}>Task Information</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
    <div style={{ fontSize: '11px' }}>
      <div style={{ color: colors.text.secondary, marginBottom: '2px' }}>{label}</div>
      <div style={{ color: colors.text.primary, fontWeight: '500' }}>{value}</div>
    </div>
  );
}

function ExecutionLogs() {
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={styles.sectionTitle}>Execution Logs</div>
      <div style={{
        padding: '12px',
        fontFamily: 'Monaco, Menlo, monospace',
        fontSize: '10px',
        color: colors.text.secondary,
        maxHeight: '120px',
        overflowY: 'auto',
        borderLeft: `3px solid ${colors.border.default}`,
        paddingLeft: '12px',
        lineHeight: 1.4
      }}>
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
    <div style={{ marginBottom: '24px' }}>
      <div style={styles.sectionTitle}>Result Summary</div>
      <div style={{
        padding: '12px',
        fontSize: '11px',
        color: colors.text.primary,
        borderLeft: `3px solid ${colors.primary}`,
        paddingLeft: '12px',
        lineHeight: 1.4
      }}>
        Document processed successfully. Low confidence (67%) on payoff amount extraction: $247,856.32. Manual verification recommended.
      </div>
    </div>
  );
}

function ActionButtons() {
  return (
    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
      <button 
        style={styles.button.primary}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = colors.primaryDark;
          e.currentTarget.style.boxShadow = '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = colors.primary;
          e.currentTarget.style.boxShadow = '0 1px 2px 0 rgb(0 0 0 / 0.05)';
        }}
      >
        🔧 Open Agent Interface
      </button>
      
      <button 
        style={styles.button.secondary}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = colors.background.secondary;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = colors.background.surface;
        }}
      >
        🔄 Retry Task
      </button>
    </div>
  );
}