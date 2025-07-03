'use client';

import { DashboardStats } from '@/components/dashboard/stats';
import { WorkflowTable } from '@/components/dashboard/workflow-table';
import { InterruptQueue } from '@/components/dashboard/interrupt-queue';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { AgentStatus } from '@/components/dashboard/agent-status';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Overview of workflows, agents, and system status
        </p>
      </div>

      {/* Stats Bar */}
      <DashboardStats />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Interrupt Queue */}
          <InterruptQueue />
          
          {/* Workflow Table */}
          <WorkflowTable />
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Agent Status */}
          <AgentStatus />
          
          {/* Activity Feed */}
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}