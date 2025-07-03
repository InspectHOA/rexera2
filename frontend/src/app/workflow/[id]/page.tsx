'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { styles, colors } from '@/styles/workflow-detail';
import { WorkflowHeader } from '@/components/workflow/WorkflowHeader';
import { TaskList } from '@/components/workflow/TaskList';
import { TabNavigation } from '@/components/workflow/TabNavigation';
import { TaskDetailView } from '@/components/workflow/TaskDetailView';

// Types
interface Task {
  id: string;
  name: string;
  agent: string;
  status: string;
  meta: string;
  sla: string;
  conditional?: boolean;
}

interface Workflow {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  eta: string;
  due: string;
  closing: string;
  progress: string;
}

// Mock data
const MOCK_WORKFLOW: Workflow = {
  id: 'PAY-0891',
  title: '123 Oak Street, Miami, FL 33101',
  subtitle: 'PAY-0891 • Payoff Request - First National',
  status: 'Urgent',
  eta: 'Dec 29, 6:00 PM',
  due: 'Dec 29, 2024',
  closing: 'Dec 30, 2024',
  progress: '6 of 10 tasks'
};

const MOCK_TASKS: Task[] = [
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

const DETAIL_FIELDS = [
  { label: 'Borrower Name', value: 'John & Maria Rodriguez' },
  { label: 'Lender Name', value: 'First National Bank' },
  { label: 'Loan Number', value: 'FNB-2019-445821', mono: true },
  { label: 'Payoff Date', value: 'December 29, 2024' },
  { label: 'Primary HIL', value: 'Sarah Chen' },
  { label: 'Client', value: 'Sunshine Title Company' }
];

export default function WorkflowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('details');

  // In real app, fetch data based on params.id
  const workflow = { ...MOCK_WORKFLOW, id: params.id as string };

  const handleBackClick = () => router.push('/dashboard');

  return (
    <div style={styles.page}>
      <WorkflowHeader workflow={workflow} onBackClick={handleBackClick} />
      
      <div style={styles.mainContent}>
        {/* Left Panel */}
        <div style={{ ...styles.panel, borderRight: `1px solid ${colors.border.default}` }}>
          <div style={styles.panelHeader}>📋 Workflow Details</div>
          
          <div style={{ padding: '20px' }}>
            <TaskList
              tasks={MOCK_TASKS}
              selectedTask={selectedTask}
              onTaskClick={setSelectedTask}
              progress={workflow.progress}
            />
            
            <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
            
            <TabContent activeTab={activeTab} />
          </div>
        </div>

        {/* Right Panel */}
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            📋 Task Details
            <span style={{ color: colors.text.tertiary, fontSize: '10px', fontWeight: '400', textTransform: 'none', letterSpacing: 0 }}>
              {selectedTask ? 'Task selected' : 'Select a task to view details'}
            </span>
          </div>
          
          <TaskDetailView selectedTask={selectedTask} tasks={MOCK_TASKS} />
        </div>
      </div>
    </div>
  );
}

function TabContent({ activeTab }: { activeTab: string }) {
  switch (activeTab) {
    case 'details':
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {DETAIL_FIELDS.map((field) => (
            <div key={field.label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '11px', color: colors.text.secondary, fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {field.label}
              </div>
              <div style={{ 
                fontSize: '13px', 
                color: colors.text.primary, 
                fontWeight: '400',
                ...(field.mono && { fontFamily: 'Monaco, Menlo, monospace' })
              }}>
                {field.value}
              </div>
            </div>
          ))}
        </div>
      );
    
    case 'files':
      return <PlaceholderContent>Files tab content would go here</PlaceholderContent>;
    
    case 'audit':
      return <PlaceholderContent>Audit trail content would go here</PlaceholderContent>;
    
    case 'notes':
      return <PlaceholderContent>Notes content would go here</PlaceholderContent>;
    
    default:
      return null;
  }
}

function PlaceholderContent({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ color: colors.text.secondary, fontSize: '12px', textAlign: 'center', padding: '20px' }}>
      {children}
    </div>
  );
}