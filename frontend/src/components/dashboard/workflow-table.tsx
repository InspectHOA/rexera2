'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkflows } from '@/lib/hooks/useWorkflows';
import { formatWorkflowIdWithType } from '@rexera/shared';
import type { WorkflowData, TaskExecution, TransformedWorkflow } from '@/types/workflow';

export function WorkflowTable() {
  const router = useRouter();
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Map frontend sort fields to backend database columns
  const getBackendSortField = (frontendField: string): string => {
    const fieldMap: Record<string, string> = {
      'id': 'human_readable_id',
      'created_at': 'created_at',
      'type': 'workflow_type',
      'client': 'client_id', // Note: This may need special handling for client name sorting
      'property': 'title',
      'status': 'status',
      'interrupts': 'interrupts', // Server handles interrupt count calculation and sorting
      'due': 'due_date'
    };
    return fieldMap[frontendField] || 'created_at';
  };
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterInterrupts, setFilterInterrupts] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  const { workflows: workflowData, loading, error, pagination } = useWorkflows({ 
    include: ['client', 'tasks'], 
    limit: 20,
    page: currentPage,
    sortBy: getBackendSortField(sortField),
    sortDirection: sortDirection
  });

  // Sort handler
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    // Reset to page 1 when sorting changes since the order of all records changes
    setCurrentPage(1);
  };

  // Get sort indicator
  const getSortIndicator = (field: string) => {
    if (sortField !== field) return '⇅';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  // Transform API data for display
  const transformedWorkflows: TransformedWorkflow[] = workflowData.map((workflow: WorkflowData) => {
    const tasks: TaskExecution[] = workflow.task_executions || workflow.tasks || [];
    const interruptCount = tasks.filter((t: TaskExecution) => t.status === 'AWAITING_REVIEW')?.length || 0;
    const hasInterrupts = interruptCount > 0;
    
    // Use human_readable_id field with type prefix (e.g., "HOA-1001")
    let displayId;
    
    if (workflow.human_readable_id) {
      const typeConfig = {
        'PAYOFF_REQUEST': 'PAY',
        'HOA_ACQUISITION': 'HOA', 
        'MUNI_LIEN_SEARCH': 'MUNI'
      };
      const prefix = typeConfig[workflow.workflow_type as keyof typeof typeConfig] || 'WF';
      displayId = `${prefix}-${workflow.human_readable_id}`;
    } else {
      // Fallback to formatted UUID if no human-readable ID
      displayId = formatWorkflowIdWithType(workflow.id, workflow.workflow_type);
    }
    
    return {
      id: displayId,
      workflowId: workflow.id, // Use UUID for navigation
      created: formatCreatedDate(workflow.created_at),
      createdRaw: workflow.created_at, // For sorting
      type: getDisplayWorkflowType(workflow.workflow_type),
      typeRaw: workflow.workflow_type, // For sorting
      client: workflow.clients?.name || 'Unknown Client',
      property: workflow.metadata?.property_address || workflow.title || 'No property info',
      status: getDisplayStatus(workflow.status),
      statusRaw: workflow.status, // For sorting
      statusClass: getStatusClass(workflow.status),
      interrupts: hasInterrupts ? {
        type: workflow.priority === 'URGENT' ? 'critical' : 'standard',
        count: interruptCount,
        icons: getInterruptIcons(tasks.filter((t: TaskExecution) => t.status === 'AWAITING_REVIEW') || [])
      } : null,
      interruptCount: interruptCount, // For sorting
      due: formatDate(workflow.due_date),
      dueRaw: workflow.due_date, // For sorting
      eta: formatDate(workflow.due_date), // Could be enhanced with better ETA logic
      dueColor: getDueColor(workflow.status, workflow.due_date)
    };
  });

  // Filter workflows
  const filteredWorkflows = transformedWorkflows.filter((workflow: TransformedWorkflow) => {
    // Type filter
    if (filterType && workflow.typeRaw !== filterType) {
      return false;
    }

    // Status filter
    if (filterStatus) {
      if (filterStatus === 'urgent' && workflow.statusRaw !== 'BLOCKED' && workflow.statusRaw !== 'AWAITING_REVIEW') {
        return false;
      }
      if (filterStatus === 'progress' && workflow.statusRaw !== 'IN_PROGRESS') {
        return false;
      }
      if (filterStatus === 'completed' && workflow.statusRaw !== 'COMPLETED') {
        return false;
      }
    }

    // Interrupts filter
    if (filterInterrupts) {
      if (filterInterrupts === 'has-interrupts' && workflow.interruptCount === 0) {
        return false;
      }
      if (filterInterrupts === 'no-interrupts' && workflow.interruptCount > 0) {
        return false;
      }
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const searchableText = [
        workflow.id,
        workflow.client,
        workflow.property,
        workflow.type
      ].join(' ').toLowerCase();
      
      if (!searchableText.includes(query)) {
        return false;
      }
    }

    return true;
  });

  // Apply client-side filtering only (server handles sorting and pagination)
  const workflows = filteredWorkflows;

  function getDisplayWorkflowType(type: string) {
    const typeMap: Record<string, string> = {
      'PAYOFF_REQUEST': 'Payoff Request',
      'HOA_ACQUISITION': 'HOA Documents', 
      'MUNI_LIEN_SEARCH': 'Lien Search'
    };
    return typeMap[type] || type;
  }

  function getDisplayStatus(status: string) {
    const statusMap: Record<string, string> = {
      'PENDING': 'Pending',
      'IN_PROGRESS': 'In Progress', 
      'AWAITING_REVIEW': 'Awaiting Review',
      'COMPLETED': 'Completed',
      'BLOCKED': 'Blocked'
    };
    return statusMap[status] || status;
  }

  function getStatusClass(status: string) {
    const classMap: Record<string, string> = {
      'PENDING': 'status-pending',
      'IN_PROGRESS': 'status-progress',
      'AWAITING_REVIEW': 'status-awaiting-review', 
      'COMPLETED': 'status-completed',
      'BLOCKED': 'status-blocked'
    };
    return classMap[status] || 'status-pending';
  }

  function getInterruptIcons(tasks: TaskExecution[]) {
    const agentIcons: Record<string, string> = {
      'mia': '📧',      // Mail emoji for mia (email agent)
      'ria': '💬',      // Chat emoji for ria (support agent)
      'nina': '🔍',     // Research icon for nina (research agent)
      'florian': '📞',  // Phone icon for florian (phone agent)
      'rex': '🤖',      // Robot icon for rex (automation agent)
      'iris': '📄',     // Document icon for iris (document processing)
      'kosha': '💰',    // Money icon for kosha (financial agent)
      'cassy': '✅',    // Check icon for cassy (quality assurance)
      'max': '🎧',      // Headphones icon for max (IVR agent)
      'corey': '🏢',    // Building icon for corey (HOA specialist)
    };
    
    return tasks.slice(0, 3).map((task: TaskExecution) => {
      const taskAny = task as any;
      const agentName = taskAny.agents?.name || taskAny.agent_name || 'unknown';
      const icon = agentIcons[agentName] || '⚠️';
      const agent = getAgentDisplay(task);
      return { icon, agent };
    });
  }

  function getAgentDisplay(task: TaskExecution) {
    if (task.executor_type === 'HIL') {
      return 'HIL Monitor';
    }
    
    // Use joined agent data if available (cast to any for runtime data)
    const taskAny = task as any;
    if (taskAny.agents?.name) {
      return taskAny.agents.name;
    }
    
    // Fallback to agent_name if available
    if (taskAny.agent_name) {
      return taskAny.agent_name;
    }
    
    // Final fallback
    return task.agent_id ? 'AI Agent' : 'Unassigned';
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return 'TBD';
    const date = new Date(dateStr);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function formatCreatedDate(dateStr: string | null) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function getDueColor(status: string, dueDate: string | null) {
    if (status === 'COMPLETED') return '#10b981';
    if (!dueDate) return '#0f172a';
    
    const due = new Date(dueDate);
    const today = new Date();
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    if (diffDays < 0) return '#ef4444'; // Overdue
    if (diffDays <= 1) return '#f59e0b'; // Due soon
    return '#0f172a'; // Normal
  }

  // Remove early returns for loading/error - handle these within table structure instead

  const handleWorkflowClick = (workflowId: string) => {
    // Find the workflow to get human_readable_id
    const workflow = workflowData.find((w: WorkflowData) => w.id === workflowId);
    if (workflow?.human_readable_id) {
      router.push(`/workflow/${workflow.human_readable_id}`);
      return;
    }
    // Fallback to UUID if no human-readable ID found
    router.push(`/workflow/${workflowId}`);
  };

  return (
    <div className="workflows-section bg-white/80 backdrop-blur-sm shadow-2xl rounded-lg border border-gray-200/50 overflow-hidden">
      {/* Table Controls */}
      <div className="table-controls px-5 py-4 border-b border-slate-200/50 flex justify-start items-center">
        <div className="filters flex gap-2 items-center flex-wrap">
          <select 
            className="filter-select px-2 py-1 border border-slate-100 bg-white text-slate-400 text-xs min-w-[100px]"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="PAYOFF_REQUEST">Payoff Request</option>
            <option value="HOA_ACQUISITION">HOA Documents</option>
            <option value="MUNI_LIEN_SEARCH">Municipal Lien</option>
          </select>
          
          <select 
            className="filter-select px-2 py-1 border border-slate-100 bg-white text-slate-400 text-xs min-w-[100px]"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="urgent">Urgent</option>
            <option value="progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          
          <select 
            className="filter-select px-2 py-1 border border-slate-100 bg-white text-slate-400 text-xs min-w-[100px]"
            value={filterInterrupts}
            onChange={(e) => setFilterInterrupts(e.target.value)}
          >
            <option value="">All Interrupts</option>
            <option value="has-interrupts">Has Interrupts</option>
            <option value="no-interrupts">No Interrupts</option>
          </select>
          
          <input 
            type="text" 
            className="search-input px-2 py-1 border border-slate-100 bg-white text-slate-400 text-xs min-w-[160px]" 
            placeholder="Search workflows, clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
          {(filterType || filterStatus || filterInterrupts || searchQuery) && (
            <button
              className="px-2 py-1 border border-slate-100 bg-white text-slate-400 text-xs cursor-pointer"
              onClick={() => {
                setFilterType('');
                setFilterStatus('');
                setFilterInterrupts('');
                setSearchQuery('');
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <table className="workflows-table w-full border-collapse">
        <thead>
          <tr>
            <th onClick={() => handleSort('id')} className="px-3 py-1.5 text-left border-b border-slate-200/50 font-normal text-[9px] text-slate-400 uppercase tracking-wider cursor-pointer">
              Workflow ID <span className="ml-1.5 text-slate-300 text-[8px]">{getSortIndicator('id')}</span>
            </th>
            <th onClick={() => handleSort('created_at')} className="px-3 py-1.5 text-left border-b border-slate-200/50 font-normal text-[9px] text-slate-400 uppercase tracking-wider cursor-pointer">
              Created <span className="ml-1.5 text-slate-300 text-[8px]">{getSortIndicator('created_at')}</span>
            </th>
            <th onClick={() => handleSort('type')} className="px-3 py-1.5 text-left border-b border-slate-200/50 font-normal text-[9px] text-slate-400 uppercase tracking-wider cursor-pointer">
              Type <span className="ml-1.5 text-slate-300 text-[8px]">{getSortIndicator('type')}</span>
            </th>
            <th onClick={() => handleSort('property')} className="px-3 py-1.5 text-left border-b border-slate-200/50 font-normal text-[9px] text-slate-400 uppercase tracking-wider cursor-pointer">
              Property <span className="ml-1.5 text-slate-300 text-[8px]">{getSortIndicator('property')}</span>
            </th>
            <th onClick={() => handleSort('client')} className="px-3 py-1.5 text-left border-b border-slate-200/50 font-normal text-[9px] text-slate-400 uppercase tracking-wider cursor-pointer">
              Client <span className="ml-1.5 text-slate-300 text-[8px]">{getSortIndicator('client')}</span>
            </th>
            <th onClick={() => handleSort('status')} className="px-3 py-1.5 text-left border-b border-slate-200/50 font-normal text-[9px] text-slate-400 uppercase tracking-wider cursor-pointer">
              Status <span className="ml-1.5 text-slate-300 text-[8px]">{getSortIndicator('status')}</span>
            </th>
            <th onClick={() => handleSort('interrupts')} className="px-3 py-1.5 text-left border-b border-slate-200/50 font-normal text-[9px] text-slate-400 uppercase tracking-wider cursor-pointer">
              Interrupts <span className="ml-1.5 text-slate-300 text-[8px]">{getSortIndicator('interrupts')}</span>
            </th>
            <th onClick={() => handleSort('due')} className="px-3 py-1.5 text-left border-b border-slate-200/50 font-normal text-[9px] text-slate-400 uppercase tracking-wider cursor-pointer">
              DUE <span className="ml-1.5 text-slate-300 text-[8px]">{getSortIndicator('due')}</span>
            </th>
            <th onClick={() => handleSort('due')} className="px-3 py-1.5 text-left border-b border-slate-200/50 font-normal text-[9px] text-slate-400 uppercase tracking-wider cursor-pointer">
              ETA <span className="ml-1.5 text-slate-300 text-[8px]">{getSortIndicator('due')}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            // Loading skeleton rows that preserve table structure
            Array.from({ length: 20 }).map((_, index) => (
              <tr key={`loading-${index}`} className="animate-pulse">
                <td className="px-3 py-2 border-b border-slate-100 text-xs align-middle">
                  <div className="h-4 bg-slate-200 rounded w-24"></div>
                </td>
                <td className="px-3 py-2 border-b border-slate-100 text-xs align-middle">
                  <div className="h-4 bg-slate-200 rounded w-16"></div>
                </td>
                <td className="px-3 py-2 border-b border-slate-100 text-xs align-middle">
                  <div className="h-4 bg-slate-200 rounded w-20"></div>
                </td>
                <td className="px-3 py-2 border-b border-slate-100 text-xs align-middle">
                  <div className="h-4 bg-slate-200 rounded w-32"></div>
                </td>
                <td className="px-3 py-2 border-b border-slate-100 text-xs align-middle">
                  <div className="h-4 bg-slate-200 rounded w-24"></div>
                </td>
                <td className="px-3 py-2 border-b border-slate-100 text-xs align-middle">
                  <div className="h-4 bg-slate-200 rounded w-20"></div>
                </td>
                <td className="px-3 py-2 border-b border-slate-200/50 text-xs align-middle">
                  <div className="h-4 bg-slate-200 rounded w-16"></div>
                </td>
                <td className="px-3 py-2 border-b border-slate-100 text-xs align-middle">
                  <div className="h-4 bg-slate-200 rounded w-16"></div>
                </td>
                <td className="px-3 py-2 border-b border-slate-100 text-xs align-middle">
                  <div className="h-4 bg-slate-200 rounded w-16"></div>
                </td>
              </tr>
            ))
          ) : error ? (
            // Error state that preserves table structure
            <tr>
              <td colSpan={9} className="px-3 py-8 text-center text-red-600">
                <div className="flex flex-col items-center gap-2">
                  <span>Failed to load workflows</span>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Retry
                  </button>
                </div>
              </td>
            </tr>
          ) : workflows.length === 0 ? (
            // Empty state that preserves table structure
            <tr>
              <td colSpan={9} className="px-3 py-8 text-center text-slate-500">
                No workflows found
              </td>
            </tr>
          ) : (
            workflows.map((workflow: TransformedWorkflow, index: number) => (
              <tr 
                key={index}
                onClick={() => handleWorkflowClick(workflow.workflowId)}
                className="cursor-pointer transition-all duration-200 hover:bg-slate-50 hover:-translate-y-px hover:shadow-md"
              >
              <td className="px-3 py-2 border-b border-slate-100 text-xs align-middle whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px] font-semibold text-slate-900 font-mono">
                {workflow.id}
              </td>
              <td className="px-3 py-2 border-b border-slate-100 text-xs align-middle whitespace-nowrap text-slate-500 font-mono">
                {workflow.created}
              </td>
              <td className="px-3 py-2 border-b border-slate-100 text-xs align-middle whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">
                {workflow.type}
              </td>
              <td className="px-3 py-2 border-b border-slate-100 text-xs align-middle whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">
                {workflow.property}
              </td>
              <td className="px-3 py-2 border-b border-slate-100 text-xs align-middle whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">
                {workflow.client}
              </td>
              <td className="px-3 py-2 border-b border-slate-100 text-xs align-middle whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">
                <span className={`status-badge ${workflow.statusClass}`}>
                  {workflow.status}
                </span>
              </td>
              <td className="px-3 py-2 border-b border-slate-200/50 text-xs align-middle whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">
                {workflow.interrupts ? (
                  <div className="interrupt-indicator flex items-center gap-1.5">
                    {workflow.interrupts.icons.map((interrupt: { icon: string; agent: string }, index: number) => (
                      <span key={index} title={interrupt.agent} className="text-sm leading-none" style={{ fontSize: '0.9em' }}>
                        {interrupt.icon}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="no-interrupts text-slate-400 text-center text-xs">
                    —
                  </span>
                )}
              </td>
              <td className="px-3 py-2 border-b border-slate-100 text-xs align-middle whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px] font-semibold" style={{ color: workflow.dueColor }}>
                {workflow.due}
              </td>
              <td className="px-3 py-2 border-b border-slate-100 text-xs align-middle whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px] font-semibold" style={{ color: workflow.dueColor }}>
                {workflow.eta}
              </td>
            </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="pagination px-5 py-3 border-t border-slate-200/50 flex justify-between items-center">
        <div className="pagination-info text-xs text-slate-400">
          Showing {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} workflows{filteredWorkflows.length !== transformedWorkflows.length ? ` (filtered from ${transformedWorkflows.length})` : ''}
        </div>
        {pagination.totalPages > 1 && (
          <div className="pagination-controls flex items-center gap-2">
            <button
              className={`btn btn-secondary btn-small px-3 py-1.5 text-xs font-medium border border-slate-200 no-underline inline-flex items-center justify-center transition-all duration-200 whitespace-nowrap gap-1.5 ${
                pagination.page <= 1 
                  ? 'cursor-not-allowed bg-white text-slate-600 opacity-50' 
                  : 'cursor-pointer bg-white text-slate-600 hover:bg-slate-50'
              }`}
              disabled={pagination.page <= 1}
              onClick={() => pagination.page > 1 && setCurrentPage(pagination.page - 1)}
            >
              « Previous
            </button>
            <span className="page-numbers flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    className={`btn btn-small px-3 py-1.5 text-xs font-medium border-none cursor-pointer no-underline inline-flex items-center justify-center transition-all duration-200 whitespace-nowrap gap-1.5 ${
                      pageNum === pagination.page
                        ? 'bg-[#64B6AC] text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </span>
            <button
              className={`btn btn-secondary btn-small px-3 py-1.5 text-xs font-medium border border-slate-200 no-underline inline-flex items-center justify-center transition-all duration-200 whitespace-nowrap gap-1.5 ${
                pagination.page >= pagination.totalPages 
                  ? 'cursor-not-allowed bg-white text-slate-600 opacity-50' 
                  : 'cursor-pointer bg-white text-slate-600 hover:bg-slate-50'
              }`}
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => pagination.page < pagination.totalPages && setCurrentPage(pagination.page + 1)}
            >
              Next »
            </button>
          </div>
        )}
      </div>
    </div>
  );
}