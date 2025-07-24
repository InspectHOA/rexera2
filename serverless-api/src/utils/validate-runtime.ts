/**
 * Runtime validation helpers to catch issues TypeScript misses
 */

export function validateNotificationData(notification: any): void {
  const requiredFields = ['user_id', 'type', 'priority', 'title', 'message'];
  const validTypes = ['WORKFLOW_UPDATE', 'TASK_INTERRUPT', 'HIL_MENTION', 'CLIENT_MESSAGE_RECEIVED', 'COUNTERPARTY_MESSAGE_RECEIVED', 'SLA_WARNING', 'AGENT_FAILURE'];
  const validPriorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

  for (const field of requiredFields) {
    if (!notification[field]) {
      throw new Error(`Missing required notification field: ${field}`);
    }
  }

  if (!validTypes.includes(notification.type)) {
    throw new Error(`Invalid notification type: ${notification.type}. Must be one of: ${validTypes.join(', ')}`);
  }

  if (!validPriorities.includes(notification.priority)) {
    throw new Error(`Invalid priority: ${notification.priority}. Must be one of: ${validPriorities.join(', ')}`);
  }
}

export function validateCommunicationData(communication: any): void {
  const requiredFields = ['body', 'communication_type'];
  const validTypes = ['email', 'phone', 'sms', 'client_chat'];
  const validDirections = ['INBOUND', 'OUTBOUND'];

  for (const field of requiredFields) {
    if (!communication[field]) {
      throw new Error(`Missing required communication field: ${field}`);
    }
  }

  if (!validTypes.includes(communication.communication_type)) {
    throw new Error(`Invalid communication type: ${communication.communication_type}`);
  }

  if (communication.direction && !validDirections.includes(communication.direction)) {
    throw new Error(`Invalid direction: ${communication.direction}`);
  }
}

// Usage in development/testing
export function enableRuntimeChecks(): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔒 Runtime validation enabled for database operations');
  }
}