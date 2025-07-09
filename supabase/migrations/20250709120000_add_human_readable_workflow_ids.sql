-- Add human_readable_id column if it doesn't exist and populate it
-- This migration adds proper human-readable IDs to workflows

-- First, check if the column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workflows' AND column_name = 'human_readable_id'
    ) THEN
        ALTER TABLE workflows ADD COLUMN human_readable_id TEXT;
    END IF;
END $$;

-- Add unique constraint on human_readable_id (allowing nulls for now)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'workflows' AND constraint_name = 'workflows_human_readable_id_unique'
    ) THEN
        ALTER TABLE workflows ADD CONSTRAINT workflows_human_readable_id_unique UNIQUE (human_readable_id);
    END IF;
END $$;

-- Create a sequence for auto-incrementing human IDs starting from 1000
CREATE SEQUENCE IF NOT EXISTS workflow_human_id_seq START 1000;

-- Create a function to generate human-readable IDs
CREATE OR REPLACE FUNCTION generate_workflow_human_id()
RETURNS TEXT AS $$
BEGIN
    RETURN nextval('workflow_human_id_seq')::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Populate existing workflows with human-readable IDs extracted from titles
-- This handles the current seed data that has titles like "PAYOFF #1000"
UPDATE workflows 
SET human_readable_id = (
    CASE 
        WHEN title ~ '#(\d+)' THEN 
            (regexp_match(title, '#(\d+)'))[1]
        ELSE 
            generate_workflow_human_id()
    END
)
WHERE human_readable_id IS NULL;

-- Create a trigger to auto-populate human_readable_id for new workflows
CREATE OR REPLACE FUNCTION set_workflow_human_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.human_readable_id IS NULL THEN
        NEW.human_readable_id = generate_workflow_human_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists and recreate
DROP TRIGGER IF EXISTS workflow_human_id_trigger ON workflows;
CREATE TRIGGER workflow_human_id_trigger
    BEFORE INSERT ON workflows
    FOR EACH ROW
    EXECUTE FUNCTION set_workflow_human_id();

-- Update the sequence to start from the highest existing human ID + 1
-- This ensures no conflicts with existing data
SELECT setval('workflow_human_id_seq', 
    COALESCE((SELECT MAX(human_readable_id::INTEGER) FROM workflows WHERE human_readable_id ~ '^\d+$'), 999) + 1, 
    false
);