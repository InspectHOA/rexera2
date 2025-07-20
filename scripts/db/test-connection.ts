#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import * as path from 'path';

config({ path: path.join(__dirname, '../../serverless-api/.env') });

console.log('🔧 Environment check:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'Missing');

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testDirectQuery() {
  console.log('🔌 Testing direct SQL query...');
  
  try {
    // Test a simple query using rpc to execute raw SQL
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: 'SELECT current_user, session_user'
    });
    
    if (error) {
      console.error('❌ Direct SQL failed:', error);
    } else {
      console.log('✅ Direct SQL successful:', data);
    }
  } catch (err) {
    console.error('❌ Direct SQL error:', err);
  }

  try {
    // Test table access
    const { data, error } = await supabase
      .from('clients')
      .select('count')
      .limit(1);
      
    if (error) {
      console.error('❌ Table access failed:', error);
    } else {
      console.log('✅ Table access successful:', data);
    }
  } catch (err) {
    console.error('❌ Table access error:', err);
  }
}

testDirectQuery();