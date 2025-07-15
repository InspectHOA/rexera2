#!/usr/bin/env tsx
/**
 * Clear conflicting user profiles to fix auth issues
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import * as path from 'path';

config({ path: path.join(__dirname, '../../serverless-api/.env') });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function clearConflictingProfiles() {
  console.log('🗑️ Clearing user profiles to fix auth conflicts...');
  
  try {
    // Delete all user profiles (they will be recreated on next login)
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all except impossible UUID
    
    if (error) {
      console.error('❌ Failed to clear profiles:', error);
      throw error;
    }
    
    console.log('✅ Successfully cleared all user profiles');
    console.log('ℹ️ Profiles will be recreated automatically on next user login');
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

clearConflictingProfiles();