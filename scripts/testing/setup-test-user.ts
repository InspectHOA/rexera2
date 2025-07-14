#!/usr/bin/env tsx

/**
 * Setup Test User for E2E Tests
 * 
 * Creates a test user in Supabase Auth for E2E testing
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const TEST_EMAIL = 'test-user@rexera.dev';
const TEST_PASSWORD = 'TestPassword123!';

async function setupTestUser() {
  console.log('🚀 Setting up test user for E2E tests...');
  
  try {
    // Check if user already exists
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error checking existing users:', listError);
      return;
    }

    const existingUser = existingUsers.users.find(user => user.email === TEST_EMAIL);
    
    if (existingUser) {
      console.log('✅ Test user already exists:', TEST_EMAIL);
      console.log('   User ID:', existingUser.id);
      return;
    }

    // Create test user
    console.log('👤 Creating test user...');
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: 'Test User',
        name: 'Test User'
      }
    });

    if (createError) {
      console.error('❌ Error creating test user:', createError);
      return;
    }

    console.log('✅ Test user created successfully!');
    console.log('   Email:', TEST_EMAIL);
    console.log('   User ID:', createData.user.id);

    // Create user profile in database
    console.log('👤 Creating user profile...');
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: createData.user.id,
        full_name: 'Test User',
        role: 'HIL_ADMIN', // Give admin access for testing
        email: TEST_EMAIL
      });

    if (profileError) {
      // Profile might already exist or table might not exist
      console.log('⚠️  Profile creation warning (might be normal):', profileError.message);
    } else {
      console.log('✅ User profile created');
    }

    console.log('\n🎉 Test user setup complete!');
    console.log('\n📋 E2E Test Credentials:');
    console.log(`   Email: ${TEST_EMAIL}`);
    console.log(`   Password: ${TEST_PASSWORD}`);
    console.log('\n🔧 Next steps:');
    console.log('   1. Make sure frontend and API are running');
    console.log('   2. Run: pnpm test:e2e');

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

if (require.main === module) {
  setupTestUser();
}

export default setupTestUser;