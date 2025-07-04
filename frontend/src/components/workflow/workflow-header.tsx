import { ArrowLeft } from 'lucide-react';

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
    <header className="bg-white border-b border-gray-200 px-5 py-3 flex justify-between items-center shadow-sm">
      <div className="flex items-center gap-4">
        <button 
          onClick={onBackClick}
          className="btn-secondary btn-small flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            {workflow.title}
          </h1>
          <p className="font-mono text-gray-500 text-sm">
            {workflow.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex gap-3 items-center">
          <DateField label="ETA" value={workflow.eta} isUrgent />
          <DateField label="Due" value={workflow.due} isUrgent />
          <DateField label="Closing" value={workflow.closing} />
        </div>
        <span className="px-2 py-1 text-xs font-semibold uppercase tracking-wider bg-red-50 text-red-600 border border-red-200 rounded">
          {workflow.status}
        </span>
      </div>
    </header>
  );
}

function DateField({ label, value, isUrgent = false }: { label: string; value: string; isUrgent?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-xs text-gray-400 uppercase font-semibold tracking-wider">
        {label}:
      </span>
      <span className={`text-xs font-medium whitespace-nowrap ${isUrgent ? 'text-red-500' : 'text-gray-600'}`}>
        {value}
      </span>
    </div>
  );
}