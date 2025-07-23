/**
 * Workflow table header component with sorting
 */

interface WorkflowTableHeaderProps {
  onSort: (field: string) => void;
  getSortIndicator: (field: string) => string;
}

export function WorkflowTableHeader({ onSort, getSortIndicator }: WorkflowTableHeaderProps) {
  return (
    <thead className="bg-muted/50">
      <tr>
        <th
          onClick={() => onSort('id')}
          className="px-4 py-1.5 text-left border-b border-border font-normal text-[9px] text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
        >
          ID <span className="ml-1.5 text-muted-foreground/70 text-[8px]">{getSortIndicator('id')}</span>
        </th>
        <th 
          onClick={() => onSort('created_at')} 
          className="px-3 py-1.5 text-left border-b border-border font-normal text-[9px] text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
        >
          Created <span className="ml-1.5 text-muted-foreground/70 text-[8px]">{getSortIndicator('created_at')}</span>
        </th>
        <th 
          onClick={() => onSort('type')} 
          className="px-3 py-1.5 text-left border-b border-border font-normal text-[9px] text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors w-40"
        >
          Type <span className="ml-1.5 text-muted-foreground/70 text-[8px]">{getSortIndicator('type')}</span>
        </th>
        <th 
          onClick={() => onSort('property')} 
          className="px-3 py-1.5 text-left border-b border-border font-normal text-[9px] text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors w-64"
        >
          Property <span className="ml-1.5 text-muted-foreground/70 text-[8px]">{getSortIndicator('property')}</span>
        </th>
        <th 
          onClick={() => onSort('client')} 
          className="px-3 py-1.5 text-left border-b border-border font-normal text-[9px] text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
        >
          Client <span className="ml-1.5 text-muted-foreground/70 text-[8px]">{getSortIndicator('client')}</span>
        </th>
        <th 
          onClick={() => onSort('status')} 
          className="px-3 py-1.5 text-left border-b border-border font-normal text-[9px] text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors w-32"
        >
          Status <span className="ml-1.5 text-muted-foreground/70 text-[8px]">{getSortIndicator('status')}</span>
        </th>
        <th 
          onClick={() => onSort('interrupts')} 
          className="px-3 py-1.5 text-left border-b border-border font-normal text-[9px] text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
        >
          Interrupts <span className="ml-1.5 text-muted-foreground/70 text-[8px]">{getSortIndicator('interrupts')}</span>
        </th>
        <th 
          onClick={() => onSort('due')} 
          className="px-3 py-1.5 text-left border-b border-border font-normal text-[9px] text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
        >
          DUE <span className="ml-1.5 text-muted-foreground/70 text-[8px]">{getSortIndicator('due')}</span>
        </th>
        <th 
          onClick={() => onSort('due')} 
          className="px-3 py-1.5 text-left border-b border-border font-normal text-[9px] text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
        >
          ETA <span className="ml-1.5 text-muted-foreground/70 text-[8px]">{getSortIndicator('due')}</span>
        </th>
      </tr>
    </thead>
  );
}