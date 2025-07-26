'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronDown, Check } from 'lucide-react';
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
import { type WorkflowStatus } from '@rexera/shared';

interface WorkflowStatusDropdownProps {
  workflowId?: string;
  currentStatus: string;
}

// Available workflow statuses
const WORKFLOW_STATUSES: { value: WorkflowStatus; label: string; description: string }[] = [
  { 
    value: 'NOT_STARTED', 
    label: 'Not Started', 
    description: 'Workflow has not been initiated yet' 
  },
  { 
    value: 'IN_PROGRESS', 
    label: 'In Progress', 
    description: 'Workflow is actively being processed' 
  },
  { 
    value: 'BLOCKED', 
    label: 'Blocked', 
    description: 'Workflow is blocked and requires attention' 
  },
  { 
    value: 'WAITING_FOR_CLIENT', 
    label: 'Waiting for Client', 
    description: 'Workflow is waiting for client response or action' 
  },
  { 
    value: 'COMPLETED', 
    label: 'Completed', 
    description: 'Workflow has been successfully completed' 
  }
];

// Get status color classes based on current UI patterns
function getStatusStyles(status: string) {
  switch (status) {
    case 'NOT_STARTED':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    case 'IN_PROGRESS':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'BLOCKED':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'WAITING_FOR_CLIENT':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'COMPLETED':
      return 'bg-green-100 text-green-700 border-green-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

export function WorkflowStatusDropdown({ workflowId, currentStatus }: WorkflowStatusDropdownProps) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<WorkflowStatus | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const currentStatusInfo = WORKFLOW_STATUSES.find(s => s.value === currentStatus);
  const selectedStatusInfo = WORKFLOW_STATUSES.find(s => s.value === selectedStatus);

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === currentStatus || !workflowId) return;
    
    setSelectedStatus(newStatus as WorkflowStatus);
    setShowConfirmation(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!selectedStatus || !workflowId || isUpdating) return;

    setIsUpdating(true);
    
    try {
      // Update workflow status via API
      await api.workflows.updateWorkflow(workflowId, {
        status: selectedStatus
      });

      // Create audit log entry
      await api.auditEvents.create({
        actor_type: 'human',
        actor_id: user?.id || 'unknown-user',
        actor_name: profile?.full_name || user?.email || 'Unknown User',
        event_type: 'workflow_management',
        action: 'update',
        resource_type: 'workflow',
        resource_id: workflowId,
        workflow_id: workflowId,
        event_data: {
          field: 'status',
          old_value: currentStatus,
          new_value: selectedStatus,
          change_reason: 'Manual status update via UI'
        }
      });

      // Invalidate queries to refresh data without full page reload
      queryClient.invalidateQueries({ queryKey: ['workflow', workflowId] });
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      
    } catch (error) {
      console.error('Failed to update workflow status:', error);
      // TODO: Show proper error toast/notification
      alert('Failed to update workflow status. Please try again.');
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

  // If no workflow ID, just show the status as text
  if (!workflowId) {
    return (
      <span className={`px-2 py-1 text-xs font-semibold uppercase tracking-wider border ${getStatusStyles(currentStatus)}`}>
        {currentStatusInfo?.label || currentStatus}
      </span>
    );
  }

  return (
    <>
      <Select value={currentStatus} onValueChange={handleStatusChange}>
        <SelectTrigger className={`w-auto min-w-32 h-auto px-2 py-1 text-xs font-semibold uppercase tracking-wider border hover:bg-opacity-80 transition-colors ${getStatusStyles(currentStatus)}`}>
          <SelectValue>
            {currentStatusInfo?.label || currentStatus}
          </SelectValue>
          <ChevronDown className="h-3 w-3 ml-1" />
        </SelectTrigger>
        <SelectContent>
          {WORKFLOW_STATUSES.map((status) => (
            <SelectItem 
              key={status.value} 
              value={status.value}
              className="text-sm"
            >
              <div className="flex items-center justify-between w-full">
                <span>{status.label}</span>
                {status.value === currentStatus && (
                  <Check className="h-4 w-4 ml-2" />
                )}
              </div>
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
              Are you sure you want to change the workflow status from{' '}
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