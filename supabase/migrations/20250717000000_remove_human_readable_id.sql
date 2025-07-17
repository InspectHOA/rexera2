-- Remove human_readable_id column and related infrastructure
-- This system was not being used as the frontend generates IDs from UUIDs

-- Drop the trigger first
DROP TRIGGER IF EXISTS workflow_human_id_trigger ON workflows;

-- Drop the trigger function
DROP FUNCTION IF EXISTS set_workflow_human_id();

-- Drop the ID generation function
DROP FUNCTION IF EXISTS generate_workflow_human_id();

-- Drop the sequence
DROP SEQUENCE IF EXISTS workflow_human_id_seq;

-- Drop the unique constraint
ALTER TABLE workflows DROP CONSTRAINT IF EXISTS workflows_human_readable_id_unique;

-- Drop the column
ALTER TABLE workflows DROP COLUMN IF EXISTS human_readable_id;