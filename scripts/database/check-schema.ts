#!/usr/bin/env tsx

/**
 * Check Schema Script
 * 
 * Checks the actual database schema constraints
 */

import { BaseScript } from '../utils/base-script.js';

class CheckSchemaScript extends BaseScript {
  constructor() {
    super({
      name: 'Check Schema',
      description: 'Check actual database schema constraints',
      requiresDb: true
    });
  }

  async run(): Promise<void> {
    this.log('Testing schema constraints...');
    
    // Get a test client
    const { data: clients } = await this.supabase!
      .from('clients')
      .select('id')
      .limit(1);

    if (!clients || clients.length === 0) {
      this.error('No clients found');
      return;
    }

    const clientId = clients[0].id;

    // Test workflow creation with minimal data
    try {
      this.log('Testing workflow creation with null created_by...');
      
      const { data, error } = await this.supabase!
        .from('workflows')
        .insert({
          workflow_type: 'PAYOFF',
          client_id: clientId,
          title: 'Test workflow',
          created_by: null
        })
        .select();

      if (error) {
        this.log(`❌ NULL created_by failed: ${error.message}`);
      } else {
        this.log(`✅ NULL created_by works`);
        // Clean up
        if (data && data[0]) {
          await this.supabase!
            .from('workflows')
            .delete()
            .eq('id', data[0].id);
        }
      }
    } catch (error) {
      this.log(`❌ Error: ${error}`);
    }

    // Test workflow creation without created_by field
    try {
      this.log('Testing workflow creation without created_by field...');
      
      const { data, error } = await this.supabase!
        .from('workflows')
        .insert({
          workflow_type: 'PAYOFF',
          client_id: clientId,
          title: 'Test workflow 2'
        })
        .select();

      if (error) {
        this.log(`❌ Missing created_by failed: ${error.message}`);
      } else {
        this.log(`✅ Missing created_by works`);
        // Clean up
        if (data && data[0]) {
          await this.supabase!
            .from('workflows')
            .delete()
            .eq('id', data[0].id);
        }
      }
    } catch (error) {
      this.log(`❌ Error: ${error}`);
    }

    this.success('Schema checking completed');
  }
}

// Run script if called directly
if (require.main === module) {
  const script = new CheckSchemaScript();
  script.run().catch(console.error);
}