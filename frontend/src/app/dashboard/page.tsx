'use client';

import { DashboardHeader } from '@/app/dashboard/_components/header';
import { DashboardStats } from '@/app/dashboard/_components/stats';
import { WorkflowTable } from '@/app/dashboard/_components/workflow-table';

export default function DashboardPage() {
  return (
    <div className="dashboard-container relative">
      {/* Very light stripe overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none z-0" 
           style={{
             backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)'
           }}>
      </div>
      
      <div className="relative z-10">
        {/* Modern Header */}
        <DashboardHeader />
        
        {/* Modern Stats Bar */}
        <DashboardStats />
        
        {/* Modern Workflows */}
        <WorkflowTable />
      </div>
    </div>
  );
}