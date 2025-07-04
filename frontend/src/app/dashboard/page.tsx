'use client';

import { DashboardHeader } from '@/components/dashboard/header';
import { DashboardStats } from '@/components/dashboard/stats';
import { WorkflowTable } from '@/components/dashboard/workflow-table';

export default function DashboardPage() {
  return (
    <div className="dashboard-container">
      {/* Modern Header */}
      <DashboardHeader />
      
      {/* Modern Stats Bar */}
      <DashboardStats />
      
      {/* Modern Workflows */}
      <WorkflowTable />
    </div>
  );
}