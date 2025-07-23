/**
 * Test fixtures for Notifications
 */

export const validNotificationFixtures = {
  basic: {
    user_id: '12345678-1234-1234-1234-123456789012',
    type: 'WORKFLOW_UPDATE' as const,
    priority: 'NORMAL' as const,
    title: 'Workflow Updated',
    message: 'Your workflow has been updated'
  },
  urgent: {
    user_id: '12345678-1234-1234-1234-123456789012',
    type: 'SLA_WARNING' as const,
    priority: 'URGENT' as const,
    title: 'SLA Warning',
    message: 'Workflow is approaching SLA deadline'
  },
  taskInterrupt: {
    user_id: '12345678-1234-1234-1234-123456789012',
    type: 'TASK_INTERRUPT' as const,
    priority: 'HIGH' as const,
    title: 'Task Requires Attention',
    message: 'Human input required for task completion'
  },
  mention: {
    user_id: '12345678-1234-1234-1234-123456789012',
    type: 'HIL_MENTION' as const,
    priority: 'NORMAL' as const,
    title: 'You were mentioned',
    message: 'You were mentioned in a HIL note'
  },
  withActionUrl: {
    user_id: '12345678-1234-1234-1234-123456789012',
    type: 'WORKFLOW_UPDATE' as const,
    priority: 'NORMAL' as const,
    title: 'Review Required',
    message: 'Please review the workflow',
    action_url: '/workflows/12345678-1234-1234-1234-123456789012'
  },
  withMetadata: {
    user_id: '12345678-1234-1234-1234-123456789012',
    type: 'AGENT_FAILURE' as const,
    priority: 'HIGH' as const,
    title: 'Agent Error',
    message: 'Agent encountered an error',
    metadata: {
      agent_id: '87654321-4321-4321-4321-210987654321',
      error_code: 'TIMEOUT',
      workflow_id: '11111111-2222-3333-4444-555555555555'
    }
  }
};

export const invalidNotificationFixtures = {
  missingUserId: {
    type: 'WORKFLOW_UPDATE' as const,
    priority: 'NORMAL' as const,
    title: 'Test',
    message: 'Test message'
  },
  missingType: {
    user_id: '12345678-1234-1234-1234-123456789012',
    priority: 'NORMAL' as const,
    title: 'Test',
    message: 'Test message'
  },
  missingPriority: {
    user_id: '12345678-1234-1234-1234-123456789012',
    type: 'WORKFLOW_UPDATE' as const,
    title: 'Test',
    message: 'Test message'
  },
  missingTitle: {
    user_id: '12345678-1234-1234-1234-123456789012',
    type: 'WORKFLOW_UPDATE' as const,
    priority: 'NORMAL' as const,
    message: 'Test message'
  },
  missingMessage: {
    user_id: '12345678-1234-1234-1234-123456789012',
    type: 'WORKFLOW_UPDATE' as const,
    priority: 'NORMAL' as const,
    title: 'Test'
  },
  invalidType: {
    user_id: '12345678-1234-1234-1234-123456789012',
    type: 'INVALID_TYPE',
    priority: 'NORMAL' as const,
    title: 'Test',
    message: 'Test message'
  },
  invalidPriority: {
    user_id: '12345678-1234-1234-1234-123456789012',
    type: 'WORKFLOW_UPDATE' as const,
    priority: 'INVALID_PRIORITY',
    title: 'Test',
    message: 'Test message'
  },
  invalidUserId: {
    user_id: 'not-a-uuid',
    type: 'WORKFLOW_UPDATE' as const,
    priority: 'NORMAL' as const,
    title: 'Test',
    message: 'Test message'
  },
  emptyTitle: {
    user_id: '12345678-1234-1234-1234-123456789012',
    type: 'WORKFLOW_UPDATE' as const,
    priority: 'NORMAL' as const,
    title: '',
    message: 'Test message'
  },
  emptyMessage: {
    user_id: '12345678-1234-1234-1234-123456789012',
    type: 'WORKFLOW_UPDATE' as const,
    priority: 'NORMAL' as const,
    title: 'Test',
    message: ''
  }
};

export const updateNotificationFixtures = {
  markAsRead: {
    read: true
  },
  updatePriority: {
    priority: 'HIGH' as const
  },
  updateWithMetadata: {
    metadata: {
      updated_by: 'test-user',
      reason: 'priority_change'
    }
  },
  invalidUpdate: {
    type: 'INVALID_TYPE',
    priority: 'INVALID_PRIORITY'
  }
};

export const notificationFilterFixtures = {
  validFilters: [
    { limit: 10 },
    { limit: 50, page: 1 },
    { type: 'WORKFLOW_UPDATE' },
    { priority: 'URGENT' },
    { read: false },
    { read: true },
    { type: 'SLA_WARNING', priority: 'HIGH' },
    { sort: 'created_at', order: 'desc' as const },
    { sort: 'priority', order: 'asc' as const }
  ],
  invalidFilters: [
    { limit: 0 },
    { limit: 101 },
    { page: 0 },
    { type: 'INVALID_TYPE' },
    { priority: 'INVALID_PRIORITY' },
    { read: 'invalid' },
    { sort: 'invalid_field' },
    { order: 'invalid_order' }
  ]
};

export const bulkOperationFixtures = {
  markAllRead: {
    // No additional data needed for mark all as read
  },
  markSelectedRead: {
    notification_ids: [
      '12345678-1234-1234-1234-123456789012',
      '87654321-4321-4321-4321-210987654321'
    ]
  },
  invalidBulkOperation: {
    notification_ids: [
      'invalid-uuid',
      '87654321-4321-4321-4321-210987654321'
    ]
  }
};