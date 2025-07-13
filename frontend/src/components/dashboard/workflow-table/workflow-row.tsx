/**
 * Individual workflow table row component
 */

import { useRouter } from 'next/navigation';
import type { TransformedWorkflow } from '@/types/workflow';

interface WorkflowRowProps {
  workflow: TransformedWorkflow;
}

export function WorkflowRow({ workflow }: WorkflowRowProps) {
  const router = useRouter();

  const handleRowClick = () => {
    router.push(`/workflow/${workflow.workflowId}` as any);
  };

  return (
    <tr 
      onClick={handleRowClick}
      className="hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100"
    >
      {/* ID */}
      <td className="px-3 py-2 text-xs text-gray-900 font-mono">
        {workflow.id}
      </td>

      {/* Created */}
      <td className="px-3 py-2 text-xs text-gray-700">
        {workflow.created}
      </td>

      {/* Type */}
      <td className="px-3 py-2 text-xs">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
          {workflow.type}
        </span>
      </td>

      {/* Property */}
      <td className="px-3 py-2 text-xs text-gray-900 max-w-0">
        <div className="truncate" title={workflow.property}>
          {workflow.property}
        </div>
      </td>

      {/* Client */}
      <td className="px-3 py-2 text-xs text-gray-700 max-w-0">
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
          <div className="flex items-center gap-1">
            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold text-white ${
              workflow.interrupts.type === 'critical' ? 'bg-red-500' : 'bg-amber-500'
            }`}>
              {workflow.interrupts.count}
            </span>
            <div className="flex gap-0.5">
              {workflow.interrupts.icons.map((iconData, index) => (
                <span key={index} className="text-xs" title={`${iconData.agent} interrupt`}>
                  {iconData.icon}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <span className="text-gray-400">-</span>
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