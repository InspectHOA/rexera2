'use client';

import { useRouter } from 'next/navigation';

export function WorkflowTable() {
  const router = useRouter();
  const workflows = [
    {
      id: '🚨 PAY-0891',
      workflowId: 'PAY-0891',
      type: 'Payoff Request',
      client: 'First National',
      property: '123 Oak St',
      status: 'Urgent',
      statusClass: 'status-urgent',
      interrupts: { type: 'critical', count: 2, icons: '🔍📄' },
      due: 'Dec 29',
      eta: 'Dec 29',
      dueColor: '#ef4444'
    },
    {
      id: '⚠️ HOA-0440',
      workflowId: 'HOA-0440',
      type: 'HOA Documents',
      client: 'Realty Plus',
      property: '456 Paradise Ln',
      status: 'In Progress',
      statusClass: 'status-progress',
      interrupts: { type: 'standard', count: 1, icons: '🌐' },
      due: 'Dec 30',
      eta: 'Dec 30',
      dueColor: '#f59e0b'
    },
    {
      id: '⏱️ MUN-0332',
      workflowId: 'MUN-0332',
      type: 'Lien Search',
      client: 'City Bank',
      property: '789 Pine Ave',
      status: 'In Progress',
      statusClass: 'status-progress',
      interrupts: null,
      due: 'Jan 2',
      eta: 'Jan 1',
      dueColor: '#0f172a'
    },
    {
      id: '✅ HOA-0445',
      workflowId: 'HOA-0445',
      type: 'HOA Documents',
      client: 'Prime Lending',
      property: '321 Elm St',
      status: 'Completed',
      statusClass: 'status-completed',
      interrupts: null,
      due: 'Dec 28',
      eta: '✓ Delivered',
      dueColor: '#10b981'
    },
    {
      id: '🔄 PAY-0889',
      workflowId: 'PAY-0889',
      type: 'Payoff Request',
      client: 'Metro Credit',
      property: '555 Maple Dr',
      status: 'In Progress',
      statusClass: 'status-progress',
      interrupts: null,
      due: 'Dec 31',
      eta: 'Dec 30 3pm',
      dueColor: '#0f172a'
    }
  ];

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
              <td style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', fontSize: '12px', verticalAlign: 'middle', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px', fontWeight: '600', fontSize: '11px', color: '#0f172a', fontFamily: 'Monaco, Menlo, monospace' }}>
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
          Showing 1-20 of 156 workflows
        </div>
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
              border: 'none',
              cursor: 'not-allowed',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              gap: '6px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
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
            <button 
              className="btn btn-secondary btn-small"
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
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                color: '#475569'
              }}
            >
              2
            </button>
            <button 
              className="btn btn-secondary btn-small"
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
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                color: '#475569'
              }}
            >
              3
            </button>
            <span className="page-dots" style={{ color: '#94a3b8', fontSize: '12px', padding: '0 4px' }}>...</span>
            <button 
              className="btn btn-secondary btn-small"
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
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                color: '#475569'
              }}
            >
              8
            </button>
          </span>
          <button 
            className="btn btn-secondary btn-small"
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
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              color: '#475569'
            }}
          >
            Next »
          </button>
        </div>
      </div>
    </div>
  );
}