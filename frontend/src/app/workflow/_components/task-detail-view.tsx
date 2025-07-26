/**
 * Enhanced Task Detail View Component
 * 
 * Displays detailed task execution information with real data integration,
 * editable JSONB fields, and execution timeline.
 */

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Copy, Edit3, Save, X, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

import type { TaskExecution } from '@rexera/shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/lib/hooks/use-toast';
import { taskExecutionsApi } from '@/lib/api/endpoints/task-executions';
import { TaskStatusDropdown } from './task-status-dropdown';
import { cn } from '@/lib/utils';
import { formatDate, formatTime, formatDuration } from '@/lib/utils/formatting';

interface TaskDetailViewProps {
  selectedTask: string | null;
  tasks: TaskExecution[];
  workflowId?: string;
}

export function TaskDetailView({ selectedTask, tasks, workflowId }: TaskDetailViewProps) {
  if (!selectedTask) {
    return <EmptyState />;
  }

  const task = tasks.find(t => t.id === selectedTask);
  if (!task) return <EmptyState />;

  return (
    <div className="space-y-4">
      <TaskOverview task={task} workflowId={workflowId} />
      <Separator />
      <InputDataSection task={task} />
      <OutputDataSection task={task} />
      <ExecutionTimeline task={task} />
      <ActionButtons task={task} />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
      <div className="text-muted-foreground mb-3">
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="text-muted-foreground mb-1 text-xs font-medium">
        No Task Selected
      </h3>
      <p className="text-xs text-muted-foreground text-center px-4">
        Select a task from the workflow progress to view its details, logs, and results.
      </p>
    </div>
  );
}

function TaskOverview({ task, workflowId }: { task: TaskExecution; workflowId?: string }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-500';
      case 'INTERRUPT': 
      case 'FAILED': return 'bg-destructive';
      case 'IN_PROGRESS': return 'bg-blue-500';
      case 'NOT_STARTED': return 'bg-muted';
      default: return 'bg-muted';
    }
  };

  const getExecutionTime = () => {
    if (task.execution_time_ms) {
      return formatDuration(task.execution_time_ms);
    }
    if (task.started_at && task.completed_at) {
      const start = new Date(task.started_at);
      const end = new Date(task.completed_at);
      return formatDuration(end.getTime() - start.getTime());
    }
    return null;
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", getStatusColor(task.status))} />
          <h3 className="text-sm font-medium text-foreground">
            {(task as any).agents?.name || 'Unknown Agent'}: {task.title}
          </h3>
        </div>
        <TaskStatusDropdown 
          taskId={task.id}
          currentStatus={task.status}
          workflowId={workflowId}
          isCompact={true}
        />
      </div>
      
      <div className="text-xs text-muted-foreground flex items-center gap-4">
        {task.started_at && (
          <span>Started {formatDate(task.started_at, 'long')}</span>
        )}
        {task.completed_at && (
          <span>• Completed {formatDate(task.completed_at, 'long')}</span>
        )}
        {getExecutionTime() && (
          <span>• {getExecutionTime()} duration</span>
        )}
      </div>
    </div>
  );
}

function InputDataSection({ task }: { task: TaskExecution }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(task.input_data, null, 2));
    toast({
      title: "Copied to clipboard",
      description: "Input data copied successfully"
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Input
        </h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-6 px-2"
        >
          <Copy className="w-3 h-3" />
        </Button>
      </div>
      
      <Card className="p-3">
        <JsonViewer data={task.input_data} />
      </Card>
    </div>
  );
}

function OutputDataSection({ task }: { task: TaskExecution }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data: any) => taskExecutionsApi.update(task.id, { output_data: data }),
    onSuccess: () => {
      toast({
        title: "Output updated",
        description: "Task output data has been saved successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['taskExecutions'] });
      queryClient.invalidateQueries({ queryKey: ['workflow'] });
      setIsEditing(false);
      setHasChanges(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive", 
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update output data"
      });
    }
  });

  const handleEdit = () => {
    setEditedData(JSON.stringify(task.output_data || {}, null, 2));
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData('');
    setHasChanges(false);
  };

  const handleSave = () => {
    try {
      const parsedData = JSON.parse(editedData);
      updateMutation.mutate(parsedData);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Invalid JSON",
        description: "Please check the JSON syntax and try again"
      });
    }
  };

  const handleCopy = () => {
    const dataToCopy = isEditing ? editedData : JSON.stringify(task.output_data, null, 2);
    navigator.clipboard.writeText(dataToCopy);
    toast({
      title: "Copied to clipboard",
      description: "Output data copied successfully"
    });
  };

  const handleChange = (value: string) => {
    setEditedData(value);
    setHasChanges(true);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Output
        </h4>
        <div className="flex items-center gap-1">
          {isEditing ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={updateMutation.isPending}
                className="h-6 px-2"
              >
                <X className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSave}
                disabled={!hasChanges || updateMutation.isPending}
                className="h-6 px-2"
              >
                {updateMutation.isPending ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Save className="w-3 h-3" />
                )}
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className="h-6 px-2"
            >
              <Edit3 className="w-3 h-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-6 px-2"
          >
            <Copy className="w-3 h-3" />
          </Button>
        </div>
      </div>
      
      <Card className="p-3">
        {isEditing ? (
          <Textarea
            value={editedData}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full h-32 text-xs font-mono resize-none bg-transparent border-none outline-none"
            placeholder="Enter JSON data..."
          />
        ) : (
          <JsonViewer data={task.output_data} />
        )}
      </Card>
    </div>
  );
}

function JsonViewer({ data }: { data: any }) {
  if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
    return (
      <div className="text-xs text-muted-foreground italic">
        No data available
      </div>
    );
  }

  return (
    <pre className="text-xs font-mono text-foreground whitespace-pre-wrap break-words">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function ExecutionTimeline({ task }: { task: TaskExecution }) {
  const timelineEvents = [];

  if (task.created_at) {
    timelineEvents.push({
      time: task.created_at,
      event: 'Task created',
      type: 'info' as const
    });
  }

  if (task.started_at) {
    timelineEvents.push({
      time: task.started_at,
      event: 'Processing started',
      type: 'info' as const
    });
  }

  if (task.status === 'INTERRUPT' && task.error_message) {
    timelineEvents.push({
      time: task.created_at,
      event: `⚠️ ${task.error_message}`,
      type: 'warning' as const
    });
  }

  if (task.completed_at) {
    const isSuccess = task.status === 'COMPLETED';
    timelineEvents.push({
      time: task.completed_at,
      event: isSuccess ? '✅ Completed successfully' : '❌ Task failed',
      type: isSuccess ? 'success' : 'error' as const
    });
  }

  if (timelineEvents.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Timeline
      </h4>
      <Card className="p-3">
        <div className="space-y-2">
          {timelineEvents.map((event, index) => (
            <div key={index} className="flex items-start gap-3 text-xs">
              <span className="text-muted-foreground font-mono min-w-0 flex-shrink-0">
                {formatTime(event.time)}
              </span>
              <span className={cn(
                "text-foreground",
                event.type === 'warning' && "text-yellow-600 dark:text-yellow-400",
                event.type === 'error' && "text-destructive"
              )}>
                {event.event}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ActionButtons({ task }: { task: TaskExecution }) {
  const canRetry = task.status === 'FAILED' || task.status === 'INTERRUPT';

  if (!canRetry) {
    return null;
  }

  return (
    <div className="flex gap-2 pt-2">
      <Button variant="outline" size="sm">
        Retry Task
      </Button>
    </div>
  );
}