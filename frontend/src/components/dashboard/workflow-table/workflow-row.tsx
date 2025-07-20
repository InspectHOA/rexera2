/**
 * Individual workflow table row component
 */

import { useRouter } from 'next/navigation';
import type { TransformedWorkflow } from '@/types/workflow';

interface WorkflowRowProps {
  workflow: TransformedWorkflow;
  isEven: boolean;
}

export function WorkflowRow({ workflow, isEven }: WorkflowRowProps) {
  const router = useRouter();

  const handleRowClick = () => {
    router.push(`/workflow/${workflow.workflowId}` as any);
  };

  return (
    <tr 
      onClick={handleRowClick}
      className={`hover:bg-muted/50 cursor-pointer transition-colors border-b border-border/50 ${
        isEven ? 'bg-background' : 'bg-muted/20'
      }`}
    >
      {/* ID */}
      <td className="px-4 py-2 text-xs text-foreground font-mono">
        {workflow.id}
      </td>

      {/* Created */}
      <td className="px-3 py-2 text-xs text-muted-foreground">
        {workflow.created}
      </td>

      {/* Type */}
      <td className="px-3 py-2 text-xs">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
          {workflow.type}
        </span>
      </td>

      {/* Property */}
      <td className="px-3 py-2 text-xs text-foreground max-w-0">
        <div className="truncate" title={workflow.property}>
          {workflow.property}
        </div>
      </td>

      {/* Client */}
      <td className="px-3 py-2 text-xs text-muted-foreground max-w-0">
        <div className="truncate" title={workflow.client}>
          {workflow.client}
        </div>
      </td>

      {/* Status */}
      <td className="px-3 py-2 text-xs">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${workflow.statusClass}`}>
          {workflow.status}
        </span>
      </td>

      {/* Interrupts */}
      <td className="px-3 py-2 text-xs">
        {workflow.interrupts ? (
          <div className="flex gap-0.5">
            {workflow.interrupts.icons.map((iconData, index) => (
              <span key={index} className="text-xs" title={`${iconData.agent} interrupt`}>
                {iconData.icon}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground/70">-</span>
        )}
      </td>

      {/* Due */}
      <td className="px-3 py-2 text-xs">
        <span className={workflow.dueColor}>
          {workflow.due}
        </span>
      </td>

      {/* ETA */}
      <td className="px-3 py-2 text-xs">
        <span className={workflow.dueColor}>
          {workflow.eta}
        </span>
      </td>
    </tr>
  );
}