-- Add service role policies for all tables to allow seeding

CREATE POLICY "Enable all access for service role" ON clients FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Enable all access for service role" ON user_profiles FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Enable all access for service role" ON workflows FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Enable all access for service role" ON task_executions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Enable all access for service role" ON agents FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Enable all access for service role" ON agent_performance_metrics FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Enable all access for service role" ON communications FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Enable all access for service role" ON email_metadata FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Enable all access for service role" ON phone_metadata FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Enable all access for service role" ON counterparties FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Enable all access for service role" ON workflow_counterparties FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Enable all access for service role" ON documents FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Enable all access for service role" ON costs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Enable all access for service role" ON invoices FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Enable all access for service role" ON audit_events FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Enable all access for service role" ON contact_labels FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Enable all access for service role" ON workflow_contacts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Enable all access for service role" ON hil_notes FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Enable all access for service role" ON hil_notifications FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Enable all access for service role" ON user_preferences FOR ALL USING (auth.role() = 'service_role');