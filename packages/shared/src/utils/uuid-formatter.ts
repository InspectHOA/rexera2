/**
 * UUID Formatting Utilities
 * 
 * Provides consistent formatting of UUIDs for human-readable display
 * while keeping the database simple with only UUID primary keys.
 */

export interface WorkflowTypeConfig {
  prefix: string;
  description: string;
}

export const WORKFLOW_TYPE_CONFIGS: Record<string, WorkflowTypeConfig> = {
  PAYOFF: {
    prefix: 'PAY',
    description: 'Payoff Request'
  },
  HOA_ACQUISITION: {
    prefix: 'HOA', 
    description: 'HOA Acquisition'
  },
  MUNI_LIEN_SEARCH: {
    prefix: 'MUNI',
    description: 'Municipal Lien Search'
  }
} as const;

/**
 * Format a UUID for human-readable display
 * Converts: "58948339-cf90-42f8-b75f-a264fef17152"
 * To: "5894-8339" (last 8 chars, formatted)
 */
export function formatWorkflowId(uuid: string): string {
  if (!uuid || typeof uuid !== 'string') {
    return 'UNKNOWN';
  }
  
  // Remove hyphens and take last 8 characters
  const cleanUuid = uuid.replace(/-/g, '');
  const shortId = cleanUuid.slice(-8).toUpperCase();
  
  // Format as XXXX-XXXX for readability
  return `${shortId.slice(0, 4)}-${shortId.slice(4)}`;
}

/**
 * Format a workflow ID with type prefix
 * Example: "PAY-5894-8339"
 */
export function formatWorkflowIdWithType(uuid: string, workflowType: string): string {
  const shortId = formatWorkflowId(uuid);
  const config = WORKFLOW_TYPE_CONFIGS[workflowType];
  
  if (!config) {
    return `WF-${shortId}`;
  }
  
  return `${config.prefix}-${shortId}`;
}

/**
 * Get the display name for a workflow type
 */
export function getWorkflowTypeDisplayName(workflowType: string): string {
  const config = WORKFLOW_TYPE_CONFIGS[workflowType];
  return config?.description || workflowType.replace(/_/g, ' ');
}

/**
 * Check if a string is a valid UUID format
 */
export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Normalize an ID input - if it's already a UUID, return as-is
 * If it's a formatted ID, we can't reverse it (would need database lookup)
 */
export function normalizeWorkflowId(input: string): string {
  if (isValidUUID(input)) {
    return input;
  }
  
  // If it's not a UUID, it's likely a formatted ID
  // In this case, we'd need to look it up in the database
  throw new Error('Formatted IDs cannot be reverse-engineered to UUIDs. Use UUID for API calls.');
}