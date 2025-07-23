#!/usr/bin/env tsx

/**
 * Test script to check if hil_notifications table exists and can be queried
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - SUPABASE_URL:', !!supabaseUrl);
  console.error('   - SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testNotificationsTable() {
  console.log('🔍 Testing hil_notifications table...');
  
  try {
    // First, try to query the table structure
    const { data, error } = await supabase
      .from('hil_notifications')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error querying hil_notifications table:', error);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      console.error('Error code:', error.code);
      return false;
    }
    
    console.log('✅ hil_notifications table exists and is queryable');
    console.log('📊 Sample data count:', data?.length || 0);
    
    // Try to get table info
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('*')
      .eq('table_name', 'hil_notifications');
    
    if (tableError) {
      console.warn('⚠️  Could not get table info:', tableError.message);
    } else {
      console.log('📋 Table info:', tableInfo);
    }
    
    return true;
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting notifications table test...');
  
  const success = await testNotificationsTable();
  
  if (success) {
    console.log('✅ All tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Tests failed!');
    process.exit(1);
  }
}

main().catch(console.error);