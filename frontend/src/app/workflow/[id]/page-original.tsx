'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function WorkflowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workflowId = params.id;
  
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('details');

  // Mock data - in real app this would come from API
  const workflow = {
    id: workflowId,
    title: '123 Oak Street, Miami, FL 33101',
    subtitle: `${workflowId} • Payoff Request - First National`,
    status: 'Urgent',
    eta: 'Dec 29, 6:00 PM',
    due: 'Dec 29, 2024',
    closing: 'Dec 30, 2024',
    progress: '6 of 10 tasks'
  };

  const tasks = [
    {
      id: 'lookup-lender',
      name: 'Lookup Lender Contact Information',
      agent: '🔍 Nina',
      status: 'completed',
      meta: 'Completed Dec 27, 9:45 AM',
      sla: 'ON TIME'
    },
    {
      id: 'send-request',
      name: 'Send Payoff Request',
      agent: '📧 Mia',
      status: 'completed',
      meta: 'Completed Dec 27, 11:30 AM (Email method)',
      sla: 'ON TIME'
    },
    {
      id: 'await-response',
      name: 'Await Statement Response',
      agent: '👤 HIL Monitor',
      status: 'completed',
      meta: 'Received Dec 29, 1:30 PM',
      sla: 'ON TIME'
    },
    {
      id: 'portal-access',
      name: 'Access Lender Portal (Conditional)',
      agent: '🌐 Rex',
      status: 'awaiting-review',
      meta: 'Failed Dec 29, 2:15 PM • Backup attempt',
      sla: 'LATE',
      conditional: true
    },
    {
      id: 'process-document',
      name: 'Process Payoff Document',
      agent: '📄 Iris',
      status: 'awaiting-review',
      meta: 'Low confidence Dec 29, 1:45 PM',
      sla: 'DUE SOON'
    },
    {
      id: 'qa-review',
      name: 'Quality Assurance Review',
      agent: '✓ Cassy',
      status: 'pending',
      meta: 'Depends on: Document Processing',
      sla: 'SLA: 3:00 PM'
    }
  ];

  const handleTaskClick = (taskId: string) => {
    setSelectedTask(taskId);
  };

  const handleBackClick = () => {
    router.push('/dashboard');
  };

  return (
    <div 
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: '14px',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <div 
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '12px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={handleBackClick}
            style={{
              background: 'none',
              border: '1px solid #e2e8f0',
              padding: '6px 12px',
              fontSize: '12px',
              color: '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f1f5f9';
              e.currentTarget.style.color = '#0f172a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = '#64748b';
            }}
          >
            ← Back
          </button>
          <div>
            <div 
              style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#0f172a'
              }}
            >
              {workflow.title}
            </div>
            <div 
              style={{
                fontFamily: 'Monaco, Menlo, monospace',
                color: '#64748b',
                fontSize: '12px'
              }}
            >
              {workflow.subtitle}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
              <span style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.05em' }}>ETA:</span>
              <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: '500', whiteSpace: 'nowrap' }}>{workflow.eta}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
              <span style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.05em' }}>Due:</span>
              <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: '500', whiteSpace: 'nowrap' }}>{workflow.due}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
              <span style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.05em' }}>Closing:</span>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500', whiteSpace: 'nowrap' }}>{workflow.closing}</span>
            </div>
          </div>
          <span 
            style={{
              padding: '4px 8px',
              fontSize: '10px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              whiteSpace: 'nowrap',
              background: '#fef2f2',
              color: '#ef4444',
              border: '1px solid #fecaca'
            }}
          >
            {workflow.status}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div 
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '40% 60%',
          gap: 0
        }}
      >
        {/* Left Panel - Workflow Details */}
        <div 
          style={{
            background: '#ffffff',
            borderRight: '1px solid #e2e8f0',
            overflowY: 'auto'
          }}
        >
          <div 
            style={{
              padding: '8px 20px',
              borderBottom: '1px solid #f1f5f9',
              background: 'transparent',
              fontWeight: '600',
              fontSize: '11px',
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            📋 Workflow Details
          </div>
          
          <div style={{ padding: '20px' }}>
            {/* Progress Section */}
            <div 
              style={{
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                padding: '16px',
                marginBottom: '24px'
              }}
            >
              <div 
                style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#64748b',
                  marginBottom: '12px',
                  textTransform: 'uppercase'
                }}
              >
                Task Progress ({workflow.progress})
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleTaskClick(task.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 12px',
                      background: selectedTask === task.id ? '#8cc8c0' : '#ffffff',
                      border: selectedTask === task.id ? '1px solid #64B6AC' : '1px solid #f1f5f9',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      ...(task.conditional && {
                        background: selectedTask === task.id ? '#8cc8c0' : '#f8fafc',
                        borderLeft: '3px solid #f59e0b'
                      })
                    }}
                    onMouseEnter={(e) => {
                      if (selectedTask !== task.id) {
                        e.currentTarget.style.background = '#f1f5f9';
                        e.currentTarget.style.borderColor = '#64B6AC';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedTask !== task.id) {
                        e.currentTarget.style.background = task.conditional ? '#f8fafc' : '#ffffff';
                        e.currentTarget.style.borderColor = '#f1f5f9';
                      }
                    }}
                  >
                    <div 
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        flexShrink: 0,
                        background: task.status === 'completed' ? '#10b981' : 
                                   task.status === 'awaiting-review' ? '#ef4444' : '#cbd5e1',
                        ...(task.status === 'pending' && {
                          border: '2px solid #94a3b8'
                        })
                      }}
                    ></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div 
                        style={{
                          fontSize: '12px',
                          fontWeight: '500',
                          color: '#0f172a',
                          marginBottom: '2px'
                        }}
                      >
                        {task.name}
                      </div>
                      <div 
                        style={{
                          fontSize: '10px',
                          color: '#64748b',
                          lineHeight: 1.3
                        }}
                      >
                        {task.agent} • {task.meta}
                      </div>
                    </div>
                    <div 
                      style={{
                        fontSize: '9px',
                        fontWeight: '600',
                        padding: '2px 6px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        color: task.sla === 'ON TIME' ? '#10b981' : 
                               task.sla === 'LATE' ? '#ef4444' : 
                               task.sla === 'DUE SOON' ? '#f59e0b' : '#94a3b8',
                        background: task.sla === 'ON TIME' ? '#f0fdf4' : 
                                   task.sla === 'LATE' ? '#fef2f2' : 
                                   task.sla === 'DUE SOON' ? '#fffbeb' : 'transparent'
                      }}
                    >
                      {task.sla}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div>
              <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '16px' }}>
                {['details', 'files', 'audit', 'notes'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '8px 16px',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: activeTab === tab ? '#64B6AC' : '#64748b',
                      cursor: 'pointer',
                      borderBottom: activeTab === tab ? '2px solid #64B6AC' : '2px solid transparent',
                      transition: 'all 0.2s ease',
                      textTransform: 'capitalize'
                    }}
                    onMouseEnter={(e) => {
                      if (activeTab !== tab) {
                        e.currentTarget.style.color = '#0f172a';
                        e.currentTarget.style.background = '#f1f5f9';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeTab !== tab) {
                        e.currentTarget.style.color = '#64748b';
                        e.currentTarget.style.background = 'none';
                      }
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab === 'details' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Borrower Name</div>
                    <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: '400' }}>John & Maria Rodriguez</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lender Name</div>
                    <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: '400' }}>First National Bank</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Loan Number</div>
                    <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: '400', fontFamily: 'Monaco, Menlo, monospace' }}>FNB-2019-445821</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payoff Date</div>
                    <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: '400' }}>December 29, 2024</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Primary HIL</div>
                    <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: '400' }}>Sarah Chen</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Client</div>
                    <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: '400' }}>Sunshine Title Company</div>
                  </div>
                </div>
              )}

              {activeTab === 'files' && (
                <div style={{ color: '#64748b', fontSize: '12px', textAlign: 'center', padding: '20px' }}>
                  Files tab content would go here
                </div>
              )}

              {activeTab === 'audit' && (
                <div style={{ color: '#64748b', fontSize: '12px', textAlign: 'center', padding: '20px' }}>
                  Audit trail content would go here
                </div>
              )}

              {activeTab === 'notes' && (
                <div style={{ color: '#64748b', fontSize: '12px', textAlign: 'center', padding: '20px' }}>
                  Notes content would go here
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Task Details */}
        <div 
          style={{
            background: '#ffffff',
            overflowY: 'auto'
          }}
        >
          <div 
            style={{
              padding: '8px 20px',
              borderBottom: '1px solid #f1f5f9',
              background: 'transparent',
              fontWeight: '600',
              fontSize: '11px',
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            📋 Task Details
            <span style={{ color: '#94a3b8', fontSize: '10px', fontWeight: '400', textTransform: 'none', letterSpacing: 0 }}>
              {selectedTask ? 'Task selected' : 'Select a task to view details'}
            </span>
          </div>
          
          <div style={{ padding: '0' }}>
            {selectedTask ? (
              <div style={{ margin: '16px 20px' }}>
                <div 
                  style={{
                    paddingBottom: '16px',
                    borderBottom: '2px solid #64B6AC',
                    background: 'transparent',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '20px'
                  }}
                >
                  <div 
                    style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#0f172a',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <div 
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: '#ef4444'
                      }}
                    ></div>
                    {tasks.find(t => t.id === selectedTask)?.name}
                  </div>
                  <span 
                    style={{
                      fontSize: '9px',
                      fontWeight: '600',
                      padding: '3px 6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      background: '#fef2f2',
                      color: '#ef4444'
                    }}
                  >
                    REVIEW REQUIRED
                  </span>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <div 
                    style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#64B6AC',
                      marginBottom: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      borderBottom: '2px solid #64B6AC',
                      paddingBottom: '6px'
                    }}
                  >
                    Task Information
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ fontSize: '11px' }}>
                      <div style={{ color: '#64748b', marginBottom: '2px' }}>Agent</div>
                      <div style={{ color: '#0f172a', fontWeight: '500' }}>{tasks.find(t => t.id === selectedTask)?.agent}</div>
                    </div>
                    <div style={{ fontSize: '11px' }}>
                      <div style={{ color: '#64748b', marginBottom: '2px' }}>Status</div>
                      <div style={{ color: '#0f172a', fontWeight: '500' }}>AWAITING REVIEW</div>
                    </div>
                    <div style={{ fontSize: '11px' }}>
                      <div style={{ color: '#64748b', marginBottom: '2px' }}>Completed</div>
                      <div style={{ color: '#0f172a', fontWeight: '500' }}>Dec 29, 1:45 PM</div>
                    </div>
                    <div style={{ fontSize: '11px' }}>
                      <div style={{ color: '#64748b', marginBottom: '2px' }}>Duration</div>
                      <div style={{ color: '#0f172a', fontWeight: '500' }}>15 minutes</div>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <div 
                    style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#64B6AC',
                      marginBottom: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      borderBottom: '2px solid #64B6AC',
                      paddingBottom: '6px'
                    }}
                  >
                    Execution Logs
                  </div>
                  <div 
                    style={{
                      background: 'transparent',
                      padding: '12px',
                      fontFamily: 'Monaco, Menlo, monospace',
                      fontSize: '10px',
                      color: '#64748b',
                      maxHeight: '120px',
                      overflowY: 'auto',
                      borderLeft: '3px solid #e2e8f0',
                      paddingLeft: '12px',
                      lineHeight: 1.4
                    }}
                  >
                    [13:30] Received payoff statement via email<br/>
                    [13:31] Starting OCR processing on payoff_statement_fnb.pdf<br/>
                    [13:33] OCR completed - Processing 1 page document<br/>
                    [13:40] Extracting payoff amount - 67% confidence (LOW)<br/>
                    [13:45] Document processing completed with manual review flag
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <div 
                    style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#64B6AC',
                      marginBottom: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      borderBottom: '2px solid #64B6AC',
                      paddingBottom: '6px'
                    }}
                  >
                    Result Summary
                  </div>
                  <div 
                    style={{
                      background: 'transparent',
                      padding: '12px',
                      fontSize: '11px',
                      color: '#0f172a',
                      border: 'none',
                      borderLeft: '3px solid #64B6AC',
                      paddingLeft: '12px',
                      maxHeight: '100px',
                      overflowY: 'auto',
                      lineHeight: 1.4
                    }}
                  >
                    Document processed successfully. Low confidence (67%) on payoff amount extraction: $247,856.32. Manual verification recommended.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button 
                    style={{
                      padding: '6px 12px',
                      fontSize: '11px',
                      fontWeight: '500',
                      border: 'none',
                      cursor: 'pointer',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap',
                      gap: '4px',
                      background: '#64B6AC',
                      color: 'white',
                      boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#5a9f95';
                      e.currentTarget.style.boxShadow = '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#64B6AC';
                      e.currentTarget.style.boxShadow = '0 1px 2px 0 rgb(0 0 0 / 0.05)';
                    }}
                  >
                    🔧 Open Agent Interface
                  </button>
                  <button 
                    style={{
                      padding: '6px 12px',
                      fontSize: '11px',
                      fontWeight: '500',
                      border: '1px solid #e2e8f0',
                      cursor: 'pointer',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap',
                      gap: '4px',
                      background: '#ffffff',
                      color: '#64748b'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f1f5f9';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#ffffff';
                    }}
                  >
                    🔄 Retry Task
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                <h3 style={{ color: '#64748b', marginBottom: '8px', fontSize: '14px' }}>No Task Selected</h3>
                <p style={{ fontSize: '12px' }}>Click on a task from the workflow progress to view its details, logs, and results.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}