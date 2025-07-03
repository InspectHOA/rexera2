# 07_UI_COMPONENTS.md

<!-- 
This document provides comprehensive UI component specifications for Rexera 2.0, including the HIL Dashboard, agent-specific interfaces, and real-time interaction patterns.
-->

## Component Architecture Overview

Rexera 2.0 implements a **hybrid design pattern** for the Human-in-the-Loop (HIL) dashboard with specialized agent interfaces:

- **80% General Framework**: Reusable interrupt queue and common components
- **20% Agent-Specific Panels**: Specialized interfaces that plug into the framework
- **Progressive Enhancement**: Start with basic queue, add agent interfaces incrementally
- **Real-Time Integration**: WebSocket updates for live interrupt notifications

### Technology Stack

```typescript
// Core Technologies
const techStack = {
  frontend: "React 18+ with TypeScript",
  stateManagement: "Redux Toolkit",
  styling: "Tailwind CSS",
  realTime: "WebSocket/Server-Sent Events",
  documentHandling: "PDF.js",
  forms: "React Hook Form + Zod validation",
  testing: "Jest + React Testing Library"
};
```

## Core Component Interfaces

### HIL Dashboard

```typescript
interface HILDashboardProps {
  user: HILUser;
  taskInterrupts: TaskInterrupt[];
  workflows: Workflow[];
  activeTasks: Task[];
}

interface HILUser {
  id: string;
  name: string;
  email: string;
  role: 'HIL_OPERATOR' | 'HIL_MANAGER' | 'HIL_ADMIN';
  permissions: string[];
  activeWorkflows: string[];
  preferences: {
    notificationSettings: NotificationSettings;
    dashboardLayout: DashboardLayout;
    agentPreferences: AgentPreferences;
  };
}

const HILDashboard: React.FC<HILDashboardProps> = ({
  user,
  taskInterrupts,
  workflows,
  activeTasks
}) => {
  return (
    <div className="hil-dashboard grid grid-cols-12 gap-6 p-6">
      <div className="col-span-8">
        <TaskInterruptQueue 
          interrupts={taskInterrupts}
          onHandleTask={handleTaskInterrupt}
          onEscalateTask={escalateTask}
        />
        <WorkflowOverview 
          workflows={workflows}
          onWorkflowClick={selectWorkflow}
        />
      </div>
      <div className="col-span-4">
        <TaskProgressPanel 
          activeTasks={activeTasks}
          onTaskClick={viewTaskDetails}
        />
        <AgentStatusPanel 
          agents={agentStatuses}
          onAgentClick={viewAgentDetails}
        />
      </div>
    </div>
  );
};
```

### Task Interrupt Queue

```typescript
interface TaskInterruptQueueProps {
  interrupts: TaskInterrupt[];
  onHandleTask: (taskId: string, interruptId: string) => void;
  onEscalateTask: (taskId: string, interruptId: string) => void;
}

interface TaskInterrupt {
  id: string;
  taskId: string;
  taskType: string;
  taskDescription: string;
  agentType: AgentType;
  agentName: string;
  workflowId: string;
  priority: 'critical' | 'standard';
  context: TaskInterruptContext;
  slaDeadline: Date;
  createdAt: Date;
  assignedHIL?: string;
}

const TaskInterruptQueue: React.FC<TaskInterruptQueueProps> = ({
  interrupts,
  onHandleTask,
  onEscalateTask
}) => {
  const sortedInterrupts = useMemo(() => 
    interrupts.sort((a, b) => {
      // Priority: critical > standard
      if (a.priority !== b.priority) {
        return a.priority === 'critical' ? -1 : 1;
      }
      // Then by SLA deadline (earliest first)
      return new Date(a.slaDeadline).getTime() - new Date(b.slaDeadline).getTime();
    }), [interrupts]
  );

  return (
    <div className="task-interrupt-queue bg-white rounded-lg shadow-lg">
      <div className="queue-header p-4 border-b">
        <h2 className="text-xl font-semibold">Task Interrupts</h2>
        <div className="flex gap-2 mt-2">
          <Badge variant="critical" count={interrupts.filter(i => i.priority === 'critical').length} />
          <Badge variant="standard" count={interrupts.filter(i => i.priority === 'standard').length} />
        </div>
      </div>
      <div className="queue-items max-h-96 overflow-y-auto">
        {sortedInterrupts.map(interrupt => (
          <TaskInterruptCard
            key={interrupt.id}
            interrupt={interrupt}
            onHandle={() => onHandleTask(interrupt.taskId, interrupt.id)}
            onEscalate={() => onEscalateTask(interrupt.taskId, interrupt.id)}
          />
        ))}
      </div>
    </div>
  );
};
```

### Task Interrupt Card

```typescript
interface TaskInterruptCardProps {
  interrupt: TaskInterrupt;
  onHandle: () => void;
  onEscalate: () => void;
}

const TaskInterruptCard: React.FC<TaskInterruptCardProps> = ({
  interrupt,
  onHandle,
  onEscalate
}) => {
  const timeRemaining = useMemo(() => 
    formatTimeRemaining(interrupt.slaDeadline), [interrupt.slaDeadline]
  );

  const priorityColor = interrupt.priority === 'critical' 
    ? 'border-red-500 bg-red-50' 
    : 'border-yellow-500 bg-yellow-50';

  return (
    <div className={`interrupt-card p-4 border-l-4 ${priorityColor} hover:shadow-md transition-shadow`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <AgentIcon agent={interrupt.agentType} />
            <span className="font-medium">{interrupt.agentName}</span>
            <Badge variant="task-type">{interrupt.taskType}</Badge>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">
            {interrupt.taskDescription}
          </h3>
          <p className="text-sm text-gray-600 mb-2">
            Workflow: {interrupt.context.workflow.clientName} - {interrupt.context.workflow.propertyAddress}
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>SLA: {timeRemaining}</span>
            <span>Attempts: {interrupt.context.failure.attemptCount}</span>
            <span>Created: {formatRelativeTime(interrupt.createdAt)}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 ml-4">
          <Button 
            variant="primary" 
            size="sm" 
            onClick={onHandle}
            className="whitespace-nowrap"
          >
            Handle Task
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={onEscalate}
            className="whitespace-nowrap"
          >
            Escalate
          </Button>
        </div>
      </div>
      {interrupt.context.failure.reason && (
        <div className="mt-3 p-2 bg-gray-100 rounded text-sm">
          <strong>Failure Reason:</strong> {interrupt.context.failure.reason}
        </div>
      )}
    </div>
  );
};
```

## Agent-Specific Interfaces

### Agent Task Interface Factory

```typescript
interface AgentTaskInterfaceProps {
  taskInterrupt: TaskInterrupt;
  agentType: AgentType;
  onResolveTask: (resolution: TaskResolution) => void;
  onClose: () => void;
}

const AgentTaskInterfaceFactory: React.FC<AgentTaskInterfaceProps> = ({ 
  taskInterrupt, 
  agentType, 
  onResolveTask, 
  onClose 
}) => {
  const agentTaskInterfaces = {
    nina: NinaResearchTaskInterface,
    mia: MiaEmailTaskInterface,
    florian: FlorianCallTaskInterface,
    rex: RexWebTaskInterface,
    iris: IrisDocumentTaskInterface,
    ria: RiaSupportTaskInterface,
    kosha: KoshaFinanceTaskInterface,
    cassy: CassyQATaskInterface,
    max: MaxIVRTaskInterface,
    corey: CoreyCondoTaskInterface,
  };
  
  const AgentComponent = agentTaskInterfaces[agentType] || GenericTaskInterface;
  
  return (
    <div className="agent-task-interface fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="interface-header p-4 border-b bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <AgentIcon agent={agentType} size="lg" />
              <div>
                <h2 className="text-xl font-semibold">{agentType.toUpperCase()} Task Interface</h2>
                <p className="text-sm text-gray-600">{taskInterrupt.taskDescription}</p>
              </div>
            </div>
            <Button variant="ghost" onClick={onClose}>
              <CloseIcon />
            </Button>
          </div>
        </div>
        
        <div className="interface-content flex h-[calc(90vh-80px)]">
          <div className="w-1/3 border-r">
            <TaskContextPanel 
              task={taskInterrupt.context.task}
              failure={taskInterrupt.context.failure}
              workflow={taskInterrupt.context.workflow}
            />
          </div>
          
          <div className="w-2/3 flex flex-col">
            <div className="flex-1 overflow-auto">
              <AgentComponent 
                taskInterrupt={taskInterrupt}
                onResolveTask={onResolveTask}
                onClose={onClose}
              />
            </div>
            
            <div className="border-t p-4">
              <TaskResolutionPanel 
                taskId={taskInterrupt.taskId}
                onResolveTask={onResolveTask}
                availableActions={getAvailableTaskActions(taskInterrupt.taskType)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### Iris Document Task Interface

```typescript
interface IrisDocumentTaskInterfaceProps {
  taskInterrupt: TaskInterrupt;
  onResolveTask: (resolution: TaskResolution) => void;
}

const IrisDocumentTaskInterface: React.FC<IrisDocumentTaskInterfaceProps> = ({
  taskInterrupt,
  onResolveTask
}) => {
  const { document, extractionData, confidence } = taskInterrupt.context.agentSpecificData;
  const { taskId, taskType, taskDescription } = taskInterrupt;
  
  const [manualExtractionData, setManualExtractionData] = useState(extractionData);
  const [annotations, setAnnotations] = useState([]);

  const handleTaskCompletion = (extractedData: any) => {
    onResolveTask({
      taskId,
      interruptId: taskInterrupt.id,
      action: 'completed',
      result: { 
        extractedData, 
        confidence: 95,
        manualVerification: true,
        annotations 
      },
      notes: `Manually verified extraction for ${taskDescription}`
    });
  };

  const handleAnnotation = (annotation: DocumentAnnotation) => {
    setAnnotations(prev => [...prev, annotation]);
  };

  const handleManualEntry = (field: string, value: any) => {
    setManualExtractionData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="iris-task-interface h-full flex flex-col">
      <div className="task-header p-4 bg-blue-50 border-b">
        <h3 className="font-semibold text-blue-900">Document Extraction Task</h3>
        <p className="text-sm text-blue-700">
          OCR confidence {confidence}% (below 80% threshold) - Manual verification required
        </p>
        <div className="flex gap-2 mt-2">
          <Badge variant="warning">Low Confidence</Badge>
          <Badge variant="info">Document Type: {document.type}</Badge>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/2 border-r">
          <div className="p-4">
            <h4 className="font-medium mb-2">Document Viewer</h4>
            <PDFViewer 
              document={document}
              annotations={extractionData.lowConfidenceRegions}
              onAnnotate={handleAnnotation}
              highlightRegions={extractionData.extractedFields}
              className="w-full h-96 border rounded"
            />
          </div>
        </div>
        
        <div className="w-1/2 overflow-auto">
          <div className="p-4">
            <h4 className="font-medium mb-2">Extraction Data</h4>
            <ExtractionDataForm 
              data={manualExtractionData}
              originalData={extractionData}
              onManualEntry={handleManualEntry}
              onValidation={handleValidation}
              onTaskComplete={handleTaskCompletion}
              documentType={document.type}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
```

### Rex Web Portal Interface

```typescript
const RexWebTaskInterface: React.FC<AgentTaskInterfaceProps> = ({
  taskInterrupt,
  onResolveTask
}) => {
  const { portalURL, credentials, errorDetails, searchCriteria } = taskInterrupt.context.agentSpecificData;
  const [testResults, setTestResults] = useState(null);
  const [alternativeMethod, setAlternativeMethod] = useState(null);

  const handleCredentialUpdate = async (newCredentials: PortalCredentials) => {
    // Test new credentials
    const testResult = await testPortalAccess(portalURL, newCredentials);
    setTestResults(testResult);
  };

  const handleTestLogin = async () => {
    const testResult = await testPortalAccess(portalURL, credentials);
    setTestResults(testResult);
  };

  const handleSwitchAgent = (newAgent: AgentType) => {
    onResolveTask({
      taskId: taskInterrupt.taskId,
      interruptId: taskInterrupt.id,
      action: 'retry',
      notes: `Switching from Rex to ${newAgent} due to portal access issues`,
      nextTasksToCreate: [{
        type: taskInterrupt.taskType,
        description: taskInterrupt.taskDescription,
        executorType: 'AI',
        executorId: newAgent,
        priority: 'high',
        dependencies: [],
        payload: {
          ...taskInterrupt.context.task,
          alternativeMethod: newAgent === 'mia' ? 'email' : 'phone',
          originalFailure: errorDetails
        }
      }]
    });
  };

  return (
    <div className="rex-task-interface p-4">
      <div className="portal-access-section mb-6">
        <h4 className="font-medium mb-3">Portal Access Issue</h4>
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
          <p className="text-red-800 font-medium">Access Failed</p>
          <p className="text-red-700 text-sm">{errorDetails.message}</p>
        </div>
        
        <PortalAccessPanel 
          url={portalURL}
          credentials={credentials}
          error={errorDetails}
          testResults={testResults}
          onCredentialUpdate={handleCredentialUpdate}
          onTestLogin={handleTestLogin}
        />
      </div>

      <div className="alternative-methods-section">
        <h4 className="font-medium mb-3">Alternative Methods</h4>
        <div className="grid grid-cols-2 gap-4">
          <AlternativeMethodCard
            agent="mia"
            method="Email Request"
            description="Send email to municipality for manual processing"
            estimatedTime="2-3 business days"
            onClick={() => handleSwitchAgent('mia')}
          />
          <AlternativeMethodCard
            agent="florian"
            method="Phone Call"
            description="Call municipality directly for information"
            estimatedTime="30-60 minutes"
            onClick={() => handleSwitchAgent('florian')}
          />
        </div>
      </div>

      <div className="search-criteria-section mt-6">
        <h4 className="font-medium mb-3">Search Criteria</h4>
        <div className="bg-gray-50 rounded p-3">
          <pre className="text-sm">{JSON.stringify(searchCriteria, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
};
```

### Mia Email Task Interface

```typescript
const MiaEmailTaskInterface: React.FC<AgentTaskInterfaceProps> = ({
  taskInterrupt,
  onResolveTask
}) => {
  const { emailDraft, recipientInfo, deliveryStatus, responseData } = taskInterrupt.context.agentSpecificData;
  const [editedEmail, setEditedEmail] = useState(emailDraft);
  const [sendStatus, setSendStatus] = useState('draft');

  const handleEmailEdit = (field: string, value: string) => {
    setEditedEmail(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSendEmail = async () => {
    setSendStatus('sending');
    try {
      const result = await sendEmail(editedEmail);
      setSendStatus('sent');
      
      onResolveTask({
        taskId: taskInterrupt.taskId,
        interruptId: taskInterrupt.id,
        action: 'completed',
        result: {
          emailSent: true,
          messageId: result.messageId,
          sentAt: new Date().toISOString(),
          editedContent: editedEmail
        },
        notes: 'Email manually reviewed and sent'
      });
    } catch (error) {
      setSendStatus('error');
    }
  };

  return (
    <div className="mia-task-interface p-4">
      <div className="email-issue-section mb-4">
        <h4 className="font-medium mb-2">Email Issue</h4>
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
          <p className="text-yellow-800">{taskInterrupt.context.failure.reason}</p>
        </div>
      </div>

      <div className="email-editor-section">
        <h4 className="font-medium mb-3">Email Content</h4>
        <EmailEditor
          email={editedEmail}
          recipientInfo={recipientInfo}
          onEdit={handleEmailEdit}
          onSend={handleSendEmail}
          sendStatus={sendStatus}
        />
      </div>

      {deliveryStatus && (
        <div className="delivery-status-section mt-4">
          <h4 className="font-medium mb-2">Delivery Status</h4>
          <DeliveryStatusPanel status={deliveryStatus} />
        </div>
      )}

      {responseData && (
        <div className="response-section mt-4">
          <h4 className="font-medium mb-2">Response Received</h4>
          <EmailResponseViewer response={responseData} />
        </div>
      )}
    </div>
  );
};
```

## Task Resolution Components

### Task Resolution Panel

```typescript
interface TaskResolutionPanelProps {
  taskId: string;
  onResolveTask: (resolution: TaskResolution) => void;
  availableActions: TaskAction[];
}

interface TaskAction {
  action: 'completed' | 'retry' | 'escalate' | 'defer' | 'failed';
  label: string;
  description: string;
  requiresNotes: boolean;
  requiresResult: boolean;
}

const TaskResolutionPanel: React.FC<TaskResolutionPanelProps> = ({
  taskId,
  onResolveTask,
  availableActions
}) => {
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState<Record<string, any>>({});

  const handleResolve = () => {
    const action = availableActions.find(a => a.action === selectedAction);
    if (!action) return;

    onResolveTask({
      taskId,
      interruptId: taskInterrupt.id,
      action: selectedAction as any,
      result: action.requiresResult ? result : undefined,
      notes: action.requiresNotes ? notes : undefined
    });
  };

  return (
    <div className="task-resolution-panel bg-gray-50 p-4 rounded">
      <h4 className="font-medium mb-3">Task Resolution</h4>
      
      <div className="action-selection mb-4">
        <label className="block text-sm font-medium mb-2">Resolution Action</label>
        <select 
          value={selectedAction}
          onChange={(e) => setSelectedAction(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="">Select action...</option>
          {availableActions.map(action => (
            <option key={action.action} value={action.action}>
              {action.label}
            </option>
          ))}
        </select>
      </div>

      {selectedAction && (
        <div className="action-details">
          {availableActions.find(a => a.action === selectedAction)?.requiresNotes && (
            <div className="notes-section mb-4">
              <label className="block text-sm font-medium mb-2">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 border rounded h-20"
                placeholder="Add resolution notes..."
              />
            </div>
          )}

          {availableActions.find(a => a.action === selectedAction)?.requiresResult && (
            <div className="result-section mb-4">
              <label className="block text-sm font-medium mb-2">Result Data</label>
              <JsonEditor
                value={result}
                onChange={setResult}
                className="w-full h-32"
              />
            </div>
          )}

          <Button 
            variant="primary" 
            onClick={handleResolve}
            disabled={!selectedAction}
            className="w-full"
          >
            Resolve Task
          </Button>
        </div>
      )}
    </div>
  );
};
```

## Real-Time Integration

### WebSocket Service

```typescript
class InterruptWebSocketService {
  private ws: WebSocket | null = null;
  private dispatch: AppDispatch;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  constructor(dispatch: AppDispatch) {
    this.dispatch = dispatch;
  }
  
  connect() {
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:3001/ws';
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.dispatch(setConnectionStatus('connected'));
    };
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };
    
    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.dispatch(setConnectionStatus('disconnected'));
      this.attemptReconnect();
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.dispatch(setConnectionStatus('error'));
    };
  }
  
  private handleMessage(message: WebSocketMessage) {
    switch (message.type) {
      case 'NEW_INTERRUPT':
        this.dispatch(interruptsSlice.actions.addInterrupt(message.data));
        this.showNotification('New interrupt requires attention', message.data);
        break;
        
      case 'INTERRUPT_RESOLVED':
        this.dispatch(interruptsSlice.actions.removeInterrupt(message.data.id));
        break;
        
      case 'TASK_UPDATED':
        this.dispatch(tasksSlice.actions.updateTask(message.data));
        break;
        
      case 'SLA_WARNING':
        this.showSLAWarning(message.data);
        break;
        
      case 'WORKFLOW_STATUS_CHANGE':
        this.dispatch(workflowsSlice.actions.updateWorkflow(message.data));
        break;
    }
  }
  
  private showNotification(message: string, data: any) {
    if (Notification.permission === 'granted') {
      const notification = new Notification('Rexera HIL Alert', { 
        body: message,
        icon: '/favicon.ico',
        tag: `interrupt-${data.id}`
      });
      
      notification.onclick = () => {
        window.focus();
        this.dispatch(selectInterrupt(data.id));
      };
    }
    
    // Also show in-app notification
    this.dispatch(addNotification({
      id: generateId(),
      type: 'interrupt',
      message,
      data,
      timestamp: new Date().toISOString()
    }));
  }
  
  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
      
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect();
      }, delay);
    }
  }
  
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
```

### State Management

```typescript
// Redux Store Structure
interface AppState {
  user: HILUser;
  interrupts: {
    items: TaskInterrupt[];
    loading: boolean;
    filter: InterruptFilter;
    selectedInterrupt?: string;
  };
  workflows: {
    items: Workflow[];
    loading: boolean;
    selectedWorkflow?: string;
  };
  tasks: {
    items: Task[];
    loading: boolean;
  };
  agentInterface: {
    isOpen: boolean;
    currentAgent?: AgentType;
    currentInterrupt?: TaskInterrupt;
  };
  notifications: Notification[];
  connection: {
    status: 'connected' | 'disconnected' | 'error';
    lastConnected?: string;
  };
}

// Redux Toolkit Slices
const interruptsSlice = createSlice({
  name: 'interrupts',
  initialState: {
    items: [],
    loading: false,
    filter: 'all',
    selectedInterrupt: undefined
  },
  reducers: {
    setInterrupts: (state, action) => {
      state.items = action.payload;
    },
    addInterrupt: (state, action) => {
      state.items.unshift(action.payload);
    },
    removeInterrupt: (state, action) => {
      state.items = state.items.filter(i => i.id !== action.payload);
    },
    updateInterrupt: (state, action) => {
      const index = state.items.findIndex(i => i.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    selectInterrupt: (state, action) => {
      state.selectedInterrupt = action.payload;
    },
    setFilter: (state, action) => {
      state.filter = action.payload;
    }
  }
});

const agentInterfaceSlice = createSlice({
  name: 'agentInterface',
  initialState: {
    isOpen: false,
    currentAgent: undefined,
    currentInterrupt: undefined
  },
  reducers: {
    openAgentInterface: (state, action) => {
      state.isOpen = true;
      state.currentAgent = action.payload.agent;
      state.currentInterrupt = action.payload.interrupt;
    },
    closeAgentInterface: (state) => {
      state.isOpen = false;
      state.currentAgent = undefined;
      state.currentInterrupt = undefined;
    }
  }
});
```

## Utility Components

### Agent Icon Component

```typescript
interface AgentIconProps {
  agent: AgentType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const AgentIcon: React.FC<AgentIconProps> = ({ agent, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const agentIcons = {
    nina: '🔍',
    mia: '📧',
    florian: '📞',
    rex: '🌐',
    iris: '📄',
    ria: '👩‍💼',
    kosha: '💰',
    cassy: '✅',
    max: '🤖',
    corey: '🏢'
  };

  const agentColors = {
    nina: 'bg-blue-100 text-blue-800',
    mia: 'bg-green-100 text-green-800',
    florian: 'bg-purple-100 text-purple-800',
    rex: 'bg-orange-100 text-orange-800',
    iris: 'bg-red-100 text-red-800',
    ria: 'bg-pink-100 text-pink-800',
    kosha: 'bg-yellow-100 text-yellow-800',
    cassy: 'bg-teal-100 text-teal-800',
    max: 'bg-gray-100 text-gray-800',
    corey: 'bg-indigo-100 text-indigo-800'
  };

  return (
    <div className={`
      