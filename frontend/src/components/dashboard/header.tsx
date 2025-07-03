'use client';

export function DashboardHeader() {
  return (
    <div 
      className="header"
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        padding: '12px 20px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
      }}
    >
      <div 
        className="logo"
        style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#0f172a',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <div 
          className="logo-icon"
          style={{
            width: '24px',
            height: '24px',
            background: '#64B6AC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '600',
            fontSize: '12px'
          }}
        >
          R
        </div>
        Rexera HIL Dashboard
      </div>
      
      <div 
        className="user-info"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '13px'
        }}
      >
        <div 
          className="notification-badge"
          style={{
            background: '#ef4444',
            color: 'white',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: '600',
            boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
          }}
        >
          3
        </div>
        <span>Sarah Chen</span>
        <div 
          className="user-avatar"
          style={{
            width: '32px',
            height: '32px',
            background: 'linear-gradient(135deg, #8cc8c0, #64B6AC)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '600',
            fontSize: '12px'
          }}
        >
          SC
        </div>
      </div>
    </div>
  );
}