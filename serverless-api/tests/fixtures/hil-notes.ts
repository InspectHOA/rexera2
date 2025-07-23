/**
 * Test fixtures for HIL Notes
 */

export const validHilNoteFixtures = {
  basic: {
    workflow_id: '12345678-1234-1234-1234-123456789012',
    content: 'This is a basic test note',
    priority: 'NORMAL' as const
  },
  withMentions: {
    workflow_id: '12345678-1234-1234-1234-123456789012',
    content: 'This note mentions @test.user for review',
    priority: 'HIGH' as const,
    mentions: ['87654321-4321-4321-4321-210987654321']
  },
  urgent: {
    workflow_id: '12345678-1234-1234-1234-123456789012',
    content: 'Urgent issue requiring immediate attention',
    priority: 'URGENT' as const,
    parent_id: null
  },
  withParent: {
    workflow_id: '12345678-1234-1234-1234-123456789012',
    content: 'This is a reply to another note',
    priority: 'NORMAL' as const,
    parent_id: '11111111-2222-3333-4444-555555555555'
  },
  low: {
    workflow_id: '12345678-1234-1234-1234-123456789012',
    content: 'Low priority informational note',
    priority: 'LOW' as const
  }
};

export const invalidHilNoteFixtures = {
  missingWorkflowId: {
    content: 'Note without workflow ID',
    priority: 'NORMAL' as const
  },
  missingContent: {
    workflow_id: '12345678-1234-1234-1234-123456789012',
    priority: 'NORMAL' as const
  },
  missingPriority: {
    workflow_id: '12345678-1234-1234-1234-123456789012',
    content: 'Note without priority'
  },
  invalidPriority: {
    workflow_id: '12345678-1234-1234-1234-123456789012',
    content: 'Note with invalid priority',
    priority: 'INVALID_PRIORITY'
  },
  invalidWorkflowId: {
    workflow_id: 'not-a-uuid',
    content: 'Note with invalid workflow ID',
    priority: 'NORMAL' as const
  },
  emptyContent: {
    workflow_id: '12345678-1234-1234-1234-123456789012',
    content: '',
    priority: 'NORMAL' as const
  },
  tooLongContent: {
    workflow_id: '12345678-1234-1234-1234-123456789012',
    content: 'A'.repeat(10001), // Assuming 10k char limit
    priority: 'NORMAL' as const
  }
};

export const updateHilNoteFixtures = {
  validUpdate: {
    content: 'Updated note content',
    priority: 'HIGH' as const,
    is_resolved: true
  },
  contentOnly: {
    content: 'Only updating the content'
  },
  priorityOnly: {
    priority: 'URGENT' as const
  },
  resolveOnly: {
    is_resolved: true
  },
  invalidUpdate: {
    priority: 'INVALID_PRIORITY',
    content: ''
  }
};

export const replyHilNoteFixtures = {
  basicReply: {
    content: 'This is a reply to the parent note',
    priority: 'NORMAL' as const
  },
  urgentReply: {
    content: 'Urgent reply requiring attention',
    priority: 'URGENT' as const
  },
  withMentions: {
    content: 'Reply mentioning @another.user for input',
    priority: 'HIGH' as const,
    mentions: ['87654321-4321-4321-4321-210987654321']
  },
  invalidReply: {
    content: '',
    priority: 'INVALID_PRIORITY'
  }
};

export const hilNoteFilterFixtures = {
  validFilters: [
    { workflow_id: '12345678-1234-1234-1234-123456789012' },
    { workflow_id: '12345678-1234-1234-1234-123456789012', priority: 'HIGH' },
    { workflow_id: '12345678-1234-1234-1234-123456789012', is_resolved: false },
    { workflow_id: '12345678-1234-1234-1234-123456789012', created_by: '87654321-4321-4321-4321-210987654321' },
    { workflow_id: '12345678-1234-1234-1234-123456789012', page: 1, limit: 10 },
    { workflow_id: '12345678-1234-1234-1234-123456789012', sort: 'created_at', order: 'desc' as const }
  ],
  invalidFilters: [
    {}, // Missing workflow_id
    { workflow_id: 'invalid-uuid' },
    { workflow_id: '12345678-1234-1234-1234-123456789012', priority: 'INVALID' },
    { workflow_id: '12345678-1234-1234-1234-123456789012', page: 0 },
    { workflow_id: '12345678-1234-1234-1234-123456789012', limit: 0 },
    { workflow_id: '12345678-1234-1234-1234-123456789012', sort: 'invalid_field' }
  ]
};

export const searchFixtures = {
  validSearches: [
    { workflow_id: '12345678-1234-1234-1234-123456789012', q: 'test' },
    { workflow_id: '12345678-1234-1234-1234-123456789012', q: 'urgent', priority: 'URGENT' },
    { workflow_id: '12345678-1234-1234-1234-123456789012', q: 'mention', limit: 5 }
  ],
  invalidSearches: [
    { q: 'test' }, // Missing workflow_id
    { workflow_id: '12345678-1234-1234-1234-123456789012', q: '' }, // Empty query
    { workflow_id: 'invalid-uuid', q: 'test' }
  ]
};