#!/usr/bin/env tsx

/**
 * Check Users Script
 * 
 * Check what users exist in the database
 */

import { BaseScript } from '../utils/base-script.js';

class CheckUsersScript extends BaseScript {
  constructor() {
    super({
      name: 'Check Users',
      description: 'Check what users exist',
      requiresDb: true
    });
  }

  async run(): Promise<void> {
    this.log('Checking existing users...');
    
    try {
      const { data: users, error } = await this.supabase!
        .from('user_profiles')
        .select('*');

      if (error) {
        this.log(`❌ Error getting users: ${error.message}`);
      } else {
        this.log(`✅ Found ${users?.length || 0} users`);
        if (users && users.length > 0) {
          users.forEach(user => {
            this.log(`  - ${user.id}: ${user.full_name || user.email} (${user.user_type})`);
          });
        }
      }

      // Also check auth.users table (might be empty in development)
      try {
        const { data: authUsers, error: authError } = await this.supabase!
          .from('auth.users')
          .select('id, email')
          .limit(5);

        if (authError) {
          this.log(`❌ Cannot access auth.users: ${authError.message}`);
        } else {
          this.log(`✅ Found ${authUsers?.length || 0} auth users`);
          if (authUsers && authUsers.length > 0) {
            authUsers.forEach(user => {
              this.log(`  - ${user.id}: ${user.email}`);
            });
          }
        }
      } catch (error) {
        this.log(`⚠️  Auth users table not accessible: ${error}`);
      }

    } catch (error) {
      this.error(`Failed to check users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Run script if called directly
if (require.main === module) {
  const script = new CheckUsersScript();
  script.run().catch(console.error);
}