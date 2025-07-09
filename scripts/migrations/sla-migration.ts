#!/usr/bin/env tsx

/**
 * SLA Tracking Migration Script
 * 
 * Applies SLA tracking fields to the task_executions table.
 * This migration adds the fields that enable proper SLA monitoring.
 */

import { BaseScript } from '../utils/base-script.js';

class SLAMigrationScript extends BaseScript {
  constructor() {
    super({
      name: 'SLA Migration',
      description: 'Add SLA tracking fields to task_executions table',
      requiresDb: true
    });
  }

  async run(): Promise<void> {
    this.log('Starting SLA migration...');
    
    try {
      // Check if columns already exist
      await this.checkExistingColumns();
      
      // Apply migration
      await this.addSLAColumns();
      
      // Update existing tasks with SLA due dates
      await this.updateExistingTasks();
      
      // Create indexes for performance
      await this.createIndexes();
      
      // Verify migration
      await this.verifyMigration();
      
      this.success('SLA migration completed successfully');
      
    } catch (error) {
      this.error(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async checkExistingColumns(): Promise<void> {
    this.log('Checking for existing SLA columns...');
    
    const { data, error } = await this.supabase!
      .from('task_executions')
      .select('sla_hours, sla_due_at, sla_status')
      .limit(1);
    
    if (!error) {
      this.warn('SLA columns already exist. Migration may be redundant.');
      
      if (!this.hasFlag('force')) {
        const shouldContinue = await this.confirmDestructive('overwrite existing SLA columns');
        if (!shouldContinue) {
          this.log('Migration cancelled by user');
          process.exit(0);
        }
      }
    }
  }

  private async addSLAColumns(): Promise<void> {
    this.log('Adding SLA tracking columns...');
    
    const migrations = [
      'ALTER TABLE task_executions ADD COLUMN IF NOT EXISTS sla_hours INTEGER DEFAULT 24;',
      'ALTER TABLE task_executions ADD COLUMN IF NOT EXISTS sla_due_at TIMESTAMPTZ;',
      `ALTER TABLE task_executions ADD COLUMN IF NOT EXISTS sla_status TEXT DEFAULT 'ON_TIME' 
       CHECK (sla_status IN ('ON_TIME', 'AT_RISK', 'BREACHED'));`
    ];

    for (const migration of migrations) {
      this.log(`Executing: ${migration.substring(0, 50)}...`);
      
      const { error } = await this.supabase!.rpc('exec', { 
        sql: migration 
      });
      
      if (error && !error.message.includes('already exists')) {
        throw new Error(`Failed to execute migration: ${error.message}`);
      }
    }
  }

  private async updateExistingTasks(): Promise<void> {
    this.log('Updating existing tasks with SLA due dates...');
    
    const updateQuery = `
      UPDATE task_executions 
      SET sla_due_at = created_at + (sla_hours || ' hours')::interval
      WHERE sla_due_at IS NULL;
    `;

    const { error } = await this.supabase!.rpc('exec', { 
      sql: updateQuery 
    });

    if (error) {
      throw new Error(`Failed to update existing tasks: ${error.message}`);
    }
  }

  private async createIndexes(): Promise<void> {
    this.log('Creating performance indexes...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_task_executions_sla_due_at ON task_executions(sla_due_at);',
      'CREATE INDEX IF NOT EXISTS idx_task_executions_sla_status ON task_executions(sla_status);'
    ];

    for (const index of indexes) {
      const { error } = await this.supabase!.rpc('exec', { 
        sql: index 
      });
      
      if (error && !error.message.includes('already exists')) {
        this.warn(`Failed to create index: ${error.message}`);
      }
    }
  }

  private async verifyMigration(): Promise<void> {
    this.log('Verifying migration results...');
    
    const { data, error } = await this.supabase!
      .from('task_executions')
      .select('id, sla_hours, sla_due_at, sla_status')
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
  const script = new SLAMigrationScript();
  script.run().catch(console.error);
}