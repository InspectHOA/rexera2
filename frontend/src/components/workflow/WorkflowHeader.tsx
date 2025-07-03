import { styles, colors } from '@/styles/workflow-detail';

interface WorkflowHeaderProps {
  workflow: {
    title: string;
    subtitle: string;
    status: string;
    eta: string;
    due: string;
    closing: string;
  };
  onBackClick: () => void;
}

export function WorkflowHeader({ workflow, onBackClick }: WorkflowHeaderProps) {
  return (
    <div style={styles.header}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          onClick={onBackClick}
          style={styles.backButton}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = colors.background.secondary;
            e.currentTarget.style.color = colors.text.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = colors.text.secondary;
          }}
        >
          ← Back
        </button>
        <div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: colors.text.primary }}>
            {workflow.title}
          </div>
          <div style={{ fontFamily: 'Monaco, Menlo, monospace', color: colors.text.secondary, fontSize: '12px' }}>
            {workflow.subtitle}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <DateField label="ETA" value={workflow.eta} isUrgent />
          <DateField label="Due" value={workflow.due} isUrgent />
          <DateField label="Closing" value={workflow.closing} />
        </div>
        <span style={{
          padding: '4px 8px',
          fontSize: '10px',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          background: '#fef2f2',
          color: colors.status.error,
          border: '1px solid #fecaca'
        }}>
          {workflow.status}
        </span>
      </div>
    </div>
  );
}

function DateField({ label, value, isUrgent = false }: { label: string; value: string; isUrgent?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
      <span style={{ fontSize: '9px', color: colors.text.tertiary, textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.05em' }}>
        {label}:
      </span>
      <span style={{ 
        fontSize: '11px', 
        color: isUrgent ? colors.status.error : colors.text.secondary, 
        fontWeight: '500', 
        whiteSpace: 'nowrap' 
      }}>
        {value}
      </span>
    </div>
  );
}