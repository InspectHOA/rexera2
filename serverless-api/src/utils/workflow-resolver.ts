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

  const { data: workflow, error } = await supabase
    .from('workflows')
    .select('id')
    .eq('human_readable_id', id)
    .single();

  if (error || !workflow) {
    throw new Error(`Workflow not found with ID: ${id}`);
  }

  return workflow.id;
}