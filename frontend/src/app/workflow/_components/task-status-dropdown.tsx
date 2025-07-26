'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/provider';
import { type TaskStatus } from '@rexera/shared';

interface TaskStatusDropdownProps {
  taskId?: string;
  currentStatus: string;
  workflowId?: string;
  isCompact?: boolean;
}

// Available task statuses from shared types
const TASK_STATUSES: { value: TaskStatus; label: string; description: string }[] = [
  { 
    value: 'NOT_STARTED', 
    label: 'Not Started', 
    description: 'Task has not been initiated yet' 
  },
  { 
    value: 'IN_PROGRESS', 
    label: 'In Progress', 
    description: 'Task is actively being processed' 
  },
  { 
    value: 'INTERRUPT', 
    label: 'Interrupted', 
    description: 'Task requires human review or approval' 
  },
  { 
    value: 'COMPLETED', 
    label: 'Completed', 
    description: 'Task has been successfully completed' 
  },
  { 
    value: 'FAILED', 
    label: 'Failed', 
    description: 'Task failed and cannot proceed' 
  }
];

// Get status color classes based on current UI patterns
function getStatusStyles(status: string) {
  switch (status) {
    case 'NOT_STARTED':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    case 'IN_PROGRESS':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'INTERRUPT':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'COMPLETED':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'FAILED':
      return 'bg-red-100 text-red-700 border-red-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

export function TaskStatusDropdown({ taskId, currentStatus, workflowId, isCompact = false }: TaskStatusDropdownProps) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Convert display status back to database status
  const getCurrentDbStatus = () => {
    const statusMap: Record<string, TaskStatus> = {
      'completed': 'COMPLETED',
      'interrupted': 'INTERRUPT', 
      'pending': 'NOT_STARTED', // Default for pending
      'failed': 'FAILED'
    };
    
    return statusMap[currentStatus] || currentStatus as TaskStatus;
  };

  const currentDbStatus = getCurrentDbStatus();
  const currentStatusInfo = TASK_STATUSES.find(s => s.value === currentDbStatus);
  const selectedStatusInfo = TASK_STATUSES.find(s => s.value === selectedStatus);

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === currentStatus || !taskId) return;
    
    setSelectedStatus(newStatus as TaskStatus);
    setShowConfirmation(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!selectedStatus || !taskId || isUpdating) return;

    setIsUpdating(true);
    
    try {
      // Update task status via API
      await api.taskExecutions.update(taskId, {
        status: selectedStatus
      });

      // Create audit log entry
      await api.auditEvents.create({
        actor_type: 'human',
        actor_id: user?.id || 'unknown-user',
        actor_name: profile?.full_name || user?.email || 'Unknown User',
        event_type: 'task_execution',
        action: 'update',
        resource_type: 'task_execution',
        resource_id: taskId,
        workflow_id: workflowId,
        event_data: {
          field: 'status',
          old_value: currentStatus,
          new_value: selectedStatus,
          change_reason: 'Manual status update via UI'
        }
      });

      // Invalidate queries to refresh data without full page reload
      if (workflowId) {
        queryClient.invalidateQueries({ queryKey: ['workflow', workflowId] });
        queryClient.invalidateQueries({ queryKey: ['taskExecutions', { workflow_id: workflowId }] });
      }
      
    } catch (error) {
      console.error('Failed to update task status:', error);
      // TODO: Show proper error toast/notification
      alert('Failed to update task status. Please try again.');
    } finally {
      setIsUpdating(false);
      setShowConfirmation(false);
      setSelectedStatus(null);
    }
  };

  const handleCancelStatusChange = () => {
    setShowConfirmation(false);
    setSelectedStatus(null);
  };

  // If no task ID, just show the status as text
  if (!taskId) {
    const className = isCompact 
      ? `px-2 py-1 text-xs font-medium uppercase tracking-wider border ${getStatusStyles(currentStatus)}`
      : `px-2 py-1 text-xs font-medium uppercase tracking-wider border ${getStatusStyles(currentStatus)}`;
      
    return (
      <span className={className}>
        {currentStatusInfo?.label || currentStatus}
      </span>
    );
  }

  const triggerClassName = isCompact
    ? `w-auto min-w-24 h-auto px-2 py-1 text-xs font-medium uppercase tracking-wider border hover:bg-opacity-80 transition-colors ${getStatusStyles(currentStatus)}`
    : `w-auto min-w-32 h-auto px-2 py-1 text-xs font-medium uppercase tracking-wider border hover:bg-opacity-80 transition-colors ${getStatusStyles(currentStatus)}`;

  return (
    <>
      <Select value={currentDbStatus} onValueChange={handleStatusChange}>
        <SelectTrigger className={triggerClassName}>
          <SelectValue>
            {currentStatusInfo?.label || currentStatus}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {TASK_STATUSES.map((status) => (
            <SelectItem 
              key={status.value} 
              value={status.value}
              className="text-sm"
            >
              {status.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Status Change</DialogTitle>
            <DialogDescription>
              Are you sure you want to change the task status from{' '}
              <span className="font-medium">{currentStatusInfo?.label}</span> to{' '}
              <span className="font-medium">{selectedStatusInfo?.label}</span>?
            </DialogDescription>
          </DialogHeader>
          
          {selectedStatusInfo && (
            <div className="py-2">
              <p className="text-sm text-muted-foreground">
                {selectedStatusInfo.description}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={handleCancelStatusChange}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmStatusChange}
              disabled={isUpdating}
            >
              {isUpdating ? 'Updating...' : 'Confirm Change'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}