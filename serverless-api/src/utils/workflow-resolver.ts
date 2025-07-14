import { SupabaseClient } from '@supabase/supabase-js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Check if a string is a valid UUID
 */
export function isUUID(value: string): boolean {
  return UUID_REGEX.test(value);
}

/**
 * Resolve workflow ID (UUID or human-readable) to actual UUID
 * @param supabase - Supabase client
 * @param id - UUID or human-readable ID
 * @returns Actual workflow UUID
 * @throws Error if workflow not found
 */
export async function resolveWorkflowId(
  supabase: SupabaseClient,
  id: string
): Promise<string> {
  if (isUUID(id)) {
    return id;
  }

  // Extract numeric part from prefixed format (e.g., "HOA-1002" -> "1002")
  const numericId = id.includes('-') ? id.split('-')[1] : id;
  
  const { data: workflow, error } = await supabase
    .from('workflows')
    .select('id')
    .eq('human_readable_id', numericId)
    .single();

  if (error || !workflow) {
    throw new Error(`Workflow not found with ID: ${id}`);
  }

  return workflow.id;
}

/**
 * Direct lookup by human-readable ID (more efficient than resolveWorkflowId for API endpoints)
 * Handles both prefixed format (HOA-1002) and numeric format (1002)
 */
export async function getWorkflowByHumanId(supabase: SupabaseClient, humanId: string, selectString: string = '*') {
  // Extract numeric part from prefixed format (e.g., "HOA-1002" -> "1002")
  const numericId = humanId.includes('-') ? humanId.split('-')[1] : humanId;
  
  const { data: workflow, error } = await supabase
    .from('workflows')
    .select(selectString)
    .eq('human_readable_id', numericId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw error;
  }

  return workflow;
}