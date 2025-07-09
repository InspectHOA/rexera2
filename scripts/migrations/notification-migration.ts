#!/usr/bin/env tsx

/**
 * Notification Read Tracking Migration Script
 * 
 * Adds read_by_users JSONB field to task_executions table for
 * tracking which users have read each task notification.
 */

import { BaseScript } from '../utils/base-script.js';

class NotificationMigrationScript extends BaseScript {
  constructor() {
    super({
      name: 'Notification Migration',
      description: 'Add notification read tracking to task_executions table',
      requiresDb: true
    });
  }

  async run(): Promise<void> {
    this.log('Starting notification read tracking migration...');
    
    try {
      // Check if column already exists
      await this.checkExistingColumn();
      
      // Apply migration
      await this.addReadTrackingColumn();
      
      // Create index for performance
      await this.createIndex();
      
      // Verify migration
      await this.verifyMigration();
      
      this.success('Notification migration completed successfully');
      
    } catch (error) {
      this.error(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async checkExistingColumn(): Promise<void> {
    this.log('Checking for existing read_by_users column...');
    
    const { data, error } = await this.supabase!
      .from('task_executions')
      .select('read_by_users')
      .limit(1);
    
    if (!error) {
      this.warn('read_by_users column already exists. Migration may be redundant.');
      
      if (!this.hasFlag('force')) {
        const shouldContinue = await this.confirmDestructive('overwrite existing read_by_users column');
        if (!shouldContinue) {
          this.log('Migration cancelled by user');
          process.exit(0);
        }
      }
    }
  }

  private async addReadTrackingColumn(): Promise<void> {
    this.log('Adding notification read tracking column...');
    
    const migration = `
      ALTER TABLE task_executions 
      ADD COLUMN IF NOT EXISTS read_by_users JSONB DEFAULT '{}';
    `;

    this.log('Executing migration...');
    
    const { error } = await this.supabase!.rpc('exec', { 
      sql: migration 
    });
    
    if (error && !error.message.includes('already exists')) {
      throw new Error(`Failed to execute migration: ${error.message}`);
    }

    // Add comment for documentation
    const commentSql = `
      COMMENT ON COLUMN task_executions.read_by_users IS 
      'JSON object tracking which users have read this task notification. Format: {"user_id": "timestamp"}';
    `;

    const { error: commentError } = await this.supabase!.rpc('exec', { 
      sql: commentSql 
    });
    
    if (commentError) {
      this.warn(`Failed to add column comment: ${commentError.message}`);
    }
  }

  private async createIndex(): Promise<void> {
    this.log('Creating GIN index for read_by_users column...');
    
    const indexSql = `
      CREATE INDEX IF NOT EXISTS idx_task_executions_read_by_users 
      ON task_executions USING GIN (read_by_users);
    `;

    const { error } = await this.supabase!.rpc('exec', { 
      sql: indexSql 
    });
    
    if (error && !error.message.includes('already exists')) {
      this.warn(`Failed to create index: ${error.message}`);
    } else {
      this.log('GIN index created for efficient JSONB querying');
    }
  }

  private async verifyMigration(): Promise<void> {
    this.log('Verifying migration results...');
    
    const { data, error } = await this.supabase!
      .from('task_executions')
      .select('id, read_by_users')
      .limit(1);
    
    if (error) {
      throw new Error(`Migration verification failed: ${error.message}`);
    }
    
    if (data && data.length > 0) {
      this.log('Sample migrated record:');
      console.log(JSON.stringify(data[0], null, 2));
    }
    
    this.success('Migration verification passed');
  }
}

// Run script if called directly
if (require.main === module) {
  const script = new NotificationMigrationScript();
  script.run().catch(console.error);
}