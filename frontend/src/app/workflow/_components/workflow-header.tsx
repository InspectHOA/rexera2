import { ArrowLeft } from 'lucide-react';
import { WorkflowStatusDropdown } from './workflow-status-dropdown';

interface WorkflowHeaderProps {
  workflow: {
    id?: string;
    rawId?: string;
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
    <header className="bg-background/80 backdrop-blur-sm px-4 py-3 mb-4 flex justify-between items-center shadow-2xl rounded-2xl border border-border/50">
      <div className="flex items-center gap-4">
        <button
          onClick={onBackClick}
          className="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50 border border-border/50 hover:bg-muted transition-colors flex items-center gap-1 rounded-md"
        >
          <ArrowLeft className="h-3 w-3" />
          Back
        </button>
        <div>
          <h1 className="text-base font-semibold text-foreground">
            {workflow.title}
          </h1>
          <p className="font-mono text-muted-foreground text-xs">
            {workflow.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex gap-3 items-center">
          <DateField label="ETA" value={workflow.eta} isUrgent />
          <DateField label="Due" value={workflow.due} isUrgent />
          <DateField label="Closing" value={workflow.closing} />
        </div>
        <WorkflowStatusDropdown 
          workflowId={workflow.rawId}
          currentStatus={workflow.status}
        />
      </div>
    </header>
  );
}

function DateField({ label, value, isUrgent = false }: { label: string; value: string; isUrgent?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
        {label}:
      </span>
      <span className={`text-xs font-medium whitespace-nowrap ${isUrgent ? 'text-destructive' : 'text-foreground'}`}>
        {value}
      </span>
    </div>
  );
}