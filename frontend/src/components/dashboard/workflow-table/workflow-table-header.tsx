/**
 * Workflow table header component with sorting
 */

interface WorkflowTableHeaderProps {
  onSort: (field: string) => void;
  getSortIndicator: (field: string) => string;
}

export function WorkflowTableHeader({ onSort, getSortIndicator }: WorkflowTableHeaderProps) {
  return (
    <thead className="bg-slate-50/80">
      <tr>
        <th 
          onClick={() => onSort('id')} 
          className="px-3 py-1.5 text-left border-b border-slate-200/50 font-normal text-[9px] text-slate-400 uppercase tracking-wider cursor-pointer"
        >
          ID <span className="ml-1.5 text-slate-300 text-[8px]">{getSortIndicator('id')}</span>
        </th>
        <th 
          onClick={() => onSort('created_at')} 
          className="px-3 py-1.5 text-left border-b border-slate-200/50 font-normal text-[9px] text-slate-400 uppercase tracking-wider cursor-pointer"
        >
          Created <span className="ml-1.5 text-slate-300 text-[8px]">{getSortIndicator('created_at')}</span>
        </th>
        <th 
          onClick={() => onSort('type')} 
          className="px-3 py-1.5 text-left border-b border-slate-200/50 font-normal text-[9px] text-slate-400 uppercase tracking-wider cursor-pointer"
        >
          Type <span className="ml-1.5 text-slate-300 text-[8px]">{getSortIndicator('type')}</span>
        </th>
        <th 
          onClick={() => onSort('property')} 
          className="px-3 py-1.5 text-left border-b border-slate-200/50 font-normal text-[9px] text-slate-400 uppercase tracking-wider cursor-pointer"
        >
          Property <span className="ml-1.5 text-slate-300 text-[8px]">{getSortIndicator('property')}</span>
        </th>
        <th 
          onClick={() => onSort('client')} 
          className="px-3 py-1.5 text-left border-b border-slate-200/50 font-normal text-[9px] text-slate-400 uppercase tracking-wider cursor-pointer"
        >
          Client <span className="ml-1.5 text-slate-300 text-[8px]">{getSortIndicator('client')}</span>
        </th>
        <th 
          onClick={() => onSort('status')} 
          className="px-3 py-1.5 text-left border-b border-slate-200/50 font-normal text-[9px] text-slate-400 uppercase tracking-wider cursor-pointer"
        >
          Status <span className="ml-1.5 text-slate-300 text-[8px]">{getSortIndicator('status')}</span>
        </th>
        <th 
          onClick={() => onSort('interrupts')} 
          className="px-3 py-1.5 text-left border-b border-slate-200/50 font-normal text-[9px] text-slate-400 uppercase tracking-wider cursor-pointer"
        >
          Interrupts <span className="ml-1.5 text-slate-300 text-[8px]">{getSortIndicator('interrupts')}</span>
        </th>
        <th 
          onClick={() => onSort('due')} 
          className="px-3 py-1.5 text-left border-b border-slate-200/50 font-normal text-[9px] text-slate-400 uppercase tracking-wider cursor-pointer"
        >
          DUE <span className="ml-1.5 text-slate-300 text-[8px]">{getSortIndicator('due')}</span>
        </th>
        <th 
          onClick={() => onSort('due')} 
          className="px-3 py-1.5 text-left border-b border-slate-200/50 font-normal text-[9px] text-slate-400 uppercase tracking-wider cursor-pointer"
        >
          ETA <span className="ml-1.5 text-slate-300 text-[8px]">{getSortIndicator('due')}</span>
        </th>
      </tr>
    </thead>
  );
}