'use client';

import { useWorkflows } from '@/lib/hooks/useWorkflows';

export function DashboardStats() {
  const { stats, loading } = useWorkflows({ include: ['tasks'] });
  return (
    <div 
      className="stats-bar"
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        padding: '12px 16px',
        marginBottom: '16px',
        boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: '16px',
        alignItems: 'center'
      }}
    >
      <div 
        className="quick-stats"
        style={{
          display: 'flex',
          gap: '20px',
          alignItems: 'center'
        }}
      >
        <div className="stat" style={{ textAlign: 'left' }}>
          <div 
            className="stat-number"
            style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#0f172a',
              lineHeight: '1',
              marginBottom: '2px'
            }}
          >
            {loading ? '...' : stats.total}
          </div>
          <div 
            className="stat-label"
            style={{
              fontSize: '11px',
              color: '#475569',
              fontWeight: '500'
            }}
          >
            Total Workflows
          </div>
        </div>
        
        <div className="stat" style={{ textAlign: 'left' }}>
          <div 
            className="stat-number"
            style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#0f172a',
              lineHeight: '1',
              marginBottom: '2px'
            }}
          >
            {loading ? '...' : stats.active}
          </div>
          <div 
            className="stat-label"
            style={{
              fontSize: '11px',
              color: '#475569',
              fontWeight: '500'
            }}
          >
            Active
          </div>
        </div>
        
        <div className="stat" style={{ textAlign: 'left' }}>
          <div 
            className="stat-number"
            style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#0f172a',
              lineHeight: '1',
              marginBottom: '2px'
            }}
          >
            {loading ? '...' : stats.interrupts}
          </div>
          <div 
            className="stat-label"
            style={{
              fontSize: '11px',
              color: '#475569',
              fontWeight: '500'
            }}
          >
            Interrupts
          </div>
        </div>
        
        <div className="stat" style={{ textAlign: 'left' }}>
          <div 
            className="stat-number"
            style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#0f172a',
              lineHeight: '1',
              marginBottom: '2px'
            }}
          >
            {loading ? '...' : stats.completedToday}
          </div>
          <div 
            className="stat-label"
            style={{
              fontSize: '11px',
              color: '#475569',
              fontWeight: '500'
            }}
          >
            Completed Today
          </div>
        </div>
      </div>
      
      <div 
        className="system-status"
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          fontSize: '11px'
        }}
      >
        <div 
          className="status-item"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            background: '#f1f5f9',
            color: '#475569',
            fontWeight: '500',
            borderRadius: '0'
          }}
        >
          <div 
            className="status-dot"
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#10b981'
            }}
          ></div>
          <span>All Agents Online</span>
        </div>
        
        <div 
          className="status-item"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            background: '#f1f5f9',
            color: '#475569',
            fontWeight: '500',
            borderRadius: '0'
          }}
        >
          <span>47 in Queue</span>
        </div>
        
        <div 
          className="status-item"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            background: '#f1f5f9',
            color: '#475569',
            fontWeight: '500',
            borderRadius: '0'
          }}
        >
          <span>94.2% Success</span>
        </div>
      </div>
    </div>
  );
}