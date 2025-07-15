#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const { config } = require('dotenv');
const path = require('path');

config({ path: path.join(__dirname, '../serverless-api/.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createAuthUser() {
  console.log('Getting existing SKIP_AUTH user...');
  
  try {
    // Get existing user by email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Failed to list users:', listError);
      return;
    }
    
    const existingUser = users.users.find(u => u.email === 'admin@rexera.com');
    
    if (!existingUser) {
      console.error('❌ No user found with email admin@rexera.com');
      return;
    }
    
    const userId = existingUser.id;
    console.log('✅ Found existing auth user:', userId);
    
    // Create user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .upsert([{
        id: userId,
        email: 'admin@rexera.com',
        full_name: 'Admin User',
        role: 'HIL_ADMIN',
        user_type: 'hil_user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select();
      
    if (profileError) {
      console.error('❌ Failed to create user profile:', profileError);
      return;
    }
    
    console.log('✅ Created user profile:', profile[0]);
    console.log('');
    console.log('🔧 Now update your auth config to use this user ID:');
    console.log(`   Frontend: SKIP_AUTH_USER.id = '${userId}'`);
    console.log(`   Backend: auth middleware user.id = '${userId}'`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createAuthUser();