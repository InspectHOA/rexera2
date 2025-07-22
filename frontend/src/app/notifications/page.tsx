'use client';

import { DashboardHeader } from '@/app/dashboard/_components/header';
import { NotificationsStats } from '@/app/notifications/_components/notifications-stats';
import { NotificationsTable } from '@/app/notifications/_components/notifications-table';

export default function NotificationsPage() {
  return (
    <div className="dashboard-container relative">
      {/* Very light stripe overlay - same pattern as dashboard */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none z-0" 
           style={{
             backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)'
           }}>
      </div>
      
      <div className="relative z-10">
        {/* Reuse dashboard header */}
        <DashboardHeader />
        
        {/* Notifications-specific stats */}
        <NotificationsStats />
        
        {/* Main notifications table */}
        <NotificationsTable />
      </div>
    </div>
  );
}