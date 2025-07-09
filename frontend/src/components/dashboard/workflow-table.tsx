'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkflows } from '@/lib/hooks/useWorkflows';
import { formatWorkflowIdWithType } from '@rexera/shared';

export function WorkflowTable() {
  const router = useRouter();
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterInterrupts, setFilterInterrupts] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const { workflows: workflowData, loading, error } = useWorkflows({ 
    include: ['client', 'tasks'], 
    limit: 20 
  });

  // Sort handler
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get sort indicator
  const getSortIndicator = (field: string) => {
    if (sortField !== field) return '⇅';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  // Transform and sort API data
  const transformedWorkflows = workflowData.map((workflow: any) => {
    const tasks = workflow.task_executions || workflow.tasks || [];
    const interruptCount = tasks.filter((t: any) => t.status === 'AWAITING_REVIEW')?.length || 0;
    const hasInterrupts = interruptCount > 0;
    
    return {
      id: formatWorkflowIdWithType(workflow.id, workflow.workflow_type),
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
        icons: getInterruptIcons(tasks.filter((t: any) => t.status === 'AWAITING_REVIEW') || [])
      } : null,
      interruptCount: interruptCount, // For sorting
      due: formatDate(workflow.due_date),
      dueRaw: workflow.due_date, // For sorting
      eta: formatDate(workflow.due_date), // Could be enhanced with better ETA logic
      dueColor: getDueColor(workflow.status, workflow.due_date)
    };
  });

  // Filter workflows
  const filteredWorkflows = transformedWorkflows.filter((workflow: any) => {
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

  // Sort workflows
  const workflows = [...filteredWorkflows].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortField) {
      case 'id':
        aValue = a.id;
        bValue = b.id;
        break;
      case 'created_at':
        aValue = new Date(a.createdRaw || 0).getTime();
        bValue = new Date(b.createdRaw || 0).getTime();
        break;
      case 'type':
        aValue = a.typeRaw;
        bValue = b.typeRaw;
        break;
      case 'client':
        aValue = a.client;
        bValue = b.client;
        break;
      case 'property':
        aValue = a.property;
        bValue = b.property;
        break;
      case 'status':
        aValue = a.statusRaw;
        bValue = b.statusRaw;
        break;
      case 'interrupts':
        aValue = a.interruptCount;
        bValue = b.interruptCount;
        break;
      case 'due':
        aValue = a.dueRaw ? new Date(a.dueRaw).getTime() : 0;
        bValue = b.dueRaw ? new Date(b.dueRaw).getTime() : 0;
        break;
      default:
        aValue = a.id;
        bValue = b.id;
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  function getDisplayWorkflowType(type: string) {
    const typeMap: Record<string, string> = {
      'PAYOFF': 'Payoff Request',
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

  function getInterruptIcons(tasks: any[]) {
    const taskTypeIcons: Record<string, string> = {
      'identify_lender_contact': '🔍',
      'research_lender_contact': '🔍',
      'submit_payoff_request': '📧',
      'send_email': '📧',
      'call_lender': '📞',
      'process_document': '📄',
      'verify_data': '✓',
      'hoa_request': '🏢',
      'municipal_search': '🏛️'
    };
    
    return tasks.slice(0, 3).map(task => {
      const taskType = task.task_type || task.type || 'unknown';
      return taskTypeIcons[taskType] || '⚠️';
    }).join('');
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48 text-slate-500">
        Loading workflows...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-48 text-red-500">
        Error loading workflows: {error}
      </div>
    );
  }


  const handleWorkflowClick = (workflowId: string) => {
    router.push(`/workflow/${workflowId}`);
  };

  return (
    <div className="workflows-section bg-white border border-slate-200 shadow-sm overflow-hidden">
      {/* Table Controls */}
      <div className="table-controls px-5 py-4 border-b border-slate-200 bg-white flex justify-start items-center">
        <div className="filters flex gap-2 items-center flex-wrap">
          <select 
            className="filter-select px-2 py-1 border border-slate-100 bg-white text-slate-400 text-xs min-w-[100px]"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="PAYOFF">Payoff Request</option>
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
            <th onClick={() => handleSort('id')} className="px-3 py-1.5 text-left bg-white border-b border-slate-200 font-normal text-[9px] text-slate-400 uppercase tracking-wider cursor-pointer">
              Workflow ID <span className="ml-1.5 text-slate-300 text-[8px]">{getSortIndicator('id')}</span>
            </th>
            <th onClick={() => handleSort('created_at')} className="px-3 py-1.5 text-left bg-white border-b border-slate-200 font-normal text-[9px] text-slate-400 uppercase tracking-wider cursor-pointer">
              Created <span className="ml-1.5 text-slate-300 text-[8px]">{getSortIndicator('created_at')}</span>
            </th>
            <th onClick={() => handleSort('type')} className="px-3 py-1.5 text-left bg-white border-b border-slate-200 font-normal text-[9px] text-slate-400 uppercase tracking-wider cursor-pointer">
              Type <span className="ml-1.5 text-slate-300 text-[8px]">{getSortIndicator('type')}</span>
            </th>
            <th onClick={() => handleSort('property')} className="px-3 py-1.5 text-left bg-white border-b border-slate-200 font-normal text-[9px] text-slate-400 uppercase tracking-wider cursor-pointer">
              Property <span className="ml-1.5 text-slate-300 text-[8px]">{getSortIndicator('property')}</span>
            </th>
            <th onClick={() => handleSort('client')} className="px-3 py-1.5 text-left bg-white border-b border-slate-200 font-normal text-[9px] text-slate-400 uppercase tracking-wider cursor-pointer">
              Client <span className="ml-1.5 text-slate-300 text-[8px]">{getSortIndicator('client')}</span>
            </th>
            <th onClick={() => handleSort('status')} className="px-3 py-1.5 text-left bg-white border-b border-slate-200 font-normal text-[9px] text-slate-400 uppercase tracking-wider cursor-pointer">
              Status <span className="ml-1.5 text-slate-300 text-[8px]">{getSortIndicator('status')}</span>
            </th>
            <th onClick={() => handleSort('interrupts')} className="px-3 py-1.5 text-left bg-white border-b border-slate-200 font-normal text-[9px] text-slate-400 uppercase tracking-wider cursor-pointer">
              Interrupts <span className="ml-1.5 text-slate-300 text-[8px]">{getSortIndicator('interrupts')}</span>
            </th>
            <th onClick={() => handleSort('due')} className="px-3 py-1.5 text-left bg-white border-b border-slate-200 font-normal text-[9px] text-slate-400 uppercase tracking-wider cursor-pointer">
              DUE <span className="ml-1.5 text-slate-300 text-[8px]">{getSortIndicator('due')}</span>
            </th>
            <th onClick={() => handleSort('due')} className="px-3 py-1.5 text-left bg-white border-b border-slate-200 font-normal text-[9px] text-slate-400 uppercase tracking-wider cursor-pointer">
              ETA <span className="ml-1.5 text-slate-300 text-[8px]">{getSortIndicator('due')}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {workflows.map((workflow: any, index: number) => (
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
              <td className="px-3 py-2 border-b border-slate-100 text-xs align-middle whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">
                {workflow.interrupts ? (
                  <div className={`interrupt-indicator ${workflow.interrupts.type} flex items-center gap-1 text-[10px]`}>
                    <span 
                      className={`interrupt-count ${workflow.interrupts.type === 'critical' ? 'bg-red-500' : 'bg-amber-500'} text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-semibold flex-shrink-0`}
                    >
                      {workflow.interrupts.count}
                    </span>
                    <span className="interrupt-text text-slate-600 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                      {workflow.interrupts.icons}
                    </span>
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
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="pagination px-5 py-3 border-t border-slate-100 bg-white flex justify-between items-center">
        <div className="pagination-info text-xs text-slate-400">
          Showing 1-{workflows.length} of {workflows.length} workflows{filteredWorkflows.length !== transformedWorkflows.length ? ` (filtered from ${transformedWorkflows.length})` : ''}
        </div>
        {workflows.length > 20 && (
          <div className="pagination-controls flex items-center gap-2">
            <button
              className="btn btn-secondary btn-small px-3 py-1.5 text-xs font-medium border border-slate-200 cursor-not-allowed no-underline inline-flex items-center justify-center transition-all duration-200 whitespace-nowrap gap-1.5 bg-white text-slate-600 opacity-50"
              disabled
            >
              « Previous
            </button>
            <span className="page-numbers flex items-center gap-1">
              <button className="btn btn-primary btn-small px-3 py-1.5 text-xs font-medium border-none cursor-pointer no-underline inline-flex items-center justify-center transition-all duration-200 whitespace-nowrap gap-1.5 bg-[#64B6AC] text-white shadow-sm">
                1
              </button>
            </span>
            <button className="btn btn-secondary btn-small px-3 py-1.5 text-xs font-medium border border-slate-200 cursor-pointer no-underline inline-flex items-center justify-center transition-all duration-200 whitespace-nowrap gap-1.5 bg-white text-slate-600">
              Next »
            </button>
          </div>
        )}
      </div>
    </div>
  );
}