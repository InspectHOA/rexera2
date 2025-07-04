'use client';

import { useRouter } from 'next/navigation';
import { useWorkflowsTRPC } from '@/lib/hooks/useWorkflowsTRPC';

export function WorkflowTable() {
  const router = useRouter();
  const { workflows: workflowData, loading, error } = useWorkflowsTRPC({ 
    include: ['client', 'tasks'], 
    limit: 20 
  });

  // Transform API data to match component format
  const workflows = workflowData.map((workflow: any) => {
    const interruptCount = workflow.tasks?.filter((t: any) => t.status === 'AWAITING_REVIEW')?.length || 0;
    const hasInterrupts = interruptCount > 0;
    
    return {
      id: workflow.id,
      workflowId: workflow.id,
      type: getDisplayWorkflowType(workflow.workflow_type),
      client: workflow.client?.name || 'Unknown Client',
      property: workflow.title || 'No property info',
      status: getDisplayStatus(workflow.status),
      statusClass: getStatusClass(workflow.status),
      interrupts: hasInterrupts ? {
        type: workflow.priority === 'URGENT' ? 'critical' : 'standard',
        count: interruptCount,
        icons: getInterruptIcons(workflow.tasks?.filter((t: any) => t.status === 'AWAITING_REVIEW') || [])
      } : null,
      due: formatDate(workflow.due_date),
      eta: formatDate(workflow.due_date), // Could be enhanced with better ETA logic
      dueColor: getDueColor(workflow.status, workflow.due_date)
    };
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
      'PENDING': 'In Progress',
      'IN_PROGRESS': 'In Progress', 
      'AWAITING_REVIEW': 'Urgent',
      'COMPLETED': 'Completed',
      'BLOCKED': 'Urgent'
    };
    return statusMap[status] || status;
  }

  function getStatusClass(status: string) {
    const classMap: Record<string, string> = {
      'PENDING': 'status-progress',
      'IN_PROGRESS': 'status-progress',
      'AWAITING_REVIEW': 'status-urgent', 
      'COMPLETED': 'status-completed',
      'BLOCKED': 'status-urgent'
    };
    return classMap[status] || 'status-progress';
  }

  function getInterruptIcons(tasks: any[]) {
    const agentIcons: Record<string, string> = {
      'Nina': '🔍',
      'Mia': '📧', 
      'Florian': '🗣️',
      'Rex': '🌐',
      'Iris': '📄',
      'Ria': '🤝',
      'Kosha': '💰',
      'Cassy': '✓',
      'Max': '📞',
      'Corey': '🏢'
    };
    
    return tasks.slice(0, 3).map(task => {
      const agentName = task.metadata?.agent_name || 'Unknown';
      return agentIcons[agentName] || '⚠️';
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
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '200px',
        color: '#64748b' 
      }}>
        Loading workflows...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '200px',
        color: '#ef4444' 
      }}>
        Error loading workflows: {error}
      </div>
    );
  }


  const handleWorkflowClick = (workflowId: string) => {
    router.push(`/workflow/${workflowId}`);
  };

  return (
    <div 
      className="workflows-section"
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        overflow: 'hidden'
      }}
    >
      {/* Table Controls */}
      <div 
        className="table-controls"
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e2e8f0',
          background: '#ffffff',
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center'
        }}
      >
        <div 
          className="filters"
          style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}
        >
          <select 
            className="filter-select"
            style={{
              padding: '6px 12px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              color: '#0f172a',
              fontSize: '13px',
              minWidth: '120px'
            }}
          >
            <option value="">All Types</option>
            <option value="payoff">Payoff Request</option>
            <option value="hoa">HOA Documents</option>
            <option value="municipal">Municipal Lien</option>
            <option value="condo">Condo Documents</option>
          </select>
          
          <select 
            className="filter-select"
            style={{
              padding: '6px 12px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              color: '#0f172a',
              fontSize: '13px',
              minWidth: '120px'
            }}
          >
            <option value="">All Statuses</option>
            <option value="urgent">Urgent</option>
            <option value="progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          
          <select 
            className="filter-select"
            style={{
              padding: '6px 12px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              color: '#0f172a',
              fontSize: '13px',
              minWidth: '120px'
            }}
          >
            <option value="">All Interrupts</option>
            <option value="has-interrupts">Has Interrupts</option>
            <option value="no-interrupts">No Interrupts</option>
          </select>
          
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search workflows, clients..."
            style={{
              padding: '6px 12px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              color: '#0f172a',
              fontSize: '13px',
              minWidth: '200px'
            }}
          />
        </div>
      </div>

      {/* Table */}
      <table 
        className="workflows-table"
        style={{
          width: '100%',
          borderCollapse: 'collapse'
        }}
      >
        <thead>
          <tr>
            <th style={{ padding: '8px 12px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', fontWeight: '600', fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer' }}>
              Workflow ID <span style={{ marginLeft: '6px', color: '#94a3b8', fontSize: '10px' }}>⇅</span>
            </th>
            <th style={{ padding: '8px 12px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', fontWeight: '600', fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer' }}>
              Type <span style={{ marginLeft: '6px', color: '#94a3b8', fontSize: '10px' }}>⇅</span>
            </th>
            <th style={{ padding: '8px 12px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', fontWeight: '600', fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer' }}>
              Client <span style={{ marginLeft: '6px', color: '#94a3b8', fontSize: '10px' }}>⇅</span>
            </th>
            <th style={{ padding: '8px 12px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', fontWeight: '600', fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer' }}>
              Property <span style={{ marginLeft: '6px', color: '#94a3b8', fontSize: '10px' }}>⇅</span>
            </th>
            <th style={{ padding: '8px 12px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', fontWeight: '600', fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer' }}>
              Status <span style={{ marginLeft: '6px', color: '#94a3b8', fontSize: '10px' }}>⇅</span>
            </th>
            <th style={{ padding: '8px 12px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', fontWeight: '600', fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer' }}>
              Interrupts <span style={{ marginLeft: '6px', color: '#94a3b8', fontSize: '10px' }}>⇅</span>
            </th>
            <th style={{ padding: '8px 12px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', fontWeight: '600', fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer' }}>
              DUE <span style={{ marginLeft: '6px', color: '#94a3b8', fontSize: '10px' }}>⇅</span>
            </th>
            <th style={{ padding: '8px 12px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', fontWeight: '600', fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer' }}>
              ETA <span style={{ marginLeft: '6px', color: '#94a3b8', fontSize: '10px' }}>⇅</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {workflows.map((workflow, index) => (
            <tr 
              key={index}
              onClick={() => handleWorkflowClick(workflow.workflowId)}
              style={{ 
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <td style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', fontSize: '11px', verticalAlign: 'middle', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px', fontWeight: '600', color: '#0f172a', fontFamily: 'Monaco, Menlo, monospace' }}>
                {workflow.id}
              </td>
              <td style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', fontSize: '12px', verticalAlign: 'middle', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>
                {workflow.type}
              </td>
              <td style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', fontSize: '12px', verticalAlign: 'middle', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>
                {workflow.client}
              </td>
              <td style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', fontSize: '12px', verticalAlign: 'middle', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>
                {workflow.property}
              </td>
              <td style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', fontSize: '12px', verticalAlign: 'middle', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>
                <span 
                  className={`status-badge ${workflow.statusClass}`}
                  style={{
                    padding: '2px 6px',
                    fontSize: '9px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    whiteSpace: 'nowrap',
                    borderRadius: '0',
                    ...(workflow.statusClass === 'status-urgent' && {
                      background: '#fef2f2',
                      color: '#ef4444',
                      border: '1px solid #fecaca'
                    }),
                    ...(workflow.statusClass === 'status-progress' && {
                      background: '#fffbeb',
                      color: '#f59e0b',
                      border: '1px solid #fed7aa'
                    }),
                    ...(workflow.statusClass === 'status-completed' && {
                      background: '#f0fdf4',
                      color: '#10b981',
                      border: '1px solid #bbf7d0'
                    })
                  }}
                >
                  {workflow.status}
                </span>
              </td>
              <td style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', fontSize: '12px', verticalAlign: 'middle', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>
                {workflow.interrupts ? (
                  <div 
                    className={`interrupt-indicator ${workflow.interrupts.type}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '10px'
                    }}
                  >
                    <span 
                      className="interrupt-count"
                      style={{
                        background: workflow.interrupts.type === 'critical' ? '#ef4444' : '#f59e0b',
                        color: 'white',
                        borderRadius: '50%',
                        width: '16px',
                        height: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '9px',
                        fontWeight: '600',
                        flexShrink: '0'
                      }}
                    >
                      {workflow.interrupts.count}
                    </span>
                    <span 
                      className="interrupt-text"
                      style={{
                        color: '#475569',
                        fontWeight: '500',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {workflow.interrupts.icons}
                    </span>
                  </div>
                ) : (
                  <span 
                    className="no-interrupts"
                    style={{
                      color: '#94a3b8',
                      textAlign: 'center',
                      fontSize: '12px'
                    }}
                  >
                    —
                  </span>
                )}
              </td>
              <td style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', fontSize: '12px', verticalAlign: 'middle', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px', color: workflow.dueColor, fontWeight: '600' }}>
                {workflow.due}
              </td>
              <td style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', fontSize: '12px', verticalAlign: 'middle', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px', color: workflow.dueColor, fontWeight: '600' }}>
                {workflow.eta}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div
        className="pagination"
        style={{
          padding: '16px 20px',
          borderTop: '1px solid #e2e8f0',
          background: '#f1f5f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div
          className="pagination-info"
          style={{
            fontSize: '13px',
            color: '#475569'
          }}
        >
          Showing 1-{workflows.length} of {workflows.length} workflows
        </div>
        {workflows.length > 20 && (
          <div
            className="pagination-controls"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <button
              className="btn btn-secondary btn-small"
              disabled
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '500',
                border: '1px solid #e2e8f0',
                cursor: 'not-allowed',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                gap: '6px',
                background: '#ffffff',
                color: '#475569',
                opacity: '0.5'
              }}
            >
              « Previous
            </button>
            <span className="page-numbers" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                className="btn btn-primary btn-small"
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: '500',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                  gap: '6px',
                  background: '#64B6AC',
                  color: 'white',
                  boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
                }}
              >
                1
              </button>
            </span>
            <button
              className="btn btn-secondary btn-small"
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '500',
                border: '1px solid #e2e8f0',
                cursor: 'pointer',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                gap: '6px',
                background: '#ffffff',
                color: '#475569'
              }}
            >
              Next »
            </button>
          </div>
        )}
      </div>
    </div>
  );
}