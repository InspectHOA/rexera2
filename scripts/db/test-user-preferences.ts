#!/usr/bin/env tsx

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testUserPreferencesTable() {
  console.log('🚀 Starting user_preferences table test...');
  
  try {
    // Test table exists and basic query
    console.log('🔍 Testing user_preferences table...');
    const { data, error, count } = await supabase
      .from('user_preferences')
      .select('*', { count: 'exact' })
      .limit(1);
    
    if (error) {
      console.error('❌ Error querying user_preferences table:', error.message);
      
      // Check if table exists
      const { data: tables, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'user_preferences');
      
      if (tableError || !tables || tables.length === 0) {
        console.log('📋 Table user_preferences does not exist. Creating it...');
        await createUserPreferencesTable();
      } else {
        console.log('❌ Table exists but query failed');
      }
      return;
    }
    
    console.log('✅ user_preferences table exists and is queryable');
    console.log('📊 Sample data count:', count);
    
    // Test insert/update for skip auth user
    const skipAuthUserId = '284219ff-3a1f-4e86-9ea4-3536f940451f';
    
    // Try to get existing preference
    const { data: existing } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', skipAuthUserId)
      .single();
    
    if (!existing) {
      console.log('🆕 Creating default preference for skip auth user...');
      const { error: insertError } = await supabase
        .from('user_preferences')
        .insert({
          user_id: skipAuthUserId,
          theme: 'system'
        });
      
      if (insertError) {
        console.error('❌ Failed to create preference:', insertError.message);
      } else {
        console.log('✅ Created default preference');
      }
    } else {
      console.log('✅ Skip auth user preference exists:', existing.theme);
    }
    
  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message);
  }
}

async function createUserPreferencesTable() {
  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS user_preferences (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(user_id)
        );

        -- Enable RLS
        ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

        -- Policy: Users can only access their own preferences
        CREATE POLICY "user_preferences_policy" ON user_preferences
          FOR ALL USING (auth.uid() = user_id);

        -- Policy for service role (for skip auth mode)
        CREATE POLICY "service_role_policy" ON user_preferences
          FOR ALL TO service_role USING (true);
      `
    });
    
    if (error) {
      console.error('❌ Failed to create table:', error.message);
    } else {
      console.log('✅ user_preferences table created successfully');
    }
  } catch (error: any) {
    console.error('❌ Error creating table:', error.message);
  }
}

async function main() {
  await testUserPreferencesTable();
  console.log('✅ All tests completed!');
}

main().catch(console.error);