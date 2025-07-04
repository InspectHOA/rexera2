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
    <header className="bg-white border border-gray-200 px-4 py-3 flex justify-between items-center shadow-sm">
      <div className="flex items-center gap-4">
        <button 
          onClick={onBackClick}
          className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="h-3 w-3" />
          Back
        </button>
        <div>
          <h1 className="text-base font-semibold text-gray-900">
            {workflow.title}
          </h1>
          <p className="font-mono text-gray-500 text-xs">
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
        <span className="px-2 py-1 text-xs font-semibold uppercase tracking-wider bg-red-50 text-red-600 border border-red-200">
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