-- =====================================================
-- FIX RLS POLICIES FOR DEVELOPMENT
-- Allow anonymous access to key tables for development
-- =====================================================

-- Add policies for anonymous/service role access to core tables
-- This allows the frontend to access data during development

-- Clients table - allow read access for anon/service_role
CREATE POLICY "Allow anonymous read access to clients" 
ON clients FOR SELECT 
USING (auth.role() = 'anon' OR auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- Workflows table - allow read access for anon/service_role
CREATE POLICY "Allow anonymous read access to workflows" 
ON workflows FOR SELECT 
USING (auth.role() = 'anon' OR auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- Tasks table - allow read access for anon/service_role
CREATE POLICY "Allow anonymous read access to tasks" 
ON tasks FOR SELECT 
USING (auth.role() = 'anon' OR auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- User profiles table - allow read access for anon/service_role
CREATE POLICY "Allow anonymous read access to user_profiles" 
ON user_profiles FOR SELECT 
USING (auth.role() = 'anon' OR auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- Agents table - allow read access for anon/service_role
CREATE POLICY "Allow anonymous read access to agents" 
ON agents FOR SELECT 
USING (auth.role() = 'anon' OR auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- For development, also allow INSERT/UPDATE operations with service_role or authenticated
CREATE POLICY "Allow service role all access to workflows" 
ON workflows FOR ALL 
USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY "Allow service role all access to tasks" 
ON tasks FOR ALL 
USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY "Allow service role all access to clients" 
ON clients FOR ALL 
USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');