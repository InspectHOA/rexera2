#!/usr/bin/env tsx

/**
 * Create hil_notifications table if it doesn't exist
 */

import { createServerClient } from '../../serverless-api/src/utils/database';

async function createNotificationsTable() {
  console.log('🔧 Creating hil_notifications table if it doesn\'t exist...');
  
  const supabase = createServerClient();
  
  try {
    // First, test if we can access the database
    const { data: testData, error: testError } = await supabase
      .from('workflows')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('❌ Cannot connect to database:', testError);
      return false;
    }
    
    console.log('✅ Database connection successful');
    
    // Try to query the notifications table
    const { data, error } = await supabase
      .from('hil_notifications')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('⚠️  hil_notifications table does not exist or is not accessible:', error.message);
      console.log('🔧 Note: This needs to be created via SQL migration in Supabase dashboard');
      console.log('📋 SQL to run in Supabase SQL editor:');
      console.log(`
-- Create notification types enum if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE notification_type AS ENUM ('WORKFLOW_UPDATE', 'TASK_INTERRUPT', 'HIL_MENTION', 'CLIENT_MESSAGE_RECEIVED', 'COUNTERPARTY_MESSAGE_RECEIVED', 'SLA_WARNING', 'AGENT_FAILURE');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'priority_level') THEN
        CREATE TYPE priority_level AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
    END IF;
END $$;

-- Create hil_notifications table if not exists
CREATE TABLE IF NOT EXISTS hil_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id),
    type notification_type NOT NULL,
    priority priority_level NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    metadata JSONB,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index if not exists
CREATE INDEX IF NOT EXISTS idx_hil_notifications_user ON hil_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_hil_notifications_read ON hil_notifications(read);
CREATE INDEX IF NOT EXISTS idx_hil_notifications_created ON hil_notifications(created_at);
      `);
      return false;
    }
    
    console.log('✅ hil_notifications table exists and is accessible');
    return true;
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return false;
  }
}

async function main() {
  console.log('🚀 Checking hil_notifications table...');
  
  const success = await createNotificationsTable();
  
  if (success) {
    console.log('✅ Table check passed!');
  } else {
    console.log('❌ Table needs to be created manually');
  }
}

main().catch(console.error);