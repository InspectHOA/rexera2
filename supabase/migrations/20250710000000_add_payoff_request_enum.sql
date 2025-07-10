-- Add PAYOFF_REQUEST to workflow_type enum
-- This migration ensures all 3 workflow types are available

-- Add the missing enum value
ALTER TYPE workflow_type ADD VALUE IF NOT EXISTS 'PAYOFF_REQUEST';

-- Verify the enum now has all required values
-- Expected values: MUNI_LIEN_SEARCH, HOA_ACQUISITION, PAYOFF_REQUEST

-- Add comment to document the complete enum
COMMENT ON TYPE workflow_type IS 'Workflow types: MUNI_LIEN_SEARCH (municipal lien searches), HOA_ACQUISITION (HOA document requests), PAYOFF_REQUEST (mortgage payoff requests)';