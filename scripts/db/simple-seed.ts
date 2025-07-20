#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import * as path from 'path';

config({ path: path.join(__dirname, '../../serverless-api/.env') });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function simpleSeed() {
  console.log('🌱 Attempting simple seed...');
  
  try {
    // First check what auth.role() returns
    const { data: roleData, error: roleError } = await supabase.rpc('check_auth_role');
    console.log('🔍 auth.role() returns:', roleData, roleError);
    
    // Try to insert a single client
    const { data, error } = await supabase
      .from('clients')
      .insert([
        { name: 'Test Client from Script', domain: 'script-test.com' }
      ])
      .select();
      
    if (error) {
      console.error('❌ Insert failed:', error);
      
      // Let's try to see what's in the JWT token
      const token = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      console.log('🔍 JWT payload:', payload);
      
    } else {
      console.log('✅ Insert successful:', data);
    }
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

simpleSeed();