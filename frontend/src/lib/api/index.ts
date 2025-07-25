/**
 * Main API exports for Rexera 2.0 frontend.
 * Provides centralized access to all API endpoints with consistent interface.
 */

// Export core utilities
export { ApiError, API_ERROR_CODES } from './core/api-error';
export { apiRequest, getAuthToken, getApiBaseUrl } from './core/request';
export type * from './core/types';

// Import and export individual API modules
import { workflowsApi } from './endpoints/workflows';
import { taskExecutionsApi } from './endpoints/task-executions';
import { documentsApi, tagsApi } from './endpoints/documents';
import { communicationsApi, hilNotesApi } from './endpoints/communications';
import { counterpartiesApi } from './endpoints/counterparties';
import { workflowCounterpartiesApi } from './endpoints/workflow-counterparties';
import { 
  healthApi, 
  activitiesApi, 
  agentsApi, 
  interruptsApi, 
  incomingEmailApi, 
  usersApi, 
  auditEventsApi, 
  clientsApi 
} from './endpoints/system';
import { notificationsApi } from './endpoints/notifications';

// Re-export individual APIs
export { workflowsApi } from './endpoints/workflows';
export { taskExecutionsApi } from './endpoints/task-executions';
export { documentsApi, tagsApi } from './endpoints/documents';
export { communicationsApi, hilNotesApi } from './endpoints/communications';
export { counterpartiesApi } from './endpoints/counterparties';
export { workflowCounterpartiesApi } from './endpoints/workflow-counterparties';
export { 
  healthApi, 
  activitiesApi, 
  agentsApi, 
  interruptsApi, 
  incomingEmailApi, 
  usersApi, 
  auditEventsApi, 
  clientsApi 
} from './endpoints/system';
export { notificationsApi } from './endpoints/notifications';

// Main API object for backward compatibility
export const api = {
  // Workflow operations
  workflows: workflowsApi,
  taskExecutions: taskExecutionsApi,
  
  // Content management
  documents: documentsApi,
  tags: tagsApi,
  
  // Communications
  communications: communicationsApi,
  hilNotes: hilNotesApi,
  
  // Counterparties
  counterparties: counterpartiesApi,
  workflowCounterparties: workflowCounterpartiesApi,
  
  // System operations
  health: healthApi,
  activities: activitiesApi,
  agents: agentsApi,
  interrupts: interruptsApi,
  incomingEmail: incomingEmailApi,
  users: usersApi,
  auditEvents: auditEventsApi,
  clients: clientsApi,
  
  // Notifications
  notifications: notificationsApi,
};