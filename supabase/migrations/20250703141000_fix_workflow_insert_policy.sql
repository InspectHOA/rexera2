-- =====================================================
-- FIX WORKFLOW INSERT POLICY
-- Add RLS policy to allow workflow creation
-- =====================================================

-- Add policy for INSERT operations on workflows
CREATE POLICY "Allow authenticated and service role to insert workflows" 
ON workflows FOR INSERT 
WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role' OR auth.role() = 'anon');

-- Also ensure UPDATE and DELETE policies exist
CREATE POLICY "Allow authenticated and service role to update workflows" 
ON workflows FOR UPDATE 
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role')
WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Allow authenticated and service role to delete workflows" 
ON workflows FOR DELETE 
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');