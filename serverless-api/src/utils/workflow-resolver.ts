import { SupabaseClient } from '@supabase/supabase-js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Check if a string is a valid UUID
 */
export function isUUID(value: string): boolean {
  return UUID_REGEX.test(value);
}

/**
 * Resolve workflow ID (UUID or formatted ID) to actual UUID
 * @param supabase - Supabase client
 * @param id - UUID or formatted ID like "MUNI-9966-FC7C"
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

  // Handle formatted IDs like "MUNI-9966-FC7C" by reconstructing the UUID
  if (id.includes('-') && id.length > 10) {
    // Extract the formatted part (everything after the prefix)
    const parts = id.split('-');
    if (parts.length >= 3) {
      // For "MUNI-2C4F-A776", we get ["MUNI", "2C4F", "A776"]
      const lastTwoChunks = parts.slice(-2).join('').toLowerCase(); // "2c4fa776"
      
      // Look for workflows where the last 8 chars of UUID (without hyphens) match
      const { data: workflows, error } = await supabase
        .from('workflows')
        .select('id')
        .like('id', `%${lastTwoChunks.toLowerCase()}%`);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      // Find exact match by checking the last 8 chars
      const matchingWorkflow = workflows?.find((w: any) => {
        const cleanUuid = w.id.replace(/-/g, '').toLowerCase();
        return cleanUuid.slice(-8) === lastTwoChunks.toLowerCase();
      });

      if (matchingWorkflow) {
        return matchingWorkflow.id;
      }
    }
  }

  throw new Error(`Workflow not found with ID: ${id}`);
}

/**
 * Direct lookup by formatted ID (handles UUID-based formatted IDs)
 */
export async function getWorkflowByHumanId(supabase: SupabaseClient, humanId: string, selectString: string = '*') {
  // If it's a UUID, query directly
  if (isUUID(humanId)) {
    const { data: workflow, error } = await supabase
      .from('workflows')
      .select(selectString)
      .eq('id', humanId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw error;
    }
    return workflow;
  }

  // Handle formatted IDs like "MUNI-9966-FC7C"
  if (humanId.includes('-') && humanId.length > 10) {
    const parts = humanId.split('-');
    if (parts.length >= 3) {
      const lastTwoChunks = parts.slice(-2).join('').toLowerCase(); // "2c4fa776"
      
      // Get all workflows and find the one with matching last 8 chars
      const { data: workflows, error } = await supabase
        .from('workflows')
        .select(selectString);

      if (error) {
        throw error;
      }

      // Find exact match by checking the last 8 chars
      const matchingWorkflow = workflows?.find((w: any) => {
        const cleanUuid = w.id.replace(/-/g, '').toLowerCase();
        return cleanUuid.slice(-8) === lastTwoChunks.toLowerCase();
      });

      return matchingWorkflow || null;
    }
  }

  return null;
}